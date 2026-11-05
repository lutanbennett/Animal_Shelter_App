// Publish on an adoption update must survive a save: write the three publish values, read them back.
// 0.43.0 shipped saveAdoptionUpdate validating share_publicly / public_story / public_first_name and then
// never sending them (docs/decisions/2026-11-05-adoption-publish-never-written.md), and returned { ok: true }.
//
//   node scripts/check-adoption-publish-roundtrip.mjs     (from the repo root; dev only; writes nothing)
//
// Part 1 reads the action's source: the row it writes must name all three columns, and the first-name
// test must be \s (a bare /s/ refused every name containing the letter s).
// Part 2 inserts a row with all three on the live dev schema, reads it back, and rolls everything back.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const src = readFileSync(join(root, "src/app/residents/[id]/adoption-updates/actions.ts"), "utf8");
const rowBlock = src.match(/const row = \{[\s\S]*?\n\s*\};/)?.[0] ?? "";
const problems = [];
for (const col of ["share_publicly", "public_story", "public_first_name"]) {
  if (!rowBlock.includes(col)) problems.push(`saveAdoptionUpdate's row does not write ${col}`);
}
const backslash = String.fromCharCode(92);
if (!src.includes(`(/${backslash}s/.test(publicFirstName)`)) problems.push("first-name whitespace test is not a whitespace class");
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
console.log("source: row writes all three columns; first-name test is /\s/");

const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const sql = `
begin;
do $$
declare v_res uuid; v_id uuid; r record;
begin
  insert into residents (name) values ('harness-publish Lucky') returning id into v_res;
  insert into adoption_updates (resident_id, received_on, channel, share_publicly, public_story, public_first_name)
    values (v_res, '2026-09-20', 'line', true, 'Settling in well', 'Susan') returning id into v_id;
  select share_publicly, public_story, public_first_name into r from adoption_updates where id = v_id;
  if r.share_publicly is distinct from true or r.public_story is distinct from 'Settling in well'
     or r.public_first_name is distinct from 'Susan' then
    raise exception 'ROUNDTRIP-FAIL %', row_to_json(r);
  end if;
  raise exception 'HARNESS-OK publish round trip: %', row_to_json(r);
end $$;
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
