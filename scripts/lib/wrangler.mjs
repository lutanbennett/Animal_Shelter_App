// wrangler.jsonc, read by the scripts that need what the Worker is configured
// with (scripts/deploy.mjs, scripts/pi/write-env.mjs).
//
// The file is JSON with whole-line `//` comments and no trailing commas, so
// dropping those lines is all the parsing it needs. That is the only form
// supported: a `/* */` block or a comment after a value on the same line is
// left in and makes JSON.parse throw. The throw is the point — every caller
// decides something from this file (a lock on the public site, a deploy
// allowed or refused), and a file it cannot read must stop the script, not
// read as an empty config with nothing set.
import { readFileSync } from "node:fs";

export function readWranglerConfig(path = "wrangler.jsonc") {
  const text = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .filter((line) => !/^\s*\/\//.test(line))
    .join("\n");
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${path} could not be parsed (whole-line // comments only): ${e.message}`);
  }
}

/** The hostnames an environment block's routes answer on. */
export function routeHosts(config, envName) {
  return (config.env?.[envName]?.routes ?? []).map((r) =>
    (typeof r === "string" ? r : r.pattern).replace(/^https?:\/\//, "").split("/")[0],
  );
}

/**
 * Why a production deploy must not go ahead with the public site locked, or
 * null when it may.
 *
 * This is waiting for the cutover, not checking a permanent invariant.
 * Today the production block serves `uatHost` (lannacare.org), which is UAT
 * for good and rightly locked, so a production deploy with PUBLIC_SITE
 * "locked" is correct and passes. Once the block's routes move off that
 * host, production is the real public website, and a lock left behind would
 * open it on a sign-in page (src/lib/public-site.ts) — that is what this
 * refuses. After the cutover has dropped the var, it never fires again.
 */
export function lockedPublicSiteProblem(config, envName, uatHost) {
  if (envName !== "production") return null;
  if (config.env?.production?.vars?.PUBLIC_SITE !== "locked") return null;
  const hosts = routeHosts(config, "production");
  if (hosts.includes(uatHost)) return null;
  return (
    `the production block of wrangler.jsonc now routes to ${hosts.join(", ") || "nothing"}, ` +
    `not ${uatHost}, but still sets "PUBLIC_SITE": "locked" — the live site would open on a ` +
    `sign-in page.\n  Drop "PUBLIC_SITE": "locked" from the production block's vars ` +
    `(README, "What the cutover changes here").`
  );
}
