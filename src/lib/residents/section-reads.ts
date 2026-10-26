import type { LevelKey } from "@/lib/permissions/catalogue";

/**
 * The activity each part of a resident's record is read under. ONE map, used by the section page
 * (to refuse a part the reader cannot read) and by the hub (to draw only the tiles it could open),
 * so the two cannot disagree: a tile shown that will not open, or hidden that would have.
 *
 * Housing, photos and adoption updates are the resident's own record (resident.record, which opening the
 * hub already requires); each medical part has its own cell. Sponsorship drives and memes are gated by
 * their own activities where they are read, and are not parts of the record.
 */
export const SECTION_READS = {
  housing: "resident.record",
  photos: "resident.record",
  "adoption-updates": "resident.record",
  immunizations: "medical.immunizations",
  "clinic-visits": "medical.visits",
  prescriptions: "medical.prescriptions",
  diet: "medical.diet",
  weight: "medical.weight",
  procedures: "medical.procedures",
  "blood-tests": "medical.blood_tests",
} as const satisfies Record<string, LevelKey>;

export type HubSectionKey = keyof typeof SECTION_READS;

/** The medical parts, in the order the hub draws them. */
export const MEDICAL_SECTIONS = [
  "immunizations",
  "clinic-visits",
  "prescriptions",
  "diet",
  "weight",
  "procedures",
  "blood-tests",
] as const satisfies readonly HubSectionKey[];

/** The activity a section is read under, or undefined for a name that is not a section. */
export function sectionRead(section: string): LevelKey | undefined {
  return (SECTION_READS as Record<string, LevelKey>)[section];
}
