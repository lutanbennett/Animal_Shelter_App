/**
 * "Send Panda to the vet hospital" and "Panda is back from hospital" —
 * the two halves of a hospital stay, one parser each.
 *
 * Both run before the vet parser, because "vet hospital" mentions a vet
 * and is not a booking; the return parser runs before the send one,
 * because "back from hospital" mentions a hospital and is not an admission.
 */

import { matchEnclosure, matchResident, parseDate } from "../text";
import type { IntentParser } from "../types";

const HOSPITAL_RE =
  /(?<![a-z])(hospital|hospitalise|hospitalize|hospitalised|hospitalized|admit|admitted)(?![a-z])|โรงพยาบาล|รพ\.?/i;

const RETURN_RE =
  /(?<![a-z])(back|returns?|returned|returning|discharge|discharged|home|out)(?![a-z])|กลับ|ออกจาก/i;

export const hospitalReturnIntent: IntentParser = {
  intent: "hospital-return",
  parse(text, ctx) {
    if (!HOSPITAL_RE.test(text) || !RETURN_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    // "back to B1" is allowed but rare; null means the enclosure they were
    // in before, which is what the return form defaults to.
    const enclosure = matchEnclosure(text, ctx);
    return {
      draft: {
        kind: "hospital-return",
        residentId: resident.id,
        enclosureId: enclosure.id,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};

export const hospitalIntent: IntentParser = {
  intent: "hospital",
  parse(text, ctx) {
    if (!HOSPITAL_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    return {
      draft: {
        kind: "hospital",
        residentId: resident.id,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};
