// Rollback harness for 0142_facility_maps.sql against DEV only.
//
//   node scripts/check-facility-maps.mjs     (from the repo root; dev only)
//
// One transaction: the migration (twice, so re-runnability is proved), assertions against real
// rows, then a deliberate `raise exception` carrying the evidence — nothing can commit.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const migration = readFileSync(join(root, "supabase/migrations/0142_facility_maps.sql"), "utf8");
const sql = `
begin;
${migration}
${migration}
do $h$
declare z uuid; e uuid; lz uuid; le uuid; n int := 0;
begin
  select id into z from zones where name <> 'Lifecycle' limit 1;
  select id into e from enclosures where zone_id = z limit 1;
  select id into lz from zones where name = 'Lifecycle';
  select id into le from enclosures where zone_id = lz limit 1;
  update enclosures set map_shape = '[[10,10],[20,10],[20,20]]' where id = e;
  begin update enclosures set map_shape = '[[10,10],[20,10]]' where id = e; exception when check_violation then n := n + 1; end;
  begin update enclosures set map_shape = '[[10,10],[120,10],[20,20]]' where id = e; exception when check_violation then n := n + 1; end;
  begin update enclosures set map_shape = '{"a":1}' where id = e; exception when check_violation then n := n + 1; end;
  begin update enclosures set map_shape = '[[10,10],[20,10],[20,20]]' where id = le; exception when others then n := n + 1; end;
  begin update zones set map_shape = '[[1,1],[2,2],[3,3]]' where id = lz; exception when others then n := n + 1; end;
  insert into facility_maps (kind, zone_id, image_path, width, height) values ('zone', z, 'p.webp', 10, 10);
  begin insert into facility_maps (kind, zone_id, image_path, width, height) values ('zone', z, 'p.webp', 10, 10); exception when unique_violation then n := n + 1; end;
  begin insert into facility_maps (kind, zone_id, image_path, width, height) values ('zone', null, 'p.webp', 10, 10); exception when check_violation then n := n + 1; end;
  begin insert into facility_maps (kind, zone_id, image_path, width, height) values ('zone', lz, 'p.webp', 10, 10); exception when others then n := n + 1; end;
  insert into facility_maps (kind, image_path, width, height) values ('overview', 'o.webp', 10, 10);
  begin insert into facility_maps (kind, image_path, width, height) values ('overview', 'o.webp', 10, 10); exception when unique_violation then n := n + 1; end;
  if n <> 9 then raise exception 'HARNESS-FAIL rejections=% (expect 9)', n; end if;
  raise exception 'HARNESS-OK rejections=%', n;
end $h$;
`;
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: sql }),
});
const text = await r.text();
console.log(text);
process.exit(text.includes("HARNESS-OK") ? 0 : 1);
