/** "Move Panda to B1 today" — the demo's first intent, unchanged. */

import { matchEnclosure, matchResident, parseDate } from "../text";
import type { IntentParser } from "../types";

const MOVE_RE =
  /(?<![a-z])(move|moves|moving|moved|transfer|relocate|put|shift)(?![a-z])|ย้าย/i;

export const moveIntent: IntentParser = {
  intent: "move",
  parse(text, ctx) {
    if (!MOVE_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    return {
      draft: {
        kind: "move",
        residentId: resident.id,
        enclosureId: matchEnclosure(text, ctx).id,
        date: parseDate(text, ctx.now),
      },
      residentCandidates: resident.candidates,
    };
  },
};
