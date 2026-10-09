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

/** "level" = Edit / Read / None. "yesno" = Yes / No: an act with nothing to look at (§4 rule 2). */
export type ActivityKind = "level" | "yesno";

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
  { key: "facility.map", kind: "yesno", area: "enclosures", sort: 23, requires: [], probes: [] },
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
  { key: "reference.add_while_recording", kind: "yesno", area: "settings", sort: 52, requires: [], probes: [] },
  { key: "audit.view", kind: "yesno", area: "settings", sort: 53, requires: [], probes: [] },
  { key: "audit.undo", kind: "yesno", area: "settings", sort: 54, requires: [], probes: [] },
  { key: "system.status", kind: "yesno", area: "settings", sort: 55, requires: [], probes: [] },
  { key: "translations.view", kind: "yesno", area: "management", sort: 56, requires: [], probes: [] },
  { key: "contacts.browse", kind: "yesno", area: "contacts", sort: 57, requires: [], probes: [] },
  { key: "friends.view", kind: "yesno", area: "contacts", sort: 58, requires: [], probes: [] },
  { key: "donation.receipt", kind: "yesno", area: "management", sort: 59, requires: [], probes: [] },
] as const satisfies readonly ActivityDef[];

export type Activity = (typeof ACTIVITIES)[number];

/** Every activity key. A mistyped key does not compile. */
export type ActivityKey = Activity["key"];

/** The Yes/No ones: `can(perms, key)` only, with no level. */
export type YesNoKey = Extract<Activity, { kind: "yesno" }>["key"];

/** The Edit/Read/None ones: `can(perms, key, "read")` is meaningful. */
export type LevelKey = Extract<Activity, { kind: "level" }>["key"];

const KNOWN: ReadonlySet<string> = new Set(ACTIVITIES.map((a) => a.key));

/** Is this a key in the catalogue? The runtime guard behind failing closed. */
export function isActivityKey(key: unknown): key is ActivityKey {
  return typeof key === "string" && KNOWN.has(key);
}
