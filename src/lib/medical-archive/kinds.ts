/**
 * Archive for the four medical record types (0124, backlog DB-6): weight,
 * prescriptions, vet visits and immunization records. One flavour of
 * archive, the same as contacts' (0075): Archive with an optional reason,
 * Restore, and a Show archived toggle.
 *
 * Plain data with no imports so client components can use it.
 */
export const MEDICAL_ARCHIVE_KINDS = ["weight", "prescription", "visit", "immunization"] as const;
export type MedicalArchiveKind = (typeof MEDICAL_ARCHIVE_KINDS)[number];

export function isMedicalArchiveKind(value: unknown): value is MedicalArchiveKind {
  return (MEDICAL_ARCHIVE_KINDS as readonly string[]).includes(value as string);
}

export const MEDICAL_ARCHIVE_TABLES = {
  weight: "weight",
  prescription: "prescriptions",
  visit: "clinic_visits",
  immunization: "immunization_records",
} as const satisfies Record<MedicalArchiveKind, string>;

/** The pages that list each kind, for revalidation. */
export const MEDICAL_ARCHIVE_SECTIONS = {
  weight: ["weight"],
  prescription: ["prescriptions"],
  visit: ["vet-appointments", "weight", "prescriptions"],
  immunization: ["immunizations"],
} as const satisfies Record<MedicalArchiveKind, readonly string[]>;

/**
 * Who is offered Archive is `can(perms, "medical.archive")`
 * (docs/decisions/2026-10-02-medical-archive-roles.md): by default admin,
 * management and staff, on all four kinds; never a vet, never a volunteer.
 * The predicate that said so, canArchiveMedical, is gone; its truth table is
 * in scripts/fixtures/legacy-predicates.json.
 *
 * Archive is an UPDATE, so the ceiling is what RLS lets each role update,
 * and a vet could (their own clinic's visits and the prescriptions on them,
 * 0110). They are not offered it because the archive is one-way for them:
 * 0124 drops an archived visit from current_clinic_resident_ids(), so the vet
 * who archives a resident's only visit loses sight of the resident and
 * cannot restore it (found by scripts/check-medical-archive-roles.mjs).
 * A volunteer cannot update any of the four.
 */
