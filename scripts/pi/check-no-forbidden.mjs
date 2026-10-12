// Refuse to go on when any env file on this Pi holds a value that must never be
// here (neverOnPi in scripts/lib/runtime-config.mjs: today SUPABASE_ACCESS_TOKEN,
// which runs arbitrary SQL against both Supabase projects). Run by setup.sh,
// setup-test.sh and write-env.mjs, so it covers both clones.
//
//   node scripts/pi/check-no-forbidden.mjs
//
// Prints file and name only, never a value.
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { PI_FORBIDDEN } from "../lib/runtime-config.mjs";

const FILES = [".env", ".env.local", ".env.production.local", ".env.deploy.production", ".env.deploy.uat"];

/** [file, name] pairs for every forbidden name set to a non-empty value. */
export function forbiddenFound(dir = ".") {
  const found = [];
  for (const f of FILES) {
    const path = `${dir}/${f}`;
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && PI_FORBIDDEN.includes(m[1]) && m[2].trim().replace(/^["']|["']$/g, "")) found.push([f, m[1]]);
    }
  }
  return found;
}

export function refuseIfForbidden(who) {
  const found = forbiddenFound();
  if (!found.length) return;
  console.error(`${who}: REFUSING — this Pi holds a value that must never be here:`);
  for (const [f, n] of found) console.error(`  ${f}: ${n}`);
  console.error("  It would let a compromised app process run SQL against the databases.");
  console.error("  Delete that line from each file above (docs/pi-hosting.md, 'Keeping the Supabase token off the Pi').");
  console.error("  If the weekly backup still depends on it, set SUPABASE_DB_URL in .env.deploy.production FIRST,");
  console.error("  run the backup once by hand, and only then delete the token.");
  process.exit(2);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  refuseIfForbidden("check-no-forbidden");
  console.log("check-no-forbidden: no forbidden values in this Pi's env files.");
}
