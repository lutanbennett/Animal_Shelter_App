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
  "borrowedFloor",
  "maintenanceDelete",
  "stockCorrect",
  "includedByAny",
  "notAskedYet",
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
        "medical.archive",
        "photos.resident_add",
        "facility.enclosures",
        "clinics.list",
        "clinics.doctors",
        "friends.view",
        "stock.medications",
        "stock.diets",
        "reference.types",
        "reference.add_while_recording",
      ],
    },
    shown: true,
    stays: true,
    closedBy: null,
    measured: true,
  },
  {
    // §5 "how much of a resident": these roles read resident_who_and_where (0134), not residents. For the
    // volunteer that is the design; for the three configured roles it is what Lutan asked (§7) but it is
    // reached through the volunteer floor (sees_all_residents() asks legacy_role <> 'volunteer'), while
    // their own roles.scope_residents says 'all'. Either way the box's Read is narrower than it looks.
    id: "whoAndWhere",
    boxes: {
      volunteer: ["resident.record"],
      head_of_maintenance: ["resident.record"],
      head_of_medical: ["resident.record"],
      second_in_command: ["resident.record"],
    },
    shown: true,
    stays: true,
    closedBy: null,
    measured: true,
  },
  {
    // §5 "how much of a contact": 0155 set the 2IC to name_phone, so /contacts reads volunteer_contacts (id,
    // name, phone) for her, and the contacts table itself refuses her (sees_all_contacts() also asks the
    // floor). The box says Yes and she does browse the book, but sees name and phone only. Meant to stay:
    // it is her scope.
    id: "nameAndPhone",
    boxes: { second_in_command: ["contacts.browse"] },
    shown: true,
    stays: true,
    closedBy: null,
    measured: true,
  },
  {
    // Every configured role borrows legacy_role 'volunteer' (0143 chose the narrowest floor), and
    // sees_all_residents() / sees_all_contacts() (0144, 0147) still refuse anything on that floor. So the
    // Director's draft gave the 2IC and both Heads boxes the database refuses: the 2IC's resident, news,
    // placement, change-a-contact and add-a-contact boxes, and both Heads' "move a resident".
    // NOT in the sequence: perm-functions-schema converts the 11 role-named functions, and these two are
    // not among them. Needs its own schema stream before who-does-what-edit can say every box works.
    id: "borrowedFloor",
    boxes: {
      second_in_command: [
        "resident.record",
        "resident.adoption_news",
        "placement.move",
        "placement.hospital",
        "placement.rehome",
        "placement.death",
        "contacts.directory",
        "contacts.add",
      ],
      head_of_maintenance: ["placement.move"],
      head_of_medical: ["placement.move"],
    },
    shown: true,
    stays: false,
    closedBy: null,
    measured: true,
  },
  {
    // 0149: deleting a maintenance job has no activity of its own, so maintenance_delete_perm asks
    // maintenance.jobs AND has_shelter_floor(), which refuses the volunteer floor. Deliberate in 0141
    // ("removing one for good stays Admin's, management's and staff's"), but the box says Edit, and
    // §4 says Edit includes delete. Closes when delete gets its own activity (role-gaps-sweep).
    id: "maintenanceDelete",
    boxes: { head_of_maintenance: ["maintenance.jobs"], second_in_command: ["maintenance.jobs"] },
    shown: true,
    stays: false,
    closedBy: null,
    measured: true,
  },
  {
    // Since 0178 record_stock_correction() asks stock.correct AND the list's own box (stock.medications or
    // stock.diets, Edit), as the paper's manage-medications / manage-diets do, so Management's box now bites
    // (taken out by perm-functions-schema). The 2IC holds stock.correct but neither list box, so her Yes is
    // still refused. That is a §4 rule 5 prerequisite (stock.correct needs a list box), which
    // who-does-what-edit states so the grid can refuse the combination instead of showing it.
    id: "stockCorrect",
    boxes: { second_in_command: ["stock.correct"] },
    shown: true,
    stays: false,
    closedBy: "who-does-what-edit",
    measured: true,
  },
  {
    // Was "namedInDatabase": functions that let a role in by name. perm-functions-schema (0178) made them ask
    // the boxes, and four of its five boxes were then obeyed and taken out. What is left is not a name:
    // record_recurring_job() lets recurring.do_any record any date, your own included, so Management's
    // "your own" box cannot be taken away while "anyone's" stays Yes. That is a §4 rule 5 prerequisite
    // (do_any needs do_own), which who-does-what-edit states so the grid cannot show the combination.
    id: "includedByAny",
    boxes: {
      management: ["recurring.do_own"],
    },
    shown: true,
    stays: false,
    closedBy: "who-does-what-edit",
    measured: true,
  },
  {
    // Three splits of §4 that nothing reads yet: booking a visit is written under medical.visits,
    // moving a job on under maintenance.jobs (the board's only gate), and is_public under
    // projects.folders (0149: "projects.publish is NOT consulted by the write policy"). Each box is right
    // today only because the same roles hold both. who-does-what-edit has to wire them before an
    // Admin can usefully change them.
    id: "notAskedYet",
    boxes: {
      management: ["visit.book", "maintenance.progress", "projects.publish"],
      head_of_maintenance: ["maintenance.progress"],
      second_in_command: ["maintenance.progress"],
    },
    shown: true,
    stays: false,
    closedBy: "who-does-what-edit",
    measured: true,
  },
  {
    // The screens ask these boxes; the database is looser because another box the role holds opens the
    // same table: archiving a weight or a prescription is an update its own Edit allows (medical.archive
    // is the app's question only), stock_receipts reads on any of the three stock boxes, contacts read on
    // browse OR directory (0170), friends on view OR manage (0155), clinics, doctors and the setup lists
    // on clinics.list / stock.medications. Not shown: nobody using the app can tell. Kept so the check
    // accounts for every box, and so who-does-what-edit knows which policies to narrow.
    id: "databaseWider",
    boxes: {
      management: [
        "medical.archive",
        "clinics.list",
        "clinics.doctors",
        "contacts.browse",
        "friends.view",
        "stock.delivery",
        "reference.add_while_recording",
      ],
      second_in_command: ["medical.archive", "stock.delivery"],
      head_of_medical: ["medical.archive"],
    },
    shown: false,
    stays: false,
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
