import { join } from "node:path"; import { pathToFileURL } from "node:url";
const { loadEnv, projectRef } = await import(pathToFileURL(join(process.cwd(), "scripts/lib/env.mjs")).href);
const env = loadEnv("test"); const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error("not dev");
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: process.argv[2] }) });
console.log(JSON.stringify(JSON.parse(await r.text()), null, 1));
