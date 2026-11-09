// Which environment a script is talking to, and that environment's values.
//
// There are three deployable environments (wrangler.jsonc, README
// "Environments"):
//
//   test        the dev Supabase project + dev Google Drive — the same values
//               `next dev` uses, so it reads .env.local and nothing else.
//   uat         the UAT Supabase project — values in the gitignored
//               .env.deploy.uat, layered OVER .env.local like production's.
//               It has its OWN project (docs/decisions/2026-11-06-uat-own-database.md,
//               in a second Supabase account), so every Supabase value is its own and
//               deploy.mjs refuses to push a dev one for it. If the file doesn't
//               exist, anything given --env uat stops here.
//   production  the production Supabase project — its values live in the
//               gitignored .env.deploy.production, which is layered OVER
//               .env.local so anything not set there (the Google Drive set,
//               while Drive still runs on the dev account) falls through.
//
// Shell variables win over both files, as they do for `next build`, except the
// account keys below (ACCOUNT_KEYS), where an environment's own file wins. Nothing
// here is read by Next.js or OpenNext on its own: .env.deploy.* is not a name
// either of them loads, which is the point — a production build only sees
// production values when scripts/deploy.mjs puts them in the shell.
import { existsSync, readFileSync } from "node:fs";
import { readWranglerConfig } from "./wrangler.mjs";

export const ENVIRONMENTS = ["test", "uat", "production"];

// Where each environment's staff app answers: for asking the live site which
// release it runs, and for the link in the email. Read from APP_HOST in
// wrangler.jsonc, the one place the address is set (src/lib/site-hosts.ts).
const wranglerEnvs = readWranglerConfig().env ?? {};
export const SITE_ORIGINS = Object.fromEntries(
  ["test", "uat", "production"].map((n) => [n, `https://${wranglerEnvs[n]?.vars?.APP_HOST}`]),
);

/** The file an environment's own values live in; test has none beyond .env.local. */
export function envFile(name) {
  return name === "test" ? ".env.local" : `.env.deploy.${name}`;
}

/** Pull `--env <name>` out of argv; returns the name (default "test") and the rest. */
export function parseEnvArg(argv) {
  const rest = [...argv];
  let name = "test";
  const i = rest.indexOf("--env");
  if (i >= 0) {
    name = rest[i + 1];
    if (!ENVIRONMENTS.includes(name)) {
      console.error(`--env must be one of ${ENVIRONMENTS.join(", ")} (got ${name ?? "nothing"}).`);
      process.exit(2);
    }
    rest.splice(i, 2);
  }
  return { name, rest };
}

function readDotEnv(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
  return out;
}

/** The three layers separately, for saying where each value came from. */
export function loadLayers(name) {
  return {
    base: readDotEnv(".env.local"),
    overlay: name === "test" ? {} : readDotEnv(envFile(name)),
    shell: process.env,
  };
}

// Keys that say WHICH ACCOUNT a script acts as, not how it behaves. For these an
// environment's own file beats the shell. UAT lives in a second Supabase account
// (docs/decisions/2026-11-06-uat-own-database.md) while this PC's shell carries the first
// account's token, so with the shell winning every UAT read died with "Missing required
// permission(s): database_read" — read on 2026-11-08 as a missing permission on UAT's
// token, and filed as one (#t0k9r). It was the wrong account's token
// (docs/decisions/2026-11-08-uat-go-live-findings.md). Production's file sets no token,
// so the shell's (the production account's) still applies there.
export const ACCOUNT_KEYS = ["SUPABASE_ACCESS_TOKEN"];

/** shell > overlay > base, except that an overlay's non-empty ACCOUNT_KEYS beat the shell. */
export function mergeLayers(base, overlay, shell) {
  const merged = { ...base, ...overlay, ...shell };
  for (const k of ACCOUNT_KEYS) if (overlay[k]) merged[k] = overlay[k];
  return merged;
}

/** The merged variables for an environment: shell > .env.deploy.<env> > .env.local (see ACCOUNT_KEYS). */
export function loadEnv(name) {
  const base = readDotEnv(".env.local");
  const overlay = name === "test" ? {} : readDotEnv(envFile(name));
  if (name !== "test" && !Object.keys(overlay).length) {
    console.error(`${envFile(name)} is missing or empty — see README, "Environments".`);
    process.exit(2);
  }
  return mergeLayers(base, overlay, process.env);
}

/** The Supabase project ref an environment points at, for printing before acting. */
export function projectRef(env) {
  return new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
}
