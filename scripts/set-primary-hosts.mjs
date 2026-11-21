// Flag the website address (shelter_hosts.is_primary) on a shelter that has addresses and none flagged (#9l7xf).
//
//   node scripts/set-primary-hosts.mjs --env test|uat|production            dry run: says what it would set
//   node scripts/set-primary-hosts.mjs --env test|uat|production --apply    sets it, one transaction
//
// my_shelters() (0433) omits a shelter with no primary host, so the chooser lists nothing for it. 0428 backfilled
// only a shelter with exactly ONE address, so a shelter with several (the real `lanna`) was left unflagged.
// The rule is in choosePrimaries() (scripts/lib/deployed-hosts.mjs): the host is the environment's PUBLIC_HOST
// from wrangler.jsonc, and only when it is one of that shelter's own hosts. Anything else is printed as
// UNDECIDED and left alone, never guessed. Touches no shelter that already has a primary. docs/decisions/2026-11-21-primary-host-backfill.md
import { parseEnvArg, loadEnv, projectRef } from "./lib/env.mjs";
import { readWranglerConfig } from "./lib/wrangler.mjs";
import { choosePrimaries } from "./lib/deployed-hosts.mjs";
import { runMain } from "./lib/exit.mjs";

const { name, rest } = parseEnvArg(process.argv.slice(2));
const apply = rest.includes("--apply");

async function main() {
  if (!process.argv.includes("--env")) { console.error("Name the environment: --env test|uat|production."); return 2; }
  const publicHost = readWranglerConfig().env?.[name]?.vars?.PUBLIC_HOST;
  const env = loadEnv(name);
  const ref = projectRef(env);
  console.log(`${apply ? "APPLY" : "Read-only"} on ${name} (project ${ref}); PUBLIC_HOST = ${publicHost ?? "(unset)"}`);
  const q = async (query) => {
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const t = await r.text();
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${t.slice(0, 300)}`);
    return t ? JSON.parse(t) : [];
  };
  const rows = await q(`select h.shelter_id, s.key, h.host, h.is_primary from public.shelter_hosts h
    join public.shelters s on s.id = h.shelter_id where s.archived_at is null`);
  const { set, undecided } = choosePrimaries(rows, publicHost);
  for (const s of set) console.log(`  SET       ${s.key}: ${s.host}`);
  for (const u of undecided) console.log(`  UNDECIDED ${u.key}: ${u.hosts.join(", ")} (PUBLIC_HOST is not one of them; choose one by hand)`);
  if (!set.length && !undecided.length) console.log("  every shelter with addresses already has a primary.");
  if (apply && set.length) {
    const sql = set.map((s) => `update public.shelter_hosts set is_primary = true where shelter_id = '${s.shelter_id}' and host = '${s.host.replace(/'/g, "")}' and not exists (select 1 from public.shelter_hosts x where x.shelter_id = '${s.shelter_id}' and x.is_primary);`).join("\n");
    await q(`begin;\n${sql}\ncommit;`);
    console.log(`Applied ${set.length}.`);
  } else if (set.length) console.log("Dry run; add --apply to set these.");
  return undecided.length ? 1 : 0;
}
await runMain(main);
