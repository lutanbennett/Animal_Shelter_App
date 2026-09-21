import type { createClient } from "@/lib/supabase/server";
import type { FrequencySchedule } from "@/lib/prescriptions/frequency";

export type MedicationOption = { id: string; name: string; dose_unit: string };
export type FrequencyOption = FrequencySchedule & { id: string; label: string };
export type VetAppointmentOption = {
  id: string;
  appointment_date: string;
  reason: string | null;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The three pick-lists the prescription form offers, for the add and edit
 * pages alike: every medication and frequency, and the resident's own vet
 * visits (newest first) to link the prescription to.
 */
export async function loadPrescriptionOptions(supabase: Supabase, residentId: string) {
  const [medications, frequencies, vetAppointments] = await Promise.all([
    supabase
      .from("medication")
      .select("id, name, dose_unit")
      .order("name")
      .returns<MedicationOption[]>(),
    supabase
      .from("frequency")
      .select("id, label, doses_per_day, interval_count, interval_unit")
      .order("label")
      .returns<FrequencyOption[]>(),
    supabase
      .from("vet_appointments")
      .select("id, appointment_date, reason")
      .eq("resident_id", residentId)
      .order("appointment_date", { ascending: false })
      .returns<VetAppointmentOption[]>(),
  ]);
  return { medications, frequencies, vetAppointments };
}
