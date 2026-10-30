/**
 * FIXED_FOR_NOW: the boxes on Settings → Who does what that the system does not yet obey, and why.
 * docs/decisions/2026-10-11-who-does-what-view.md has the whole story.
 *
 * The grid is a demo surface. Lutan stands in front of someone and says "the 2IC can move a resident";
 * if the database then refuses, the grid was worse than no grid. So every box is either true today or
 * marked here, with the reason in both dictionaries (admin.whoDoesWhat.fixed[id]).
 *
 * THIS LIST IS MEASURED, NOT WRITTEN FROM THE CATALOGUE. `node scripts/check-who-does-what.mjs` runs
 * every database probe under each live role twice, with its box as it is and with that box flipped,
 * and fails when a box is wrong today or cannot be taken away and no `measured` entry covers it, and
 * when an entry covers only boxes that are obeyed now (STALE). So the streams that shorten this list
 * (perm-functions-schema, perm-role-lists, who-does-what-edit) delete entries when the script says so,
 * not when they believe they have fixed something. Measured on dev 2026-10-11, at main 56ec669 (0177);
 * perm-functions-schema (0178) then took out the five boxes it closed, as this script reported after the apply.
 *
 * Pure and client-safe: no i18n, no database. The script imports it.
 */
import type { ActivityKey } from "./catalogue";

export const FIXED_IDS = [
  "clinicRule",
  "whoAndWhere",
  "nameAndPhone",
  "databaseWider",
] as const;
export type FixedId = (typeof FIXED_IDS)[number];

export type FixedEntry = {
  id: FixedId;
  /** Role key → the activities whose box for that role this is about. Precise: a box not listed is obeyed. */
  boxes: Readonly<Record<string, readonly ActivityKey[]>>;
  /**
   * True: marked on the grid, because someone using the app would notice. False: the screens follow the
   * box and only the database is looser (a hand-built request could get past a screen); kept here so the
   * script accounts for it, and listed under the grid for the record, not marked in it.
   */
  shown: boolean;
  /** True for a rule meant to stay (docs/roles-and-permissions.md §5, §6); false for a gap a stream closes. */
  stays: boolean;
  /** The stream expected to remove it, or null when nothing in the plan does yet. */
  closedBy: string | null;
  /** True: check-who-does-what.mjs measures it. False: read by hand, and the comment says how. */
  measured: boolean;
};

export const FIXED_FOR_NOW: readonly FixedEntry[] = [
  {
    // perm-convert-vet (0167): a doctor's policies ask is_clinic_login(), not cells, by Lutan's decision
    // ("nothing changes for a vet", 2026-10-07). The doctor's cells are the Director's draft (microchip,
    // read the record), so every medical box reads None while the doctor really records visits,
    // procedures, prescriptions, weights and diets for their own clinic's residents. Meant to stay: the
    // parent item says the list ends as "the §6 rules and the doctor's clinic scope".
    id: "clinicRule",
    boxes: {
      doctor: [
        "resident.record",
        "resident.adoption_news",
        "visit.book",
        "medical.visits",
        "medical.procedures",
        "medical.blood_tests",
        "medical.prescriptions",
        "medical.immunizations",
        "medical.weight",
        "medical.diet",
        "photos.resident_add",
        "facility.enclosures",
        "clinics.list",
        "clinics.doctors",
        "friends.view",
        "stock.medications",
        "stock.diets",
        "reference.types",
      ],
    },
    shown: true,
    stays: true,
    closedBy: null,
    measured: true,
  },
  {
    // SHARED ON PURPOSE (Lutan, 2026-10-19: keep the shared read). check-who-does-what.mjs proves each box
    // by the probe's `sharedWith` and reports SHARED, not "cannot be taken away". Older note, same boxes:
    // The screens ask these boxes; the database is looser because another box the role holds opens the same
    // thing. photos.resident_add is proved shared with photos.shelter_add (2026-10-30). perm-policy-cleanup (0182) narrowed contacts, friends, clinics and doctors, and split visit.book,
    // maintenance.progress and projects.publish out, and 0187 put a trigger on the four medical tables so
    // archiving needs medical.archive. What is left is not a policy that can be narrowed:
    // stock_receipts is read by the purchasing job by design (0143, check-2ic-role.mjs); and a medication
    // can be added through stock.medications Edit as well as add_while_recording. Not shown: nobody using
    // the app can tell. See docs/decisions/2026-10-11-perm-policy-cleanup.md.
    id: "databaseWider",
    boxes: {
      head_of_medical: ["photos.resident_add"],
      management: ["photos.resident_add"],
      second_in_command: ["stock.delivery", "photos.resident_add"],
    },
    shown: false,
    stays: true,
    closedBy: null,
    measured: true,
  },
];

/** "role|activity" for every box an entry covers, among the roles given. The check's join key. */
export function boxesOf(entry: FixedEntry, roles: readonly string[]): string[] {
  return Object.entries(entry.boxes)
    .filter(([role]) => roles.includes(role))
    .flatMap(([role, acts]) => acts.map((a) => `${role}|${a}`));
}

/** The entries that mark this role's box for this activity, in list order. */
export function fixedFor(role: string, activity: string): FixedEntry[] {
  return FIXED_FOR_NOW.filter((e) => (e.boxes[role] as readonly string[] | undefined)?.includes(activity));
}
