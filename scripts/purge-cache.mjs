// Purge Cloudflare's cache for one environment, then prove the purge took.
//
//   node scripts/purge-cache.mjs --env production
//   node scripts/purge-cache.mjs --env test --dry-run
//
// WHY THIS EXISTS. `/_next/static/**` is served `max-age=31536000, immutable`, so
// Cloudflare keeps whatever it saw for a year. A Pi deploy rewrites `.next` while
// requests keep arriving, so any edge node that fetches an asset mid-swap can cache
// a 404 or a half-written file — and then serve it for a year. On 2026-10-17 that
// left the app unstyled on a phone while every release check passed and the laptop
// looked perfect: a phone on mobile data reaches a different edge node than the
// machine doing the checking. See docs/releases/2026-10-17-0-36-0.md, Defect 2.
//
// WHY IT RUNS HERE AND NOT ON THE PI. docs/decisions/2026-10-18-pi-deploy-safety.md
// assumed the purge would go at the end of deploy-pi.sh, which needs a Cloudflare
// token ON the Pi. It does not have to: the Pi deploy is driven over ssh from this
// machine, where `.env.deploy.production` already lives and `loadEnv` already reads
// it. Running the purge here keeps the credential off the internet-facing box
// entirely. See docs/decisions/2026-10-18-purge-from-the-deploy-machine.md.
//
// WHAT IT NEEDS. In `.env.deploy.<env>` (gitignored; for --env test, `.env.deploy.uat`, since test
// and UAT are one zone), two values:
//   CLOUDFLARE_ZONE_ID      the lannacare.org zone, which serves test.lannacare.org and uat.lannacare.org
//   CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS  production only (since the 2026-11-06 cutover): the
//                           zone for lannacareforanimals.org, required for --env production
//   CLOUDFLARE_PURGE_TOKEN  an API token scoped to Zone -> Cache Purge, that zone only (a production token must be allowed on the lannacareforanimals.org zone)
// Nothing else in the repo reads CLOUDFLARE_PURGE_TOKEN, and it is never printed.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { fetchBytes } from "./lib/served-bytes.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const envName = (args[args.indexOf("--env") + 1] || "").trim();
const dryRun = args.includes("--dry-run");
const skipCheck = args.includes("--no-check");

if (!["production", "uat", "test"].includes(envName)) {
  console.error("purge-cache: --env must be production, uat or test");
  process.exitCode = 2;
} else {
  const { loadEnv, envFile } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
  // Test and UAT are ONE Cloudflare zone (lannacare.org), and that zone's purge credentials live in
  // .env.deploy.uat: a token limited to lannacare.org alone, which cannot see production's zone
  // (#prg4z, 2026-11-09). Test's own file is .env.local, which every worktree and `next dev` read,
  // so a Cloudflare token does not belong there; --env test reads the zone's file instead (#pz3tk).
  const credEnv = envName === "test" ? "uat" : envName;
  const env = loadEnv(credEnv); // stops, naming the file, if .env.deploy.uat is missing
  const file = envFile(credEnv);

  // Since the 2026-11-06 cutover production is lannacareforanimals.org, which is its own zone
  // (CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS); the lannacare.org zone serves test and UAT and keeps
  // CLOUDFLARE_ZONE_ID. The token must be allowed to purge whichever zone it is used on.
  //
  // UAT's host is uat.lannacare.org since 2026-11-08 (docs/uat-finalisation.md, Part 6). It read
  // `lannacare.org` until then, and that address now 301s to production (Part 7), so purging it
  // would have purged a redirect and reported success while UAT's own cache stood.
  const zoneVar = envName === "production" ? "CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS" : "CLOUDFLARE_ZONE_ID";
  const zone = env[zoneVar];
  const token = env.CLOUDFLARE_PURGE_TOKEN;
  const host = envName === "test" ? "test.lannacare.org" : envName === "uat" ? "uat.lannacare.org" : "lannacareforanimals.org";
  const targets = [{ zone, host }];
  // The purge is zone-wide, so a test or UAT purge clears both sites; re-check both, the named one first.
  const checkHosts = envName === "production" ? [host] : [host, envName === "test" ? "uat.lannacare.org" : "test.lannacare.org"];

  // Refuse with instructions rather than a stack trace: whoever hits this is
  // mid-release and needs to know exactly what to add and with what scope.
  const missing = [];
  if (!zone) missing.push(zoneVar);
  if (!token) missing.push("CLOUDFLARE_PURGE_TOKEN");
  if (missing.length) {
    console.error(`purge-cache: ${missing.join(" and ")} missing from ${file}.`);
    console.error("  Create an API token at Cloudflare -> My Profile -> API Tokens with");
    console.error("  Permissions: Zone -> Cache Purge -> Purge, and Zone Resources limited to");
    console.error(`  the one zone serving ${host}. Put it in ${file} as`);
    console.error(`  CLOUDFLARE_PURGE_TOKEN, with ${zoneVar} beside it.`);
    console.error("  Until then, purge by hand: Cloudflare -> Caching -> Configuration -> Purge Everything.");
    process.exitCode = 2;
  } else for (const { zone, host } of targets) if (dryRun) {
    console.log(`purge-cache: would purge everything for ${host} (zone ${zone.slice(0, 8)}…). Dry run, nothing sent.`);
  } else {
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ purge_everything: true }),
    });
    let body = {};
    try { body = JSON.parse(await res.text()); } catch { /* reported below */ }

    if (!res.ok || body.success !== true) {
      const why = (body.errors ?? []).map((e) => `${e.code} ${e.message}`).join("; ") || `HTTP ${res.status}`;
      console.error(`purge-cache: REFUSED by Cloudflare for ${host}: ${why}`);
      console.error("  A 10000 means the token is wrong or lacks Zone -> Cache Purge on this zone.");
      console.error("  Purge by hand and carry on: Cloudflare -> Caching -> Configuration -> Purge Everything.");
      process.exitCode = 1;
    } else {
      console.log(`purge-cache: purged everything for ${checkHosts.join(" and ")} (zone ${zone.slice(0, 8)}…).`);

      // A purge that reports success and did not take is the failure worth catching,
      // so prove something from the outside rather than trusting the API's own word.
      //
      // scripts/pi/check-assets.mjs is the stronger check — it compares the served
      // bytes against the build — but it needs a local `.next`, which exists on the
      // Pi and not here, and it is a top-level script with no exports (importing it
      // would run it with this script's argv). So do the half that IS possible from
      // the deploy machine: the page's own stylesheet must come back, and come back
      // whole. Then name the stronger check rather than implying this replaced it.
      if (!skipCheck) for (const checkHost of checkHosts) {
        try {
          const page = await fetch(`https://${checkHost}/?purge-check=${Date.now()}`, { redirect: "follow" });
          const html = await page.text();
          const hrefs = [...new Set([...html.matchAll(/\/_next\/static\/[^"']+\.css/g)].map((m) => m[0]))];
          if (!hrefs.length) {
            console.log(`purge-cache: no stylesheet found on https://${checkHost}/ to check (gated page?).`);
          }
          for (const href of hrefs) {
            const { res: r, bytes: body } = await fetchBytes(`https://${checkHost}${href}`);
            const cf = r.headers.get("cf-cache-status") ?? "?";
            if (!r.ok || body.length < 1000) {
              console.error(`purge-cache: ${checkHost}${href} came back HTTP ${r.status}, ${body.length} bytes (CF ${cf}) — NOT right.`);
              process.exitCode = 1;
            } else {
              console.log(`purge-cache: ${checkHost}${href} — HTTP ${r.status}, ${body.length} bytes (CF ${cf}).`);
            }
          }
        } catch (e) {
          console.error(`purge-cache: could not re-check ${checkHost} after the purge: ${e.message}`);
          process.exitCode = 1;
        }
        console.log(`purge-cache: for the byte-for-byte check against the build, run on the Pi:`);
        console.log(`  node scripts/pi/check-assets.mjs --url https://${checkHost}/`);
      }
    }
  }
}
