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
