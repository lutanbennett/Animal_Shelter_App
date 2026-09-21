// Build and deploy one environment's Worker.
//
//   node scripts/deploy.mjs --env test                # test.lannacare.org
//   node scripts/deploy.mjs --env production          # lannacare.org
//   node scripts/deploy.mjs --env production --secrets
//       # also (re)upload the five runtime secrets for that environment first
//   ... --skip-build   # reuse the .open-next output of the previous run
//
// Why a script rather than `opennextjs-cloudflare deploy --env`: the Supabase
// URL and anon key are inlined by `next build`, so each environment needs its
// own build with its own values in the shell (shell beats .env.local for
// Next), and the env-file snapshot OpenNext bakes into the bundle has to be
// emptied before upload (scripts/strip-baked-env.mjs). Production also gets a
// guard: the checkout must be a clean, pushed `main`, so what is live is
// always a commit GitHub has.
import { spawnSync } from "node:child_process";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const pushSecrets = rest.includes("--secrets");
const skipBuild = rest.includes("--skip-build");

const RUNTIME_SECRETS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REFRESH_TOKEN",
  "GOOGLE_DRIVE_ROOT_FOLDER_ID",
];
const BUILD_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];

function run(cmd, opts = {}) {
  const r = spawnSync(cmd, { stdio: opts.input ? ["pipe", "inherit", "inherit"] : "inherit", shell: true, ...opts });
  if (r.status !== 0) {
    console.error(`\ndeploy: \`${cmd}\` exited with ${r.status}`);
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

if (envName === "production") {
  git("fetch origin main --quiet");
  const branch = git("rev-parse --abbrev-ref HEAD");
  const dirty = git("status --porcelain");
  const behindAhead = git("rev-list --left-right --count origin/main...HEAD");
  const problems = [];
  if (branch !== "main") problems.push(`on branch ${branch}, not main`);
  if (dirty) problems.push("working tree has uncommitted changes");
  if (behindAhead !== "0\t0") problems.push(`main and origin/main differ (${behindAhead.replace("\t", " behind / ")} ahead)`);
  if (problems.length) {
    console.error("deploy: production deploys only from a clean, pushed main:\n  - " + problems.join("\n  - "));
    process.exit(2);
  }
}

console.log(`deploy: ${envName} → Supabase project ${projectRef(env)} (${git("rev-parse --short HEAD")})`);

if (!skipBuild) {
  const buildEnv = { ...process.env };
  for (const key of BUILD_VARS) buildEnv[key] = env[key];
  run("npm run opennext:build", { env: buildEnv });
  run("node scripts/strip-baked-env.mjs");
}

if (pushSecrets) {
  const secrets = Object.fromEntries(RUNTIME_SECRETS.map((k) => [k, env[k]]));
  run(`npx wrangler secret bulk --env ${envName}`, { input: JSON.stringify(secrets) });
}

run(`npx wrangler deploy --env ${envName}`);
