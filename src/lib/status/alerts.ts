import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAppEnv } from "@/lib/app-env";
import en from "@/lib/i18n/dictionaries/en";
import { createAdminClient } from "@/lib/supabase/admin";
import { type HealthCheckKey, type HealthReport, runHealthChecks } from "./health";
import { type CheckOutcome, redactSecrets } from "./run";

/**
 * "Alert me when a tile goes red": the System status health checks, run on
 * a schedule, mailed to the admins when one turns red and again when it
 * recovers (docs/decisions.md, 2026-09-27, "Status alerts").
 *
 * Where it runs. A Worker cron trigger (wrangler.jsonc, every
 * ALERT_INTERVAL_MINUTES) calls POST /api/status/alerts inside the Worker
 * itself — worker/index.mjs hands the request straight to the Next handler,
 * so the checks run exactly as the page runs them, with the Worker's
 * bindings, and no second copy of them exists. The same function backs the
 * page's "Run the alert check now", so it can be exercised anywhere.
 *
 * What it remembers (0098). status_alert_checks keeps each check's last
 * state and how many runs in a row it has been red; a mail goes out on the
 * FAIL_RUNS_BEFORE_MAIL-th red run, once, and `alerted_at` is set so the
 * next runs stay quiet. The first run that isn't red after that sends the
 * recovery and clears it. Only `fail` counts: `off` is deliberate and
 * `warn` is working. status_alert_runs records every run — the heartbeat
 * the Alerts tile reads, and who each mail reached or skipped.
 *
 * What it cannot do: remember through a database outage, because it
 * remembers in the database. Then it sends nothing (it could send the same
 * mail every run, but also doesn't know who the admins are) and logs why;
 * the Alerts tile shows the gap once the database is back.
 */

export const ALERT_INTERVAL_MINUTES = 15;

/** Red twice in a row before anyone is mailed: one slow answer from Google is not an outage. */
export const FAIL_RUNS_BEFORE_MAIL = 2;

/** A cron run older than this means the schedule has stopped. */
const STALE_AFTER_MS = 3 * ALERT_INTERVAL_MINUTES * 60_000;

const KEEP_RUNS_DAYS = 30;

export type AlertTrigger = "cron" | "manual" | "test";

export type Skipped = { address: string; reason: string };

export type AlertRunResult = {
  /** False when the run could not read or write its memory (the database). */
  remembered: boolean;
  failing: HealthCheckKey[];
  failed: HealthCheckKey[];
  recovered: HealthCheckKey[];
  sent: string[];
  skipped: Skipped[];
  note: string | null;
};

type MailBinding = {
  send(message: {
    from: { email: string; name: string };
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
};

type AlertEnv = {
  STATUS_ALERT_MAIL?: MailBinding;
  STATUS_ALERT_FROM?: string;
  STATUS_ALERT_SITE?: string;
};

/** The Worker's bindings, or null under `next dev` and on the Pi. */
function workerEnv(): AlertEnv | null {
  try {
    return getCloudflareContext().env as AlertEnv;
  } catch {
    return null;
  }
}

/** Plain English names for the mail, from the page's own tile titles. */
const TITLES: Record<HealthCheckKey, string> = {
  database: en.admin.status.tiles.database.title,
  drive: en.admin.status.tiles.drive.title,
  migrations: en.admin.status.tiles.migrations.title,
  release: en.admin.status.tiles.release.title,
  releaseMail: en.admin.status.tiles.releaseMail.title,
  backup: en.admin.status.tiles.backup.title,
  origin: en.admin.status.tiles.origin.title,
};

const CHECK_KEYS = Object.keys(TITLES) as HealthCheckKey[];

/**
 * A way to break a check on purpose, so the whole path — two red runs, one
 * mail, quiet runs, a recovery — can be proved without breaking anything
 * real: STATUS_ALERT_SIMULATE_FAIL=drive,backup turns those checks red in
 * the alert run (never on the page). Honoured on the dev database only.
 */
function simulated(report: HealthReport): HealthReport {
  const names = (process.env.STATUS_ALERT_SIMULATE_FAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!names.length || getAppEnv() !== "dev") return report;
  const out = { ...report };
  for (const key of CHECK_KEYS) {
    if (names.includes(key)) {
      out[key] = { ...out[key], state: "fail", error: "Simulated failure (STATUS_ALERT_SIMULATE_FAIL)." } as never;
    }
  }
  return out;
}

/** Every non-archived admin's sign-in email, as release mail finds them. */
async function adminEmails(): Promise<string[]> {
  const db = createAdminClient();
  const { data, error } = await db.from("user_roles").select("user_id").eq("role", "admin").is("archived_at", null);
  if (error) throw new Error(`Could not list admins: ${error.message}`);
  const emails = await Promise.all(
    (data ?? []).map(async ({ user_id }) => (await db.auth.admin.getUserById(user_id as string)).data.user?.email ?? null),
  );
  return [...new Set(emails.filter((e): e is string => !!e))];
}

type Mail = { subject: string; text: string; html: string };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * One message per address, as release mail does, so no admin sees the
 * others'. Three ways out, each saying what happened to every address:
 *   - the Worker's STATUS_ALERT_MAIL binding: sent, or skipped with
 *     Cloudflare's reason (an address that isn't a verified destination);
 *   - a local dev server on the dev database: printed to the server log and
 *     counted as sent, so the one-mail-per-outage rule can be proved there;
 *   - anywhere else (the Pi, a Worker without the binding): skipped, with
 *     the reason, never silently.
 */
async function send(
  mail: Mail,
  to: string[],
  origin: string,
): Promise<{ sent: string[]; skipped: Skipped[]; note: string | null }> {
  const env = workerEnv();
  const site = hostOf(origin);
  const subject = `[${site}] ${mail.subject}`;
  if (env?.STATUS_ALERT_MAIL && env.STATUS_ALERT_FROM) {
    const sent: string[] = [];
    const skipped: Skipped[] = [];
    for (const address of to) {
      try {
        await env.STATUS_ALERT_MAIL.send({
          from: { email: env.STATUS_ALERT_FROM, name: "Lanna Care status" },
          to: address,
          subject,
          text: mail.text,
          html: mail.html,
        });
        sent.push(address);
      } catch (err) {
        const e = err as { code?: string; message?: string };
        skipped.push({ address, reason: redactSecrets(e?.code ?? e?.message ?? String(err)) });
      }
    }
    return { sent, skipped, note: null };
  }
  if (!env && getAppEnv() === "dev") {
    console.log(`status-alerts: [logged, not mailed] to ${to.join(", ")}\nSubject: ${subject}\n\n${mail.text}`);
    return { sent: to, skipped: [], note: "Local dev server: the mail was written to the server log, not sent." };
  }
  const reason = !env
    ? "alert mail is off here: not running on the Worker, which holds the mail binding"
    : "alert mail is off here: no STATUS_ALERT_MAIL binding or STATUS_ALERT_FROM (wrangler.jsonc)";
  return { sent: [], skipped: to.map((address) => ({ address, reason })), note: reason };
}

const hostOf = (origin: string) => {
  try {
    return new URL(origin).host || "Lanna Care";
  } catch {
    return "Lanna Care";
  }
};

function buildMail(
  report: HealthReport,
  failed: HealthCheckKey[],
  recovered: { key: HealthCheckKey; error: string | null }[],
  origin: string,
): Mail {
  const parts: string[] = [];
  if (failed.length) parts.push(`Not working: ${failed.map((k) => TITLES[k]).join(", ")}`);
  if (recovered.length) parts.push(`Working again: ${recovered.map((r) => TITLES[r.key]).join(", ")}`);
  const statusUrl = `${origin}/admin/status`;

  const text: string[] = [];
  const html: string[] = [];
  if (failed.length) {
    text.push(`Not working (red on ${FAIL_RUNS_BEFORE_MAIL} checks in a row):`);
    html.push(`<p><strong>Not working</strong> (red on ${FAIL_RUNS_BEFORE_MAIL} checks in a row):</p><ul>`);
    for (const key of failed) {
      const why = redactSecrets(report[key].error ?? "No reason given.");
      text.push(`  - ${TITLES[key]}: ${why}`);
      html.push(`<li><strong>${escapeHtml(TITLES[key])}</strong>: ${escapeHtml(why)}</li>`);
    }
    html.push("</ul>");
  }
  if (recovered.length) {
    if (text.length) text.push("");
    text.push("Working again:");
    html.push("<p><strong>Working again</strong>:</p><ul>");
    for (const { key, error } of recovered) {
      const was = error ? ` (last error: ${redactSecrets(error)})` : "";
      text.push(`  - ${TITLES[key]}${was}`);
      html.push(`<li><strong>${escapeHtml(TITLES[key])}</strong>${escapeHtml(was)}</li>`);
    }
    html.push("</ul>");
  }
  const footer = `Settings → System status: ${statusUrl}\nYou get this because you are an admin. One mail when a check goes red, one when it recovers; nothing in between.`;
  text.push("", footer);
  html.push(
    `<p><a href="${escapeHtml(statusUrl)}">Settings → System status</a></p>`,
    `<p style="color:#666;font-size:12px">You get this because you are an admin. One mail when a check goes red, one when it recovers; nothing in between.</p>`,
  );
  return { subject: parts.join(" · "), text: text.join("\n"), html: html.join("\n") };
}

async function recordRun(
  trigger: AlertTrigger,
  row: { failing: string[]; mailed: object | null; sent: string[]; skipped: Skipped[]; note: string | null },
) {
  const db = createAdminClient();
  const { error } = await db.from("status_alert_runs").insert({ trigger, ...row });
  if (error) throw new Error(`Could not record the run: ${error.message}`);
  await db
    .from("status_alert_runs")
    .delete()
    .lt("ran_at", new Date(Date.now() - KEEP_RUNS_DAYS * 86_400_000).toISOString());
}

/**
 * One alert run: check everything, compare with last time, mail what
 * changed, remember. Never throws — the result says what happened, and a
 * run that cannot remember says that too.
 */
export async function runStatusAlerts(trigger: "cron" | "manual", origin: string): Promise<AlertRunResult> {
  const report = simulated(await runHealthChecks());
  const failing = CHECK_KEYS.filter((k) => report[k].state === "fail");
  const result: AlertRunResult = { remembered: false, failing, failed: [], recovered: [], sent: [], skipped: [], note: null };

  const db = createAdminClient();
  const { data: prevRows, error: readError } = await db
    .from("status_alert_checks")
    .select("check_key, state, error, fail_runs, alerted_at");
  if (readError) {
    result.note = redactSecrets(`Cannot read the last run's state, so nothing was mailed: ${readError.message}`);
    console.error(`status-alerts: ${result.note}`);
    return result;
  }
  const prev = new Map((prevRows ?? []).map((r) => [r.check_key as string, r]));

  const rows = CHECK_KEYS.map((key) => {
    const r = report[key];
    const p = prev.get(key);
    const failRuns = r.state === "fail" ? (p?.fail_runs ?? 0) + 1 : 0;
    return {
      key,
      failRuns,
      alertedAt: (p?.alerted_at as string | null) ?? null,
      prevError: (p?.error as string | null) ?? null,
      row: {
        check_key: key,
        state: r.state,
        error: r.error ?? null,
        fail_runs: failRuns,
        alerted_at: (p?.alerted_at as string | null) ?? null,
        updated_at: new Date().toISOString(),
      },
    };
  });

  const failed = rows.filter((x) => x.failRuns >= FAIL_RUNS_BEFORE_MAIL && !x.alertedAt).map((x) => x.key);
  const recovered = rows.filter((x) => report[x.key].state !== "fail" && x.alertedAt);
  result.failed = failed;
  result.recovered = recovered.map((x) => x.key);

  if (failed.length || recovered.length) {
    let to: string[] = [];
    try {
      to = await adminEmails();
    } catch (err) {
      result.note = redactSecrets(err instanceof Error ? err.message : String(err));
    }
    if (to.length) {
      const mail = buildMail(report, failed, recovered.map((x) => ({ key: x.key, error: x.prevError })), origin);
      const out = await send(mail, to, origin);
      result.sent = out.sent;
      result.skipped = out.skipped;
      result.note = out.note;
    } else if (!result.note) {
      result.note = "No admin has an email address, so nobody could be told.";
    }
    // Only a mail that reached someone closes the loop. One that reached
    // nobody is tried again next run, and the tile shows why it failed.
    if (result.sent.length) {
      const now = new Date().toISOString();
      for (const x of rows) {
        if (failed.includes(x.key)) x.row.alerted_at = now;
        if (recovered.some((r) => r.key === x.key)) x.row.alerted_at = null;
      }
    }
  }

  const { error: writeError } = await db.from("status_alert_checks").upsert(rows.map((x) => x.row));
  if (writeError) {
    result.note = redactSecrets(`Cannot remember this run: ${writeError.message}`);
    console.error(`status-alerts: ${result.note}`);
    return result;
  }
  try {
    await recordRun(trigger, {
      failing,
      mailed: failed.length || recovered.length ? { failed, recovered: result.recovered } : null,
      sent: result.sent,
      skipped: result.skipped,
      note: result.note,
    });
  } catch (err) {
    result.note = redactSecrets(err instanceof Error ? err.message : String(err));
    console.error(`status-alerts: ${result.note}`);
    return result;
  }
  result.remembered = true;
  return result;
}

/**
 * "Send a test alert": the same recipients, the same way out, a mail that
 * says it is a test. Changes no check's state; recorded as a 'test' run so
 * the tile can say whether it reached anyone.
 */
export async function sendTestAlert(origin: string): Promise<{ sent: string[]; skipped: Skipped[]; note: string | null }> {
  const to = await adminEmails();
  const statusUrl = `${origin}/admin/status`;
  const out = to.length
    ? await send(
        {
          subject: "Test: status alerts reach you",
          text: `This is a test of the System status alerts, sent from Settings → System status.\nIf a health check goes red for ${FAIL_RUNS_BEFORE_MAIL} checks in a row (about ${FAIL_RUNS_BEFORE_MAIL * ALERT_INTERVAL_MINUTES} minutes), every admin gets one mail like this, and another when it recovers.\n\n${statusUrl}`,
          html: `<p>This is a test of the System status alerts, sent from Settings → System status.</p><p>If a health check goes red for ${FAIL_RUNS_BEFORE_MAIL} checks in a row (about ${FAIL_RUNS_BEFORE_MAIL * ALERT_INTERVAL_MINUTES} minutes), every admin gets one mail like this, and another when it recovers.</p><p><a href="${escapeHtml(statusUrl)}">Settings → System status</a></p>`,
        },
        to,
        origin,
      )
    : { sent: [], skipped: [], note: "No admin has an email address, so nobody could be told." };
  await recordRun("test", { failing: [], mailed: null, ...out });
  return out;
}

export type AlertFacts = {
  /** The Worker runs the schedule here (STATUS_ALERT_SITE is set). */
  scheduledHere: boolean;
  lastCronAt: string | null;
  /** Checks mailed as red and not yet recovered. */
  open: HealthCheckKey[];
  /** The most recent run that tried to mail (an alert or a test). */
  lastMail: { at: string; trigger: AlertTrigger; sent: number; skipped: Skipped[]; note: string | null } | null;
};

/**
 * The Alerts tile. Red when the schedule has stopped or the last mail
 * reached nobody, amber when it reached only some admins — the ways an
 * alert path fails without anyone seeing. Deliberately not one of the
 * checks the run itself alerts on: a stopped schedule can't mail about
 * itself, and a mail that reached nobody can't either.
 */
export async function checkAlerts(): Promise<CheckOutcome<AlertFacts>> {
  const scheduledHere = !!workerEnv()?.STATUS_ALERT_SITE;
  const db = createAdminClient();
  const [cron, mail, open] = await Promise.all([
    db.from("status_alert_runs").select("ran_at").eq("trigger", "cron").order("ran_at", { ascending: false }).limit(1),
    db
      .from("status_alert_runs")
      .select("ran_at, trigger, sent, skipped, note")
      .or("mailed.not.is.null,trigger.eq.test")
      .order("ran_at", { ascending: false })
      .limit(1),
    db.from("status_alert_checks").select("check_key").not("alerted_at", "is", null),
  ]);
  const error = cron.error ?? mail.error ?? open.error;
  if (error) return { state: "fail", error: error.message };

  const m = mail.data?.[0];
  const facts: AlertFacts = {
    scheduledHere,
    lastCronAt: (cron.data?.[0]?.ran_at as string | undefined) ?? null,
    open: (open.data ?? []).map((r) => r.check_key as HealthCheckKey),
    lastMail: m
      ? {
          at: m.ran_at as string,
          trigger: m.trigger as AlertTrigger,
          sent: (m.sent as string[]).length,
          skipped: m.skipped as Skipped[],
          note: m.note as string | null,
        }
      : null,
  };

  if (!facts.lastCronAt) {
    return scheduledHere
      ? { state: "fail", error: "The alert schedule is set up here but has never run.", facts }
      : { state: "off", facts };
  }
  const age = Date.now() - Date.parse(facts.lastCronAt);
  if (age > STALE_AFTER_MS) {
    return {
      state: "fail",
      error: `The alert check last ran ${Math.round(age / 60_000)} minutes ago; it should run every ${ALERT_INTERVAL_MINUTES}.`,
      facts,
    };
  }
  if (facts.lastMail && facts.lastMail.sent === 0) {
    return { state: "fail", error: facts.lastMail.note ?? "The last alert reached nobody.", facts };
  }
  if (facts.lastMail?.skipped.length) {
    return {
      state: "warn",
      error: facts.lastMail.skipped.map((s) => `${s.address}: ${s.reason}`).join("; "),
      facts,
    };
  }
  return { state: "ok", facts };
}
