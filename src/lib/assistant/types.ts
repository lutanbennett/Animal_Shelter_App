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

export type ParserVet = { id: string; name: string; clinicName: string | null };

/** Everything a parser may match a sentence against. */
export type ParseContext = {
  residents: ParserResident[];
  enclosures: ParserEnclosure[];
  vets: ParserVet[];
  /** The person's own clock, so "tomorrow" is tomorrow where they are. */
  now: Date;
};

/** The parser that claimed the sentence. Stored on the audit row. */
export type Intent =
  | "move"
  | "vet"
  | "hospital"
  | "hospital-return"
  | "weight"
  | "where"
  | "who"
  | "due";

/** Intents that write; the rest are answered inline with no confirm step. */
export const WRITE_INTENTS: readonly Intent[] = [
  "move",
  "vet",
  "hospital",
  "hospital-return",
  "weight",
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

export type VetVisitDraft = {
  kind: "vet";
  residentId: string | null;
  vetId: string | null;
  date: string | null;
  /** HH:MM, or null when the text didn't say. */
  time: string | null;
  reason: string | null;
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

export type WhereDraft = { kind: "where"; residentId: string | null };

export type WhoDraft = { kind: "who"; enclosureId: string | null };

export type DueDraft = {
  kind: "due";
  /** How far ahead to look, in days. "today" is 1, "this week" is 7. */
  days: number;
};

export type Draft =
  | MoveDraft
  | VetVisitDraft
  | HospitalDraft
  | HospitalReturnDraft
  | WeightDraft
  | WhereDraft
  | WhoDraft
  | DueDraft;

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
