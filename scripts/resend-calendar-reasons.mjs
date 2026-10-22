// One-off, run once per environment after the "reason in the calendar entry" release is live:
// marks every upcoming booked visit that already has a calendar entry and a reason as out of date,
// so the next sweep (within 15 minutes) rewrites its entry with the Reason: line. New and edited
// visits get the line by themselves; only entries made before the release need this.
// docs/decisions/2026-10-22-vet-calendar-shows-the-reason.md
//
//   node scripts/resend-calendar-reasons.mjs                       what it would mark on the test database
//   node scripts/resend-calendar-reasons.mjs --apply               mark them
//   node scripts/resend-calendar-reasons.mjs --env production --apply
//
// Only calendar columns are written (the 0207 trigger does not treat that as a change). Safe to re-run:
// the sweep rewrites an entry to the same text.
import { createClient } from "@supabase/supabase-js";
import { loadEnv, parseEnvArg, projectRef } from "./lib/env.mjs";

const { name, rest } = parseEnvArg(process.argv.slice(2));
const apply = rest.includes("--apply");
const env = loadEnv(name);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Bangkok is UTC+7 all year: the start of today there, as an instant.
const bangkokToday = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
const todayStart = new Date(`${bangkokToday}T00:00:00+07:00`).toISOString();

const { data, error } = await db
  .from("clinic_visits")
  .select("id")
  .eq("status", "scheduled")
  .is("archived_at", null)
  .not("calendar_event_id", "is", null)
  .not("reason", "is", null)
  .neq("reason", "")
  .gte("appointment_date", todayStart);
if (error) throw new Error(error.message);
console.log(`${name} (${projectRef(env)}): ${data.length} upcoming visit(s) with an entry and a reason.`);
if (!apply) {
  console.log("Dry run. Add --apply to mark them out of date.");
} else if (data.length) {
  const { error: e2 } = await db
    .from("clinic_visits")
    .update({ calendar_out_of_date_at: new Date().toISOString() })
    .in(
      "id",
      data.map((r) => r.id),
    );
  if (e2) {
    console.error(e2.message);
    process.exitCode = 1;
  } else {
    console.log("Marked. The calendar sweep rewrites these entries within 15 minutes.");
  }
}
