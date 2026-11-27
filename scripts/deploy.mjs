// Build and deploy one environment's Worker.
//
//   node scripts/deploy.mjs --env test                # test.lannacare.org
//   node scripts/deploy.mjs --env uat                 # uat.lannacare.org (UAT's own project, fsjagxmxjosauwmxwype)
//   node scripts/deploy.mjs --env production          # lannacareforanimals.org
//   node scripts/deploy.mjs --env production --secrets
//       # (uat/production refuse a secret found only in .env.local unless
//       #  --allow-dev-fallthrough is also given)
//       # also (re)upload the five runtime secrets for that environment first
//   ... --skip-build   # reuse the .open-next output of the previous run
//   ... --no-mail      # deploy without emailing a major release to admins
//   ... --no-pi        # EMERGENCY LEVER: this deploy sets ORIGIN_HOST empty, so the
//                      # Worker serves everything and the Pi is not consulted. Nothing
//                      # in wrangler.jsonc changes; the next deploy without the flag
//                      # puts the Pi back (docs/pi-hosting.md, "The Pi is sick").
//   ... --plan         # print the wrangler command this would run, then stop
//                      # (before any build or upload)
//
// Why a script rather than `opennextjs-cloudflare deploy --env`: the Supabase
// URL and anon key are inlined by `next build`, so each environment needs its
// own build with its own values in the shell (shell beats .env.local for
// Next; NEXT_PUBLIC_SITE_URL goes there too, so no env file can leak a host),
// and the env-file snapshot OpenNext bakes into the bundle has to be emptied before upload (scripts/strip-baked-env.mjs). UAT and production also
// get a guard: the checkout must be a clean, pushed `main`, so what the
// customer tests and what is live are always commits GitHub has. And every
// environment's build must wear its own badge (src/lib/app-env.ts), so a
// wrong env file can't put Production's look on a UAT database or the reverse.
//
// HOW WRANGLER AUTHENTICATES, AND WHY THERE IS A CHOICE (added 2026-11-16)
//
//   CLOUDFLARE_API_TOKEN   optional, per environment, read from that environment's own values file
//                          (`.env.deploy.production`, `.env.deploy.uat`; test's layer is
//                          `.env.local`). When present it is handed to wrangler and nothing else,
//                          and it BEATS any token in the shell.
//   CLOUDFLARE_ACCOUNT_ID  optional, alongside it, for a token that can reach more than one account.
//
// With neither set, wrangler uses its own interactive OAuth login exactly as before — this is
// opt-in and no environment is required to have a token.
//
// Why bother: that OAuth login holds a SHORT-LIVED access token, and a deploy here is a ten-minute
// build followed by an upload. On `0.47.1` the production deploy died at the upload with
// `A request to the Cloudflare API (/accounts/.../workers/scripts/lanna-animal-care/versions)
// failed. Authentication error [code: 10000]` after 138 s, and wrangler rewrote its own credentials
// file at the same second — i.e. the access token expired mid-deploy and refreshed on the way out.
// Nothing was half-deployed and the plain retry worked, but it cost the one person whose only job
// in a release is this command a second ten-minute run. An API token does not expire mid-build.
// Recorded as defect 1 of docs/releases/2026-11-16-0-47-1.md.
//
// The token to create, and nothing wider (Cloudflare → My Profile → API Tokens → Create Token →
// Custom token), is in docs/decisions/2026-11-16-deploy-cloudflare-api-token.md: Account →
// Workers Scripts → Edit, Account → Account Settings → Read, and Zone → Workers Routes → Edit on
// the one zone that environment serves. **Not** a Global API Key, which can do everything to
// everything and cannot be scoped.
//
// Whichever path is in use is PRINTED on every deploy and by --plan, so a future `code: 10000` is
// one line away from being explained instead of being guessed at.
//
// Every deploy is also a release (src/lib/releases.ts): package.json must
// name the newest entry, UAT and production refuse unreleased notes, the
// Worker version is tagged with it, and a major release that is new to the
// site is mailed to that environment's admins through the Worker (announce()).
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { SITE_ORIGINS, envFile, loadEnv, loadLayers, parseEnvArg, projectRef } from "./lib/env.mjs";
import { ALLOW_FLAG, fallthroughRefusal, localOnly, planLines, sourcesFor } from "./lib/secret-sources.mjs";
import { CLOUDFLARE_ACCOUNT_VAR, DELIBERATE_DEV_FALLTHROUGH, WORKER_BUILD_VARS, WORKER_NOT_PUSHED, WORKER_OPTIONAL_SECRETS, WORKER_REQUIRED_SECRETS } from "./lib/runtime-config.mjs";
import { appliedMigrations } from "./lib/deploy-schema.mjs";
import { releaseProblems, schemaVerdict } from "./lib/release-guards.mjs";
import { strayEnvFiles } from "./lib/env-leak.mjs";
import { readWranglerConfig, routeHosts } from "./lib/wrangler.mjs";
import { domainsToReassert, readFlaggedHosts } from "./lib/attached-hosts.mjs";
import { takeTreeLock, treeProblems } from "./lib/tree-lock.mjs";
import { ACTIONS_KEY_VAR, actionsKeyProblem, builtKeyProblem, keyFingerprint } from "./lib/actions-key.mjs";
// TypeScript, loaded through Node's type stripping: the same file the app
// renders, so the page, the tag and the email can't disagree.
import { latestRelease, majorReleasesSince, unreleased } from "../src/lib/releases.ts";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";
import { buildReleaseMail } from "../src/lib/release-mail.ts";
import { DEFAULT_SHELTER_NAMES } from "../src/lib/shelter-names-default.ts";
import { SITE_HOST_VARS } from "../src/lib/site-hosts.ts";
import { bail, runMain } from "./lib/exit.mjs";
import { DNS_RETRY_MAX, dnsRetryDecision, dnsRetryDelayMs } from "./lib/dns-retry.mjs";

async function main() {

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const pushSecrets = rest.includes("--secrets");
const skipBuild = rest.includes("--skip-build");
const noMail = rest.includes("--no-mail");
// UAT's database holds production's real people (docs/decisions/2026-11-06-uat-own-database.md), so a
// major release deployed there would mail them from a test site. A flag the operator must remember is
// the wrong shape for that — forget it once and the mail has gone, and UAT is now deployed on every
// release (docs/release-procedure.md, step 6). So UAT mails only when asked for in words: `--mail`
// means nothing on any other environment.
const mailOptIn = rest.includes("--mail");
const uatWillNotMail = envName === "uat" && !mailOptIn;
const noPi = rest.includes("--no-pi");
const planOnly = rest.includes("--plan");

// SITE_ORIGINS — where each environment answers — is imported from
// ./lib/env.mjs above. It used to be declared here as well; #290 moved it into
// the shared module so apply-migrations.mjs could ask /api/version too, and a
// later merge brought this copy back, which made the whole script a syntax
// error ("Identifier 'SITE_ORIGINS' has already been declared"). The two
// definitions were identical, so removing this one changes nothing.

// What src/lib/app-env.ts must call each environment's database.
// What the PROJECT must be called (appEnvForSupabaseUrl): each environment has its own project.
const EXPECTED_APP_ENV = { test: "dev", uat: "uat", production: "production" };

// Environments where a deploy is something a customer or the shelter sees.
const GUARDED = envName === "uat" || envName === "production";

// What reaches the Worker, derived from scripts/lib/runtime-config.mjs, which
// says what each value is for. Required secrets are pushed with --secrets and
// refused without; optional ones are pushed when set, harmless when not.
const RUNTIME_SECRETS = WORKER_REQUIRED_SECRETS;
const BUILD_VARS = WORKER_BUILD_VARS;
const OPTIONAL_SECRETS = WORKER_OPTIONAL_SECRETS;

function run(cmd, opts = {}) {
  const r = spawnSync(cmd, { stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit", shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`\ndeploy: \`${cmd}\` exited with ${r.status}`);
    bail(r.status ?? 1);
  }
}

/**
 * Run wrangler with its arguments as an array, so one containing spaces stays
 * one argument.
 *
 * `npx wrangler …` through a shell goes cmd.exe → npx.cmd → wrangler.cmd → node
 * on Windows, and each shim re-parses the line. The quotes did not survive that,
 * so `--message "v0.0.1 Current Baseline Build"` reached wrangler as separate
 * words: it took `v0.0.1` as the message, `Current` as the positional script
 * argument, and rejected the rest with `Unknown arguments: Baseline, Build`.
 * Every release title has a space in it, so every deploy failed.
 *
 * Spawning wrangler's own entry point with node skips all three shims. Passing
 * `npx.cmd` an argv array instead is not an option: since the fix for
 * CVE-2024-27980, Node refuses to spawn a .cmd without `shell: true`, which puts
 * the parsing back.
 */
// Resolved via package.json: wrangler's "exports" map does not expose
// ./bin/wrangler.js, so asking for it directly throws ERR_PACKAGE_PATH_NOT_EXPORTED.
const WRANGLER = join(
  dirname(createRequire(import.meta.url).resolve("wrangler/package.json")),
  "bin",
  "wrangler.js",
);

/**
 * The Cloudflare credentials handed to wrangler, and only to wrangler.
 *
 * Deliberately NOT part of `buildEnv`: this is a deploy-time credential, so it has no business in
 * `next build`'s environment, and keeping it out means it cannot be inlined or baked into the
 * bundle however the adapter changes. (`strip-baked-env.mjs` empties the baked snapshot anyway;
 * belt and braces, because that snapshot is written from `.env*`, not from `.env.deploy.*`, and
 * only one of those two facts is guaranteed to stay true.)
 *
 * The environment's own file WINS over the shell, which is the opposite way round from the trap
 * the Supabase access token set (named here without backticks on purpose: check-runtime-config
 * forbids this file from spelling a manifest name inside quotes or backticks, comments included,
 * so that names are derived from the manifest rather than copied): there the shell's token for
 * another Supabase account beat the file's
 * and every UAT read failed until `scripts/lib/env.mjs` was changed (2026-11-08). A token is a
 * property of the environment being deployed, not of the window the command is typed in.
 */
/**
 * Which layer each Cloudflare credential comes from, in `mergeLayers`' own order.
 *
 * Read from the LAYERS, not from the merged `env`: the merged view cannot tell a value in the
 * environment's file from one exported in the shell, and the first draft of this that read `env`
 * reported a shell-only token as *"API token from .env.local"* — a line that would have sent the
 * next reader to the wrong file. Both keys are in `ACCOUNT_KEYS`, so a non-empty value in the
 * environment's own file beats the shell; below that it is shell, then `.env.local`.
 */
function cfSource(key) {
  const { base, overlay, shell } = loadLayers(envName);
  const file = envFile(envName);
  const o = (overlay[key] ?? "").trim();
  if (o) return { value: o, from: file };
  const s = (shell[key] ?? "").trim();
  if (s) return { value: s, from: "the shell" };
  const b = (base[key] ?? "").trim();
  if (b) return { value: b, from: ".env.local" };
  return null;
}

/** The credentials handed to wrangler. Empty means wrangler falls back to its own OAuth login. */
function cfAuth() {
  const token = cfSource("CLOUDFLARE_API_TOKEN");
  if (!token) return {};
  const account = cfSource(CLOUDFLARE_ACCOUNT_VAR);
  return {
    CLOUDFLARE_API_TOKEN: token.value,
    ...(account ? { [CLOUDFLARE_ACCOUNT_VAR]: account.value } : {}),
  };
}

/** One line naming which credential wrangler will use, so a `code: 10000` is never a mystery. */
function cfAuthNote() {
  const token = cfSource("CLOUDFLARE_API_TOKEN");
  if (token) {
    const account = cfSource(CLOUDFLARE_ACCOUNT_VAR);
    return (
      `API token from ${token.from}` +
      (account ? `, account id from ${account.from}` : ", no account id set (wrangler infers it)")
    );
  }
  // Deduped defensively: should two of these ever name the same file, naming both
  // would read "in X, the shell or X".
  const looked = [...new Set([envFile(envName), "the shell", ".env.local"])];
  return (
    `wrangler's own OAuth login — no CLOUDFLARE_API_TOKEN in ${looked.slice(0, -1).join(", ")} or ${looked.at(-1)}. ` +
    "Its access token can expire part-way through the build (0.47.1); see the header"
  );
}

function wrangler(args, opts = {}) {
  // --require the net trace: wrangler swallows the error behind its DNS message (#wgdns).
  const trace = fileURLToPath(new URL("./lib/wrangler-net-trace.cjs", import.meta.url));
  // Retried ONLY on the sub-second DNS blackout (#dnsgp): a getaddrinfo ENOTFOUND that the trace saw
  // inside this child. Any other failure fails at once, as before. This runs after the build, so a
  // retry re-uploads the same .open-next output and never rebuilds.
  // docs/decisions/2026-11-27-deploy-dns-blackout.md
  const cmd = `wrangler ${args.join(" ")}`;
  const dir = mkdtempSync(join(tmpdir(), "deploy-net-trace-"));
  try {
    for (let retriesDone = 0; ; retriesDone++) {
      const traceFile = join(dir, `attempt-${retriesDone}.log`);
      const r = spawnSync(process.execPath, ["--require", trace, WRANGLER, ...args], {
        stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit",
        ...opts,
        env: { ...process.env, ...cfAuth(), ...(opts.env ?? {}), DEPLOY_NET_TRACE_FILE: traceFile },
      });
      if (r.status === 0) {
        if (retriesDone) console.log(`deploy: DNS-RETRY: \`${cmd}\` succeeded on retry ${retriesDone} of ${DNS_RETRY_MAX}. Note it in the release record (#dnsgp).`);
        return;
      }
      let traceText = "";
      try {
        traceText = readFileSync(traceFile, "utf8");
      } catch {
        // no file: the trace saw no failed lookup
      }
      const d = dnsRetryDecision({ status: r.status, traceText, retriesDone });
      if (!d.retry) {
        console.error(`\ndeploy: \`${cmd}\` exited with ${r.status}`);
        if (retriesDone) console.error(`deploy: DNS-RETRY: gave up after ${retriesDone} retr${retriesDone === 1 ? "y" : "ies"} (#dnsgp).`);
        bail(r.status ?? 1);
      }
      const delay = dnsRetryDelayMs(retriesDone);
      console.warn(
        `\ndeploy: DNS-RETRY ${retriesDone + 1} of ${DNS_RETRY_MAX}: \`${cmd}\` exited with ${r.status} and the net trace saw ` +
          `getaddrinfo ENOTFOUND for ${d.hosts.join(", ")}: the machine-wide DNS blackout (#dnsgp). ` +
          `Retrying in ${delay / 1000}s with the same build (no rebuild). Note it in the release record.`,
      );
      // Visible waiting: a silent pause reads exactly like a hang, so say something every 5 s.
      for (let left = delay; left > 0; left -= 5000) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(5000, left));
        if (left > 5000) console.warn(`deploy: DNS-RETRY waiting, ${(left - 5000) / 1000}s until retry ${retriesDone + 1} of ${DNS_RETRY_MAX}…`);
      }
      console.warn(`deploy: DNS-RETRY ${retriesDone + 1} of ${DNS_RETRY_MAX}: retrying now.`);
      // The 0.47.4 safeguard on every attempt: the build being re-uploaded still carries this key.
      const problem = builtKeyProblem(env[ACTIONS_KEY_VAR]);
      if (problem) {
        console.error(`deploy: ${envName}: ${problem}`);
        bail(2);
      }
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const git = (args) => spawnSync(`git ${args}`, { shell: true, encoding: "utf8" }).stdout.trim();

const env = loadEnv(envName);
for (const key of [...BUILD_VARS, ...(pushSecrets ? RUNTIME_SECRETS : [])]) {
  if (!env[key]) {
    console.error(`deploy: ${key} is not set for the ${envName} environment.`);
    bail(2);
  }
}

// Which of the secrets --secrets will push came only from .env.local (dev)? Refused
// before the build so a wrong push costs seconds, not a four-minute build.
let secretNames = [];
if (pushSecrets) {
  secretNames = [...RUNTIME_SECRETS, ...OPTIONAL_SECRETS.filter((k) => env[k])];
  const sources = sourcesFor(secretNames, loadLayers(envName), envFile(envName));
  console.log(`deploy: --secrets plan for ${envName} (every registry name, pushed or skipped, and why):\n` + planLines({ sources, required: RUNTIME_SECRETS, notPushed: WORKER_NOT_PUSHED, unsetOptional: OPTIONAL_SECRETS.filter((k) => !env[k]), deliberate: DELIBERATE_DEV_FALLTHROUGH, overlayName: envFile(envName) }).join("\n"));
  // UAT has its own database: a Supabase secret that exists only in .env.local is dev's, and no flag
  // may push it to UAT (the Drive set may still fall through until #rqv5c).
  const devDb = envName === "uat" ? localOnly(sources).filter((n) => /SUPABASE/.test(n)) : [];
  if (devDb.length) {
    console.error(`deploy: uat would push dev's database secret(s) from .env.local: ${devDb.join(", ")}. Put UAT's own in ${envFile(envName)}; ${ALLOW_FLAG} does not apply to these.`);
    bail(2);
  }
  const refusal = GUARDED
    ? fallthroughRefusal({ envName, sources, overlayName: envFile(envName), allowed: rest.includes(ALLOW_FLAG), deliberate: DELIBERATE_DEV_FALLTHROUGH })
    : null;
  if (refusal) {
    console.error(`deploy: ${refusal}`);
    bail(2);
  }
}

// Same value the Pi builds with, or a form one renders fails on the other
// (scripts/lib/actions-key.mjs). Refused here, before a build, rather than
// shipped with a random key of its own.
{
  const problem = actionsKeyProblem(env[ACTIONS_KEY_VAR]);
  if (problem) {
    console.error(`deploy: ${envName}: ${problem}`);
    bail(2);
  }
}

{
  const builds = appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (builds !== EXPECTED_APP_ENV[envName]) {
    console.error(
      `deploy: --env ${envName} points at Supabase project ${projectRef(env)}, which src/lib/app-env.ts ` +
        `calls "${builds}" — the build would wear ${builds}'s badge, not ${envName}'s.` +
        (envName === "uat" ? "\n  UAT has its own project (docs/decisions/2026-11-06-uat-own-database.md): .env.deploy.uat must hold ITS values, not dev's or production's." : ""),
    );
    bail(2);
  }
}

// A leftover env file for another environment (belt; the build below pins
// NEXT_PUBLIC_SITE_URL itself, so it can no longer leak the host). Guarded for
// test too: unlike a missing migration, no environment ever wants one.
// docs/decisions/2026-10-01-deploy-pins-site-url.md
{
  const stray = strayEnvFiles(envName, {
    siteOrigin: SITE_ORIGINS[envName],
    expectedAppEnv: EXPECTED_APP_ENV[envName],
    appEnvForSupabaseUrl,
  });
  if (stray.length) {
    console.error(
      `deploy: ${envName} would build with an env file that names another environment:\n  - ` +
        stray.map((s) => `${s.file}: ${s.why}`).join("\n  - ") +
        `\nMove it out of the checkout (mv ${stray[0].file} ..) and deploy again.`,
    );
    bail(2);
  }
}

if (GUARDED) {
  git("fetch origin main --quiet");
  const branch = git("rev-parse --abbrev-ref HEAD");
  const dirty = git("status --porcelain");
  const behindAhead = git("rev-list --left-right --count origin/main...HEAD");
  const problems = [];
  if (branch !== "main") problems.push(`on branch ${branch}, not main`);
  if (dirty) problems.push("working tree has uncommitted changes");
  if (behindAhead !== "0\t0") problems.push(`main and origin/main differ (${behindAhead.replace("\t", " behind / ")} ahead)`);
  if (problems.length) {
    console.error(`deploy: ${envName} deploys only from a clean, pushed main:\n  - ` + problems.join("\n  - "));
    bail(2);
  }
}

// The database must hold every migration this commit carries. 0.10.1 put a
// column reader live an hour before its migration (docs/releases/2026-09-30.md).
// Only "every file in the deployed commit is applied" counts: extra applied rows
// are schema ahead of code, which is fine (docs/decisions/2026-10-01-deploy-requires-deployed-migrations-applied.md).
// Could not ask is a warning, not a refusal: a Supabase blip must not block a release.
if (GUARDED) {
  const verdict = schemaVerdict({ envName, result: await appliedMigrations(env, projectRef(env)), git });
  for (const w of verdict.warnings) console.warn(`deploy: WARNING: ${w}`);
  if (verdict.refusal) {
    console.error(`deploy: ${verdict.refusal}`);
    bail(2);
  }
}

// The release this deploy ships.
{
  const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
  const problems = releaseProblems({ pkgVersion, latestRelease, unreleased });
  if (problems.length && GUARDED) {
    console.error(`deploy: ${envName} ships only a written-down release:\n  - ` + problems.join("\n  - "));
    bail(2);
  }
  for (const p of problems) console.warn(`deploy: warning: ${p}`);
}

/** The release the live site says it runs, or null if it can't say. */
async function liveVersion() {
  try {
    const r = await fetch(`${SITE_ORIGINS[envName]}/api/releases/current`, { signal: AbortSignal.timeout(10_000) });
    if (!r.ok) return null;
    const { version } = await r.json();
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}
const previous = await liveVersion();

// The hosts the console attached to this Worker (#hstau). A deploy DELETES every custom domain absent from
// the config it deploys (measured, #1899), so each flagged host is passed as `--domain`, which wrangler
// APPENDS to wrangler.jsonc's routes (docs/decisions/2026-11-26-host-attach-deploy.md, -deploy-reasserts-hosts.md).
//
// A FAILED READ REFUSES THE DEPLOY, and that is deliberate: do NOT soften it to a warning. Deploying without
// the list is exactly the outage this exists to prevent — every console-attached shelter address would go
// dark until someone noticed. A Supabase blip costing a retry is the cheaper failure. (Contrast the schema
// check above, where "could not ask" warns: a missed check there loses nothing that is live.)
const flagged = await readFlaggedHosts(env, projectRef(env));
if (!flagged.ok) {
  console.error(
    `deploy: could not read which hosts are attached to the ${envName} Worker (shelter_hosts.attach_to_worker): ${flagged.reason}.
` +
      "  Refusing: a deploy without that list would DELETE every console-attached custom domain. Retry when the database answers.",
  );
  bail(2);
}
const extraDomains = domainsToReassert(flagged.hosts, routeHosts(readWranglerConfig(), envName));

console.log(`deploy: release ${latestRelease.version} "${latestRelease.title}" (live now: ${previous ?? "unknown"})`);
if (noPi) console.log(`deploy: --no-pi: ORIGIN_HOST will be EMPTY on ${envName}; the Worker serves everything and the Pi is bypassed. Deploy again without --no-pi to put it back.`);
console.log(`deploy: ${envName} → Supabase project ${projectRef(env)} (${git("rev-parse --short HEAD")})`);
console.log(`deploy: wrangler auth: ${cfAuthNote()}`);

// The tag and message land in the Worker's version history (dashboard →
// Workers → Deployments). The strip keeps the message readable in that list.
const message = `v${latestRelease.version} ${latestRelease.title}`.replace(/[^\w .,:-]/g, "");
// --autoconfig false stops wrangler detecting an OpenNext project and handing
// off to `opennextjs-cloudflare deploy`, which re-invokes wrangler with a
// re-joined command line and loses the quoting again. We have already run the
// OpenNext build and the env strip, so there is nothing for that hand-off to add.
// A --var on the command line beats wrangler.jsonc's value, and "NAME:" with
// nothing after the colon is an empty string (checked in wrangler 4.145).
const deployArgs = [
  "deploy",
  "--env",
  envName,
  "--tag",
  `v${latestRelease.version}`,
  "--message",
  message,
  "--autoconfig",
  "false",
  ...(noPi ? ["--var", "ORIGIN_HOST:"] : []),
  ...extraDomains.flatMap((h) => ["--domain", h]),
];
console.log(
  `deploy: attached hosts re-asserted as --domain: ${extraDomains.length ? extraDomains.join(", ") : "none"}` +
    ` (${flagged.hosts.length} flagged in shelter_hosts, the rest already in wrangler.jsonc routes)`,
);
if (planOnly) {
  console.log(`deploy: --plan: would ${skipBuild ? "reuse the last build" : "build"}${pushSecrets ? ", push secrets" : ""}, then run:`);
  console.log(`  wrangler ${deployArgs.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
  // Say what it would do about mail, so the decision is visible BEFORE the deploy rather than in a
  // line that scrolls past after it. `0.43.6` had to be asserted by reading the code instead.
  const mailPlan = noMail
    ? "--no-mail: nothing would be mailed"
    : uatWillNotMail
      ? "uat does not mail unless --mail is given: nothing would be mailed"
      : "a major release new to this environment would be mailed to the admins";
  console.log(`deploy: --plan: mail: ${mailPlan}.`);
  console.log("deploy: --plan: stopping here; nothing built, uploaded or deployed.");
  bail(0);
}

// Safe to run beside a live `next dev`: the build type-checks with
// tsconfig.build.json (see next.config.ts), which leaves out the
// `.next/dev` types the dev server keeps rewriting.
if (!skipBuild) {
  // Held until deploy exits: an `npm ci` in this checkout mid-build deletes the
  // tree under it (2026-11-03). Refuse rather than race, and check the tree first.
  try {
    takeTreeLock("build");
  } catch (e) {
    console.error(`deploy: ${e.message}`);
    bail(2);
  }
  const damaged = treeProblems();
  if (damaged) {
    console.error(`deploy: ${damaged}`);
    bail(2);
  }
  const buildEnv = { ...process.env };
  for (const key of [...BUILD_VARS, ACTIONS_KEY_VAR]) buildEnv[key] = env[key];
  // EVERY address from wrangler.jsonc (SITE_HOST_VARS in src/lib/site-hosts.ts):
  // next.config.ts builds serverActions.allowedOrigins from them. Pinned, not
  // inherited, so no shell or env file can put another host in the bundle.
  //
  // A LOOP, NOT A LINE EACH, and that is the whole point: this read "the two
  // addresses" and assigned exactly two, so when PLATFORM_HOST was added to
  // site-hosts.ts and wrangler.jsonc it was silently left out of the build
  // (#plhbd). wrangler.jsonc `vars` are RUNTIME values, so a host that is not
  // pinned here never reaches the bundle, and every Server Action on it is
  // refused while every page still renders.
  const wranglerVars = readWranglerConfig().env?.[envName]?.vars ?? {};
  for (const key of SITE_HOST_VARS) buildEnv[key] = wranglerVars[key];
  delete buildEnv.NEXT_PUBLIC_SITE_URL;
  run("npm run opennext:build", { env: buildEnv });
  run("node scripts/strip-baked-env.mjs");
  // The commit this build was made from, beside the one the release was asked
  // for (--ref <sha>, optional). A build can come from a different commit than
  // the release names: a 0.42.0 test deploy took no ref and built the wrong one.
  const built = git("rev-parse HEAD");
  const asked = rest.includes("--ref") ? rest[rest.indexOf("--ref") + 1] : null;
  const dirtyTree = git("status --porcelain") ? " (working tree has uncommitted changes)" : "";
  console.log(`deploy: built from ${built.slice(0, 12)}${dirtyTree}; release SHA asked for: ${asked ?? "none given (--ref <sha>)"}`);
  if (asked && !built.startsWith(asked)) console.warn(`deploy: WARNING: the build is ${built.slice(0, 12)}, not the requested ${asked}.`);
}

// Whatever .next holds now — fresh, or the previous run's under --skip-build —
// must carry this environment's key. Compare this fingerprint with the one
// deploy-pi.sh prints on the Pi.
{
  const problem = builtKeyProblem(env[ACTIONS_KEY_VAR]);
  if (problem) {
    console.error(`deploy: ${envName}: ${problem}`);
    bail(2);
  }
  console.log(`deploy: Server Actions key ${keyFingerprint(env[ACTIONS_KEY_VAR])} (the Pi's build must print the same)`);
}

if (pushSecrets) {
  const secrets = Object.fromEntries(secretNames.map((k) => [k, env[k]]));
  wrangler(["secret", "bulk", "--env", envName], { input: JSON.stringify(secrets) });
}

wrangler(deployArgs);

await announce();

/**
 * Mail the major releases this deploy brought to the site. This script
 * picks the releases and the admins; the Worker labels the environment,
 * sets the From and decides whether to send at all (worker/release-mail.mjs).
 * On test it answers that mail is off, and that is printed like any result.
 */
async function announce() {
  const majors = majorReleasesSince(previous);
  if (!majors.length) {
    console.log(`deploy: no major release new to ${envName} (was ${previous ?? "unknown"}), so no email.`);
    return;
  }
  const versions = majors.map((r) => r.version).join(", ");
  if (noMail) {
    console.log(`deploy: --no-mail, not announcing ${versions}.`);
    return;
  }
  if (uatWillNotMail) {
    console.log(`deploy: uat does not mail unless --mail is given, so not announcing ${versions}. Its database holds production's real people.`);
    return;
  }
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    console.warn(`deploy: SUPABASE_SERVICE_ROLE_KEY is not set for ${envName}; not announcing ${versions}.`);
    return;
  }

  // The new Worker takes a few seconds to answer everywhere. Mail only once
  // it does, so the relay that sends is the one that knows this release.
  for (let i = 0; i < 12 && (await liveVersion()) !== latestRelease.version; i++) {
    await new Promise((r) => setTimeout(r, 5_000));
  }

  // user_roles, then each login's email from the Auth admin API — not the
  // app_users view, which shows nothing without a signed-in role (0063).
  const auth = { headers: { apikey: key, authorization: `Bearer ${key}` } };
  const rolesRes = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?select=user_id,roles!inner(key)&roles.key=eq.admin&archived_at=is.null`,
    auth,
  );
  if (!rolesRes.ok) {
    console.warn(`deploy: could not list admins (${rolesRes.status}); not announcing ${versions}.`);
    return;
  }
  const to = [];
  for (const { user_id } of await rolesRes.json()) {
    const userRes = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${user_id}`, auth);
    const email = userRes.ok ? (await userRes.json()).email : null;
    if (email) to.push(email);
  }
  if (!to.length) {
    console.warn(`deploy: no admin in ${envName} has an email; not announcing ${versions}.`);
    return;
  }

  const res = await fetch(`${SITE_ORIGINS[envName]}/api/releases/mail`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...buildReleaseMail(majors, SITE_ORIGINS[envName], DEFAULT_SHELTER_NAMES), to }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.warn(`deploy: the release mail relay answered ${res.status}: ${result.error ?? "no detail"}`);
    return;
  }
  console.log(
    `deploy: release mail for ${versions} [${result.environment || "off"}]: sent ${result.sent.length}, skipped ${result.skipped.length}`,
  );
  for (const a of result.sent) console.log(`  sent     ${a}`);
  for (const s of result.skipped) console.log(`  skipped  ${s.address}: ${s.reason}`);
}
}

await runMain(main);
