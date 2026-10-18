/**
 * Cards: the unit the Director assigns to a role (docs/decisions/2026-10-13-cards-are-what-a-role-is-given.md).
 * A card is a name, the page it opens, and a bundle of activities at a level. A role is given cards, and
 * its `role_permissions` rows are the union of their bundles plus its extras (single activities no card
 * gives). `role_permissions` stays the table the database checks, so has_permission(), every policy and can()
 * are untouched.
 *
 * Definitions live here, in code, because knowing that Purchasing also needs the last count takes reading
 * the code (the 2026-10-04 ruling: the bundles are written by a session). WHICH cards a role has is data
 * (role_cards, 0194).
 *
 * ADDING CARD TWENTY-TWO is one entry in NEW_CARDS below, its key in NewCardKey, its title in NEW_CARD_LABEL
 * and in appHome.cards in both dictionaries. Nothing else lists the cards: the eight jobs are cards by being
 * in JOBS, and the database holds no copy of a bundle (set_role_cards() is handed the bundle this file
 * computes). check-cards-schema.mjs fails if what the database holds for a role ever differs from what this
 * file says its cards give.
 *
 * Pure and client-safe.
 */
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import type { ActivityKey, Level } from "./catalogue";
import { JOBS, type BundleEntry, type JobKey } from "./jobs";

export type NewCardKey =
  | "view_residents"
  | "residents"
  | "medical_records"
  | "book_clinic_visits"
  | "contacts"
  | "recurring_jobs"
  | "dashboard"
  | "donations_receipts"
  | "bills"
  | "website"
  | "outreach_notes"
  | "assistant"
  | "enclosures"
  | "add_photos"
  | "approve_photos"
  | "run_appeals";

export type CardKey = JobKey | NewCardKey;

export type Card = {
  key: CardKey;
  label: (t: Dictionary) => string;
  /** Cards this one includes: giving it gives everything they give (levels flow down). */
  includes: readonly CardKey[];
  /** This card's own activities, at the level it needs; what an included card gives is not repeated. */
  bundle: readonly BundleEntry[];
  /** The page the card's tile opens: a route in the registry. */
  opens: string;
  /**
   * The page it opens instead for a role whose clinical scope is "any" (shelter staff), when `opens` is a clinic
   * login's own page that they are refused. Read it through cardOpens(), never directly.
   */
  opensAny?: string;
  /**
   * Cards that SOME OTHER role must hold before any role may be given this one (0221 enforces it in set_role_cards()).
   * Each name is satisfied by the cards in CARD_SATISFIED_BY, not only by itself.
   */
  requiresCardSomewhere?: readonly CardKey[];
};

/** The page this card's tile opens for a role with this clinical scope: one that role can open. */
export function cardOpens(card: Pick<Card, "opens" | "opensAny">, clinical: string): string {
  return clinical === "own_clinic" ? card.opens : (card.opensAny ?? card.opens);
}

type NewCard = Omit<Card, "key" | "label">;

const NEW_CARDS: Record<NewCardKey, NewCard> = {
  // Who and where, read only: the floor every role that opens the app can already have (0134).
  view_residents: { includes: [], bundle: [{ activity: "resident.record", level: "read" }], opens: "/residents" },
  // Lutan, 2026-10-13: the full record, edit, move, photos and intake. Photo upload follows the edit card.
  residents: {
    includes: ["view_residents"],
    bundle: [
      { activity: "resident.record", level: "edit" },
      { activity: "resident.register" },
      { activity: "resident.microchip" },
      { activity: "resident.adoption_news", level: "edit" },
      { activity: "placement.move" },
      { activity: "placement.hospital" },
      { activity: "placement.rehome" },
      { activity: "placement.death" },
      // placement.death_withdraw is NOT here: Management does not hold it, so the card would have handed it a power
      // on the day cards land (found by the 0194 seed check). It stays a single activity, given as an extra.
      { activity: "photos.resident_add" },
      { activity: "photos.resident_manage" },
      { activity: "photos.resident_publish" },
    ],
    opens: "/residents",
  },
  medical_records: {
    includes: ["view_residents"],
    bundle: [
      { activity: "medical.visits", level: "edit" },
      { activity: "medical.procedures", level: "edit" },
      { activity: "medical.blood_tests", level: "edit" },
      { activity: "medical.prescriptions", level: "edit" },
      { activity: "medical.immunizations", level: "edit" },
      { activity: "medical.weight", level: "edit" },
      { activity: "medical.diet", level: "edit" },
      { activity: "medical.archive" },
    ],
    opens: "/residents",
  },
  book_clinic_visits: {
    includes: ["view_residents"],
    bundle: [{ activity: "visit.book" }, { activity: "medical.visits", level: "read" }],
    // /appointments is the clinic login's own page (refused to shelter roles); the shelter's list of visits is /upcoming-visits.
    opens: "/appointments",
    opensAny: "/upcoming-visits",
  },
  contacts: {
    includes: [],
    bundle: [
      { activity: "contacts.browse" },
      { activity: "contacts.directory", level: "edit" },
      { activity: "contacts.add" },
      { activity: "clinics.list", level: "edit" },
      { activity: "clinics.doctors" },
      { activity: "friends.view" },
      { activity: "friends.manage" },
    ],
    opens: "/management/contacts",
  },
  recurring_jobs: {
    includes: [],
    bundle: [{ activity: "recurring.manage" }, { activity: "recurring.do_any" }, { activity: "recurring.do_own" }],
    opens: "/management/recurring-jobs",
  },
  dashboard: {
    includes: [],
    bundle: [{ activity: "reports.dashboard" }, { activity: "reports.cashflow", level: "read" }],
    opens: "/management/dashboard",
  },
  donations_receipts: { includes: [], bundle: [{ activity: "donation.receipt" }], opens: "/management/donations" },
  bills: { includes: [], bundle: [{ activity: "maintenance.bills" }], opens: "/bills" },
  website: { includes: [], bundle: [{ activity: "website.content", level: "edit" }], opens: "/admin/website" },
  outreach_notes: { includes: [], bundle: [{ activity: "community.outings", level: "edit" }], opens: "/outreach" },
  assistant: { includes: [], bundle: [{ activity: "assistant.ask" }, { activity: "assistant.record" }], opens: "/assistant" },
  // Lutan, 2026-10-13: deliberately narrow. Which animal is where; NOT bundled with Do Maintenance, so the
  // 2IC gets no maintenance write access by it. The facility map and rooms belong to no card (accepted).
  enclosures: { includes: [], bundle: [{ activity: "facility.enclosures", level: "read" }], opens: "/enclosures" },
  // Card twenty-two (2026-10-17): file photos into the Shelter folder, phone-first, for a volunteer. The bundle is
  // photos.shelter_add and the who-and-where read the picker needs, and NOTHING else: never photos.resident_publish,
  // which is what puts a photo on the website. The photo waits for a role holding Approve photos (or Residents) to approve it (0217).
  add_photos: {
    includes: [],
    bundle: [{ activity: "photos.shelter_add" }, { activity: "resident.record", level: "read" }],
    opens: "/photos/add",
    requiresCardSomewhere: ["approve_photos"],
  },
  // Card twenty-four (2026-10-18): approve the photos that wait for it, and remove one that should not be seen. The bundle is
  // exactly what /photos/approve needs and nothing wider: photos.resident_publish (the database guard 0221/0222 keys on this
  // activity), photos.resident_manage (delete_resident_photo and refiling a waiting photo ask it, 0152), and the who-and-where
  // read. NOT resident.record at edit, not photos.resident_add, not any placement or medical cell: a role can approve photos
  // without being able to edit a resident. Residents (Management) still approves, by union. Not granted to any role here.
  approve_photos: {
    includes: [],
    bundle: [
      { activity: "photos.resident_publish" },
      { activity: "photos.resident_manage" },
      { activity: "resident.record", level: "read" },
    ],
    opens: "/photos/approve",
  },
  // Card twenty-three (2026-10-18): run the fundraising appeals. donation.receipt is bundled because the appeals
  // pages show what has been raised only to a login that holds it (the one donations read there is). NOT granted to
  // any role here: the Director ticks it onto roles in Settings.
  run_appeals: {
    includes: [],
    bundle: [{ activity: "appeal.run" }, { activity: "donation.receipt" }],
    opens: "/management/appeals",
  },
};

/** Titles of the new cards, from the dictionary; the eight jobs keep theirs under appHome.jobs. */
const NEW_CARD_LABEL: Record<NewCardKey, (t: Dictionary) => string> = {
  view_residents: (t) => t.appHome.cards.viewResidents,
  residents: (t) => t.appHome.cards.residents,
  medical_records: (t) => t.appHome.cards.medicalRecords,
  book_clinic_visits: (t) => t.appHome.cards.bookClinicVisits,
  contacts: (t) => t.appHome.cards.contacts,
  recurring_jobs: (t) => t.appHome.cards.recurringJobs,
  dashboard: (t) => t.appHome.cards.dashboard,
  donations_receipts: (t) => t.appHome.cards.donationsReceipts,
  bills: (t) => t.appHome.cards.bills,
  website: (t) => t.appHome.cards.website,
  outreach_notes: (t) => t.appHome.cards.outreachNotes,
  assistant: (t) => t.appHome.cards.assistant,
  enclosures: (t) => t.appHome.cards.enclosures,
  add_photos: (t) => t.appHome.cards.addPhotos,
  approve_photos: (t) => t.appHome.cards.approvePhotos,
  run_appeals: (t) => t.appHome.cards.runAppeals,
};

export const CARDS: Record<CardKey, Card> = {
  ...(Object.fromEntries(
    Object.values(JOBS).map((j) => [j.key, { key: j.key, label: j.label, includes: [], bundle: j.bundle, opens: j.opens }]),
  ) as unknown as Record<JobKey, Card>),
  ...(Object.fromEntries(
    (Object.keys(NEW_CARDS) as NewCardKey[]).map((k) => [k, { key: k, label: NEW_CARD_LABEL[k], ...NEW_CARDS[k] }]),
  ) as unknown as Record<NewCardKey, Card>),
};

/**
 * Which cards satisfy a requirement named in requiresCardSomewhere. The Approve photos card is satisfied by itself and by
 * Residents, which bundles photos.resident_publish. The database counts the ACTIVITY (photos.resident_publish) on roles that
 * are not retired (0222), so it stays correct for extras and both cards; the screen must ask the same question (approverTest).
 */
export const CARD_SATISFIED_BY: Partial<Record<CardKey, readonly CardKey[]>> = {
  approve_photos: ["approve_photos", "residents"],
};

export const CARD_KEYS = Object.keys(CARDS) as CardKey[];

export function isCardKey(key: unknown): key is CardKey {
  return typeof key === "string" && Object.hasOwn(CARDS, key);
}

/** The cards a card brings with it, transitively, not counting itself. */
export function includedCards(key: CardKey): CardKey[] {
  const seen = new Set<CardKey>();
  const walk = (k: CardKey) => {
    for (const i of CARDS[k].includes) {
      if (!seen.has(i)) {
        seen.add(i);
        walk(i);
      }
    }
  };
  walk(key);
  return [...seen];
}

/** Add entries, keeping the higher level; a yes/no activity is held at "edit" (cell 2). */
function add(into: Map<ActivityKey, Level>, entries: readonly BundleEntry[]) {
  for (const { activity, level = "edit" } of entries) {
    if (into.get(activity) !== "edit") into.set(activity, level);
  }
}

/** The union of these cards and everything they include: each activity once, at the highest level any asks. */
export function bundleOfCards(keys: readonly CardKey[]): Map<ActivityKey, Level> {
  const union = new Map<ActivityKey, Level>();
  for (const k of keys) for (const c of [k, ...includedCards(k)]) add(union, CARDS[c].bundle);
  return union;
}

/** What set_role_cards() is handed: the bundle as [{activity, level}] with level 1 (read) or 2 (edit / yes). */
export function bundleJson(keys: readonly CardKey[]): { activity: ActivityKey; level: 1 | 2 }[] {
  return [...bundleOfCards(keys)].map(([activity, level]) => ({ activity, level: level === "edit" ? 2 : 1 }));
}
