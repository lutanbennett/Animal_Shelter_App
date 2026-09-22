/**
 * "Panda weighs 12.4 kg" / "log weight 12.4 for Panda".
 *
 * Kilograms only, as the weight table and every form in the app are —
 * a sentence saying pounds is left for the person to convert rather than
 * silently reinterpreted, because a wrong weight reads as a plausible one.
 */

import { matchResident, parseDate } from "../text";
import type { IntentParser } from "../types";

const WEIGHT_RE =
  /(?<![a-z])(weigh|weighs|weighed|weighing|weight)(?![a-z])|น้ำหนัก|หนัก/i;

/**
 * A number with a unit attached ("12.4 kg"), or a bare number when the
 * sentence already said "weight" ("log weight 12.4 for Panda"). Never a
 * bare number on its own — resident codes, dates and enclosure names are
 * full of digits.
 */
const WITH_UNIT_RE =
  /(?<![a-z0-9.])(\d{1,3}(?:\.\d{1,2})?)\s*(?:kgs?|kilograms?|kilos?|กก\.?|กิโล(?:กรัม)?)(?![a-z0-9])/i;
const BARE_NUMBER_RE = /(?<![a-z0-9.\-/])(\d{1,3}(?:\.\d{1,2})?)(?![a-z0-9.\-/:])/;

function parseWeightKg(text: string): number | null {
  const withUnit = text.match(WITH_UNIT_RE);
  const raw = withUnit?.[1] ?? text.match(BARE_NUMBER_RE)?.[1];
  if (!raw) return null;
  const kg = Number(raw);
  // The database's own check (0028) is > 0; anything past 500 kg in a
  // shelter for cats and dogs is a typo or a stray number, so leave it
  // blank rather than put it on the card as if it were understood.
  if (!Number.isFinite(kg) || kg <= 0 || kg > 500) return null;
  return kg;
}

export const weightIntent: IntentParser = {
  intent: "weight",
  parse(text, ctx) {
    if (!WEIGHT_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    const date = parseDate(text, ctx.now);
    // A date the text spelled out ("2026-09-23") is digits the weight
    // matcher must not also read as kilograms.
    const withoutDate = date ? text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ") : text;
    return {
      draft: {
        kind: "weight",
        residentId: resident.id,
        weightKg: parseWeightKg(withoutDate),
        date,
      },
      residentCandidates: resident.candidates,
    };
  },
};
