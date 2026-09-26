// Build and deploy one environment's Worker.
//
//   node scripts/deploy.mjs --env test                # test.lannacare.org
//   node scripts/deploy.mjs --env uat                 # lannacare.org, from the cutover
//   node scripts/deploy.mjs --env production          # lannacare.org until the cutover
//   node scripts/deploy.mjs --env production --secrets
//       # also (re)upload the five runtime secrets for that environment first
//   ... --skip-build   # reuse the .open-next output of the previous run
//   ... --no-mail      # deploy without emailing a major release to admins
//
// Why a script rather than `opennextjs-cloudflare deploy --env`: the Supabase
// URL and anon key are inlined by `next build`, so each environment needs its
// own build with its own values in the shell (shell beats .env.local for
// Next), and the env-file snapshot OpenNext bakes into the bundle has to be
// emptied before upload (scripts/strip-baked-env.mjs). UAT and production also
// get a guard: the checkout must be a clean, pushed `main`, so what the
// customer tests and what is live are always commits GitHub has. And every
// environment's build must wear its own badge (src/lib/app-env.ts), so a
// wrong env file can't put Production's look on a UAT database or the reverse.
//
// Every deploy is also a release (src/lib/releases.ts): package.json must
// name the newest entry, UAT and production refuse unreleased notes, the
// Worker version is tagged with it, and a major release that is new to the
// site is mailed to that environment's admins through the Worker (announce()).
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";
// TypeScript, loaded through Node's type stripping: the same file the app
// renders, so the page, the tag and the email can't disagree.
import { latestRelease, majorReleasesSince, unreleased } from "../src/lib/releases.ts";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";
import { buildReleaseMail } from "../src/lib/release-mail.ts";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const pushSecrets = rest.includes("--secrets");
const skipBuild = rest.includes("--skip-build");
const noMail = rest.includes("--no-mail");

// Where each environment answers: for asking the live site which release it
// runs, and for the link in the email. lannacare.org is UAT's for good; the
// cutover moves production to lannacareforanimals.org and until then uat
// can't deploy (below), so the two sharing an origin never meet.
const SITE_ORIGINS = {
  test: "https://test.lannacare.org",
  uat: "https://lannacare.org",
  production: "https://lannacare.org",
};

// What src/lib/app-env.ts must call each environment's database.
const EXPECTED_APP_ENV = { test: "dev", uat: "uat", production: "production" };

// Environments where a deploy is something a customer or the shelter sees.
const GUARDED = envName === "uat" || envName === "production";

const RUNTIME_SECRETS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REFRESH_TOKEN",
  "GOOGLE_DRIVE_ROOT_FOLDER_ID",
];
// Shared with the WAF rule that guards the Pi's tunnel hostname
// (docs/pi-hosting.md); pushed when set, harmless when not. The two
// Cloudflare ones feed the visitor count on Settings → System status
// (src/lib/status/usage.ts), which stays grey until both are set.
const OPTIONAL_SECRETS = ["ORIGIN_KEY", "CLOUDFLARE_ANALYTICS_TOKEN", "CLOUDFLARE_ZONE_ID"];
const BUILD_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function run(cmd, opts = {}) {
  const r = spawnSync(cmd, { stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit", shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`\ndeploy: \`${cmd}\` exited with ${r.status}`);
    process.exit(r.status ?? 1);
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

function wrangler(args, opts = {}) {
  const r = spawnSync(process.execPath, [WRANGLER, ...args], {
    stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit",
    ...opts,
  });
  if (r.status !== 0) {
    console.error(`\ndeploy: \`wrangler ${args.join(" ")}\` exited with ${r.status}`);
    process.exit(r.status ?? 1);
  }
}
const git = (args) => spawnSync(`git ${args}`, { shell: true, encoding: "utf8" }).stdout.trim();

const env = loadEnv(envName);
for (const key of [...BUILD_VARS, ...(pushSecrets ? RUNTIME_SECRETS : [])]) {
  if (!env[key]) {
    console.error(`deploy: ${key} is not set for the ${envName} environment.`);
    process.exit(2);
  }
}

{
  const builds = appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL);
  if (builds !== EXPECTED_APP_ENV[envName]) {
    console.error(
      `deploy: --env ${envName} points at Supabase project ${projectRef(env)}, which src/lib/app-env.ts ` +
        `calls "${builds}" — the build would wear ${builds}'s badge, not ${envName}'s.` +
        (envName === "uat" ? "\n  UAT has no project of its own until the cutover sets UAT_PROJECT_REF there." : ""),
    );
    process.exit(2);
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
    process.exit(2);
  }
}

// The release this deploy ships.
{
  const pkgVersion = JSON.parse(readFileSync("package.json", "utf8")).version;
  const problems = [];
  if (pkgVersion !== latestRelease.version) {
    problems.push(`package.json says ${pkgVersion} but the newest release in src/lib/releases.ts is ${latestRelease.version}`);
  }
  if (unreleased.length) {
    problems.push(`src/lib/releases.ts has ${unreleased.length} unreleased note(s); cut a release first (see the top of that file)`);
  }
  if (problems.length && GUARDED) {
    console.error(`deploy: ${envName} ships only a written-down release:\n  - ` + problems.join("\n  - "));
    process.exit(2);
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

console.log(`deploy: release ${latestRelease.version} "${latestRelease.title}" (live now: ${previous ?? "unknown"})`);
console.log(`deploy: ${envName} → Supabase project ${projectRef(env)} (${git("rev-parse --short HEAD")})`);

// Safe to run beside a live `next dev`: the build type-checks with
// tsconfig.build.json (see next.config.ts), which leaves out the
// `.next/dev` types the dev server keeps rewriting.
if (!skipBuild) {
  const buildEnv = { ...process.env };
  for (const key of BUILD_VARS) buildEnv[key] = env[key];
  run("npm run opennext:build", { env: buildEnv });
  run("node scripts/strip-baked-env.mjs");
}

if (pushSecrets) {
  const secrets = Object.fromEntries(
    [...RUNTIME_SECRETS, ...OPTIONAL_SECRETS.filter((k) => env[k])].map((k) => [k, env[k]]),
  );
  wrangler(["secret", "bulk", "--env", envName], { input: JSON.stringify(secrets) });
}

// The tag and message land in the Worker's version history (dashboard →
// Workers → Deployments): a record of what went where and when, with no
// table of our own. The strip keeps the message readable in that list; it is
// no longer load-bearing for quoting, since wrangler() does not use a shell.
const message = `v${latestRelease.version} ${latestRelease.title}`.replace(/[^\w .,:-]/g, "");
// --autoconfig false stops wrangler detecting an OpenNext project and handing
// off to `opennextjs-cloudflare deploy`, which re-invokes wrangler with a
// re-joined command line and loses the quoting again — downstream of anything
// this script can control. We have already run the OpenNext build and the env
// strip above, so there is nothing for that hand-off to add.
wrangler([
  "deploy",
  "--env",
  envName,
  "--tag",
  `v${latestRelease.version}`,
  "--message",
  message,
  "--autoconfig",
  "false",
]);

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
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?select=user_id&role=eq.admin&archived_at=is.null`,
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
    body: JSON.stringify({ ...buildReleaseMail(majors, SITE_ORIGINS[envName]), to }),
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
