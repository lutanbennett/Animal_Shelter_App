// The seeded default cells of the permission catalogue (permission_activities and
// role_permissions), read out of the migrations that carry them, so a script can ask
// "which of the six roles hold this activity today" with no database. Admin is a rule
// and not data (§6): it holds every activity. check-permission-catalogue.mjs reads
// the same inserts for its own checks; this is the same reading for the words.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SIX = ["admin", "management", "staff", "vet", "volunteer", "public_viewer"];

export function loadSeed(repo) {
  const dir = path.join(repo, "supabase/migrations");
  const keys = new Set();
  const cells = []; // [role, activity, level]
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    const sql = readFileSync(path.join(dir, f), "utf8");
    if (!/permission_activities|role_permissions/.test(sql)) continue;
    for (const m of sql.matchAll(/\('([a-z_]+\.[a-z_]+)', '(?:level|yesno)', '[a-z]+', \d+\)/g)) keys.add(m[1]);
    for (const m of sql.matchAll(/\('([a-z_]+)', '([a-z_]+\.[a-z_]+)', ([12])\)/g)) cells.push([m[1], m[2], Number(m[3])]);
  }
  return {
    has: (activity) => keys.has(activity),
    /** The roles that hold `activity` at `level` ("edit" by default; edit includes read), in role order. */
    rolesHolding(activity, level = "edit") {
      const need = level === "read" ? 1 : 2;
      return SIX.filter((r) => r === "admin" || cells.some(([role, a, l]) => role === r && a === activity && l >= need));
    },
  };
}
