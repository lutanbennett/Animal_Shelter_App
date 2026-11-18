// Tells the database how a scheduled writer's run went, so a failure is something a person can read (#lblcr).
//
// A Worker cron that fails only logs to the Worker's own log, which nobody reads: the label-draft cron wrote no
// drafts for a day after 0397 and the only trace was a console line. This posts the run's outcome to
// record_scheduled_writer_run() (0408). src/lib/status/health.ts reads that table into the System status
// "Scheduled jobs" tile, and the quarter-hourly alert run (0098) mails the admins when it stays red.
//
// outcome: 'ok' | 'skipped' (deliberately not configured, counts as healthy) | 'failed'.
// NEVER throws: reporting must not be the thing that breaks the run it reports on. If this call itself fails the
// run is simply unrecorded, and the tile goes amber ("stale") after 48 hours rather than staying green.
export async function reportWriterRun(env, job, summary, fetchImpl = fetch) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return false;
  try {
    const res = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/rpc/record_scheduled_writer_run`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_job: job, p_outcome: summary.outcome ?? "ok", p_detail: summary.note ?? null }),
    });
    if (!res.ok) console.error(`writer-runs: ${job} not recorded (${res.status})`);
    return res.ok;
  } catch (err) {
    console.error(`writer-runs: ${job} not recorded, ${err?.message ?? err}`);
    return false;
  }
}

// The scheduled stages return a one-line string for the heartbeat ("calendar-sweep: 200", "...: skipped, not set: X",
// "...: failed, boom", "...: not due"). This turns that line into the summary reportWriterRun wants, so a stage keeps
// returning its string and one adapter decides what the string means (#rpwrt). Returns null for "not due": the stage did
// not run this tick, so there is nothing to record and the last real run's age stays honest.
// An HTTP answer is judged by its status: a 5xx from the endpoint is a failure, not an "ok" just because it answered.
export function summariseStage(line) {
  const rest = String(line).replace(/^[a-z0-9-]+:\s*/, "");
  if (rest.startsWith("not due")) return null;
  if (rest.startsWith("skipped")) return { outcome: "skipped", note: rest };
  if (rest.startsWith("failed") || rest.startsWith("threw")) return { outcome: "failed", note: rest };
  const status = /^(\d{3})\b/.exec(rest);
  if (status) return Number(status[1]) < 300 ? { outcome: "ok", note: rest } : { outcome: "failed", note: `answered ${rest}` };
  return { outcome: "failed", note: `unrecognised result: ${rest}` };
}

// Pushes a stage's string onto `stages` (for the heartbeat) and records its run. Never throws.
export async function reportStage(env, job, line, stages, fetchImpl = fetch) {
  stages.push(line);
  const summary = summariseStage(line);
  if (summary) await reportWriterRun(env, job, summary, fetchImpl);
}
