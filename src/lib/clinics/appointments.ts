import type { SupabaseClient } from "@supabase/supabase-js";
import { addDaysIso, todayIso } from "@/lib/format";
import { visitDate } from "./linkable";

export type ClinicAppointment = {
  id: string;
  resident_id: string;
  appointment_date: string;
  status: string;
  reason: string | null;
  doctor_name: string | null;
  residents: { name: string; thai_name: string | null } | null;
};

/** How far back "recently done" reaches, in days. */
export const RECENTLY_DONE_DAYS = 30;

export type ClinicAppointments = {
  /** Still `scheduled` and dated before today: visited, not yet written up. */
  toWriteUp: ClinicAppointment[];
  /** `scheduled`, today or later, soonest first. */
  upcoming: ClinicAppointment[];
  /** `completed` in the last RECENTLY_DONE_DAYS, newest first. */
  recentlyDone: ClinicAppointment[];
  error: string | null;
};

/**
 * The visits booked with the vet's clinics, for their /appointments page.
 * `clinicIds` are the clinics of their login (loadClinicScope): the page shows the clinics'
 * appointments, not just the signed-in doctor's (Lutan, 2026-09-29). Which
 * residents a vet may see is RLS (0108) and is not re-decided here.
 *
 * Cancelled visits are left out: there is nothing to write up. A completed
 * visit stays reachable for RECENTLY_DONE_DAYS, because marking a visit done
 * does not close it — records can still be added, and they link to it.
 */
export async function loadClinicAppointments(
  supabase: SupabaseClient,
  clinicIds: string[],
): Promise<ClinicAppointments> {
  const today = todayIso();
  const since = addDaysIso(today, -RECENTLY_DONE_DAYS);

  const { data, error } = await supabase
    .from("clinic_visits")
    .select(
      "id, resident_id, appointment_date, status, reason, doctor_name, residents(name, thai_name)",
    )
    .is("archived_at", null)
    .in("clinic_id", clinicIds)
    .in("status", ["scheduled", "completed"])
    .order("appointment_date", { ascending: true })
    .returns<ClinicAppointment[]>();

  const rows = data ?? [];
  const toWriteUp: ClinicAppointment[] = [];
  const upcoming: ClinicAppointment[] = [];
  const recentlyDone: ClinicAppointment[] = [];
  for (const row of rows) {
    const day = visitDate(row);
    if (row.status === "completed") {
      if (day >= since) recentlyDone.push(row);
    } else if (day < today) {
      toWriteUp.push(row);
    } else {
      upcoming.push(row);
    }
  }
  recentlyDone.reverse();

  return { toWriteUp, upcoming, recentlyDone, error: error?.message ?? null };
}
