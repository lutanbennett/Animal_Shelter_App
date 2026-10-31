/**
 * The questions that write nothing: "where is Panda", "who is in B1",
 * "what is due this week", "which enclosure has space" and "tell me about
 * Panda". They are answered inline from the server rather than previewed,
 * so they are the intents anyone holding `assistant.ask` gets.
 *
 * They are tried first, because a question about a move ("where is Panda
 * going") should never be read as a move.
 */

import { matchEnclosure, matchResident, matchZone } from "../text";
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

const SPACE_RE =
  /(?<![a-z])(space|spaces|room|free|empty|vacant|available)(?![a-z])|ว่าง|ที่ว่าง/i;

/** "room for 2", "space for two dogs", "2 dogs". Nothing found reads as one. */
function placesWanted(text: string): number | null {
  const forN = text.match(/(?:for|สำหรับ)\s+(\d{1,2})(?![\d])/);
  if (forN) return Number(forN[1]);
  const nAnimals = text.match(/(\d{1,2})\s*(?:dogs?|cats?|animals?|residents?|ตัว)/);
  return nAnimals ? Number(nAnimals[1]) : null;
}

/**
 * "Which enclosure has space?" — asked before "where is …", because "where
 * is there room for two dogs" is this question and not a resident's
 * whereabouts.
 *
 * It declines any sentence that names a resident, which is what keeps it off
 * "where can I put Panda" — that is a move, and the move parser should have
 * it. The one cost is that "is there room for Panda" is read as a move too,
 * which is the safer of the two readings: it ends on a card, not an answer.
 */
export const findEnclosureIntent: IntentParser = {
  intent: "find-enclosure",
  parse(text, ctx) {
    if (!SPACE_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    if (resident.id || resident.candidates.length) return null;
    return {
      draft: { kind: "find-enclosure", zoneId: matchZone(text, ctx).id, places: placesWanted(text) },
      residentCandidates: [],
    };
  },
};

const SUMMARY_RE =
  /(?<![a-z])(summary|summarise|summarize|overview)(?![a-z])|tell me about|how is|how's|how are|update on|สรุป|เป็นอย่างไร|เป็นไง/i;

/** "Tell me about Panda", "how is Panda doing?" — one resident, gathered. */
export const summaryIntent: IntentParser = {
  intent: "summary",
  parse(text, ctx) {
    if (!SUMMARY_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    // Without a resident there is nothing to summarise, and "how is it going"
    // is not a request. The candidates still go through, so an ambiguous name
    // is asked about rather than guessed.
    if (!resident.id && resident.candidates.length === 0) return null;
    return {
      draft: { kind: "summary", residentId: resident.id },
      residentCandidates: resident.candidates,
    };
  },
};
