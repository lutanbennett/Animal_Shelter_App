#!/usr/bin/env node
/**
 * Re-takes the count behind the backlog item "refusal sentences that come from the database are English only".
 * Report only, always exits 0, not in CI. SOURCE: the migration files in this checkout (supabase/migrations/*.sql),
 * not a database; quote `git rev-parse --short HEAD` beside any figure.
 *
 * Method: read migrations in number order; a function is LIVE if its last `create [or replace] function` (by name and
 * argument count) is not followed by a `drop function`; count every `raise exception` in live bodies; separately count
 * those in `do $$` blocks (one-off or test harness, never live). Then sort each live function with
 * scripts/lib/sql-refusal-classes.mjs, using a search of src/ and worker/ for the quoted function name.
 * Cannot see: dynamic SQL, messages built from variables, the live database. See scripts/lib/sql-refusals.mjs.
 *
 *   node scripts/measure-sql-refusals.mjs          counts
 *   node scripts/measure-sql-refusals.mjs --list   every function with its class and messages
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyLiveRefusals, CLASSES } from "./lib/sql-refusal-classes.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { rows, live, rawHits, doBlocks } = classifyLiveRefusals(root);
const sum = (a, k) => a.reduce((n, r) => n + k(r), 0);
const doN = sum(doBlocks, (b) => b.n);
const liveN = sum(rows, (r) => r.m.all);
console.log("source: supabase/migrations/*.sql in this checkout (no database); quote `git rev-parse --short HEAD` with it");
console.log(`raw "raise exception" hits, every migration file:        ${rawHits}`);
console.log(`  inside do $$ blocks (one-off or harness, not live):     ${doN}`);
console.log(`live functions (after redefinition and drop):             ${live.length}`);
console.log(`  of which contain a refusal:                             ${rows.length}`);
console.log(`live refusal messages:                                    ${liveN}  (shapes the parser could not read: ${sum(rows, (r) => r.m.unparsed)})`);
console.log(`  in security definer functions:                          ${sum(rows.filter((r) => r.f.definer), (r) => r.m.all)}`);
console.log(`raw hits in neither (superseded, dropped, other):         ${rawHits - doN - liveN}`);
const names = {};
for (const f of live) (names[f.name] ??= []).push(f.key);
const multi = Object.entries(names).filter(([, k]) => k.length > 1).map(([n]) => n);
console.log(`names live under more than one argument count:            ${multi.length}${multi.length ? " (" + multi.join(", ") + ")" : ""}`);
console.log("");
for (const c of CLASSES) {
  const mine = rows.filter((r) => r.cls === c);
  console.log(`${c.reads.padEnd(10)} ${c.id.padEnd(30)} functions ${String(mine.length).padStart(3)}  messages ${String(sum(mine, (r) => r.m.all)).padStart(3)}`);
}
console.log("");
for (const k of ["user", "maybe", "masked", "developer"]) {
  const mine = rows.filter((r) => r.cls.reads === k);
  console.log(`reads=${k}: ${mine.length} functions, ${sum(mine, (r) => r.m.all)} messages`);
}
console.log(`unclassified: ${rows.filter((r) => !r.cls).length}`);
if (process.argv.includes("--list")) {
  console.log("");
  for (const r of rows) {
    console.log(`[${r.cls.reads}/${r.cls.id}] ${r.f.name} (${r.f.file}${r.f.definer ? ", security definer" : ""}) callers: ${r.srcCallers.map((c) => c.rel).join("; ") || "-"}`);
    for (const x of r.m.messages) console.log(`    ${x.text.replace(/\s+/g, " ")}`);
  }
}
