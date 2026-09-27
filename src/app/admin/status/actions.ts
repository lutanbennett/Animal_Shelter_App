"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { type ActionResult, runAction } from "@/lib/action-result";
import { assertAdminRole, hasAdminRole } from "@/lib/auth/require-admin";
import { getT } from "@/lib/i18n/get-t";
import { runStatusAlerts, sendTestAlert, type Skipped } from "@/lib/status/alerts";
import { clearStatusCache } from "@/lib/status/run";

/** "Check now": forget the minute's cached results and render again. */
export async function checkNow() {
  await assertAdminRole();
  clearStatusCache();
  revalidatePath("/admin/status");
}

/** This site's origin, for the link in the mail. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

type AlertOutcome = { message: string; skipped: Skipped[] };
export type AlertActionResult = ActionResult<AlertOutcome>;

/**
 * "Run the alert check now": one alert run, exactly as the schedule makes
 * it — it counts towards the two red runs, and it mails if the schedule
 * would have. The way to prove the path without waiting 15 minutes.
 */
export async function runAlertCheckNow(): Promise<AlertActionResult> {
  const { t } = await getT();
  const a = t.admin.status.alerts;
  if (!(await hasAdminRole())) return { ok: false, error: t.admin.security.errors.adminAccessRequired };
  return runAction<AlertOutcome>("status.runAlertCheckNow", t.common.somethingWentWrong, async () => {
    const r = await runStatusAlerts("manual", await origin());
    clearStatusCache();
    revalidatePath("/admin/status");
    if (!r.remembered) return { ok: false, error: a.notRemembered({ note: r.note ?? "" }) };
    const parts = [r.failing.length ? a.runFailing({ count: r.failing.length }) : a.runAllClear];
    if (r.failed.length || r.recovered.length) parts.push(a.runMailed({ sent: r.sent.length, skipped: r.skipped.length }));
    else parts.push(a.runNoMail);
    if (r.note) parts.push(r.note);
    return { ok: true, message: parts.join(" "), skipped: r.skipped };
  });
}

/** "Send a test alert": the same recipients and way out, touching no state. */
export async function sendTestAlertNow(): Promise<AlertActionResult> {
  const { t } = await getT();
  const a = t.admin.status.alerts;
  if (!(await hasAdminRole())) return { ok: false, error: t.admin.security.errors.adminAccessRequired };
  return runAction<AlertOutcome>("status.sendTestAlert", t.common.somethingWentWrong, async () => {
    const r = await sendTestAlert(await origin());
    revalidatePath("/admin/status");
    const message = [a.testSent({ sent: r.sent.length, skipped: r.skipped.length }), r.note].filter(Boolean).join(" ");
    return { ok: true, message, skipped: r.skipped };
  });
}
