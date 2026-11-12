/**
 * The permission catalogue: every activity a role can be given, once.
 * docs/roles-and-permissions.md §4; docs/decisions/2026-10-03-permissions-catalogue.md
 * says how code uses it.
 *
 * Pure and client-safe: no database, no i18n, no server imports. Anything may
 * import it, including scripts (check-permission-catalogue.mjs).
 *
 * THIS FILE AND permission_activities (0132) ARE THE SAME LIST. The check in
 * `npm run lint` fails when they differ in key, kind, area, sort or
 * requires. To add an activity: add a row here AND a migration that inserts it
 * into permission_activities, in one PR. A new activity starts at None for
 * every role but Admin (§6 rule 8), so adding one opens nothing.
 *
 * What lives here is the product's list: key, kind, area, order,
 * prerequisites, probes. The cells (which role gets which level) are not
 * here: they belong to the shelter, live in role_permissions and an Admin
 * edits them. Labels are not here either: a key never changes and a name is
 * translated (§4 rule 6), so people-facing words come from the dictionaries.
 */

/**
 * "level" = Edit / Read / None. "yesno" = Yes / No: an act with nothing to look at (§4 rule 2).
 * "readonly" = Read / None: nothing is ever done at Edit, so the setting is not offered.
 *
 * Lutan, 2026-11-12, ruling on the four activities nothing asked at edit
 * (docs/decisions/2026-11-12-fourteen-activities-ruled.md): he chose to take the unused Edit setting off
 * the list rather than leave it as a placeholder, because a setting that does nothing is a trap -- someone
 * grants it and expects a result. "readonly" is how that removal is said, and it is enforced three ways:
 * the type system refuses can(perms, key, "edit"), the database refuses a card_grants or role_permissions
 * row at level 2 (0360), and the Admin-only check (check-ungranted-activities) stops counting an edit gap
 * that can no longer exist. Admin is unaffected: it sits outside the card system (can.ts).
 */
export type ActivityKind = "level" | "yesno" | "readonly";

/** What a check asks for. Edit includes Read. A yes/no activity is only ever asked at "edit". */
export type Level = "read" | "edit";

/** §11: one concrete statement that exercises an activity at a level. Owned by the parity check. */
export type Probe = { level: Level; sql: string };

/** §4 rule 5: this activity needs that one at least at that level. */
export type Requirement = { activity: string; level: Level };

type ActivityDef = {
  key: string;
  kind: ActivityKind;
  area: string;
  /** Position in the Settings matrix. Unique. */
  sort: number;
  /**
   * Stated nowhere yet: 0132 seeded permission_activities.requires empty and
   * this file must agree with it. Filling it is a row change here plus a
   * migration, done with the Settings matrix that enforces it.
   */
  requires: readonly Requirement[];
  /** Filled by the parity check (permission-parity-check); empty until it is. */
  probes: readonly Probe[];
};

export const ACTIVITIES = [
  { key: "resident.record", kind: "level", area: "residents", sort: 1, requires: [], probes: [] },
  { key: "resident.register", kind: "yesno", area: "residents", sort: 2, requires: [], probes: [] },
  { key: "resident.microchip", kind: "yesno", area: "residents", sort: 3, requires: [], probes: [] },
  { key: "resident.adoption_news", kind: "level", area: "residents", sort: 4, requires: [], probes: [] },
  { key: "placement.move", kind: "yesno", area: "housing", sort: 5, requires: [], probes: [] },
  { key: "placement.hospital", kind: "yesno", area: "housing", sort: 6, requires: [], probes: [] },
  { key: "placement.rehome", kind: "yesno", area: "housing", sort: 7, requires: [], probes: [] },
  { key: "placement.death", kind: "yesno", area: "housing", sort: 8, requires: [], probes: [] },
  { key: "placement.death_withdraw", kind: "yesno", area: "housing", sort: 9, requires: [], probes: [] },
  { key: "visit.book", kind: "yesno", area: "medical", sort: 10, requires: [], probes: [] },
  { key: "medical.visits", kind: "level", area: "medical", sort: 11, requires: [], probes: [] },
  { key: "medical.procedures", kind: "level", area: "medical", sort: 12, requires: [], probes: [] },
  { key: "medical.blood_tests", kind: "level", area: "medical", sort: 13, requires: [], probes: [] },
  { key: "medical.prescriptions", kind: "level", area: "medical", sort: 14, requires: [], probes: [] },
  { key: "medical.immunizations", kind: "level", area: "medical", sort: 15, requires: [], probes: [] },
  { key: "medical.weight", kind: "level", area: "medical", sort: 16, requires: [], probes: [] },
  { key: "medical.diet", kind: "level", area: "medical", sort: 17, requires: [], probes: [] },
  { key: "medical.archive", kind: "yesno", area: "medical", sort: 18, requires: [], probes: [] },
  { key: "photos.resident_add", kind: "yesno", area: "photos", sort: 19, requires: [], probes: [] },
  { key: "photos.resident_manage", kind: "yesno", area: "photos", sort: 20, requires: [], probes: [] },
  { key: "photos.resident_publish", kind: "yesno", area: "photos", sort: 21, requires: [], probes: [] },
  { key: "facility.enclosures", kind: "level", area: "enclosures", sort: 22, requires: [], probes: [] },
  { key: "maintenance.jobs", kind: "level", area: "maintenance", sort: 24, requires: [], probes: [] },
  { key: "maintenance.progress", kind: "yesno", area: "maintenance", sort: 25, requires: [], probes: [] },
  { key: "maintenance.photos", kind: "yesno", area: "maintenance", sort: 26, requires: [], probes: [] },
  { key: "projects.folders", kind: "level", area: "projects", sort: 27, requires: [], probes: [] },
  { key: "projects.photos", kind: "yesno", area: "projects", sort: 28, requires: [], probes: [] },
  { key: "projects.publish", kind: "yesno", area: "projects", sort: 29, requires: [], probes: [] },
  { key: "clinics.list", kind: "level", area: "contacts", sort: 30, requires: [], probes: [] },
  { key: "clinics.doctors", kind: "yesno", area: "contacts", sort: 31, requires: [], probes: [] },
  { key: "contacts.directory", kind: "level", area: "contacts", sort: 32, requires: [], probes: [] },
  { key: "contacts.add", kind: "yesno", area: "contacts", sort: 33, requires: [], probes: [] },
  { key: "friends.manage", kind: "yesno", area: "contacts", sort: 34, requires: [], probes: [] },
  { key: "stock.count", kind: "yesno", area: "stock", sort: 35, requires: [], probes: [] },
  { key: "stock.delivery", kind: "yesno", area: "stock", sort: 36, requires: [], probes: [] },
  { key: "stock.purchasing", kind: "yesno", area: "stock", sort: 37, requires: [], probes: [] },
  { key: "stock.usage", kind: "yesno", area: "stock", sort: 38, requires: [], probes: [] },
  { key: "stock.medications", kind: "level", area: "stock", sort: 39, requires: [], probes: [] },
  { key: "stock.diets", kind: "level", area: "stock", sort: 40, requires: [], probes: [] },
  { key: "stock.correct", kind: "yesno", area: "stock", sort: 41, requires: [], probes: [] },
  { key: "reports.dashboard", kind: "yesno", area: "management", sort: 42, requires: [], probes: [] },
  { key: "reports.cashflow", kind: "level", area: "management", sort: 43, requires: [], probes: [] },
  { key: "recurring.manage", kind: "yesno", area: "management", sort: 44, requires: [], probes: [] },
  { key: "recurring.do_any", kind: "yesno", area: "management", sort: 45, requires: [], probes: [] },
  { key: "recurring.do_own", kind: "yesno", area: "management", sort: 46, requires: [], probes: [] },
  { key: "translations.manage", kind: "yesno", area: "management", sort: 47, requires: [], probes: [] },
  { key: "assistant.ask", kind: "yesno", area: "assistant", sort: 48, requires: [], probes: [] },
  { key: "assistant.record", kind: "yesno", area: "assistant", sort: 49, requires: [], probes: [] },
  { key: "website.content", kind: "level", area: "settings", sort: 50, requires: [], probes: [] },
  { key: "reference.types", kind: "level", area: "settings", sort: 51, requires: [], probes: [] },
  { key: "system.status", kind: "yesno", area: "settings", sort: 55, requires: [], probes: [] },
  { key: "translations.view", kind: "yesno", area: "management", sort: 56, requires: [], probes: [] },
  // 0296: proposing a Thai label, which is NOT approving one. propose_label_th() asks this while
  // approve_label_th() keeps asking translations.manage, so a proposing caller cannot publish.
  // Sort 74, not a number beside 47 and 56: sort is the matrix position AND is compared per key with
  // the migration that seeded it, so renumbering would put every later activity out of step.
  { key: "translations.propose", kind: "yesno", area: "management", sort: 74, requires: [], probes: [] },
  // 0302: correct a resident's intake date, moving the dates the intake stamped with it. Sort 75, after 74, for the reason above.
  { key: "resident.correct_intake_date", kind: "yesno", area: "residents", sort: 75, requires: [], probes: [] },
  { key: "bills.utilities", kind: "yesno", area: "maintenance", sort: 76, requires: [], probes: [] },
  { key: "bills.general", kind: "yesno", area: "maintenance", sort: 77, requires: [], probes: [] },
  { key: "bills.sites", kind: "yesno", area: "maintenance", sort: 78, requires: [], probes: [] },
  // 0312: run a fundraising event (its own table, apart from appeals and projects). Sort 79, after 78, for the reason above.
  { key: "events.run", kind: "yesno", area: "management", sort: 79, requires: [], probes: [] },
  // 0315: propose a website change (it waits as a draft) and approve it. Sort 80 and 81, after 79, for the reason above.
  { key: "website.propose", kind: "yesno", area: "settings", sort: 80, requires: [], probes: [] },
  { key: "website.approve", kind: "yesno", area: "settings", sort: 81, requires: [], probes: [] },
  // 0317: read the expense report. A level, so Read can open the screen without handing over the right to write any bill.
  { key: "reports.expenses", kind: "readonly", area: "management", sort: 82, requires: [], probes: [] },
  { key: "social.library_manage", kind: "yesno", area: "management", sort: 83, requires: [], probes: [] },
  // 0329: the reels half of the same split. social.reels is add-and-change and recording a post; social.reels_manage archives, deletes and takes a post record off.
  { key: "social.reels", kind: "level", area: "management", sort: 84, requires: [], probes: [] },
  { key: "social.reels_manage", kind: "yesno", area: "management", sort: 85, requires: [], probes: [] },
  // 0338: the suppliers list and a supplier's page (Read), add, change, archive and restore (Edit). Never delete: suppliers are archived.
  { key: "suppliers.directory", kind: "level", area: "contacts", sort: 86, requires: [], probes: [] },
  // 0340: Settings → Diets, every screen and every save on it, asked alone (#d3cw7). It replaced reference.types Edit AND stock.diets Edit
  // asked together, which no screen said. Yes/no: nothing on those screens is offered to read that is not also offered to change.
  { key: "diets.settings", kind: "yesno", area: "settings", sort: 87, requires: [], probes: [] },
  { key: "text.approve", kind: "yesno", area: "settings", sort: 88, requires: [], probes: [] },
  { key: "contacts.browse", kind: "yesno", area: "contacts", sort: 57, requires: [], probes: [] },
  { key: "friends.view", kind: "yesno", area: "contacts", sort: 58, requires: [], probes: [] },
  { key: "community.outings", kind: "level", area: "projects", sort: 59, requires: [], probes: [] },
  { key: "donation.receipt", kind: "yesno", area: "management", sort: 60, requires: [], probes: [] },
  { key: "maintenance.delete", kind: "yesno", area: "maintenance", sort: 61, requires: [], probes: [] },
  { key: "maintenance.bills", kind: "yesno", area: "maintenance", sort: 62, requires: [], probes: [] },
  { key: "appeal.run", kind: "yesno", area: "management", sort: 63, requires: [], probes: [] },
  { key: "appeal.medical_photo", kind: "yesno", area: "management", sort: 64, requires: [], probes: [] },
  { key: "photos.shelter_add", kind: "yesno", area: "photos", sort: 65, requires: [], probes: [] },
  { key: "social.library", kind: "level", area: "management", sort: 66, requires: [], probes: [] },
  { key: "photos.approve", kind: "yesno", area: "photos", sort: 67, requires: [], probes: [] },
  { key: "roles.view", kind: "readonly", area: "settings", sort: 68, requires: [], probes: [] },
  { key: "website.gallery", kind: "yesno", area: "settings", sort: 70, requires: [], probes: [] },
  { key: "resident.who_and_where", kind: "readonly", area: "residents", sort: 69, requires: [], probes: [] },
  { key: "photos.resident_medical", kind: "readonly", area: "photos", sort: 71, requires: [], probes: [] },
  { key: "photos.medical_add", kind: "yesno", area: "photos", sort: 72, requires: [], probes: [] },
  { key: "shop.manage", kind: "level", area: "settings", sort: 73, requires: [], probes: [] },
  { key: "maintenance.job_picker", kind: "yesno", area: "maintenance", sort: 89, requires: [], probes: [] },
] as const satisfies readonly ActivityDef[];

export type Activity = (typeof ACTIVITIES)[number];

/** Every activity key. A mistyped key does not compile. */
export type ActivityKey = Activity["key"];

/** The Yes/No ones: `can(perms, key)` only, with no level. */
export type YesNoKey = Extract<Activity, { kind: "yesno" }>["key"];

/** The Edit/Read/None ones: `can(perms, key, "read")` is meaningful. */
export type LevelKey = Extract<Activity, { kind: "level" }>["key"];

/** The Read/None ones: read is the only question, so `can(perms, key, "edit")` does not compile (2026-11-12). */
export type ReadOnlyKey = Extract<Activity, { kind: "readonly" }>["key"];

const KNOWN: ReadonlySet<string> = new Set(ACTIVITIES.map((a) => a.key));

/** Is this a key in the catalogue? The runtime guard behind failing closed. */
export function isActivityKey(key: unknown): key is ActivityKey {
  return typeof key === "string" && KNOWN.has(key);
}
