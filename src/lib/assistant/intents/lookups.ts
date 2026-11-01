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

/** Numbers a shelter would say aloud, to twenty, in English and Thai; recognition only, never shown. */
const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  หนึ่ง: 1, สอง: 2, สาม: 3, สี่: 4, ห้า: 5, หก: 6, เจ็ด: 7, แปด: 8, เก้า: 9, สิบ: 10,
};
const THAI_DIGITS = "๐๑๒๓๔๕๖๗๘๙";
const QUANTITY = "\\d{1,2}|[" + THAI_DIGITS + "]{1,2}|" + Object.keys(NUMBER_WORDS).join("|");
const ANIMAL = "(?:dogs?|cats?|animals?|residents?|ตัว)";
const WANTED_RE = new RegExp(
  "(?:(?:for|สำหรับ)\\s*(" + QUANTITY + ")(?![\\w\\d])|(" + QUANTITY + ")\\s*" + ANIMAL + ")",
  "i",
);
/** A quantity that is plainly being asked for but that this parser cannot read. */
const UNREADABLE_RE = new RegExp(
  "(?:for|สำหรับ)\\s+(?:(?:a\\s+)?(?:few|couple|several|some|many|multiple|lots|bunch)|\\d{3,}|(?:thirty|forty|fifty|sixty|hundred)\\w*)(?:\\s+of)?\\s+" +
    ANIMAL,
  "i",
);

function readQuantity(token: string): number {
  const thai = [...token].map((c) => THAI_DIGITS.indexOf(c));
  if (thai.every((d) => d >= 0)) return Number(thai.join(""));
  return /^\d+$/.test(token) ? Number(token) : NUMBER_WORDS[token.toLowerCase()];
}

/**
 * "room for 2", "space for two dogs", "2 dogs". No quantity at all reads as one
 * (null). A quantity that is there but cannot be read ("room for a few dogs") is
 * "unreadable", so the question is declined rather than answered for one.
 */
function placesWanted(text: string): number | null | "unreadable" {
  const m = text.match(WANTED_RE);
  if (m) return readQuantity(m[1] ?? m[2]);
  return UNREADABLE_RE.test(text) ? "unreadable" : null;
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
    const places = placesWanted(text);
    if (places === "unreadable") return null;
    return {
      draft: { kind: "find-enclosure", zoneId: matchZone(text, ctx).id, places },
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
