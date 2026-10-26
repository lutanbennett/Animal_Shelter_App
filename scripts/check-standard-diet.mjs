// Rollback harness for the standard diet flag (0087, moved to the recipe table by 0239) against DEV only.
// One transaction: assertions against the LIVE schema, then a deliberate `raise exception` carrying the
// evidence, so nothing can commit.
//
//   node scripts/check-standard-diet.mjs     (from the repo root; dev only)
//
// Exits 0 when every assertion held. Writes nothing.
//
// What changed (2026-10-26, harness sweep 3): this used to replay 0087 and prove its back-fill (every living
// resident without a current diet got the standard one, a booked-ahead resident stopped at today + 4, deceased
// and adopted residents got nothing). That back-fill was a one-off written against diet_types.is_standard and
// resident_diets.diet_type_id, both gone since 0239, so it can no longer run, and its result is history
// (docs/decisions/2026-10-02-replay-or-assert-live.md, rule 4). What is live, and asserted here: the flag
// lives on diets, there is exactly one standard recipe, a second is refused, and the standard can be moved.
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;

do $h$
declare
  v_std uuid; v_other uuid; v_n bigint;
begin
  -- A. shape: diets.is_standard is a not-null boolean default false; the partial unique index exists; the old
  --    column is gone from the ingredient table (the flag moved in 0239).
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'diets' and column_name = 'is_standard'
     and data_type = 'boolean' and is_nullable = 'NO' and column_default = 'false';
  if v_n <> 1 then raise exception 'FAIL A: diets.is_standard not as expected'; end if;
  select count(*) into v_n from pg_indexes
   where indexname = 'diets_one_standard' and indexdef ilike '%unique%' and indexdef ilike '%where is_standard%';
  if v_n <> 1 then raise exception 'FAIL A: diets_one_standard missing or not a partial unique index'; end if;
  select count(*) into v_n from information_schema.columns
   where table_schema = 'public' and table_name = 'diet_types' and column_name = 'is_standard';
  if v_n <> 0 then raise exception 'FAIL A: diet_types still has is_standard'; end if;

  -- B. exactly one standard recipe. Its name is data a shelter may change, so it is not pinned.
  select count(*) into v_n from diets where is_standard;
  if v_n <> 1 then raise exception 'FAIL B: % standard diets', v_n; end if;
  select id into v_std from diets where is_standard;

  -- C. a second standard is refused
  select id into v_other from diets where not is_standard order by name limit 1;
  if v_other is null then raise exception 'FAIL C setup: dev has only the standard diet, nothing to try as a second'; end if;
  begin
    update diets set is_standard = true where id = v_other;
    raise exception 'FAIL C: a second standard diet was accepted';
  exception when unique_violation then null;
  end;

  -- D. moving the standard (clear, then set) works, and still leaves exactly one
  update diets set is_standard = false where id = v_std;
  update diets set is_standard = true where id = v_other;
  select count(*) into v_n from diets where is_standard;
  if v_n <> 1 or not exists (select 1 from diets where id = v_other and is_standard) then
    raise exception 'FAIL D: the standard did not move cleanly (% standard)', v_n;
  end if;

  raise exception 'HARNESS-OK diets.is_standard not null default false + partial unique index (diet_types has no flag) | exactly one standard | a second is refused | move leaves exactly one';
end;
$h$;
rollback;
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await res.text();
let msg = text;
try { msg = JSON.parse(text).message ?? text; } catch {}
console.log(`status ${res.status}`);
console.log(msg);
// exitCode, not exit(): exiting straight after fetch trips a libuv assertion on Windows.
process.exitCode = /HARNESS-OK/.test(msg) ? 0 : 1;
