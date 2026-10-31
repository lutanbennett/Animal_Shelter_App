/**
 * The assistant's whole "brain": an ordered list of small parsers, each
 * one intent, the first to claim the sentence wins. No model, no API, no
 * guessing — anything a parser can't find in the text is left null for the
 * person to fill in on the preview card.
 *
 * Understanding is hard-coded in intents/; the doing
 * (src/app/assistant/actions.ts) is the app's own server helpers. When
 * version 2 arrives it replaces this file and intents/, and the cards,
 * the types and the actions stay.
 *
 * Order is the only thing this file decides, and it matters: a sentence
 * that several parsers would claim goes to the most specific one.
 *
 *   - the lookups first, so "where is Panda going" is a question, not a move;
 *   - "which enclosure has space" before "where is …", because "where is
 *     there room for two dogs" is a question about enclosures, not about a
 *     resident; it declines any sentence that names one;
 *   - the resident summary next, which needs a resident and so cannot claim
 *     a sentence the other questions want;
 *   - no parser for a prescription: a medicine, an amount and a frequency in
 *     one sentence is the model's job, and a wrong guess at a dose is not
 *     worth the keyword rules (decision file, 2026-10-31);
 *   - death next: "Bella died at the hospital" is a death, not an
 *     admission, and it is the one sentence that must never be misread;
 *   - immunization after death and rehome, before the hospital and
 *     bookings: "had rabies at the vet" is a vaccine, not a visit;
 *   - the carer return before rehome: "came back from foster" is a
 *     return, and rehome declines any sentence that says "back";
 *   - rehome before the hospital and bookings, whose words it may share;
 *   - hospital before clinic, because a "vet hospital" is not a booking;
 *   - the return before the admission, because "back from hospital" is
 *     still a sentence about a hospital;
 *   - weight before both bookings, because "weigh Panda before the vet"
 *     is a weight;
 *   - move last, as the broadest of them ("put", "shift", "transfer").
 */

import { dueIntent, findEnclosureIntent, summaryIntent, whereIntent, whoIntent } from "./intents/lookups";
import { hospitalIntent, hospitalReturnIntent } from "./intents/hospital";
import { deathIntent } from "./intents/death";
import { rehomeIntent } from "./intents/rehome";
import { carerReturnIntent } from "./intents/carer-return";
import { immunizationIntent } from "./intents/immunization";
import { weightIntent } from "./intents/weight";
import { clinicIntent } from "./intents/clinic";
import { moveIntent } from "./intents/move";
import type { Intent, IntentParser, ParseContext, ParseResult } from "./types";

export const INTENT_PARSERS: readonly IntentParser[] = [
  findEnclosureIntent,
  summaryIntent,
  whereIntent,
  whoIntent,
  dueIntent,
  deathIntent,
  carerReturnIntent,
  rehomeIntent,
  immunizationIntent,
  hospitalReturnIntent,
  hospitalIntent,
  weightIntent,
  clinicIntent,
  moveIntent,
];

/** A parsed request, or null when no parser recognised the sentence. */
export type ParsedRequest = ParseResult & { intent: Intent };

export function parseRequest(
  input: string,
  ctx: Omit<ParseContext, "now"> & { now?: Date },
): ParsedRequest | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const context: ParseContext = { ...ctx, now: ctx.now ?? new Date() };
  for (const parser of INTENT_PARSERS) {
    const result = parser.parse(text, context);
    if (result) return { ...result, intent: parser.intent };
  }
  return null;
}
