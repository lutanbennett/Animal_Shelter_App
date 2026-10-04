/**
 * Jobs: a day's work in the Director's own words, written as a bundle of activities.
 * This file is the first worked example (docs/decisions/2026-10-04-medical-role.md); three more
 * follow (Do Maintenance, Do the Purchasing, Do Stocktaking) and the layer is formalised from them,
 * so it stays a named bundle and nothing more: no table, no framework.
 *
 * The rules (Lutan, 2026-10-04; backlog branch f2cb2b43):
 *  - A job sits ABOVE activities and replaces none. Enforcement stays activity-level
 *    (has_permission('medical.prescriptions', 'read'), can()), so the Edit / Read distinction
 *    survives inside a job. A job is never asked at a gate.
 *  - A role is given jobs, a job expands to activities, and a role's rights are the union. Jobs
 *    may overlap, so the union is not a partition.
 *  - What a role is given is expressed in the database the old way: `role_permissions` rows. The
 *    migration writes the expansion; check-medical-role.mjs fails if the rows and this file ever
 *    disagree, so neither can drift without a red.
 *
 * Pure and client-safe.
 */
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ActivityKey, Level, LevelKey, YesNoKey } from "./catalogue";

export type JobKey = "administer_medication" | "record_weight" | "add_medical_photos" | "feed_special_diets";

/** A level activity at the level the job needs, or a yes/no activity (no level: the cell is Yes). */
export type BundleEntry = { activity: LevelKey; level: Level } | { activity: YesNoKey; level?: undefined };

export type Job = {
  key: JobKey;
  /** The person's own words, from the dictionary. */
  label: (t: Dictionary) => string;
  /** The activities the job expands to, at the level it needs. Not a promise of a page. */
  bundle: readonly BundleEntry[];
  /** The one page the job's tile opens; it is a route in the registry. */
  opens: string;
};

export const JOBS: Record<JobKey, Job> = {
  // Lutan, 2026-10-03: their only job is to give out medicine, and the system keeps no record of
  // doses, so all this needs is who, where and how much — a list to read.
  administer_medication: {
    key: "administer_medication",
    label: (t) => t.appHome.jobs.administerMedication,
    bundle: [
      { activity: "medical.prescriptions", level: "read" },
      { activity: "resident.record", level: "read" }, // who and where, nothing more (0134)
    ],
    opens: "/management/medication-list",
  },
  // Second job of the Head of Medical. She cannot open a resident's record, so the page is her
  // own (/medical/weight), reading who-and-where and writing the flat `weight` table.
  record_weight: {
    key: "record_weight",
    label: (t) => t.appHome.jobs.recordWeight,
    bundle: [
      { activity: "medical.weight", level: "edit" },
      { activity: "resident.record", level: "read" }, // the picker: who and where (0134)
    ],
    opens: "/medical/weight",
  },
  // Third. The upload is hers because record_attachment() now takes a login that holds the cell
  // (0140); the page and its route read who-and-where and medical_photo_residents, not residents.
  add_medical_photos: {
    key: "add_medical_photos",
    label: (t) => t.appHome.jobs.addMedicalPhotos,
    bundle: [
      { activity: "photos.resident_add" },
      { activity: "resident.record", level: "read" }, // the picker: who and where (0134)
    ],
    opens: "/medical/photos",
  },
  // Fourth. Read only, like the first: a list of the non-standard diets, nothing recorded as fed
  // (Lutan, 2026-10-04: "a non standard diet is anything where that field is FALSE").
  feed_special_diets: {
    key: "feed_special_diets",
    label: (t) => t.appHome.jobs.feedSpecialDiets,
    bundle: [
      { activity: "medical.diet", level: "read" },
      { activity: "resident.record", level: "read" }, // who and where, nothing more (0134)
    ],
    opens: "/medical/diets",
  },
};

/**
 * Which jobs a configured role is given, by the role's key. The role's `role_permissions` rows
 * are the union of these bundles. A role not listed here has no jobs and its home is derived
 * from its cells, as every role's was before.
 */
export const JOBS_OF_ROLE: Readonly<Record<string, readonly JobKey[]>> = {
  head_of_medical: ["administer_medication", "record_weight", "add_medical_photos", "feed_special_diets"],
};

export function jobsOfRole(roleKey: string): readonly Job[] {
  return (JOBS_OF_ROLE[roleKey] ?? []).map((k) => JOBS[k]);
}

/** The union of a role's jobs: each activity once, at the highest level any job asks. */
export function bundleOfRole(roleKey: string): Map<ActivityKey, Level> {
  // A yes/no activity is held at "edit" (cell 2), the way role_permissions stores a Yes.
  const union = new Map<ActivityKey, Level>();
  for (const job of jobsOfRole(roleKey)) {
    for (const { activity, level = "edit" } of job.bundle) {
      if (union.get(activity) !== "edit") union.set(activity, level);
    }
  }
  return union;
}
