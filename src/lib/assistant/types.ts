/**
 * The shapes the assistant's brain and its preview cards agree on.
 *
 * One request becomes one `Draft`: the intent a parser claimed, plus a
 * field for everything that intent needs, null wherever the sentence
 * didn't say. Nulls are the point — the card shows them as blanks for the
 * person to fill, and the audit row keeps them, because what a sentence
 * left out is half of what version 2 has to learn.
 *
 * Version 2 replaces the parsers (src/lib/assistant/intents/) and keeps
 * everything in this file, the cards and the server actions.
 */

export type ParserResident = {
  id: string;
  name: string;
  thaiName: string | null;
  code: string;
  enclosureId: string | null;
  enclosureName: string | null;
  enclosureNameTh: string | null;
  status: string | null;
};

export type ParserEnclosure = { id: string; name: string; nameTh: string | null };

export type ParserZone = { id: string; name: string; nameTh: string | null };

export type ParserClinic = { id: string; name: string };

/** A medicine the prescription tool may name. `doseUnit` is what its amount is counted in. */
export type ParserMedication = { id: string; name: string; nameTh: string | null; doseUnit: string };

export type ParserCarer = { id: string; name: string };

export type ParserImmunizationType = { id: string; name: string; nameTh: string | null };

/** Everything a parser may match a sentence against. */
export type ParseContext = {
  residents: ParserResident[];
  enclosures: ParserEnclosure[];
  /** The physical zones the enclosures sit in, for "is there room in the cat zone?". */
  zones: ParserZone[];
  clinics: ParserClinic[];
  /** Existing carers only: a new one is never created from a sentence. */
  carers: ParserCarer[];
  /** The vaccines /immunizations/new offers. */
  immunizationTypes: ParserImmunizationType[];
  /**
   * The medicines /prescriptions/new offers. Empty for a login without
   * `medical.prescriptions`, which is not offered the prescription tool either.
   */
  medications: ParserMedication[];
  /** The person's own clock, so "tomorrow" is tomorrow where they are. */
  now: Date;
};

/**
 * The parser that claimed the sentence. Stored on the audit row
 * (assistant_actions.intent, and draft.kind inside draft). Rows written
 * before 0172 say "vet" where these say "clinic"; nothing in the app reads
 * them back, but anything that does should treat the two as one.
 */
export type Intent =
  | "move"
  | "clinic"
  | "hospital"
  | "hospital-return"
  | "weight"
  | "death"
  | "rehome"
  | "carer-return"
  | "immunization"
  | "prescription"
  | "where"
  | "who"
  | "due"
  | "find-enclosure"
  | "summary";

/** Intents that write; the rest are answered inline with no confirm step. */
export const WRITE_INTENTS: readonly Intent[] = [
  "move",
  "clinic",
  "hospital",
  "hospital-return",
  "weight",
  "death",
  "rehome",
  "carer-return",
  "immunization",
  "prescription",
];

export function isWriteIntent(intent: Intent): boolean {
  return WRITE_INTENTS.includes(intent);
}

export type MoveDraft = {
  kind: "move";
  residentId: string | null;
  enclosureId: string | null;
  /** YYYY-MM-DD, or null when the text didn't say. */
  date: string | null;
};

export type ClinicVisitDraft = {
  kind: "clinic";
  residentId: string | null;
  clinicId: string | null;
  date: string | null;
  /** HH:MM, or null when the text didn't say. */
  time: string | null;
  reason: string | null;
  /** "with Dr X" / "หมอ X", as said; null when the sentence named no one. */
  doctorName: string | null;
};

export type HospitalDraft = {
  kind: "hospital";
  residentId: string | null;
  date: string | null;
};

export type HospitalReturnDraft = {
  kind: "hospital-return";
  residentId: string | null;
  /** Where they go back to; null means "wherever they came from". */
  enclosureId: string | null;
  date: string | null;
};

export type WeightDraft = {
  kind: "weight";
  residentId: string | null;
  /** Kilograms, as every weight in the app is. */
  weightKg: number | null;
  date: string | null;
};

export type DeathDraft = {
  kind: "death";
  residentId: string | null;
  /** Never defaulted: "last night" straddles midnight, so it stays null. */
  date: string | null;
  causeOfDeath: string | null;
};

export type RehomeDraft = {
  kind: "rehome";
  residentId: string | null;
  /** Null when the sentence said neither (or both) of foster and adopt. */
  rehomeKind: "foster" | "adopt" | null;
  /** An existing carer; null unless the sentence named exactly one. */
  carerId: string | null;
  date: string | null;
};

export type CarerReturnDraft = {
  kind: "carer-return";
  residentId: string | null;
  /** An existing carer the sentence named; shown on the card, never written. */
  carerId: string | null;
  /** The name said after "from" when it matched no carer; null otherwise. */
  carerName: string | null;
  /** Where they come back to; null until the person picks one. */
  enclosureId: string | null;
  date: string | null;
};

export type ImmunizationDraft = {
  kind: "immunization";
  residentId: string | null;
  /** Every vaccine the sentence named; empty when it named none. */
  immunizationTypeIds: string[];
  date: string | null;
};

/**
 * A prescription for a resident. The sentence gives the medicine, the amount
 * and when it starts; which DAYS it falls on stays the card's picker (0283),
 * because "every other Tuesday" is not something a sentence says reliably.
 * `timesPerDay` is the one part of the pattern a sentence does say plainly,
 * so it is here and it chooses the card's round ticks.
 */
export type PrescriptionDraft = {
  kind: "prescription";
  residentId: string | null;
  medicationId: string | null;
  /** Amount per dose, in the medicine's own unit; null when the sentence didn't say. */
  doseQuantity: number | null;
  /** Doses a day, 1 to 4 — the round ticks the card starts with. Null reads as one. */
  timesPerDay: number | null;
  /** YYYY-MM-DD; null means the card's default, today. */
  startDate: string | null;
  /** YYYY-MM-DD; null means open-ended, which is what most courses are. */
  endDate: string | null;
  notes: string | null;
};

export type WhereDraft = { kind: "where"; residentId: string | null };

export type WhoDraft = { kind: "who"; enclosureId: string | null };

/**
 * "Where is there room?" — the enclosures with places free. Answered from
 * capacity minus headcount, the same arithmetic the enclosure list shows.
 */
export type FindEnclosureDraft = {
  kind: "find-enclosure";
  /** One zone only; null means every zone. */
  zoneId: string | null;
  /** How many places are needed. Null reads as one. */
  places: number | null;
};

/** "Tell me about Panda" — one resident's current state, gathered, read only. */
export type SummaryDraft = { kind: "summary"; residentId: string | null };

export type DueDraft = {
  kind: "due";
  /** How far ahead to look, in days. "today" is 1, "this week" is 7. */
  days: number;
};

export type Draft =
  | MoveDraft
  | ClinicVisitDraft
  | HospitalDraft
  | HospitalReturnDraft
  | WeightDraft
  | DeathDraft
  | RehomeDraft
  | CarerReturnDraft
  | ImmunizationDraft
  | PrescriptionDraft
  | WhereDraft
  | WhoDraft
  | DueDraft
  | FindEnclosureDraft
  | SummaryDraft;

export type ParseResult = {
  draft: Draft;
  /**
   * The residents a name could have meant, when it could have meant more
   * than one. Empty when the match was unambiguous or nothing matched —
   * the card turns a non-empty list into a picker.
   */
  residentCandidates: string[];
};

/** One intent's parser. Returns null when the sentence isn't its business. */
export type IntentParser = {
  intent: Intent;
  parse: (text: string, ctx: ParseContext) => ParseResult | null;
};

/**
 * What a version 2 turn carries from the model call to the audit row: the
 * model id and the exchange (shape: `AssistantExchange` in interpret.ts).
 * Absent on every version 1 turn. It travels through the browser the same
 * way `request` and `draft` already do, so it is exactly as trustworthy as
 * they are, which for a row on the caller's own session is enough.
 */
export type AssistantTrace = { model: string; exchange: unknown };
