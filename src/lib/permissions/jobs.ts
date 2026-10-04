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
import type { ActivityKey, Level } from "./catalogue";

export type JobKey = "administer_medication" | "do_maintenance";

export type Job = {
  key: JobKey;
  /** The person's own words, from the dictionary. */
  label: (t: Dictionary) => string;
  /** The activities the job expands to, at the level it needs. Not a promise of a page. */
  bundle: readonly { activity: ActivityKey; level: Level }[];
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
  // The whiteboard's Maintenance column: one tile, "Maint tasks" (§8, §12 R3). Her job is Edit, not
  // Read: she creates, assigns, moves on and completes jobs. Setting up a recurring task stays
  // Management's (P2), so recurring.manage is not here; recurring.do_own is "mark your own done" (/my).
  do_maintenance: {
    key: "do_maintenance",
    label: (t) => t.appHome.jobs.doMaintenance,
    bundle: [
      { activity: "maintenance.jobs", level: "edit" },
      { activity: "maintenance.progress", level: "edit" },
      { activity: "recurring.do_own", level: "edit" },
      { activity: "resident.record", level: "read" }, // who and where, nothing more (0134)
      { activity: "facility.enclosures", level: "read" }, // the board names and picks them
    ],
    opens: "/maintenance",
  },
};

/**
 * Which jobs a configured role is given, by the role's key. The role's `role_permissions` rows
 * are the union of these bundles. A role not listed here has no jobs and its home is derived
 * from its cells, as every role's was before.
 */
export const JOBS_OF_ROLE: Readonly<Record<string, readonly JobKey[]>> = {
  head_of_medical: ["administer_medication"],
  head_of_maintenance: ["do_maintenance"],
};

export function jobsOfRole(roleKey: string): readonly Job[] {
  return (JOBS_OF_ROLE[roleKey] ?? []).map((k) => JOBS[k]);
}

/** The union of a role's jobs: each activity once, at the highest level any job asks. */
export function bundleOfRole(roleKey: string): Map<ActivityKey, Level> {
  const union = new Map<ActivityKey, Level>();
  for (const job of jobsOfRole(roleKey)) {
    for (const { activity, level } of job.bundle) {
      if (union.get(activity) !== "edit") union.set(activity, level);
    }
  }
  return union;
}
