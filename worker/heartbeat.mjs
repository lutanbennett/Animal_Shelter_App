// "The trigger fired", written straight to Supabase by the Worker itself.
//
// Why it exists: the 15-minute cron went silent on 2026-10-23 and nothing could
// say whether the trigger stopped or a stage swallowed the run (a missing
// variable returns early). The real run's row is written by the Next.js route,
// so it only appears if the trigger fired AND the Worker reached the app AND the
// route wrote. This row needs the first stage only, so it separates the cases.
//
// No migration: status_alert_runs.trigger only allows cron/manual/test, so a
// heartbeat is trigger 'cron' with a note starting HEARTBEAT_NOTE. The
// calendar-cron check (scripts/lib/readonly-checks.mjs) counts real runs as
// rows WITHOUT that prefix, so a heartbeat can never make a dead cron look fixed.
export const HEARTBEAT_NOTE = "heartbeat:";

function rest(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return {
    url: `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/status_alert_runs`,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
    },
  };
}

/** Never throws. Returns the row id, or null (and logs why) when it could not write. */
export async function recordHeartbeat(env, cron) {
  try {
    const target = rest(env);
    if (!target) {
      console.error(`heartbeat: not written; ${!env.SUPABASE_URL ? "SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY"} is not set.`);
      return null;
    }
    const res = await fetch(target.url, {
      method: "POST",
      headers: { ...target.headers, prefer: "return=representation" },
      body: JSON.stringify({ trigger: "cron", failing: [], note: `${HEARTBEAT_NOTE} fired (${cron ?? "?"}); stages not yet reported` }),
    });
    if (!res.ok) {
      console.error(`heartbeat: not written; Supabase answered ${res.status}.`);
      return null;
    }
    const rows = await res.json();
    return rows?.[0]?.id ?? null;
  } catch (err) {
    console.error(`heartbeat: not written; ${err?.message ?? err}`);
    return null;
  }
}

/** Replaces the note with what each stage did, e.g. "status-alerts: skipped, STATUS_ALERT_SITE not set". Never throws. */
export async function finishHeartbeat(env, id, cron, stages) {
  if (id == null) return;
  try {
    const target = rest(env);
    if (!target) return;
    await fetch(`${target.url}?id=eq.${id}`, {
      method: "PATCH",
      headers: target.headers,
      body: JSON.stringify({ note: `${HEARTBEAT_NOTE} fired (${cron ?? "?"}); ${stages.join("; ")}` }),
    });
  } catch (err) {
    console.error(`heartbeat: stages not recorded; ${err?.message ?? err}`);
  }
}
