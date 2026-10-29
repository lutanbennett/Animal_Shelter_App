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
 * ADDING CARD TWENTY-SEVEN is one entry in NEW_CARDS below, its key in NewCardKey, its title in NEW_CARD_LABEL
 * and in appHome.cards in both dictionaries. Nothing else lists the cards: the eight jobs are cards by being
 * in JOBS, and the database holds no copy of a bundle (set_role_cards() is handed the bundle this file
 * computes). check-card-grants.mjs fails if what the database holds for a role ever differs from what this
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
  | "view_medical"
  | "medical_records"
  | "book_clinic_visits"
  | "view_contacts"
  | "contacts"
  | "publish_shelter_friends"
  | "recurring_jobs"
  | "dashboard"
  | "donations_receipts"
  | "bills"
  | "website"
  | "website_photos"
  | "outreach_notes"
  | "assistant"
  | "enclosures"
  | "add_photos"
  | "approve_photos"
  | "run_appeals"
  | "meme_library"
  | "my_tasks"
  | "who_does_what"
  | "record_death"
  | "translations"
  | "food_forecast"
  | "medicine_forecast"
  | "view_cashflow"
  | "record_vet_care"
  | "record_microchip"
  | "adoption_news"
  | "add_while_recording";

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
   * Cards that SOME OTHER role must hold before any role may be given this one (0221 enforces it in set_role_cards()).
   * Each name is satisfied by the cards in CARD_SATISFIED_BY, not only by itself.
   */
  requiresCardSomewhere?: readonly CardKey[];
};

type NewCard = Omit<Card, "key" | "label">;

const NEW_CARDS: Record<NewCardKey, NewCard> = {
  // Who and where, read only: the floor every role that opens the app can already have (0134).
  // Card review 1 (2026-10-26, 0265): the whole non-medical record (medical records are in their own tables) and the enclosure read, so the
  // Enclosure column fills. The "who and where only" narrowing was rejected for this card; the four job cards hold resident.who_and_where.
  view_residents: {
    includes: [],
    bundle: [
      { activity: "resident.record", level: "read" },
      { activity: "facility.enclosures", level: "read" },
    ],
    opens: "/residents",
  },
  // Lutan, 2026-10-13: the full record, edit, move, photos and intake. Photo upload follows the edit card.
  // Card review 1 (2026-10-26, 0265): recording a death is its own card (record_death); new photos go through approval
  // (photos.shelter_add) instead of straight to the website (photos.resident_publish); the Foster carer list reads contacts' names only
  // (contacts.directory at read); the enclosure lookup its forms need comes from view_residents.
  residents: {
    includes: ["view_residents"],
    bundle: [
      { activity: "resident.record", level: "edit" },
      { activity: "resident.register" },
      { activity: "resident.microchip" },
      { activity: "resident.adoption_news", level: "edit" },
      { activity: "placement.move" },
      { activity: "placement.rehome" },
      // placement.death_withdraw is NOT here: Management does not hold it, so the card would have handed it a power
      // on the day cards land (found by the 0194 seed check). It stays a single activity, given as an extra.
      { activity: "photos.resident_add" },
      { activity: "photos.resident_manage" },
      { activity: "photos.shelter_add" },
      { activity: "contacts.directory", level: "read" },
    ],
    opens: "/residents",
  },
  // Card thirty (2026-10-26, Lutan, Card review 1: "split Recording a death out into its own card in the Medical feature"). The death page
  // needs the resident and the Deceased enclosure, which view_residents gives. Every role that held Residents was given this card by 0265.
  record_death: {
    includes: ["view_residents"],
    bundle: [{ activity: "placement.death" }],
    opens: "/residents",
  },
  // Card review 2 (2026-10-26, 0268): reading medical history is its own card (view_medical); this one, shown as "Manage medical", adds
  // writing it and booking visits. Staff held Medical records alone, so staff keeps every cell and gains visit.book and the clinic list.
  view_medical: {
    includes: ["view_residents"],
    bundle: [
      { activity: "medical.visits", level: "read" },
      { activity: "medical.procedures", level: "read" },
      { activity: "medical.blood_tests", level: "read" },
      { activity: "medical.prescriptions", level: "read" },
      { activity: "medical.immunizations", level: "read" },
      { activity: "medical.weight", level: "read" },
      { activity: "medical.diet", level: "read" },
      { activity: "clinics.list", level: "read" },
    ],
    opens: "/residents",
  },
  medical_records: {
    includes: ["view_medical"],
    bundle: [
      { activity: "medical.visits", level: "edit" },
      { activity: "medical.procedures", level: "edit" },
      { activity: "medical.blood_tests", level: "edit" },
      { activity: "medical.prescriptions", level: "edit" },
      { activity: "medical.immunizations", level: "edit" },
      { activity: "medical.weight", level: "edit" },
      { activity: "medical.diet", level: "edit" },
      { activity: "medical.archive" },
      { activity: "visit.book" },
      // 0269: Send to hospital is a medical action, visible only through this card (Lutan, 2026-10-26).
      { activity: "placement.hospital" },
    ],
    opens: "/residents",
  },
  // Card review 2 (0268): the clinic list and the resident's medical history at READ come through View medical; it edits and cancels the
  // visits it books (medical.visits at edit; clinic_visits has no delete policy, so it cannot delete one).
  book_clinic_visits: {
    includes: ["view_medical"],
    bundle: [{ activity: "visit.book" }, { activity: "medical.visits", level: "edit" }],
    // One card, one page. It used to open /appointments for a clinic login and /upcoming-visits for everyone else, chosen by
    // the role's clinical column; a card now opens the same page for every role that holds it (docs/decisions/2026-10-25-remove-hard-coded-security.md).
    opens: "/upcoming-visits",
  },
  // Card review 2 (0268): looking people up is View contacts; this card, shown as "Manage contacts", edits them. Publishing Shelter Friends to the
  // public website is its own card. Management held Contacts alone and was given Publish Shelter Friends by the migration.
  view_contacts: {
    includes: [],
    bundle: [
      { activity: "contacts.browse" },
      { activity: "contacts.directory", level: "read" },
      { activity: "clinics.list", level: "read" },
      { activity: "friends.view" },
    ],
    // The look-up list, not the management list: that one asks contacts.directory at edit, which this card does not hold.
    opens: "/contacts",
  },
  publish_shelter_friends: {
    includes: ["view_contacts"],
    bundle: [{ activity: "friends.manage" }],
    opens: "/management/shelter-friends",
  },
  contacts: {
    includes: ["view_contacts"],
    bundle: [
      { activity: "contacts.directory", level: "edit" },
      { activity: "contacts.add" },
      { activity: "clinics.list", level: "edit" },
      { activity: "clinics.doctors" },
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
    // Card review 2 (0268): it also reads what the dashboard counts, as who-and-where, clinic visits and maintenance jobs at read.
    // Cashflow came off it in 0280 (Lutan, 2026-10-28: "Keep dashboard and cashflow separate"); View cashflow is its own card.
    bundle: [
      { activity: "reports.dashboard" },
      { activity: "resident.who_and_where", level: "read" },
      { activity: "medical.visits", level: "read" },
      { activity: "maintenance.jobs", level: "read" },
    ],
    opens: "/management/dashboard",
  },
  // Card review 2 (0268): a gift can be for a resident or a project, so the card reads who-and-where and project folders.
  donations_receipts: {
    includes: [],
    bundle: [
      { activity: "donation.receipt" },
      { activity: "resident.who_and_where", level: "read" },
      { activity: "projects.folders", level: "read" },
    ],
    opens: "/management/donations",
  },
  // Card review 2 (0268): it reads maintenance jobs, so the holder can attach a bill to one.
  bills: { includes: [], bundle: [{ activity: "maintenance.bills" }, { activity: "maintenance.jobs", level: "read" }], opens: "/bills" },
  website: { includes: [], bundle: [{ activity: "website.content", level: "edit" }], opens: "/admin/website" },
  // Card review 2 (0268): the photo strip is its own card, so a person who changes the opening hours cannot add a public photo. The page
  // opens on website.content, held here at read. The hero photo is a column of site_content and stays with Website until the app half moves it.
  website_photos: {
    includes: [],
    bundle: [{ activity: "website.content", level: "read" }, { activity: "website.gallery" }],
    opens: "/admin/website",
  },
  outreach_notes: { includes: [], bundle: [{ activity: "community.outings", level: "edit" }], opens: "/outreach" },
  // Card review 2 (0268): reads who-and-where and the enclosures to name an animal; assistant.record is dropped (it can do nothing alone).
  assistant: {
    includes: [],
    bundle: [
      { activity: "assistant.ask" },
      { activity: "resident.who_and_where", level: "read" },
      { activity: "facility.enclosures", level: "read" },
    ],
    opens: "/assistant",
  },
  // Lutan, 2026-10-13: deliberately narrow. Which animal is where; NOT bundled with Do Maintenance, so the
  // 2IC gets no maintenance write access by it. The facility map and rooms belong to no card (accepted).
  // Card review 2 (0268): plus who-and-where, so the occupancy it shows is true.
  enclosures: {
    includes: [],
    bundle: [{ activity: "facility.enclosures", level: "read" }, { activity: "resident.who_and_where", level: "read" }],
    opens: "/enclosures",
  },
  // Card twenty-two (2026-10-17): file photos into the Shelter folder, phone-first, for a volunteer. The bundle is
  // photos.shelter_add and the who-and-where read the picker needs, and NOTHING else: never photos.resident_publish,
  // which is what puts a photo on the website. The photo waits for a role holding Approve photos to approve it (0217, 0224).
  add_photos: {
    includes: [],
    bundle: [{ activity: "photos.shelter_add" }, { activity: "resident.who_and_where", level: "read" }],
    opens: "/photos/add",
    requiresCardSomewhere: ["approve_photos"],
  },
  // Card twenty-four (2026-10-18): approve the photos that wait for it, and remove one that should not be seen. The bundle is
  // exactly what /photos/approve needs and nothing wider: photos.approve (the database guard 0221/0222/0224 keys on this
  // activity; it is NOT photos.resident_publish, which Residents holds to publish its own uploads), photos.resident_manage (delete_resident_photo and refiling a waiting photo ask it, 0152), and the who-and-where
  // read. NOT resident.record at edit, not photos.resident_add, not any placement or medical cell: a role can approve photos
  // without being able to edit a resident. Residents does NOT approve (Lutan, 2026-10-19: a Residents holder publishes their own photos but cannot approve the queue). Management holds this card (0224); nobody else.
  // Card review 2 (0268): includes View residents, the wider read, so an approver can look at age and sex (Lutan's words).
  approve_photos: {
    includes: ["view_residents"],
    bundle: [{ activity: "photos.approve" }, { activity: "photos.resident_manage" }],
    opens: "/photos/approve",
  },
  // Card twenty-three (2026-10-18): run the fundraising appeals. donation.receipt is bundled because the appeals
  // pages show what has been raised only to a login that holds it (the one donations read there is). NOT granted to
  // any role here: the Director ticks it onto roles in Settings.
  // Card review 2 (0268): includes View residents (read only). 0269: and the medical history at read through View medical (his answer: "Make it a yes").
  run_appeals: {
    includes: ["view_residents", "view_medical"],
    bundle: [{ activity: "appeal.run" }, { activity: "donation.receipt" }],
    opens: "/management/appeals",
  },
  // Card twenty-five (2026-10-18): the social media library, for whoever runs the shelter's Facebook and Instagram. One
  // activity at Edit: browse the memes, add one, record where it was posted, archive one. Nothing about residents' photos or
  // records: a meme is not a resident's photo (docs/decisions/2026-10-18-social-shares-schema.md). NOT granted to any role
  // here: who gets it is a Settings answer, and the Director ticks it on.
  meme_library: {
    includes: [],
    bundle: [{ activity: "social.library", level: "edit" }, { activity: "resident.who_and_where", level: "read" }],
    opens: "/memes",
  },
  // Card twenty-six (2026-10-21, Lutan's ruling on menu-removal orphans 1 of 6): do the recurring tasks assigned to me, and
  // nothing else. recurring.do_own is what /my reads and what record_recurring_job() enforces as own only; it gives no
  // other person's tasks and no way to set tasks up. The tile is drawn only for a role that has been given this card.
  my_tasks: { includes: [], bundle: [{ activity: "recurring.do_own" }], opens: "/my" },
  // The Operations and Management landings were cards twenty-seven and twenty-eight; they are gone (0268, Lutan 2026-10-26: "it is a
  // grouping, not a card"). The landings and their menu links open on opensAnyIn, which never read these cards.
  // Card twenty-nine (2026-10-25, Lutan: only a card gives an ability): see the roles grid on Settings -> Who does what. Read only, in the grant too
  // since 0268 (roles.view is a level activity held at read); editing stays Admin at 2-step. Management is given it by 0262 so it keeps the page it had when the code asked for the role name.
  who_does_what: { includes: [], bundle: [{ activity: "roles.view", level: "read" }], opens: "/admin/who-does-what" },
  // Lutan, 2026-10-27: "Management will also do translations so a card is required for this" (0271). Who holds it is assigned in Who does what.
  translations: {
    includes: [],
    bundle: [{ activity: "translations.view" }, { activity: "translations.manage" }],
    opens: "/management/translations",
  },
  // Card review 2, his answers of 2026-10-28 (0280): three cards, each at READ, because the diet list, the medicine list and the cashflow
  // outgoings are Admin tasks and stay with Admin (outside the card system). Read sees the page; every control that changes something asks
  // the same activity at edit, so none of them is drawn for a holder of one of these cards.
  food_forecast: { includes: [], bundle: [{ activity: "stock.diets", level: "read" }], opens: "/management/diets" },
  medicine_forecast: { includes: [], bundle: [{ activity: "stock.medications", level: "read" }], opens: "/management/medications" },
  view_cashflow: { includes: [], bundle: [{ activity: "reports.cashflow", level: "read" }], opens: "/management/cashflow" },
  // Vet cards (2026-10-29, 0281): the nine activities a vet performs that no card was sized for, split so a vet is not handed Manage medical
  // (archive, send to hospital, booking) or Residents (move, rehome, register). Each includes the read it needs to be usable.
  record_vet_care: {
    includes: ["view_medical"],
    bundle: [
      { activity: "medical.visits", level: "edit" },
      { activity: "medical.procedures", level: "edit" },
      { activity: "medical.blood_tests", level: "edit" },
      { activity: "medical.prescriptions", level: "edit" },
      { activity: "medical.immunizations", level: "edit" },
      { activity: "medical.diet", level: "edit" },
    ],
    opens: "/residents",
  },
  record_microchip: { includes: ["view_residents"], bundle: [{ activity: "resident.microchip" }], opens: "/residents" },
  adoption_news: { includes: ["view_residents"], bundle: [{ activity: "resident.adoption_news", level: "edit" }], opens: "/residents" },
  // Its own card, not part of record_vet_care: the cell is asked by the medication, frequency and procedure-type insert policies (0148), which
  // anyone recording may need, so it must be givable without the six medical edits. Includes view_medical so it sits where the forms are.
  add_while_recording: { includes: ["view_medical"], bundle: [{ activity: "reference.add_while_recording" }], opens: "/residents" },
};

/** Titles of the new cards, from the dictionary; the eight jobs keep theirs under appHome.jobs. */
const NEW_CARD_LABEL: Record<NewCardKey, (t: Dictionary) => string> = {
  view_residents: (t) => t.appHome.cards.viewResidents,
  residents: (t) => t.appHome.cards.residents,
  view_medical: (t) => t.appHome.cards.viewMedical,
  medical_records: (t) => t.appHome.cards.medicalRecords,
  book_clinic_visits: (t) => t.appHome.cards.bookClinicVisits,
  view_contacts: (t) => t.appHome.cards.viewContacts,
  contacts: (t) => t.appHome.cards.contacts,
  publish_shelter_friends: (t) => t.appHome.cards.publishShelterFriends,
  recurring_jobs: (t) => t.appHome.cards.recurringJobs,
  dashboard: (t) => t.appHome.cards.dashboard,
  donations_receipts: (t) => t.appHome.cards.donationsReceipts,
  bills: (t) => t.appHome.cards.bills,
  website: (t) => t.appHome.cards.website,
  website_photos: (t) => t.appHome.cards.websitePhotos,
  outreach_notes: (t) => t.appHome.cards.outreachNotes,
  assistant: (t) => t.appHome.cards.assistant,
  enclosures: (t) => t.appHome.cards.enclosures,
  add_photos: (t) => t.appHome.cards.addPhotos,
  approve_photos: (t) => t.appHome.cards.approvePhotos,
  run_appeals: (t) => t.appHome.cards.runAppeals,
  meme_library: (t) => t.appHome.cards.memeLibrary,
  my_tasks: (t) => t.appHome.cards.myTasks,
  who_does_what: (t) => t.appHome.cards.whoDoesWhat,
  record_death: (t) => t.appHome.cards.recordDeath,
  translations: (t) => t.appHome.cards.translations,
  food_forecast: (t) => t.appHome.cards.foodForecast,
  medicine_forecast: (t) => t.appHome.cards.medicineForecast,
  view_cashflow: (t) => t.appHome.cards.viewCashflow,
  record_vet_care: (t) => t.appHome.cards.recordVetCare,
  record_microchip: (t) => t.appHome.cards.recordMicrochip,
  adoption_news: (t) => t.appHome.cards.adoptionNews,
  add_while_recording: (t) => t.appHome.cards.addWhileRecording,
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
 * Which cards satisfy a requirement named in requiresCardSomewhere. The Approve photos card is satisfied by itself only:
 * Residents bundles photos.resident_publish but not photos.approve. The database counts the ACTIVITY (photos.approve) on roles that
 * are not retired (0222), so it stays correct for extras and both cards; the screen must ask the same question (approverTest).
 */
export const CARD_SATISFIED_BY: Partial<Record<CardKey, readonly CardKey[]>> = {
  approve_photos: ["approve_photos"],
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
