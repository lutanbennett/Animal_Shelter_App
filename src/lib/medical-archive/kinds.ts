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
  visit: "vet_appointments",
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
 * Who is offered Archive (docs/decisions/2026-10-02-medical-archive-roles.md).
 * Archive is an UPDATE, so this follows what RLS lets each role update:
 *
 *  - admin, management, staff: all four kinds.
 *  - a vet: only what 0110 scopes to their own clinic — their clinic's visits
 *    and prescriptions on those visits. Never weight or immunizations (0001
 *    lets a vet write those on any resident they can see, which is wider
 *    than a vet should reach for a record the shelter keeps).
 *  - a volunteer: nothing; they cannot update any of the four.
 *
 * `clinicVetId` is the clinic that owns the visit (the visit's own vet_id; a
 * prescription's visit's vet_id), or null when there is none.
 */
export function canArchiveMedical(
  kind: MedicalArchiveKind,
  role: string | null | undefined,
  ownClinicVetId: string | null,
  clinicVetId: string | null,
): boolean {
  if (role === "admin" || role === "management" || role === "staff") return true;
  if (role === "vet") {
    return (
      (kind === "visit" || kind === "prescription") &&
      ownClinicVetId !== null &&
      clinicVetId === ownClinicVetId
    );
  }
  return false;
}
