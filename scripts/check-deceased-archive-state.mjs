// Is each deceased resident's archive written? A READ-ONLY question, so it has
// an answer to look up instead of a person to ask.
//
//   node scripts/check-deceased-archive-state.mjs [--env test|uat|production] [R-0323]
//
// Prints one line per deceased resident (or just the one asked for):
//
//   R-0323  Chao Guay (2)  — died 2026-10-28, archived 2026-11-04 12:30:43, summary, index
//
// "archived" is residents.deceased_archived_at (UTC); "summary" and "index" are
// the two Drive files recorded in deceased_summary_drive_file_id and
// deceased_index_drive_file_id (0026). A resident missing any of the three prints
// "NOT ARCHIVED" or says which part is missing. Exit 0 if every line printed is
// complete, 1 if any is not, 2 if it could not ask.
//
// It never writes. Regenerating an archive stays the resident hub's "Retry
// archive" button and refresh-deceased-archive.ts. On 2026-11-04 R-0323 was
// retried and reported done more than once and Lutan was asked again anyway,
// because nobody could check: this is the check
// (docs/decisions/2026-11-05-planner-tooling-follow-ups.md).
//
// Reaches the database through the Management API (SUPABASE_ACCESS_TOKEN), as
// apply-migrations.mjs does. A worktree cannot reach production, so the
// production run is the planner's.
import { exitWith } from "./lib/exit.mjs";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name: envName, rest } = parseEnvArg(process.argv.slice(2));
const code = rest.find((a) => !a.startsWith("--"));
if (code && !/^R-\d+$/.test(code)) {
  console.error(`check-deceased-archive-state: "${code}" is not a resident code like R-0323.`);
  await exitWith(2);
} else {
  await main();
}

async function main() {
  const env = loadEnv(envName);
  if (!env.SUPABASE_ACCESS_TOKEN || !env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error(
      "check-deceased-archive-state: SUPABASE_ACCESS_TOKEN or NEXT_PUBLIC_SUPABASE_URL is not set for " +
        `${envName}; the token may be missing from this shell (node scripts/check-planner-preflight.mjs shows which credentials it can reach).`,
    );
    return exitWith(2);
  }
  const sql =
    `select r.resident_code, r.name, to_char(s.date_of_death at time zone 'UTC', 'YYYY-MM-DD') as died, ` +
    `to_char(r.deceased_archived_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') as archived, ` +
    `(r.deceased_summary_drive_file_id is not null) as has_summary, ` +
    `(r.deceased_index_drive_file_id is not null) as has_index ` +
    `from residents r join resident_current_state s on s.resident_id = r.id ` +
    `where s.is_deceased` +
    (code ? ` and r.resident_code = '${code}'` : "") +
    ` order by r.resident_code`;
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef(env)}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(
      `check-deceased-archive-state: ${envName} answered ${res.status}: ${text.slice(0, 300)}` +
        (res.status === 401 ? "\n  The token may be missing from this shell, or expired." : ""),
    );
    return exitWith(2);
  }
  const rows = JSON.parse(text);
  console.log(`check-deceased-archive-state: ${envName} (${projectRef(env)}), read-only`);
  if (!rows.length) {
    console.log(code ? `${code}  is not recorded as deceased here (or does not exist).` : "No deceased residents.");
    return exitWith(code ? 1 : 0);
  }
  let incomplete = 0;
  for (const r of rows) {
    const parts = [r.archived ? `archived ${r.archived}` : null, r.has_summary ? "summary" : null, r.has_index ? "index" : null].filter(Boolean);
    const ok = r.archived && r.has_summary && r.has_index;
    if (!ok) incomplete++;
    const missing = [!r.archived && "no archive time", !r.has_summary && "no summary file", !r.has_index && "no index file"].filter(Boolean);
    console.log(`${r.resident_code}  ${r.name}  — died ${r.died ?? "unknown"}, ${ok ? parts.join(", ") : `NOT ARCHIVED (${missing.join(", ")})`}`);
  }
  console.log(incomplete ? `${incomplete} of ${rows.length} not fully archived.` : `${rows.length} deceased, all fully archived.`);
  return exitWith(incomplete ? 1 : 0);
}
