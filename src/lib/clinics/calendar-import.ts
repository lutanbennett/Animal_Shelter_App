import { createAdminClient } from "@/lib/supabase/admin";
import { getAppEnv } from "@/lib/app-env";
import { isOtherEnvironment } from "./calendar-change";
import { calendarFetch, errorText, syncPendingVisits } from "./calendar-sync";
import {
  decideImport,
  type ClinicRef,
  type Decision,
  type ResidentRef,
} from "./calendar-import-match";

/**
 * The calendar's other direction: an event the Director typed ("Novel - Blackie") becomes a clinic visit
 * (docs/decisions/2026-10-22-visits-from-google-calendar.md).
 *
 *  - Only events the poll sees ARRIVE are imported on their own, so an event made before this was switched
 *    on is never imported unless someone confirms it from the list.
 *  - Exactly one clinic and one live resident per name: the visit is made, the event is claimed (the visit's
 *    calendar_event_id), and the app's own sync then retitles it and writes its visitId. Anything else is
 *    never guessed: it waits in the confirm list for one tap, or is dismissed.
 *  - The same event is never imported twice: keyed on the event id (calendar_event_id), and an event that
 *    already carries a visitId is the app's own and is never read as new.
 *  - "Dismissed" is a private flag on the event itself (extendedProperties.private.dismissed), so it needs
 *    no table. The event is otherwise left alone.
 * Nothing here throws into the poll.
 */

export const CREATED_NOTE = "Created from Google Calendar";

export type CalEvent = {
  id: string;
  status?: string;
  summary?: string;
  recurrence?: string[];
  recurringEventId?: string;
  extendedProperties?: { private?: { env?: string; visitId?: string; dismissed?: string } };
  start?: { dateTime?: string; date?: string };
};

type Refs = { clinics: ClinicRef[]; residents: ResidentRef[] };

export async function loadRefs(): Promise<Refs> {
  const db = createAdminClient();
  const [clinics, residents, state] = await Promise.all([
    db.from("clinics").select("id, name").returns<ClinicRef[]>(),
    db
      .from("residents")
      .select("id, resident_code, name, thai_name")
      .returns<{ id: string; resident_code: string | null; name: string; thai_name: string | null }[]>(),
    db.from("resident_current_state").select("resident_id, current_status").returns<{ resident_id: string; current_status: string | null }[]>(),
  ]);
  const status = new Map((state.data ?? []).map((s) => [s.resident_id, s.current_status]));
  return {
    clinics: clinics.data ?? [],
    residents: (residents.data ?? []).map((r) => ({ id: r.id, name: r.name, thaiName: r.thai_name, code: r.resident_code, status: status.get(r.id) ?? null })),
  };
}

/** An event this feature may look at at all: a live, single, not-the-app's, not-dismissed entry of this environment. */
export function isCandidate(e: CalEvent): boolean {
  if (e.status === "cancelled") return false;
  if (e.recurrence || e.recurringEventId) return false; // a repeating entry is never turned into visits
  const p = e.extendedProperties?.private;
  if (p?.visitId || p?.dismissed) return false;
  return !isOtherEnvironment(p?.env, getAppEnv());
}

const hasTime = (e: CalEvent) => Boolean(e.start?.dateTime && !Number.isNaN(new Date(e.start.dateTime).getTime()));

export function decide(e: CalEvent, refs: Refs): Decision {
  return decideImport({ summary: e.summary, hasTime: hasTime(e) }, refs.clinics, refs.residents);
}

/** Make the visits for one event. The first claims the event; the rest get their own events from the sync. */
export async function createVisits(
  e: CalEvent,
  clinicId: string,
  residentIds: string[],
  origin: string | null,
): Promise<{ created: number; error?: string }> {
  if (!hasTime(e) || residentIds.length === 0) return { created: 0, error: "The event has no time or no resident." };
  const db = createAdminClient();
  const { data: already } = await db.from("clinic_visits").select("id").eq("calendar_event_id", e.id).limit(1);
  if (already?.length) return { created: 0 }; // imported before: never twice
  const when = new Date(e.start!.dateTime!).toISOString();
  let created = 0;
  for (const [i, residentId] of [...new Set(residentIds)].entries()) {
    const { error } = await db.from("clinic_visits").insert({
      resident_id: residentId,
      clinic_id: clinicId,
      appointment_date: when,
      status: "scheduled",
      notes: CREATED_NOTE,
      ...(i === 0 ? { calendar_event_id: e.id } : {}),
    });
    if (error) return { created, error: error.message };
    created += 1;
  }
  // The visits are saved; the sync now retitles the claimed event and makes the others' events.
  await syncPendingVisits(origin);
  return { created };
}

/** The poll's hook: an event that is not one of the app's visits has just arrived. */
export async function importNewEvent(e: CalEvent, origin: string | null): Promise<boolean> {
  try {
    if (!isCandidate(e)) return false;
    const d = decide(e, await loadRefs());
    if (d.kind !== "import") return false; // waits in the confirm list
    const r = await createVisits(e, d.clinic.id, d.residents.map((x) => x.id), origin);
    return r.created > 0;
  } catch {
    return false;
  }
}

export type ConfirmItem = {
  eventId: string;
  title: string;
  start: string | null;
  allDay: boolean;
  decision: Extract<Decision, { kind: "confirm" }>;
};

/** Future entries in the shelter calendar that are not visits and have not been dismissed, read live. */
export async function listToConfirm(): Promise<{ items: ConfirmItem[]; refs: Refs; error: string | null }> {
  const empty: Refs = { clinics: [], residents: [] };
  try {
    const db = createAdminClient();
    const timeMin = new Date(Date.now() - 24 * 3600_000).toISOString();
    const qs = new URLSearchParams({ maxResults: "250", singleEvents: "false", showDeleted: "false", timeMin });
    const res = await calendarFetch(`/events?${qs}`);
    if (!res.ok) return { items: [], refs: empty, error: `Calendar read failed (${res.status}): ${await errorText(res)}` };
    const events = (((await res.json()) as { items?: CalEvent[] }).items ?? []).filter(isCandidate);
    if (events.length === 0) return { items: [], refs: empty, error: null };
    const { data: known } = await db.from("clinic_visits").select("calendar_event_id").in("calendar_event_id", events.map((e) => e.id));
    const claimed = new Set((known ?? []).map((k) => k.calendar_event_id));
    const refs = await loadRefs();
    const items: ConfirmItem[] = [];
    for (const e of events) {
      if (claimed.has(e.id)) continue;
      const decision = decide(e, refs);
      if (decision.kind !== "confirm") continue; // a clean one is imported by the poll; it never waits here
      items.push({ eventId: e.id, title: e.summary ?? "", start: e.start?.dateTime ?? e.start?.date ?? null, allDay: !hasTime(e), decision });
    }
    items.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
    return { items, refs, error: null };
  } catch (err) {
    return { items: [], refs: empty, error: err instanceof Error ? err.message : String(err) };
  }
}

/** The event as Google has it now, for a confirm: the form is never trusted for the time. */
export async function fetchEvent(eventId: string): Promise<CalEvent | null> {
  const res = await calendarFetch(`/events/${encodeURIComponent(eventId)}`);
  return res.ok ? ((await res.json()) as CalEvent) : null;
}

/** Dismiss: a private flag on the event, so the list stops showing it. Nothing else about the event changes. */
export async function dismissEvent(eventId: string): Promise<string | null> {
  const res = await calendarFetch(`/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify({ extendedProperties: { private: { dismissed: "1" } } }),
  });
  return res.ok ? null : `Calendar update failed (${res.status}): ${await errorText(res)}`;
}
