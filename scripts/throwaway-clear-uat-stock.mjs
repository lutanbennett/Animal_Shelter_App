// THROWAWAY — clears the stock figures out of the UAT database, which were
// never a physical count (Lutan, 2026-09-27, during the role walkthrough).
// Delete this file once it has been run and the result recorded.
//
//   node scripts/throwaway-clear-uat-stock.mjs --env production            # dry run
//   node scripts/throwaway-clear-uat-stock.mjs --env production --apply    # commit
//
// NOT a migration, deliberately. A numbered file under supabase/migrations/
// runs against every environment, so a 0101 that deletes stock rows would
// wipe the dev database's figures the next time anyone applied migrations —
// including the stocktake recorded during this walkthrough. This is a one-off
// correction to one environment's data, so it is a script, the way
// throwaway-utc-date-audit.mjs was. It still goes through the same Management
// API endpoint as scripts/apply-migrations.mjs rather than the SQL editor.
//
// What it clears, and why each is not a count:
//
//   * medication.stock_on_hand / diet_types.stock_on_hand — 9 items. Two
//     medications and two diets were typed this morning by accident while
//     signed into UAT instead of test; seven medications were typed on
//     2026-09-25. None was a physical count. Nulling stock_on_hand is enough:
//     0083's trigger clears stock_counted_at with it ("Clearing stock_on_hand
//     to null clears the stamp"), and callers cannot set the stamp directly.
//
//   * stock_counts — 7 rows, all the 0093 back-fill rather than a stocktake:
//     counted_by is null and each has its own stocktake_id with one row,
//     which is what the back-fill produces for items edited seconds apart.
//     record_stocktake() has never run on this database.
//
//   * stock_receipts — nothing to do; the table is empty.
//
// null means "never counted" throughout (0083), and every page already has a
// display path for it, so this returns the app to an honest state rather than
// an invented one.
//
// Re-runnable: both statements are no-ops the second time.
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const apply = args.includes("--apply");
const env = loadEnv(envName);
const token = env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN is required.");
  process.exit(2);
}

const projectRef = refOf(env);
// UAT is the production Supabase project until the cutover. Refuse anything
// else outright: this script deletes, and pointing it at dev would destroy the
// walkthrough's own test data.
const UAT_REF = "dbkodyyxxhtygxcxmfcu";
if (projectRef !== UAT_REF) {
  console.error(`refusing: ${projectRef} is not the UAT/production project (${UAT_REF}).`);
  process.exit(2);
}

async function query(sql, readOnly) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql, read_only: readOnly }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text}`);
  return JSON.parse(text);
}

const BEFORE_AFTER = `
select 'medication with a figure' as what, count(*)::int as n from medication where stock_on_hand is not null
union all
select 'diet_types with a figure', count(*)::int from diet_types where stock_on_hand is not null
union all
select 'stock_counts rows', count(*)::int from stock_counts
union all
select 'stock_receipts rows', count(*)::int from stock_receipts
order by what
`;

const show = (label, rows) => {
  console.log(`\n${label}`);
  for (const r of rows) console.log(`  ${String(r.n).padStart(4)}  ${r.what}`);
};

console.log(`Environment: ${envName} — project ${projectRef} (UAT)`);
console.log(apply ? "Mode: APPLY — this commits." : "Mode: dry run — rolls back.");

show("Before:", await query(BEFORE_AFTER, true));

// One transaction either way; the dry run rolls it back, so the counts it
// prints are the ones a real apply would produce.
const work = `
begin;
delete from stock_counts;
update medication  set stock_on_hand = null where stock_on_hand is not null;
update diet_types  set stock_on_hand = null where stock_on_hand is not null;
${BEFORE_AFTER.trim()};
${apply ? "commit;" : "rollback;"}
`;

const after = await query(work, false);
show(apply ? "After (committed):" : "After (rolled back — this is what --apply would do):", after);

if (!apply) console.log("\nNothing was changed. Re-run with --apply to commit.");
else console.log("\nDone. Every item now reads as never counted.");
