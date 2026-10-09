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
    // The other form a cell is seeded in: "select r.id, 'translations.view', 2 from roles r where r.key in
    // ('management', 'staff')" (0154) or "… where r.key = 'management'" (0168). Without this the cell was
    // invisible here, and the matrix said only Admin held the activity.
    for (const m of sql.matchAll(/select r\.id, '([a-z_]+\.[a-z_]+)', ([12])\s+from roles r\s+where r\.key (?:= '([a-z_]+)'|in \(([^)]*)\))/g)) {
      const roles = m[3] ? [m[3]] : [...m[4].matchAll(/'([a-z_]+)'/g)].map((r) => r[1]);
      for (const role of roles) cells.push([role, m[1], Number(m[2])]);
    }
    // A later file that narrows a role ("delete … where role_id = (select id from roles where key = 'volunteer')
    // and activity not in (…)", 0134) takes the cells it deletes out of what the role holds, in file order.
    for (const m of sql.matchAll(/delete from role_permissions\s+where role_id = \(select id from roles where key = '([a-z_]+)'\)\s+and activity not in \(([^)]*)\)/g)) {
      const kept = new Set([...m[2].matchAll(/'([a-z_]+\.[a-z_]+)'/g)].map((k) => k[1]));
      for (let i = cells.length - 1; i >= 0; i--) if (cells[i][0] === m[1] && !kept.has(cells[i][1])) cells.splice(i, 1);
    }
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
