import type { createClient } from "@/lib/supabase/server";
import type { FrequencySchedule } from "@/lib/prescriptions/frequency";
import { loadLinkableVisits, type LinkableVisit } from "@/lib/clinics/linkable";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";

export type MedicationOption = { id: string; name: string; dose_unit: string };
export type FrequencyOption = FrequencySchedule & { id: string; label: string };
export type ClinicVisitOption = LinkableVisit;

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The three pick-lists the prescription form offers, for the add and edit
 * pages alike: every medication and frequency, and the resident's own clinic
 * visits (newest first) to link the prescription to — only those on or
 * before today, since a prescription on a visit that hasn't happened is a
 * mistake or a plan (0107 refuses it). `keepVisitId` is the visit an edited
 * prescription is already linked to, listed whatever its date so the form
 * doesn't silently drop the link.
 */
export async function loadPrescriptionOptions(
  supabase: Supabase,
  residentId: string,
  /** Medicine and frequency names come back in this language where they have one (0166). */
  locale: Locale,
  keepVisitId: string | null = null,
) {
  const [medications, frequencies, linkable] = await Promise.all([
    supabase
      .from("picker_medications")
      .select("id, name, name_th, dose_unit")
      .order("name")
      .returns<(MedicationOption & { name_th: string | null })[]>(),
    supabase
      .from("frequency")
      .select("id, label, label_th, doses_per_day, interval_count, interval_unit")
      .order("label")
      .returns<(FrequencyOption & { label_th: string | null })[]>(),
    loadLinkableVisits(supabase, residentId, { notInFuture: true, keep: keepVisitId }),
  ]);
  // Same { data, error } shape as the other two, for the pages' error list.
  const clinicVisits = {
    data: linkable.visits,
    error: linkable.error ? { message: linkable.error } : null,
  };
  return {
    medications: {
      ...medications,
      data: medications.data?.map(({ name_th, ...m }) => ({ ...m, name: localLabel(locale, m.name, name_th) })) ?? null,
    },
    frequencies: {
      ...frequencies,
      data:
        frequencies.data?.map(({ label_th, ...f }) => ({ ...f, label: localLabel(locale, f.label, label_th) })) ?? null,
    },
    clinicVisits,
  };
}
