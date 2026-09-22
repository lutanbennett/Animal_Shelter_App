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
 *   - hospital before vet, because a "vet hospital" is not a booking;
 *   - the return before the admission, because "back from hospital" is
 *     still a sentence about a hospital;
 *   - weight before both bookings, because "weigh Panda before the vet"
 *     is a weight;
 *   - move last, as the broadest of them ("put", "shift", "transfer").
 */

import { dueIntent, whereIntent, whoIntent } from "./intents/lookups";
import { hospitalIntent, hospitalReturnIntent } from "./intents/hospital";
import { weightIntent } from "./intents/weight";
import { vetIntent } from "./intents/vet";
import { moveIntent } from "./intents/move";
import type { Intent, IntentParser, ParseContext, ParseResult } from "./types";

export const INTENT_PARSERS: readonly IntentParser[] = [
  whereIntent,
  whoIntent,
  dueIntent,
  hospitalReturnIntent,
  hospitalIntent,
  weightIntent,
  vetIntent,
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
