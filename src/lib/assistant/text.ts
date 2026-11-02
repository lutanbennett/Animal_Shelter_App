/**
 * The matching every intent parser shares: find a name in a sentence, find
 * a date, find a time. Promoted unchanged from the demo's single-file
 * parser (src/lib/assistant/demo-parser.ts, 2026-09-22) so the intents can
 * be one small file each.
 *
 * Names are matched against the rows the page loaded, so "Panda" only
 * resolves when a resident is actually called that. Latin names must stand
 * alone in the text (so "Pan" doesn't hit "Panda"); Thai has no word
 * boundaries, so a Thai name matches as a substring.
 */

import type { ParseContext, ParserResident } from "./types";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAscii(s: string) {
  return /^[\x00-\x7f]*$/.test(s);
}

/** Whole-word for Latin text, plain substring for anything else. */
export function mentions(text: string, name: string | null | undefined): boolean {
  const n = (name ?? "").trim().toLowerCase();
  if (n.length < 2) return false;
  if (!isAscii(n)) return text.includes(n);
  return new RegExp(`(?<![a-z0-9])${escapeRegExp(n)}(?![a-z0-9])`).test(text);
}

/**
 * Picks the option whose (longest) name the text mentions. Several options
 * sharing that name is ambiguity, reported as the list of ids so the card
 * can ask "which one?" rather than the parser picking.
 */
export function matchByName<T extends { id: string }>(
  text: string,
  options: T[],
  namesOf: (o: T) => (string | null | undefined)[],
): { id: string | null; candidates: string[] } {
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
  if (!best) return { id: null, candidates: [] };
  const ids = [...best.ids];
  return {
    id: ids.length === 1 ? ids[0] : null,
    candidates: ids.length > 1 ? ids : [],
  };
}

/**
 * A resident code is unambiguous, so it wins; names are only consulted
 * when the sentence didn't carry one.
 */
export function matchResident(
  text: string,
  residents: ParserResident[],
): { id: string | null; candidates: string[] } {
  const byCode = matchByName(text, residents, (r) => [r.code]);
  if (byCode.id || byCode.candidates.length) return byCode;
  const byName = matchByName(text, residents, (r) => [r.name, r.thaiName]);
  if (byName.id || byName.candidates.length) return byName;
  return { id: null, candidates: nearNameMatches(text, residents) };
}

/**
 * The fallback when no whole name is in the sentence: residents whose Latin
 * name has a WORD the sentence also says, so "Gigi" finds "Gigi (1)",
 * "Gigi (2)" and "Gigi Blue". The boundary rule
 * (docs/decisions/2026-11-02-assistant-partial-name-picker.md):
 *  - a name's words are its runs of a-z/0-9, so brackets, spaces and
 *    punctuation are separators, never part of a word;
 *  - a word counts only if it has a letter (the "1" in "Gigi (1)" is a
 *    disambiguator, not a name) and is at least 2 characters;
 *  - it must stand alone in the sentence, as `mentions` already requires;
 *  - Thai names are not looked at: they keep their substring rule.
 * The result is ALWAYS a list to confirm, even for one resident, and never
 * an id: a near match is a guess.
 */
function nearNameMatches(text: string, residents: ParserResident[]): string[] {
  const ids: string[] = [];
  for (const r of residents) {
    const words = (r.name ?? "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
    if (words.some((w) => w.length >= 2 && /[a-z]/.test(w) && mentions(text, w))) ids.push(r.id);
  }
  return ids;
}

export function matchEnclosure(text: string, ctx: ParseContext) {
  return matchByName(text, ctx.enclosures, (e) => [e.name, e.nameTh]);
}

export function matchZone(text: string, ctx: ParseContext) {
  return matchByName(text, ctx.zones, (z) => [z.name, z.nameTh]);
}

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

export function isoLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function plusDays(now: Date, days: number) {
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
    const en = WEEKDAYS_EN[day].some((w) => new RegExp(`\\b${w}\\b`).test(text));
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
