/**
 * "Book a vet visit for Panda with Dr Somchai on Friday at 10am" — the
 * demo's second intent, unchanged except that it now runs after the
 * hospital parsers, which also mention vets.
 */

import { matchByName, matchResident, mentions, parseDate, parseTime } from "../text";
import type { IntentParser } from "../types";

const VET_RE =
  /(?<![a-z])(vet|vets|clinic|appointment|check-?up|vaccin[a-z]*|book)(?![a-z])|หมอ|สัตวแพทย์|คลินิก|นัด|วัคซีน/i;

const REASONS = [
  "checkup",
  "check-up",
  "check up",
  "vaccination",
  "vaccine",
  "injury",
  "surgery",
  "dental",
  "emergency",
  "sterilisation",
  "sterilization",
  "neutering",
  "spay",
  "blood test",
  "x-ray",
];

// Words a vet's name is matched on must be more than a title.
const VET_STOPWORDS = new Set(["dr", "dr.", "doctor", "vet", "clinic", "the", "and"]);

export const vetIntent: IntentParser = {
  intent: "vet",
  parse(text, ctx) {
    if (!VET_RE.test(text)) return null;
    const resident = matchResident(text, ctx.residents);
    const vet = matchByName(text, ctx.vets, (v) => [
      v.name,
      v.clinicName,
      ...v.name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !VET_STOPWORDS.has(w)),
    ]);
    return {
      draft: {
        kind: "vet",
        residentId: resident.id,
        vetId: vet.id,
        date: parseDate(text, ctx.now),
        time: parseTime(text),
        reason: REASONS.find((r) => mentions(text, r)) ?? null,
      },
      residentCandidates: resident.candidates,
    };
  },
};
