/**
 * The three questions that write nothing: "where is Panda", "who is in
 * B1", "what is due this week". They are answered inline from the server
 * rather than previewed, so they are the only intents a volunteer gets.
 *
 * They are tried first, because a question about a move ("where is Panda
 * going") should never be read as a move.
 */

import { matchEnclosure, matchResident } from "../text";
import type { IntentParser } from "../types";

const WHERE_RE = /(?<![a-z])where(?![a-z])|อยู่ที่ไหน|อยู่ไหน|อยู่กรงไหน/i;
const WHO_RE = /(?<![a-z])who(?:'s)?(?![a-z])|ใคร/i;
const IN_RE = /(?<![a-z])(in|inside|at)(?![a-z])|อยู่ใน|ใน/i;
const DUE_RE =
  /(?<![a-z])(due|overdue|upcoming)(?![a-z])|coming up|ครบกำหนด|ถึงกำหนด|ที่ต้องทำ/i;

export const whereIntent: IntentParser = {
  intent: "where",
  parse(text, ctx) {
    if (!WHERE_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    return {
      draft: { kind: "where", residentId: resident.id },
      residentCandidates: resident.candidates,
    };
  },
};

export const whoIntent: IntentParser = {
  intent: "who",
  parse(text, ctx) {
    if (!WHO_RE.test(text) || !IN_RE.test(text)) return null;
    return {
      draft: { kind: "who", enclosureId: matchEnclosure(text, ctx).id },
      residentCandidates: [],
    };
  },
};

/**
 * How far ahead "due" looks. The dashboard's own window is seven days
 * (src/lib/management/report.ts, `vetVisitsDue`), so that is the default
 * and what "this week" means here.
 */
function dueWindowDays(text: string): number {
  if (/\btoday\b|วันนี้/.test(text)) return 1;
  if (/\btomorrow\b|พรุ่งนี้/.test(text)) return 2;
  if (/\b(month|30 days)\b|เดือน/.test(text)) return 30;
  if (/\bnext week\b|สัปดาห์หน้า/.test(text)) return 14;
  return 7;
}

export const dueIntent: IntentParser = {
  intent: "due",
  parse(text) {
    if (!DUE_RE.test(text)) return null;
    return { draft: { kind: "due", days: dueWindowDays(text) }, residentCandidates: [] };
  },
};
