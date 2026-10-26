import { pathToFileURL } from "node:url";
import { join } from "node:path";
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
const uid = process.argv[2];
const sql = process.argv[3];
const q = `begin;
select set_config('request.jwt.claims', json_build_object('sub','${uid}','role','authenticated','aal','aal1')::text, true);
set local role authenticated;
do $x$ begin
  begin
    ${sql}
  exception when others then raise exception 'PROBE-ERR % / %', sqlstate, sqlerrm;
  end;
  raise exception 'PROBE-OK';
end $x$;
rollback;`;
const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) });
console.log((await res.text()).slice(0, 800));
