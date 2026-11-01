"use server";

import { revalidatePath } from "next/cache";
import { runWriteAction, unexpectedFailure, type ActionResult, type WriteMessages } from "@/lib/action-result";
import { writeRequestIdFrom } from "@/lib/write-requests";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { calendarConfigured } from "@/lib/clinics/calendar-sync";
import { createVisits, dismissEvent, fetchEvent, isCandidate, loadRefs } from "@/lib/clinics/calendar-import";

// PI FAILOVER (D), 2026-11-01: both writes go through runWriteAction()
// (docs/decisions/2026-11-01-write-paths-tail-b.md). The helpers they call write through other clients:
// createVisits() inserts as the admin client and dismissEvent() PATCHes Google Calendar. Both were already
// convergent (createVisits refuses an event it has imported, a repeated dismiss sets the same flag), so the claim
// is a second line and not the only one.

/** The words runWriteAction() needs. */
const write = (t: Dictionary): WriteMessages => ({
  somethingWentWrong: t.common.somethingWentWrong,
  saveUnknown: t.common.saveUnknown,
  reloadToSave: t.common.reloadToSave,
});

/**
 * The two buttons on "Calendar entries to confirm". Both need the right to book visits. A confirm takes the
 * event's time from Google, not from the form, and re-checks that the event is still unclaimed, that the
 * clinic exists and that every resident is still live: what the form carries is only which to use.
 */
async function allowed(): Promise<boolean> {
  return calendarConfigured() && can(await loadPermissions(), "visit.book");
}

export type ConfirmEntryState = ActionResult | undefined;

export async function confirmCalendarEntry(_state: ConfirmEntryState, formData: FormData): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("upcomingVisits.confirm", write(t), { id: writeRequestIdFrom(formData), action: "upcomingVisits.confirm", db: supabase }, async () => {
    if (!(await allowed())) return { ok: false, error: t.common.notAllowed };
    const eventId = formData.get("eventId");
    const clinicId = formData.get("clinicId");
    const residentIds = [...formData.entries()].filter(([k]) => /^pick-[0-9]+$/.test(k)).map(([, v]) => v).filter((x): x is string => typeof x === "string" && x.length > 0);
    // A stale or tampered form changes nothing and says nothing, as before.
    if (typeof eventId !== "string" || !eventId || typeof clinicId !== "string" || !clinicId || residentIds.length === 0) return { ok: true };
    const event = await fetchEvent(eventId);
    if (!event || !isCandidate(event)) return { ok: true };
    const refs = await loadRefs();
    if (!refs.clinics.some((c) => c.id === clinicId)) return { ok: true };
    const live = new Set(refs.residents.filter((r) => r.status !== "Deceased" && r.status !== "Adopted").map((r) => r.id));
    if (!residentIds.every((id) => live.has(id))) return { ok: true };
    const made = await createVisits(event, clinicId, residentIds, (await getSiteOrigin())?.origin ?? null);
    if (made.error) return unexpectedFailure("upcomingVisits.confirm", made.error, t.common.somethingWentWrong);
    revalidatePath("/upcoming-visits");
    return { ok: true };
  });
}

export async function dismissCalendarEntry(eventId: string, requestId: string): Promise<ActionResult> {
  const { t } = await getT();
  const supabase = await createClient();
  return runWriteAction("upcomingVisits.dismiss", write(t), { id: requestId, action: "upcomingVisits.dismiss", db: supabase }, async () => {
    if (!(await allowed())) return { ok: false, error: t.common.notAllowed };
    if (typeof eventId !== "string" || !eventId) return { ok: true };
    const failed = await dismissEvent(eventId);
    if (failed) return unexpectedFailure("upcomingVisits.dismiss", failed, t.common.somethingWentWrong);
    revalidatePath("/upcoming-visits");
    return { ok: true };
  });
}
