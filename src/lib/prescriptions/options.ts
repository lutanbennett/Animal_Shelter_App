import type { createClient } from "@/lib/supabase/server";
import type { FrequencySchedule } from "@/lib/prescriptions/frequency";
import { loadLinkableVisits, type LinkableVisit } from "@/lib/vets/linkable";

export type MedicationOption = { id: string; name: string; dose_unit: string };
export type FrequencyOption = FrequencySchedule & { id: string; label: string };
export type VetAppointmentOption = LinkableVisit;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The three pick-lists the prescription form offers, for the add and edit
 * pages alike: every medication and frequency, and the resident's own vet
 * visits (newest first) to link the prescription to — only those on or
 * before today, since a prescription on a visit that hasn't happened is a
 * mistake or a plan (0107 refuses it). `keepVisitId` is the visit an edited
 * prescription is already linked to, listed whatever its date so the form
 * doesn't silently drop the link.
 */
export async function loadPrescriptionOptions(
  supabase: Supabase,
  residentId: string,
  keepVisitId: string | null = null,
) {
  const [medications, frequencies, linkable] = await Promise.all([
    supabase
      .from("picker_medications")
      .select("id, name, dose_unit")
      .order("name")
      .returns<MedicationOption[]>(),
    supabase
      .from("frequency")
      .select("id, label, doses_per_day, interval_count, interval_unit")
      .order("label")
      .returns<FrequencyOption[]>(),
    loadLinkableVisits(supabase, residentId, { notInFuture: true, keep: keepVisitId }),
  ]);
  // Same { data, error } shape as the other two, for the pages' error list.
  const vetAppointments = {
    data: linkable.visits,
    error: linkable.error ? { message: linkable.error } : null,
  };
  return { medications, frequencies, vetAppointments };
}
