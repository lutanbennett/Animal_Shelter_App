// Runs one begin…rollback SQL harness against the dev database and prints the result.
// A harness ends by raising an exception, so success is the message it chooses.
// Usage: node scripts/run-harness.mjs supabase/harness/<file>.sql
import { readFileSync } from "node:fs";
import { loadEnv, projectRef } from "./lib/env.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/run-harness.mjs <file.sql>");
  process.exit(2);
}
const env = loadEnv("test");
const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
  method: "POST",
  headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: readFileSync(file, "utf8") }),
});
console.log(res.status, await res.text());
