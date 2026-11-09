// Third question for check-audited-tables: does every table that DECIDES ACCESS carry an audit trigger?
//
// The first two questions (a triggered table is listed; a listed table is triggered) are both satisfied by a
// table with NEITHER, which is how card_includes sat unaudited from 0257 to 0341 while the check said ok (#v3qmz).
//
// The set is DERIVED, not hand-kept: any table the migrations create whose name matches ACCESS_NAME is expected
// to be audited, so the next permissions table is caught by its name without anyone knowing a list exists.
// Two records, both with a reason, are the only hand-kept part, and the failure message says where they go.
// docs/decisions/2026-11-09-security-instruments.md
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MIGRATIONS_DIR, MIGRATION_NAME } from "./migrations.mjs";

// roles, user_roles, role_*, card_*, *permission*  (these hold who may do what, or the catalogue of what).
export const ACCESS_NAME = /^(roles|user_roles|role_[a-z_]+|card_[a-z_]+|[a-z_]*permission[a-z_]*)$/;

/** Named like an access table but decides nothing, so no audit is expected. Reason required. */
export const NOT_ACCESS = {
  permission_activities: "the catalogue of activity keys, seeded by migrations; nothing at run time writes it, and a grant is a card_grants row",
  role_groups: "how a role's home is laid out (names, icons, order); layout, not security",
};

/** Decides access today and is NOT yet audited. Printed every run; fails once it gains a trigger, so the entry is deleted. */
export const KNOWN_UNAUDITED = {
};

export function createdTables(dir = MIGRATIONS_DIR) {
  const live = new Set();
  for (const file of readdirSync(dir).filter((f) => MIGRATION_NAME.test(f)).sort()) {
    const sql = readFileSync(join(dir, file), "utf8").replace(/--[^\n]*/g, "");
    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?/gi)) live.add(m[1].toLowerCase());
    for (const m of sql.matchAll(/drop\s+table\s+(?:if\s+exists\s+)?([^;]+)/gi))
      for (const t of m[1].replace(/\bcascade\b/i, "").split(",")) live.delete(t.trim().replace(/^public\.|"/g, "").toLowerCase());
    for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+rename\s+to\s+"?([a-z_][a-z0-9_]*)"?/gi))
      if (live.delete(m[1].toLowerCase())) live.add(m[2].toLowerCase());
  }
  return live;
}

/** → { problems: string[], known: string[] }.  `triggered` is a Set of audited table names. */
export function accessTableProblems(tables, triggered, notAccess = NOT_ACCESS, known = KNOWN_UNAUDITED) {
  const problems = [];
  const expected = [...tables].filter((t) => ACCESS_NAME.test(t) && !(t in notAccess)).sort();
  const bare = expected.filter((t) => !triggered.has(t) && !(t in known));
  if (bare.length) problems.push(`Access-deciding table with no audit trigger (a change to who may do what would leave no record). Add a trigger in a migration (record_audit(), see 0341 for card_includes). If it truly decides nothing, add it to NOT_ACCESS in scripts/lib/access-tables.mjs with the reason:\n    ${bare.join("\n    ")}`);
  const fixed = Object.keys(known).filter((t) => triggered.has(t) || !tables.has(t));
  if (fixed.length) problems.push(`In KNOWN_UNAUDITED but now audited or gone (delete the entry in scripts/lib/access-tables.mjs): ${fixed.join(", ")}`);
  const stale = Object.keys(notAccess).filter((t) => !tables.has(t));
  if (stale.length) problems.push(`In NOT_ACCESS but no migration creates it (delete the entry): ${stale.join(", ")}`);
  const still = Object.keys(known).filter((t) => tables.has(t) && !triggered.has(t));
  return { problems, known: still.map((t) => `${t}: ${known[t]}`), expected };
}
