import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysIso, SHELTER_TIME_ZONE, todayIso } from "@/lib/format";
import { visitDate } from "./linkable";

/** One visit as the shelter-wide /vet-visits page lists it. */
export type ShelterVisit = {
  id: string;
  resident_id: string;
  clinic_id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
  doctor_name: string | null;
  residents: { name: string; thai_name: string | null; profile_photo_drive_file_id: string | null } | null;
  clinics: { name: string; name_th: string | null } | null;
};

/** How far back finished and cancelled visits are loaded, in days. Scheduled ones are never cut off. */
export const SHELTER_VISITS_LOOKBACK_DAYS = 30;

/**
 * Every visit at every clinic, for the Director's page. The same table and the same
 * archived filter as loadClinicAppointments, without the clinic filter: what a login may
 * see is RLS's decision (medical.visits, shelter-wide scope), not re-decided here.
 *
 * A still-Scheduled visit is loaded however old it is: overdue is how the app shows a
 * visit nobody closed, and a page that dropped the oldest would hide exactly those.
 * Completed and Cancelled only matter for a month back.
 */
export async function loadShelterVisits(
  supabase: SupabaseClient,
): Promise<{ visits: ShelterVisit[]; error: string | null }> {
  const since = addDaysIso(todayIso(), -SHELTER_VISITS_LOOKBACK_DAYS);
  const { data, error } = await supabase
    .from("clinic_visits")
    .select(
      "id, resident_id, clinic_id, appointment_date, status, reason, doctor_name, residents(name, thai_name, profile_photo_drive_file_id), clinics(name, name_th)",
    )
    .is("archived_at", null)
    .or(`status.eq.scheduled,appointment_date.gte.${since}T00:00:00+07:00`)
    .order("appointment_date", { ascending: true })
    .limit(2000)
    .returns<ShelterVisit[]>();
  return { visits: data ?? [], error: error?.message ?? null };
}

/** The kinds of day group, in the order the list shows them. */
export type GroupKind = "overdue" | "today" | "tomorrow" | "later" | "past";

export type DayGroup<T> = { key: string; kind: GroupKind; day: string | null; visits: T[] };

/** A visit still Scheduled on a day before today at the shelter: how the app shows overdue. */
export function isOverdue(v: { status: string; appointment_date: string }, today: string): boolean {
  return v.status === "scheduled" && visitDate(v) < today;
}

/**
 * Groups visits for the list: overdue Scheduled first, then one group per day from today.
 * Finished or cancelled visits of earlier days (shown only when those are switched on) follow
 * as "past" days, newest first. Visits inside a day are in time order.
 */
export function groupVisits<T extends { status: string; appointment_date: string }>(
  visits: T[],
  today: string,
): DayGroup<T>[] {
  const tomorrow = addDaysIso(today, 1);
  const sorted = [...visits].sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
  const overdue = sorted.filter((v) => isOverdue(v, today));
  const rest = sorted.filter((v) => !isOverdue(v, today));
  const byDay = new Map<string, T[]>();
  for (const v of rest) {
    const day = visitDate(v);
    byDay.set(day, [...(byDay.get(day) ?? []), v]);
  }
  const days = [...byDay.keys()].sort();
  const groups: DayGroup<T>[] = [];
  if (overdue.length > 0) groups.push({ key: "overdue", kind: "overdue", day: null, visits: overdue });
  for (const day of days.filter((d) => d >= today)) {
    const kind = day === today ? "today" : day === tomorrow ? "tomorrow" : "later";
    groups.push({ key: day, kind, day, visits: byDay.get(day)! });
  }
  for (const day of days.filter((d) => d < today).reverse()) {
    groups.push({ key: day, kind: "past", day, visits: byDay.get(day)! });
  }
  return groups;
}

const SHELTER_TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  timeZone: SHELTER_TIME_ZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

/** "14:05" on the shelter's clock, whatever zone the server runs in. */
export function shelterTime(value: string): string {
  return SHELTER_TIME_FORMAT.format(new Date(value));
}
