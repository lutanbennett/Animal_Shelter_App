import type { createClient } from "@/lib/supabase/server";
import { loadLinkableVisits, type LinkableVisit } from "@/lib/clinics/linkable";
import type { Locale } from "@/lib/i18n/locales";
import { localLabel } from "@/lib/translations/labels";

export type MedicationOption = { id: string; name: string; dose_unit: string };
export type ClinicVisitOption = LinkableVisit;
/** One of the medication rounds (0137), in the order the form shows them. */
export type RoundOption = { id: string; key: string; name: string };

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The pick-lists the prescription form offers, for the add and edit
 * pages alike: every medication, the rounds, and the resident's own clinic
 * visits (newest first) to link the prescription to — only those on or
 * before today, since a prescription on a visit that hasn't happened is a
 * mistake or a plan (0107 refuses it). `keepVisitId` is the visit an edited
 * prescription is already linked to, listed whatever its date so the form
 * doesn't silently drop the link.
 */
export async function loadPrescriptionOptions(
  supabase: Supabase,
  residentId: string,
  /** Medicine and round names come back in this language where they have one (0166). */
  locale: Locale,
  keepVisitId: string | null = null,
) {
  const [medications, linkable, roundRows] = await Promise.all([
    supabase
      .from("picker_medications")
      .select("id, name, name_th, dose_unit")
      .order("name")
      .returns<(MedicationOption & { name_th: string | null })[]>(),
    loadLinkableVisits(supabase, residentId, { notInFuture: true, keep: keepVisitId }),
    supabase
      .from("rounds")
      .select("id, key, name, name_th")
      .eq("for_medication", true)
      .order("sort_order")
      .returns<{ id: string; key: string; name: string; name_th: string }[]>(),
  ]);
  const rounds: RoundOption[] = (roundRows.data ?? []).map((r) => ({
    id: r.id,
    key: r.key,
    name: localLabel(locale, r.name, r.name_th),
  }));
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
    clinicVisits,
    rounds,
    roundsError: roundRows.error?.message ?? null,
  };
}
