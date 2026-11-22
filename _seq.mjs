import { loadEnv, projectRef } from "./scripts/lib/env.mjs";
const env = loadEnv(process.argv[2]);
const q = `begin read only; do $o$ begin raise exception 'R %', (select json_build_object('last', last_value) from pg_sequences where sequencename='residents_resident_number_seq'); end $o$; rollback;`;
const r = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {method:"POST",headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({query:q})});
console.log(process.argv[2], JSON.parse(await r.text()).message.split("\n")[0].replace(/.*R /,""));
