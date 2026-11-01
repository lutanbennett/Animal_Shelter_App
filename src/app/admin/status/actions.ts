"use server";

import { revalidatePath } from "next/cache";
import { type ActionResult, runWriteAction, type WriteMessages } from "@/lib/action-result";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getSiteOrigin } from "@/lib/site-origin";
import { requestTestAlert, runStatusAlerts, sendTestAlert, type Skipped } from "@/lib/status/alerts";
import { clearStatusCache } from "@/lib/status/run";
import { renderedBy } from "@/lib/status/runtime";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * "Check now": forget the minute's cached results and render again. Called
 * from CheckNowButton. It clears a per-process cache and writes no row, so a replay would be harmless; it is wrapped
 * anyway because the rule is every write reachable at the address, not every harmful one.
 */
export async function checkNow(requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("status.checkNow", write(t), { id: requestId, action: "status.checkNow", db: supabase }, async () => {
    if (!can(await loadPermissions(), "system.status")) {
      return { ok: false, error: t.admin.security.errors.adminAccessRequired };
    }
    clearStatusCache();
    revalidatePath("/admin/status");
    return { ok: true };
  });
}

/**
 * This site's origin, for the link in the mail — the pinned
 * NEXT_PUBLIC_SITE_URL where there is one, so a forged Host header cannot
 * put another address in an alert.
 */
async function origin() {
  return (await getSiteOrigin())?.origin ?? "";
}

type AlertOutcome = { message: string; skipped: Skipped[] };
export type AlertActionResult = ActionResult<AlertOutcome>;

/**
 * "Run the alert check now": one alert run, exactly as the schedule makes
 * it — it counts towards the two red runs, and it mails if the schedule
 * would have. The way to prove the path without waiting 15 minutes.
 */
export async function runAlertCheckNow(requestId: string): Promise<AlertActionResult> {
  const { t } = await getT();
  const a = t.admin.status.alerts;
  if (!can(await loadPermissions(), "system.status")) return { ok: false, error: t.admin.security.errors.adminAccessRequired };
  if (renderedBy() === "pi") return { ok: false, error: a.onPi };
  const supabase = await createClient();
  return runWriteAction<AlertOutcome>("status.runAlertCheckNow", write(t), { id: requestId, action: "status.runAlertCheckNow", db: supabase }, async () => {
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

/**
 * "Send a test alert": the same recipients and way out, touching no state. Both branches (the Pi leaves a request for
 * the Worker, anywhere else mails) sit inside ONE claim: the mail cannot be unsent, so a replay must return the stored
 * answer and never reach the body, and a claim left open by a throw reads "cannot tell" rather than mailing twice.
 */
export async function sendTestAlertNow(requestId: string): Promise<AlertActionResult> {
  const { t } = await getT();
  const a = t.admin.status.alerts;
  if (!can(await loadPermissions(), "system.status")) return { ok: false, error: t.admin.security.errors.adminAccessRequired };
  const supabase = await createClient();
  return runWriteAction<AlertOutcome>("status.sendTestAlert", write(t), { id: requestId, action: "status.sendTestAlert", db: supabase }, async () => {
    if (renderedBy() === "pi") {
      // The Pi cannot mail: leave a request for the Worker's next run instead.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? null;
      const r = await requestTestAlert({ id: user?.id ?? null, name });
      revalidatePath("/admin/status");
      return { ok: true, message: r === "already" ? a.testAlreadyRequested : a.testRequested, skipped: [] };
    }
    const r = await sendTestAlert(await origin());
    revalidatePath("/admin/status");
    const message = [a.testSent({ sent: r.sent.length, skipped: r.skipped.length }), r.note].filter(Boolean).join(" ");
    return { ok: true, message, skipped: r.skipped };
  });
}
