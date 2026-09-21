// Which environment a script is talking to, and that environment's values.
//
// There are two deployable environments (wrangler.jsonc, README "Deploying
// to Cloudflare"):
//
//   test        the dev Supabase project + dev Google Drive — the same values
//               `next dev` uses, so it reads .env.local and nothing else.
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

export const ENVIRONMENTS = ["test", "production"];

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
  const overlay = name === "production" ? readDotEnv(".env.deploy.production") : {};
  if (name === "production" && !Object.keys(overlay).length) {
    console.error(".env.deploy.production is missing or empty — see README, \"Deploying to Cloudflare\".");
    process.exit(2);
  }
  return { ...base, ...overlay, ...process.env };
}

/** The Supabase project ref an environment points at, for printing before acting. */
export function projectRef(env) {
  return new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
}
