// Which environment a script is talking to, and that environment's values.
//
// There are three deployable environments (wrangler.jsonc, README
// "Environments"):
//
//   test        the dev Supabase project + dev Google Drive — the same values
//               `next dev` uses, so it reads .env.local and nothing else.
//   uat         the UAT Supabase project — values in the gitignored
//               .env.deploy.uat, layered OVER .env.local like production's.
//               It has no project of its own until the cutover (UAT_PROJECT_REF
//               in src/lib/app-env.ts), so until then the file doesn't exist
//               and anything given --env uat stops here.
//   production  the production Supabase project — its values live in the
//               gitignored .env.deploy.production, which is layered OVER
//               .env.local so anything not set there (the Google Drive set,
//               while Drive still runs on the dev account) falls through.
//
// Shell variables win over both files, as they do for `next build`. Nothing
// here is read by Next.js or OpenNext on its own: .env.deploy.* is not a name
// either of them loads, which is the point — a production build only sees
// production values when scripts/deploy.mjs puts them in the shell.
import { existsSync, readFileSync } from "node:fs";

export const ENVIRONMENTS = ["test", "uat", "production"];

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

/** The merged variables for an environment: shell > .env.deploy.<env> > .env.local. */
export function loadEnv(name) {
  const base = readDotEnv(".env.local");
  const overlay = name === "test" ? {} : readDotEnv(envFile(name));
  if (name !== "test" && !Object.keys(overlay).length) {
    console.error(`${envFile(name)} is missing or empty — see README, "Environments".`);
    process.exit(2);
  }
  return { ...base, ...overlay, ...process.env };
}

/** The Supabase project ref an environment points at, for printing before acting. */
export function projectRef(env) {
  return new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
}
