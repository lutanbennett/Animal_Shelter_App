import { loadEnv, projectRef } from "./lib/env.mjs";
const env = loadEnv("test"); const ref = projectRef(env);
const q = process.argv[2];
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {method:"POST",headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({query:q})});
console.log(await r.text());
