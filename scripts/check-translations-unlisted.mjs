// Gate: a `_th` column added by a migration must be registered in translatable_labels, or named below as deliberate.
//
//   node scripts/check-translations-unlisted.mjs            # reads supabase/migrations/ as it is on disk
//   node scripts/check-translations-unlisted.mjs --dir <d>  # a different folder (the test uses this)
//
// Why it exists: registering a label is a hand step nobody is told about, and since 0166 it was missed twelve times, so
// twelve columns were invisible to Management -> Translations. This reads only the repo, so CI can run it on every pull
// request and it blocks the one that adds an unregistered column. The live-database version is
// `check-production.mjs translations-unlisted`; it catches a column that arrived any other way, but only when a person runs it.
//
// Fails (exit 1) on any `_th` column declared by a migration that no translatable_labels row names and that is not in
// DELIBERATE. It never reports and passes: a gap is a failure.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

/** `table.column` -> why this Thai column is deliberately not a registered label. Add here only with a reason. */
export const DELIBERATE = {
  "rounds.name_th": "a fixed seeded vocabulary whose Thai ships with it (0166 says so in its own comment)",
  "label_drafts.text_th": "a proposed translation, not a label: it is the draft that Translations itself holds (0293)",
};

const strip = (sql) => sql.replace(/--[^\n]*/g, "");

/** Every `table.col_th` a migration's text declares, and every `table.col_th` its translatable_labels rows register. */
export function scan(files) {
  const declared = new Map(); // key -> file
  const registered = new Set();
  for (const { name, sql: raw } of files) {
    const sql = strip(raw);
    for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?(\w+)"?\s+add\s+column\s+(?:if\s+not\s+exists\s+)?"?(\w+_th)"?/gi))
      declared.set(`${m[1]}.${m[2]}`, name);
    for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?(\w+)"?\s*\(([\s\S]*?)\n\);/gi))
      for (const c of m[2].matchAll(/^\s*"?(\w+_th)"?\s+(?:text|varchar|character)/gim)) declared.set(`${m[1]}.${c[1]}`, name);
    // Files run in order, so a later drop removes the column; a dropped column is nothing to register.
    for (const m of sql.matchAll(/alters+tables+(?:ifs+existss+)?(?:public.)?"?(w+)"?s+drops+columns+(?:ifs+existss+)?"?(w+_th)"?/gi))
      declared.delete(`${m[1]}.${m[2]}`);
    // Files run in order, so a later drop removes the column; a dropped column is nothing to register.
    for (const m of sql.matchAll(/alter\s+table\s+(?:if\s+exists\s+)?(?:public\.)?"?(\w+)"?\s+drop\s+column\s+(?:if\s+exists\s+)?"?(\w+_th)"?/gi))
      declared.delete(`${m[1]}.${m[2]}`);
    if (/translatable_labels/i.test(sql))
      for (const m of sql.matchAll(/\(\s*'(\w+)'\s*,\s*'\w+'\s*,\s*'(\w+_th)'/g)) registered.add(`${m[1]}.${m[2]}`);
  }
  const unlisted = [...declared].filter(([k]) => !registered.has(k) && !(k in DELIBERATE));
  return { declared, registered, unlisted };
}

export function load(dir) {
  return readdirSync(dir).filter((n) => /^\d{4}_.+\.sql$/.test(n)).sort()
    .map((name) => ({ name, sql: readFileSync(join(dir, name), "utf8") }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--dir");
  const dir = i >= 0 ? process.argv[i + 1] : "supabase/migrations";
  const { declared, unlisted } = scan(load(dir));
  if (declared.size === 0) { console.error("translations-unlisted: found no _th columns at all - the scan is broken, not clean."); process.exit(1); }
  if (unlisted.length) {
    console.error(`translations-unlisted: ${unlisted.length} Thai column(s) no one can reach from Management -> Translations:`);
    for (const [k, f] of unlisted) console.error(`   ${k}   (${f})`);
    console.error("Fix: register each in translatable_labels (table_name, column_name, th_column, label_group, optional) in a migration,\n" +
      "or, if it is deliberately not a translatable label, add it to DELIBERATE in scripts/check-translations-unlisted.mjs with the reason.");
    process.exit(1);
  }
  console.log(`translations-unlisted: ok - ${declared.size} Thai columns declared, all registered or named as deliberate.`);
}
