// features (0255): the 13 features, one feature per card, Not-yet-sorted behaviour and who may write.
// Against DEV only. Reads the live rows, then one transaction that always rolls back.
//
//   node scripts/check-features-schema.mjs
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { exitWith } from "./lib/exit.mjs";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

async function sql(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error((() => { try { return JSON.parse(text).message ?? text; } catch { return text; } })());
  return text ? JSON.parse(text) : [];
}
let failed = 0;
const fail = (m) => { failed++; console.log(`FAIL ${m}`); };
const pass = (m) => console.log(`ok   ${m}`);

// 0. the code's cards (read from cards.ts text: the keys of CardKey) and the doc's feature names
const cardsTs = readFileSync(join(root, "src/lib/permissions/cards.ts"), "utf8");
const jobsTs = readFileSync(join(root, "src/lib/permissions/jobs.ts"), "utf8");
const keysOf = (src, type) => [...src.match(new RegExp(`export type ${type} =([^;]+);`))[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
const cardKeys = [...keysOf(jobsTs, "JobKey"), ...keysOf(cardsTs, "NewCardKey")];
const docNames = [...readFileSync(join(root, "docs/features.md"), "utf8").matchAll(/^## (\d+)\. (.+)$/gm)].map((m) => [Number(m[1]), m[2]]);

// 1. live rows
const feats = await sql(`select key, name, position from features order by position`);
if (feats.length !== 13) fail(`13 features expected, found ${feats.length}`);
for (const [n, name] of docNames) {
  const f = feats[n - 1];
  if (!f || f.name !== name || f.position !== n) fail(`feature ${n} should be "${name}" at position ${n}, is ${JSON.stringify(f)}`);
}
if (!failed) pass("13 features, named and ordered as docs/features.md");

const rows = await sql(`select c.card, f.key from card_features c left join features f on f.id = c.feature_id`);
const have = new Map(rows.map((r) => [r.card, r.key]));
const missing = cardKeys.filter((k) => !have.has(k));
const unsorted = cardKeys.filter((k) => have.has(k) && !have.get(k));
const stray = rows.filter((r) => !cardKeys.includes(r.card)).map((r) => r.card);
if (cardKeys.length !== 28) fail(`cards.ts should have 28 cards, has ${cardKeys.length}`);
if (missing.length) fail(`cards with no feature row: ${missing.join(", ")}`);
if (unsorted.length) fail(`cards with a null feature: ${unsorted.join(", ")}`);
if (stray.length) fail(`rows for cards that do not exist: ${stray.join(", ")}`);
if (!missing.length && !unsorted.length && !stray.length) pass("every one of the 28 cards has exactly one feature");

// 2. behaviour, rolled back
const lit = (s) => `'${s}'`;
const body = `
do $t$
declare
  v_uid uuid;
  v_feat uuid;
  n int;
begin
  select ur.user_id into v_uid from user_roles ur join roles r on r.id = ur.role_id where r.key = 'admin' limit 1;
  select id into v_feat from features where key = 'website_public_pages';

  -- deleting a feature leaves its card Not yet sorted, not gone
  delete from features where key = 'website_public_pages';
  select count(*) into n from card_features where card = 'website' and feature_id is null;
  if n <> 1 then raise exception 'FAIL deleting a feature should leave website unsorted (found %)', n; end if;

  -- a card is one row
  begin
    insert into card_features (card) values ('website');
    raise exception 'FAIL a card given two rows';
  exception when unique_violation then null; end;

  -- a blank name and a bad key are refused
  begin insert into features (key, name) values ('x_test', '  '); raise exception 'FAIL blank name';
  exception when check_violation then null; end;
  begin insert into features (key, name) values ('Bad Key', 'ok'); raise exception 'FAIL bad key';
  exception when check_violation then null; end;

  -- who may write
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated', 'aal', 'aal2')::text, true);
  update features set name = name where key = 'housing_and_moves';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL admin at 2-step should write (rows %)', n; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', v_uid, 'role', 'authenticated', 'aal', 'aal1')::text, true);
  update features set name = name where key = 'housing_and_moves';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL admin at 1-step wrote % rows', n; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated', 'aal', 'aal2')::text, true);
  select count(*) into n from features;
  if n <> 0 then raise exception 'FAIL a non-admin can read % features', n; end if;
  update features set name = 'hacked';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL a non-admin updated % rows', n; end if;
  raise exception 'HARNESS_OK';
end $t$;`;
try {
  await sql(`begin; ${body} rollback;`);
  fail("harness did not reach its end");
} catch (e) {
  if (String(e.message).includes("HARNESS_OK")) pass("deleting a feature unsorts its cards; one row per card; bad names refused; Admin at 2-step only");
  else fail(String(e.message));
}
exitWith(failed ? 1 : 0);
