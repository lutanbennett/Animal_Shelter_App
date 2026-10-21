import { createClient } from "@/lib/supabase/server";

export type CalendarChange = {
  id: string;
  appointment_date: string;
  calendar_changed_at: string;
  calendar_change_kind: string;
  residents: { name: string } | null;
  clinics: { name: string } | null;
};

/** Visits the calendar poll moved or cancelled in the last 7 days, newest first (0236). */
export async function loadCalendarChanges(): Promise<CalendarChange[] | null> {
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const { data, error } = await (await createClient())
    .from("clinic_visits")
    .select("id, appointment_date, calendar_changed_at, calendar_change_kind, residents(name), clinics(name)")
    .gt("calendar_changed_at", since)
    .order("calendar_changed_at", { ascending: false })
    .limit(50)
    .returns<CalendarChange[]>();
  return error ? null : (data ?? []);
}
