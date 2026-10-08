// order-and-units-schema (0161): zones, enclosures, medication and diet_types carry a sort_order; both
// cost_per_unit columns hold 4 places. Everything runs in one transaction that the closing `raise exception`
// rolls back, so dev keeps nothing.
//
//   node scripts/check-order-and-units.mjs              (from the repo root; dev only) against the applied database
//   node scripts/check-order-and-units.mjs --with supabase/migrations/0161_place_and_stock_order_and_unit_prices.sql
//        runs the file TWICE first in the same transaction: proof of a pending migration, and of re-running it
//
// Asserts: every physical zone and enclosure has an order and no Lifecycle row does; numbers read naturally
// within a zone (…2 before …10); a new zone, enclosure, medicine and diet go last; an enclosure moved to another
// zone goes last there; the Lifecycle zone and its enclosures refuse an order, still refuse a map shape, and still
// take a new pseudo-enclosure; a 4-place price round-trips on both tables; and one live login per role that can
// count stock reads sort_order through stock_medications and stock_diet_types under its own JWT.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const withIndex = process.argv.indexOf("--with");
const file = withIndex === -1 ? "" : readFileSync(process.argv[withIndex + 1], "utf8");

const harness = `begin;
${file}
${file}
do $$
declare
  out text := '';
  lz uuid; z1 uuid; z2 uuid; e uuid; n int; m int; ok boolean; u record;
begin
  select id into lz from zones where name = 'Lifecycle';

  out := out || format('check|physical zones all ordered|%s', not exists (select 1 from zones where name <> 'Lifecycle' and sort_order is null)) || E'\\n';
  out := out || format('check|Lifecycle zone has no order|%s', (select sort_order is null from zones where id = lz)) || E'\\n';
  out := out || format('check|physical enclosures all ordered|%s', not exists (
    select 1 from enclosures e join zones z on z.id = e.zone_id where z.name <> 'Lifecycle' and e.sort_order is null)) || E'\\n';
  out := out || format('check|Lifecycle enclosures have no order|%s', not exists (select 1 from enclosures where zone_id = lz and sort_order is not null)) || E'\\n';
  -- Natural order: within any zone, "<prefix> 2" sorts before "<prefix> 10".
  out := out || format('check|numbers read naturally (no "x 10" before "x 2" in a zone)|%s', not exists (
    select 1 from enclosures a join enclosures b on a.zone_id = b.zone_id
     where substring(a.name from '^(.*\\D)\\d+$') = substring(b.name from '^(.*\\D)\\d+$')
       and substring(a.name from '(\\d+)$')::int < substring(b.name from '(\\d+)$')::int
       and a.sort_order > b.sort_order)) || E'\\n';
  out := out || format('check|medication all ordered|%s', not exists (select 1 from medication where sort_order is null)) || E'\\n';
  out := out || format('check|diet_types all ordered|%s', not exists (select 1 from diet_types where sort_order is null)) || E'\\n';

  insert into zones (name) values ('Harness zone 0161') returning id, sort_order into z1, n;
  out := out || format('check|new zone goes last|%s', n = (select max(sort_order) from zones) and n > (select max(sort_order) from zones where id <> z1)) || E'\\n';
  select id into z2 from zones where name <> 'Lifecycle' and id <> z1 order by sort_order limit 1;
  insert into enclosures (name, zone_id) values ('Harness enclosure 0161', z2) returning id, sort_order into e, n;
  out := out || format('check|new enclosure goes last in its zone|%s', n > coalesce((select max(sort_order) from enclosures where zone_id = z2 and id <> e), 0)) || E'\\n';
  insert into enclosures (name, zone_id) values ('Harness other 0161', z1);
  update enclosures set zone_id = z1 where id = e returning sort_order into n;
  out := out || format('check|moved enclosure goes last in the new zone|%s', n = 2) || E'\\n';

  begin update zones set sort_order = 99 where id = lz; ok := true; exception when others then ok := false; end;
  out := out || format('check|Lifecycle zone refuses an order|%s', not ok) || E'\\n';
  begin update enclosures set sort_order = 99 where zone_id = lz; ok := true; exception when others then ok := false; end;
  out := out || format('check|Lifecycle enclosures refuse an order|%s', not ok) || E'\\n';
  begin update enclosures set map_shape = '[[1,1],[2,2],[3,1]]' where zone_id = lz; ok := true; exception when others then ok := false; end;
  out := out || format('check|Lifecycle enclosures still refuse a map shape|%s', not ok) || E'\\n';
  begin insert into enclosures (name, zone_id) values ('Harness pseudo 0161', lz) returning sort_order into n; ok := n is null; exception when others then ok := false; end;
  out := out || format('check|a new Lifecycle pseudo-enclosure is accepted, with no order|%s', ok) || E'\\n';

  insert into medication (name) values ('Harness medicine 0161') returning sort_order into n;
  out := out || format('check|new medicine goes last|%s', n > (select max(sort_order) from medication where name <> 'Harness medicine 0161')) || E'\\n';
  insert into diet_types (name, unit, daily_qty_small, daily_qty_medium, daily_qty_large)
    values ('Harness diet 0161', 'g', 1, 1, 1) returning sort_order into n;
  out := out || format('check|new diet goes last|%s', n > coalesce((select max(sort_order) from diet_types where name <> 'Harness diet 0161'), 0)) || E'\\n';

  update diet_types set cost_per_unit = 0.035 where name = 'Harness diet 0161';
  update medication set cost_per_unit = 0.0125 where name = 'Harness medicine 0161';
  out := out || format('check|diet price 0.035 round-trips|%s', (select cost_per_unit = 0.035 from diet_types where name = 'Harness diet 0161')) || E'\\n';
  out := out || format('check|medicine price 0.0125 round-trips|%s', (select cost_per_unit = 0.0125 from medication where name = 'Harness medicine 0161')) || E'\\n';

  for u in
    select distinct on (r.key) r.key, ur.user_id
      from user_roles ur join roles r on r.id = ur.role_id
     where ur.archived_at is null and r.archived_at is null
     order by r.key, ur.created_at
  loop
    perform set_config('request.jwt.claims', json_build_object('sub', u.user_id, 'role', 'authenticated', 'aal', 'aal2')::text, true);
    set local role authenticated;
    select count(*), count(sort_order) into n, m from stock_medications;
    out := out || format('role|%s|stock_medications rows %s, with order %s', u.key, n, m) || E'\\n';
    select count(*), count(sort_order) into n, m from stock_diet_types;
    out := out || format('role|%s|stock_diet_types rows %s, with order %s', u.key, n, m) || E'\\n';
    reset role;
  end loop;

  raise exception 'HARNESS-RESULT %', out;
end $$;
rollback;`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: harness }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
const m = /HARNESS-RESULT ([\s\S]*?)(\nCONTEXT:|$)/.exec(msg);
if (!m) throw new Error(`no result (status ${res.status}): ${msg.slice(0, 1500)}`);

let failed = 0;
const roleLines = [];
for (const line of m[1].trim().split("\n")) {
  const [kind, a, b] = line.split("|");
  if (kind === "check") {
    const pass = b === "t" || b === "true";
    if (!pass) failed++;
    console.log(`${pass ? "ok  " : "FAIL"} ${a}`);
  } else if (kind === "role") {
    roleLines.push(`     ${a.padEnd(20)} ${b}`);
  }
}
console.log("stock views read as each role (rows a login can count should all carry an order):");
for (const l of roleLines) console.log(l);
// A role that sees rows must see an order on every one of them.
const short = roleLines.filter((l) => {
  const [, rows, ordered] = /rows (\d+), with order (\d+)/.exec(l) ?? [];
  return rows !== ordered;
});
if (short.length) { failed += short.length; console.log("FAIL a role sees stock rows without an order"); }
console.log(failed ? `RESULT: RED (${failed} failed)` : "RESULT: GREEN");
process.exitCode = failed ? 1 : 0;
