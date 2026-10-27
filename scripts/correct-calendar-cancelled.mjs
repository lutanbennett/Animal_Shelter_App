// Put back vet visits the calendar poll cancelled by mistake (the 2026-10-27 loop:
// docs/decisions/2026-10-27-calendar-loop.md).
//
//   node scripts/correct-calendar-cancelled.mjs --env production --visit <id>[,<id>…]
//       dry run: reads each visit, checks it, runs the change inside begin…rollback
//
//   node scripts/correct-calendar-cancelled.mjs --env production --visit <ids> --apply --confirm RESTORE
//       writes a receipt of every row FIRST (Desktop), then restores them in one begin…commit
//
// Without --env it works on the test database. The ids come from
// `node scripts/check-production.mjs calendar-recent`; this script never guesses which visits.
//
// It restores ONLY a visit that is cancelled, with cancel_reason "Cancelled from Google Calendar" and
// calendar_change_kind "cancelled". Anything else is refused: a person cancelled that one on purpose.
// What it sets: status back to scheduled; the "Cancelled from Google Calendar" line removed from notes;
// cancel_reason, calendar_change_kind, calendar_changed_at and calendar_error cleared. The visit has no
// event now; a future visit gets a fresh one from the next sweep, a past one keeps none (by the rule).

import { existsSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const value = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? (args[i + 1] ?? null) : null;
};
const apply = args.includes("--apply");
const NOTE = "Cancelled from Google Calendar";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KNOWN = new Set(["--visit", "--confirm", "--apply"]);
const unknown = args.filter((a, i) => a.startsWith("--") && !KNOWN.has(a) && !["--visit", "--confirm"].includes(args[i - 1]));
if (unknown.length) {
  console.error(`Unknown option ${unknown.join(", ")}.`);
  process.exit(2);
}
const ids = (value("--visit") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
if (!ids.length || ids.some((i) => !UUID.test(i))) {
  console.error("Give --visit <id>[,<id>…] with full visit ids (from the calendar-recent check).");
  process.exit(2);
}

const LIVE_REF = "dbkodyyxxhtygxcxmfcu";
const live = envName === "production";
if (envName === "uat") {
  console.error("Refusing: there is no UAT database yet.");
  process.exit(2);
}
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const right = live
  ? Boolean(url) && appEnvForSupabaseUrl(url) === "production" && refOf(env) === LIVE_REF
  : Boolean(url) && appEnvForSupabaseUrl(url) === "dev";
if (!right) {
  console.error(`Refusing: NEXT_PUBLIC_SUPABASE_URL (${url ?? "not set"}) is not the ${live ? "live" : "test"} database.`);
  process.exit(2);
}
if (live && apply && value("--confirm") !== "RESTORE") {
  console.error("Refusing: the LIVE database needs --confirm RESTORE as well as --apply. Run without --apply first.");
  process.exit(2);
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required.");
  process.exit(2);
}
const projectRef = refOf(env);

async function query(statement) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: statement }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const list = ids.map((i) => `'${i}'`).join(",");
const rows = await query(`select id, status, appointment_date, notes, cancel_reason, calendar_change_kind, calendar_changed_at, calendar_event_id from clinic_visits where id in (${list})`);
const problems = [];
for (const id of ids) {
  const r = rows.find((x) => x.id === id);
  if (!r) problems.push(`${id}: no such visit`);
  else if (r.status !== "cancelled") problems.push(`${id}: status is ${r.status}, not cancelled`);
  else if (r.cancel_reason !== NOTE || r.calendar_change_kind !== "cancelled")
    problems.push(`${id}: not cancelled by the calendar poll (reason: ${r.cancel_reason ?? "none"}, kind: ${r.calendar_change_kind ?? "none"}); a person did that`);
}
if (problems.length) {
  console.error(`Refusing; nothing changed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}

const change = `update clinic_visits set status = 'scheduled', cancel_reason = null, calendar_change_kind = null,
  calendar_changed_at = null, calendar_error = null,
  notes = nullif(btrim(replace(replace(coalesce(notes, ''), E'\n${NOTE}', ''), '${NOTE}', '')), '')
  where id in (${list}) and status = 'cancelled' and cancel_reason = '${NOTE}' and calendar_change_kind = 'cancelled' returning id, status`;

console.log(`${live ? "LIVE" : "Test"} database: ${rows.length} visit(s) to restore:`);
for (const r of rows) console.log(`  ${r.id}  dated ${r.appointment_date}  cancelled by the calendar at ${r.calendar_changed_at}`);

if (!apply) {
  const out = await query(`begin; ${change}; rollback;`).catch((e) => ({ error: e.message }));
  console.log(out.error ? `Dry run failed: ${out.error}` : "Dry run: the change runs cleanly (rolled back). Add --apply to do it.");
  process.exit(out.error ? 1 : 0);
}

const desktop = [join(homedir(), "OneDrive", "Desktop"), join(homedir(), "Desktop")].find(existsSync) ?? homedir();
const receipt = join(desktop, `restored-calendar-visits-${live ? "live" : "test"}-${new Date().toISOString().slice(0, 10)}.json`);
if (existsSync(receipt)) {
  console.error(`${receipt} already exists; a receipt is never overwritten.`);
  process.exit(2);
}
writeFileSync(receipt, `${JSON.stringify({ at: new Date().toISOString(), rows }, null, 2)}\n`);
console.log(`Receipt written first: ${receipt}`);
const done = await query(`begin; ${change}; commit;`);
console.log(`Restored: ${JSON.stringify(done)}`);
