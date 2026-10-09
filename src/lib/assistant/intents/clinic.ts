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

// Words that follow "doctor"/"dr" without being a name: "doctor visit",
// "doctor tomorrow", "doctor for Panda". Ending the name here is what
// keeps a generic "see the doctor" from inventing a doctor called "Visit".
const NAME_ENDERS = new Set([
  "on", "at", "for", "in", "to", "and", "by", "about", "because", "regarding", "please",
  "today", "tomorrow", "yesterday", "next", "this", "visit", "appointment", "checkup",
  "check", "check-up", "vaccination", "vaccine", "injury", "surgery", "dental",
  "emergency", "sterilisation", "sterilization", "neutering", "spay", "blood", "x-ray",
  "vet", "clinic", "hospital", "monday", "tuesday", "wednesday", "thursday", "friday",
  "saturday", "sunday", "mon", "tue", "tues", "wed", "thu", "thur", "thurs", "fri", "sat", "sun",
]);

// Thai has no spaces, so a name runs on into the words after it: "หมอสมชายพรุ่งนี้".
// The name stops at the first of these.
const THAI_NAME_ENDERS = /ให้|ที่|ใน|เมื่อ|วัน|พรุ่งนี้|เวลา|ตอน|เพื่อ|และ|เรื่อง|สำหรับ|ไป|\d/;

const LATIN_TITLE = /(?<![a-z])(?:dr\.?|doctor)\s+/;
const THAI_TITLE = /(?:หมอ|น\.?สพ\.?|สพ\.?ญ\.?)\s*/;

function titleCase(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The doctor a sentence names: "with Dr Somchai", "doctor Somchai Wong",
 * "หมอสมชาย". Only a title opens a name — a bare "with Somchai" might be
 * the clinic — and null when nothing follows the title, so "see the
 * doctor tomorrow" names no one. The text arrives lower-cased
 * (parse.ts), so a Latin name comes back capitalised; the card matches
 * it to the clinic's list, which restores the list's own spelling.
 */
export function parseDoctorName(text: string): string | null {
  const latin = LATIN_TITLE.exec(text);
  if (latin) {
    const words: string[] = [];
    const rest = text.slice(latin.index + latin[0].length).split(/\s+/);
    for (const raw of rest) {
      const word = raw.replace(/[,;!?]+$/, "");
      if (!/^[a-z][a-z.'-]*$/.test(word) || NAME_ENDERS.has(word) || words.length === 2) break;
      words.push(titleCase(word));
      if (word !== raw) break; // a comma ends the name
    }
    if (words.length) return words.join(" ");
  }

  const thai = THAI_TITLE.exec(text);
  if (thai) {
    const rest = text.slice(thai.index + thai[0].length).split(/\s+/)[0] ?? "";
    // "หมอให้" / "หมอพรุ่งนี้": the word after the title is not a name.
    const cut = rest.search(THAI_NAME_ENDERS);
    const name = (cut === -1 ? rest : rest.slice(0, cut)).replace(/[,;!?.]+$/, "");
    if (name.length >= 2) return name;
  }
  return null;
}

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
        clinicId: vet.id,
        date: parseDate(text, ctx.now),
        time: parseTime(text),
        reason: REASONS.find((r) => mentions(text, r)) ?? null,
        // Read from the whole sentence, before the stopword pass above
        // could be thought to have eaten the title. Never asked for.
        doctorName: parseDoctorName(text),
      },
      residentCandidates: resident.candidates,
    };
  },
};
