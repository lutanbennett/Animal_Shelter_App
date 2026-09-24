import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Vet id → the doctor names already recorded against that vet's visits. */
export type DoctorNamesByVet = Record<string, string[]>;

/**
 * The suggestions behind the vet-visit forms' Doctor field: every distinct
 * `doctor_name` per vet, loaded once with the page so switching the vet
 * select costs no round trip. Spellings are kept exactly as typed — the
 * column is free text on purpose (docs/decisions.md, 2026-09-24), so
 * "Dr Somchai" and "Somchai" are two suggestions, and picking one is how a
 * name stops being typed three ways.
 */
export async function loadDoctorNamesByVet(supabase: Supabase): Promise<DoctorNamesByVet> {
  const { data } = await supabase
    .from("vet_appointments")
    .select("vet_id, doctor_name")
    .not("doctor_name", "is", null)
    .not("vet_id", "is", null)
    .returns<{ vet_id: string; doctor_name: string }[]>();

  const sets = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const names = sets.get(row.vet_id) ?? new Set<string>();
    names.add(row.doctor_name);
    sets.set(row.vet_id, names);
  }
  // Suggestions are a convenience: a failed load leaves the field plain
  // free text rather than breaking the form.
  return Object.fromEntries(
    [...sets].map(([vetId, names]) => [vetId, [...names].sort((a, b) => a.localeCompare(b))]),
  );
}
