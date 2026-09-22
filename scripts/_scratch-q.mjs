import { loadEnv, projectRef } from "./lib/env.mjs";
const env = loadEnv("test");
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST", headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: process.argv[2] }),
});
console.log(await res.text());
