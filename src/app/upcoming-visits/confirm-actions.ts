"use server";

import { revalidatePath } from "next/cache";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { getSiteOrigin } from "@/lib/site-origin";
import { calendarConfigured } from "@/lib/clinics/calendar-sync";
import { createVisits, dismissEvent, fetchEvent, isCandidate, loadRefs } from "@/lib/clinics/calendar-import";

/**
 * The two buttons on "Calendar entries to confirm". Both need the right to book visits. A confirm takes the
 * event's time from Google, not from the form, and re-checks that the event is still unclaimed, that the
 * clinic exists and that every resident is still live: what the form carries is only which to use.
 */
async function allowed(): Promise<boolean> {
  return calendarConfigured() && can(await loadPermissions(), "visit.book");
}

export async function confirmCalendarEntry(formData: FormData): Promise<void> {
  if (!(await allowed())) return;
  const eventId = formData.get("eventId");
  const clinicId = formData.get("clinicId");
  const residentIds = [...formData.entries()].filter(([k]) => /^pick-[0-9]+$/.test(k)).map(([, v]) => v).filter((x): x is string => typeof x === "string" && x.length > 0);
  if (typeof eventId !== "string" || !eventId || typeof clinicId !== "string" || !clinicId || residentIds.length === 0) return;
  const event = await fetchEvent(eventId);
  if (!event || !isCandidate(event)) return;
  const refs = await loadRefs();
  if (!refs.clinics.some((c) => c.id === clinicId)) return;
  const live = new Set(refs.residents.filter((r) => r.status !== "Deceased" && r.status !== "Adopted").map((r) => r.id));
  if (!residentIds.every((id) => live.has(id))) return;
  await createVisits(event, clinicId, residentIds, (await getSiteOrigin())?.origin ?? null);
  revalidatePath("/upcoming-visits");
}

export async function dismissCalendarEntry(formData: FormData): Promise<void> {
  if (!(await allowed())) return;
  const eventId = formData.get("eventId");
  if (typeof eventId !== "string" || !eventId) return;
  await dismissEvent(eventId);
  revalidatePath("/upcoming-visits");
}
