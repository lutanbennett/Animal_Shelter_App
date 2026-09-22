/**
 * The demo assistant's whole "brain": a keyword parser that turns one typed
 * request into a draft of one of two actions — move a resident, or book a
 * vet visit. No model, no API, no guessing: anything it can't find in the
 * text is left null for the person to fill in on the preview card.
 *
 * Understanding is hard-coded here; the doing (src/app/assistant/actions.ts)
 * is the app's real move helper and vet-visit RPC. If a real assistant is
 * ever built, this file is what gets replaced and the card is what stays.
 *
 * Names are matched against the rows the page loaded, so "Panda" only
 * resolves when a resident is actually called that. Latin names must stand
 * alone in the text (so "Pan" doesn't hit "Panda"); Thai has no word
 * boundaries, so a Thai name matches as a substring.
 */

export type ParserResident = {
  id: string;
  name: string;
  thaiName: string | null;
  code: string;
};

export type ParserEnclosure = { id: string; name: string; nameTh: string | null };

export type ParserVet = { id: string; name: string; clinicName: string | null };

export type MoveDraft = {
  kind: "move";
  residentId: string | null;
  enclosureId: string | null;
  /** YYYY-MM-DD, or null when the text didn't say. */
  date: string | null;
};

export type VetVisitDraft = {
  kind: "vet";
  residentId: string | null;
  vetId: string | null;
  date: string | null;
  /** HH:MM, or null when the text didn't say. */
  time: string | null;
  reason: string | null;
};

export type Draft = MoveDraft | VetVisitDraft;

export type ParseResult = {
  /** null when the request isn't a move or a vet booking. */
  draft: Draft | null;
  /** How many residents the text could have meant; >1 means "pick one". */
  residentMatches: number;
};

const VET_RE =
  /(?<![a-z])(vet|vets|clinic|appointment|check-?up|vaccin[a-z]*|book)(?![a-z])|หมอ|สัตวแพทย์|คลินิก|นัด|วัคซีน/i;
const MOVE_RE =
  /(?<![a-z])(move|moves|moving|moved|transfer|relocate|put|shift)(?![a-z])|ย้าย/i;

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

const WEEKDAYS_EN = [
  ["sunday", "sun"],
  ["monday", "mon"],
  ["tuesday", "tue", "tues"],
  ["wednesday", "wed"],
  ["thursday", "thu", "thur", "thurs"],
  ["friday", "fri"],
  ["saturday", "sat"],
];
const WEEKDAYS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];

// Words a vet's name is matched on must be more than a title.
const VET_STOPWORDS = new Set(["dr", "dr.", "doctor", "vet", "clinic", "the", "and"]);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAscii(s: string) {
  return /^[\x00-\x7f]*$/.test(s);
}

/** Whole-word for Latin text, plain substring for anything else. */
function mentions(text: string, name: string | null | undefined): boolean {
  const n = (name ?? "").trim().toLowerCase();
  if (n.length < 2) return false;
  if (!isAscii(n)) return text.includes(n);
  return new RegExp(`(?<![a-z0-9])${escapeRegExp(n)}(?![a-z0-9])`).test(text);
}

/**
 * Picks the option whose (longest) name the text mentions. Several
 * options sharing that name is ambiguity, reported as a count so the UI can
 * say "which one?" rather than the parser picking.
 */
function matchByName<T extends { id: string }>(
  text: string,
  options: T[],
  namesOf: (o: T) => (string | null | undefined)[],
): { id: string | null; matches: number } {
  let best: { length: number; ids: Set<string> } | null = null;
  for (const option of options) {
    for (const name of namesOf(option)) {
      if (!mentions(text, name)) continue;
      const length = (name ?? "").trim().length;
      if (!best || length > best.length) {
        best = { length, ids: new Set([option.id]) };
      } else if (length === best.length) {
        best.ids.add(option.id);
      }
    }
  }
  if (!best) return { id: null, matches: 0 };
  return {
    id: best.ids.size === 1 ? [...best.ids][0] : null,
    matches: best.ids.size,
  };
}

function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function plusDays(now: Date, days: number) {
  return isoLocal(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

/**
 * today / tomorrow / yesterday, a weekday name (the next one, today if it
 * is today), or an ISO date — in English or Thai. Nothing else.
 */
export function parseDate(text: string, now: Date): string | null {
  const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];

  if (/\btoday\b|วันนี้/.test(text)) return plusDays(now, 0);
  if (/\btomorrow\b|พรุ่งนี้/.test(text)) return plusDays(now, 1);
  if (/\byesterday\b|เมื่อวาน/.test(text)) return plusDays(now, -1);

  for (let day = 0; day < 7; day++) {
    const en = WEEKDAYS_EN[day].some((w) =>
      new RegExp(`\\b${w}\\b`).test(text),
    );
    if (en || text.includes(WEEKDAYS_TH[day])) {
      return plusDays(now, (day - now.getDay() + 7) % 7);
    }
  }
  return null;
}

/** "10am", "2.30pm", "14:30" → "HH:MM". A bare number is not a time. */
export function parseTime(text: string): string | null {
  const re = /(?<![a-z0-9])(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?![a-z0-9])/g;
  for (const m of text.matchAll(re)) {
    const [, h, min, ampm] = m;
    if (!min && !ampm) continue;
    let hours = Number(h);
    const minutes = Number(min ?? "0");
    if (minutes > 59) continue;
    if (ampm) {
      if (hours < 1 || hours > 12) continue;
      const pm = ampm.startsWith("p");
      hours = (hours % 12) + (pm ? 12 : 0);
    } else if (hours > 23) {
      continue;
    }
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return null;
}

export function parseRequest(
  input: string,
  data: {
    residents: ParserResident[];
    enclosures: ParserEnclosure[];
    vets: ParserVet[];
  },
  now: Date = new Date(),
): ParseResult {
  const text = input.trim().toLowerCase();
  if (!text) return { draft: null, residentMatches: 0 };

  const isVet = VET_RE.test(text);
  const isMove = MOVE_RE.test(text);
  if (!isVet && !isMove) return { draft: null, residentMatches: 0 };

  // A code is unambiguous; fall back to names only when none was given.
  const byCode = matchByName(text, data.residents, (r) => [r.code]);
  const resident = byCode.matches
    ? byCode
    : matchByName(text, data.residents, (r) => [r.name, r.thaiName]);

  const date = parseDate(text, now);

  if (isVet) {
    const vet = matchByName(text, data.vets, (v) => [
      v.name,
      v.clinicName,
      ...v.name
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !VET_STOPWORDS.has(w)),
    ]);
    const reason = REASONS.find((r) => mentions(text, r)) ?? null;
    return {
      draft: {
        kind: "vet",
        residentId: resident.id,
        vetId: vet.id,
        date,
        time: parseTime(text),
        reason,
      },
      residentMatches: resident.matches,
    };
  }

  const enclosure = matchByName(text, data.enclosures, (e) => [e.name, e.nameTh]);
  return {
    draft: {
      kind: "move",
      residentId: resident.id,
      enclosureId: enclosure.id,
      date,
    },
    residentMatches: resident.matches,
  };
}
