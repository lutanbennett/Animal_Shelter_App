// Which tables write to audit_log, read from the migration files alone (no database).
//
// It replays supabase/migrations in file order, so the answer is the state the files
// leave behind, not a count of every `create trigger` ever written: a trigger that a
// later file drops, a table a later file drops, and a table a later file renames are
// all followed. A trigger counts when it executes record_audit() or any function whose
// body inserts into audit_log (site_content has two of the second kind, 0254 and 0256).
//
// What it cannot see: a trigger created inside dynamic SQL (`execute format(...)`) and
// the live database. Use `node scripts/check-production.mjs` for the second.
// docs/decisions/2026-11-08-audited-tables-drift.md

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MIGRATIONS_DIR, MIGRATION_NAME } from "./migrations.mjs";

const name = String.raw`(?:public\.)?"?([a-z_][a-z0-9_]*)"?`;
const FUNCTION_BLOCK = /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z_][a-z0-9_]*)[\s\S]*?\$([a-z]*)\$([\s\S]*?)\$\2\$/gi;

/** Map of table → { trigger, file } for every table whose triggers still write audit_log. */
export function auditTriggerTables(dir = MIGRATIONS_DIR) {
  const files = readdirSync(dir).filter((f) => MIGRATION_NAME.test(f)).sort();
  const auditFns = new Set(["record_audit"]);
  const live = new Map(); // table → Map(trigger → file)
  const add = (t, trig, file) => live.set(t, (live.get(t) ?? new Map()).set(trig, file));

  for (const file of files) {
    let sql = readFileSync(join(dir, file), "utf8").replace(/--[^\n]*/g, "");
    sql = sql.replace(FUNCTION_BLOCK, (whole, fn, _tag, body) => {
      if (/insert\s+into\s+(?:public\.)?audit_log/i.test(body)) auditFns.add(fn.toLowerCase());
      return ";";
    });
    // Remaining $$ blocks (do blocks) hold no top-level DDL this scanner follows.
    sql = sql.replace(/\$([a-z]*)\$[\s\S]*?\$\1\$/gi, "''");
    for (const stmt of sql.split(";")) {
      let m;
      if ((m = stmt.match(new RegExp(String.raw`create\s+(?:constraint\s+)?trigger\s+${name}[\s\S]*?\bon\s+${name}[\s\S]*?execute\s+(?:function|procedure)\s+(?:public\.)?([a-z_][a-z0-9_]*)`, "i")))) {
        if (auditFns.has(m[3].toLowerCase())) add(m[2].toLowerCase(), m[1].toLowerCase(), file);
      } else if ((m = stmt.match(new RegExp(String.raw`drop\s+trigger\s+(?:if\s+exists\s+)?${name}\s+on\s+${name}`, "i")))) {
        live.get(m[2].toLowerCase())?.delete(m[1].toLowerCase());
      } else if ((m = stmt.match(/drop\s+table\s+(?:if\s+exists\s+)?([\s\S]+)/i))) {
        for (const t of m[1].replace(/\bcascade\b/i, "").split(",")) live.delete(t.trim().replace(/^public\.|"/g, "").toLowerCase());
      } else if ((m = stmt.match(new RegExp(String.raw`alter\s+table\s+(?:if\s+exists\s+)?${name}\s+rename\s+to\s+${name}`, "i")))) {
        const from = m[1].toLowerCase();
        if (live.has(from)) { live.set(m[2].toLowerCase(), live.get(from)); live.delete(from); }
      }
    }
  }
  const out = new Map();
  for (const [t, trigs] of live) if (trigs.size) { const [trigger, file] = [...trigs][0]; out.set(t, { trigger, file }); }
  return out;
}
