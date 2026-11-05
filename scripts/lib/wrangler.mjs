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
