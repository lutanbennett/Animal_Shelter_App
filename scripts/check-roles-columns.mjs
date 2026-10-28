// Fails when app code selects a column of a table that no migration creates.
//
//   node scripts/check-roles-columns.mjs [--table roles] [--table other ...]
//
// WHY: on 2026-10-28 the Security page and Delete role selected roles.is_admin, a column no migration made, and shipped a production
// outage (#990, #991). Nothing compared what src/ asks the database for with what the migrations build. This does, from files alone,
// so it runs in CI with no token.
//
// WHAT IT READS: every `.from("<table>").select("a, b, c")` in src/ (string, template or single quotes; whitespace and newlines
// between the calls are fine), and every column named in the select list. The columns a table HAS are replayed from
// supabase/migrations in order: the `create table` body, `add column [if not exists]`, `drop column [if exists]`, `rename column a to b`.
// It starts with `roles` (the table the outage was on); --table adds others.
//
// WHAT IT CANNOT SEE, and the PR says so too:
//   - a select built from a variable or a template with ${...} in it (skipped, and counted so the number is visible)
//   - a column written by .insert()/.update()/.upsert()/.eq()/.order() or a filter: only the select list is read
//   - embedded relations such as `roles(key, name)` inside another table's select: the embed is skipped, not followed
//   - a select reached through a helper that receives the table name as an argument
//   - columns added outside supabase/migrations (the dashboard, a manual SQL run), and views (a view is not a `create table`)
//   - whether production has the migration yet: that is `node scripts/apply-migrations.mjs --status --env production`
// Exits 1 when a selected column is not created by any migration, 0 otherwise.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const args = process.argv.slice(2);
const tables = [];
for (let i = 0; i < args.length; i++) if (args[i] === "--table" && args[i + 1]) tables.push(args[++i]);
if (!tables.length) tables.push("roles");

const stripSqlComments = (s) => s.replace(/--[^\n]*/g, "");
const name = (s) => s.replace(/^public\./i, "").replace(/"/g, "").toLowerCase();

const migDir = join(root, "supabase/migrations");
const migrations = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort().map((f) => ({ f, sql: stripSqlComments(readFileSync(join(migDir, f), "utf8")) }));

function columnsOf(table) {
  const cols = new Map(); // column -> migration that last created it
  const T = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const create = new RegExp(`create\\s+table\\s+(?:if\\s+not\\s+exists\\s+)?(?:public\\.)?"?${T}"?\\s*\\(`, "ig");
  const add = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:public\\.)?"?${T}"?\\s+([^;]*);`, "ig");
  for (const { f, sql } of migrations) {
    let m;
    while ((m = create.exec(sql))) {
      let depth = 1, i = create.lastIndex, start = i;
      for (; i < sql.length && depth > 0; i++) depth += sql[i] === "(" ? 1 : sql[i] === ")" ? -1 : 0;
      const body = sql.slice(start, i - 1);
      let d = 0, cur = "";
      const parts = [];
      for (const ch of body) {
        if (ch === "(") d++;
        if (ch === ")") d--;
        if (ch === "," && d === 0) { parts.push(cur); cur = ""; } else cur += ch;
      }
      parts.push(cur);
      for (const p of parts) {
        const w = p.trim().split(/\s+/)[0]?.replace(/"/g, "").toLowerCase();
        if (w && !/^(constraint|primary|unique|foreign|check|exclude|like)$/.test(w)) cols.set(w, f);
      }
    }
    while ((m = add.exec(sql))) {
      for (const a of m[1].matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?(\w+)"?/gi)) cols.set(a[1].toLowerCase(), f);
      for (const a of m[1].matchAll(/drop\s+column\s+(?:if\s+exists\s+)?"?(\w+)"?/gi)) cols.delete(a[1].toLowerCase());
      for (const a of m[1].matchAll(/rename\s+column\s+"?(\w+)"?\s+to\s+"?(\w+)"?/gi)) { cols.delete(a[1].toLowerCase()); cols.set(a[2].toLowerCase(), f); }
    }
  }
  return cols;
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e)) out.push(p);
  }
  return out;
}
const files = walk(join(root, "src"));

function selectedColumns(list) {
  const out = [];
  let d = 0, cur = "";
  for (const ch of list) {
    if (ch === "(") d++;
    if (ch === ")") d--;
    if ((ch === "," && d === 0) || (d === 0 && ch === "\n")) { out.push(cur); cur = ""; } else cur += ch;
  }
  out.push(cur);
  return out
    .map((s) => s.trim())
    .filter((s) => s && !s.includes("(") && !s.includes(")") && !s.includes("!") && s !== "*")
    .map((s) => s.split(":").pop().trim().split(/\s+/)[0]);
}

let failed = 0;
for (const table of tables) {
  const have = columnsOf(table);
  if (!have.size) { console.error(`check-roles-columns: no \`create table ${table}\` found in supabase/migrations; nothing to compare.`); process.exit(2); }
  const re = new RegExp(`\\.from\\(\\s*["'\`]${table}["'\`]\\s*\\)\\s*\\.select\\(\\s*(["'\`])([\\s\\S]*?)\\1`, "g");
  let seen = 0, skipped = 0;
  const bad = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    let m;
    while ((m = re.exec(text))) {
      const line = text.slice(0, m.index).split("\n").length;
      if (m[1] === "`" && m[2].includes("${")) { skipped++; continue; }
      seen++;
      for (const c of selectedColumns(m[2])) if (!have.has(c.toLowerCase())) bad.push({ file: file.slice(root.length + 1).replace(/\\/g, "/"), line, c });
    }
  }
  // .from(table) followed by something other than .select(" ... ") directly (a variable, a helper): counted, not read
  console.log(`${table}: ${have.size} column(s) from migrations; ${seen} literal select(s) read in src/, ${skipped} template select(s) skipped.`);
  if (bad.length) {
    failed++;
    for (const b of bad) console.log(`FAIL ${b.file}:${b.line} selects ${table}.${b.c}, which no migration creates.`);
    console.log("  Add the migration first (schema PRs land before the code that reads them), or fix the select.");
  } else console.log(`ok   every column selected from ${table} is created by a migration.`);
}
process.exit(failed ? 1 : 0);
