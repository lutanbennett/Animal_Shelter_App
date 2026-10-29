import { join } from "node:path"; import { pathToFileURL } from "node:url";
const root=process.cwd(); const {loadEnv,projectRef}=await import(pathToFileURL(join(root,"scripts/lib/env.mjs")).href);
const env=loadEnv("test"); const ref=projectRef(env);
const r=await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`,{method:"POST",headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,"Content-Type":"application/json"},body:JSON.stringify({query:process.argv[2]})});
console.log((await r.text()).slice(0,1500));
