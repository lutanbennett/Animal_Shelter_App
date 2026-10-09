import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Vet id → the doctor names offered for that clinic. */
export type DoctorNamesByClinic = Record<string, string[]>;

/**
 * The suggestions behind the vet-visit forms' Doctor field: each clinic's
 * active doctors from its list (doctor_clinics, 0125: a doctor appears
 * under every clinic they work at), loaded once with the
 * page so switching the vet select costs no round trip. The list fills
 * itself from the names typed on visits and is corrected under
 * Management → Vets → Doctors, so a merged typo stops being offered and a
 * doctor marked as left drops out. Typing a name that is not offered still
 * works: the database adds it to the clinic's list.
 */
export async function loadDoctorNamesByClinic(supabase: Supabase): Promise<DoctorNamesByClinic> {
  const { data } = await supabase
    .from("doctor_clinics")
    .select("clinic_id, doctors!inner(name)")
    .eq("active", true)
    .returns<{ clinic_id: string; doctors: { name: string } }[]>();

  const byVet = new Map<string, string[]>();
  for (const row of data ?? []) {
    byVet.set(row.clinic_id, [...(byVet.get(row.clinic_id) ?? []), row.doctors.name]);
  }
  // Suggestions are a convenience: a failed load leaves the field plain
  // free text rather than breaking the form.
  return Object.fromEntries(
    [...byVet].map(([clinicId, names]) => [clinicId, names.sort((a, b) => a.localeCompare(b))]),
  );
}

// Titles people put in front of a vet's name, compared after punctuation
// is gone: "Dr.", "น.สพ." (male vet) and "สพ.ญ." (female vet) arrive here
// as "dr", "นสพ" and "สพญ". Thai titles are often written without a space.
const LATIN_TITLES = new Set(["dr", "doctor", "doc", "vet", "khun"]);
const THAI_TITLES = ["นสพ", "สพญ", "หมอ", "คุณ"];

/**
 * A name reduced to the part that identifies the person, for spotting two
 * spellings of one doctor: "Dr. Somchai", "somchai" and "หมอ Somchai" all
 * give "somchai". Only a hint for the roster page. The database's own
 * matching (vet_doctor_key) deliberately ignores just case and spacing, and
 * a merge is always someone's decision.
 */
export function doctorNameCore(name: string): string {
  let words = name
    .toLowerCase()
    // "น.สพ." is one abbreviation: its dots join Thai letters rather than
    // separating words, as they do in "Dr.Somchai".
    .replace(/(?<=[฀-๿])\.(?=[฀-๿])/g, "")
    .replace(/[.,'"()\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 1 && LATIN_TITLES.has(words[0])) words = words.slice(1);
  if (words.length > 0) {
    for (const title of THAI_TITLES) {
      if (words[0] === title && words.length > 1) {
        words = words.slice(1);
        break;
      }
      if (words[0].startsWith(title) && words[0].length > title.length) {
        words = [words[0].slice(title.length), ...words.slice(1)];
        break;
      }
    }
  }
  return words.join(" ");
}

/**
 * For each doctor, the other doctors on the same list whose name has the
 * same core — the likely duplicates the roster page suggests merging.
 */
export function likelyDuplicates<T extends { id: string; name: string }>(
  doctors: T[],
): Map<string, T[]> {
  const byCore = new Map<string, T[]>();
  for (const doctor of doctors) {
    const core = doctorNameCore(doctor.name);
    if (!core) continue;
    byCore.set(core, [...(byCore.get(core) ?? []), doctor]);
  }
  const result = new Map<string, T[]>();
  for (const group of byCore.values()) {
    if (group.length < 2) continue;
    for (const doctor of group) {
      result.set(
        doctor.id,
        group.filter((other) => other.id !== doctor.id),
      );
    }
  }
  return result;
}
