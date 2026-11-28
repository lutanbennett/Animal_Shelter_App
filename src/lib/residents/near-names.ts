// Do two resident names look like the same animal? Used by the intake wizard
// (src/app/residents/new: warns before a new resident takes a name in use;
// moved here from scripts/lib/near-names.mjs on 2026-11-27, rules unchanged),
// by load-residents.mjs
// (to warn about near-duplicates before a bulk load) and correct-resident.mjs
// (to refuse removing one resident in favour of another with an unrelated
// name). Kept deliberately small and explainable: every match comes back with
// the one plain-English reason it matched, so a human can rule on it.
//
// The miss that prompted it (backlog, 2026-10-06): Left Zone's "Noon (Daeng)"
// against the Blue upload's "Noon". The exact-name check passed it.
//
// Three rules, tried in order:
//   1. the same name once a bracket tag is dropped   "Noon" ~ "Noon (Daeng)"
//      or one name is the other's bracket tag         "Daeng" ~ "Noon (Daeng)"
//   2. the same Thai name                             (both filled in)
//   3. another name it goes by (other_names, #dupnx)  "Lucky" ~ "Bob" known as "Lucky"
//      other_names is one text column, split on , ; / and new lines. Exact
//      (normalised) only, never close spelling: every alias would multiply
//      the noise. As strong as rule 1, but its reason says which field matched.
//   4. a number added to the same name                "Tiger" ~ "Tiger 2"
//   5. close spelling, on the names without tags      "Lucky" ~ "Lucy"
//      one letter apart if both are 4+ letters, two if both are 8+.
//      Shorter names are left out: "Max" and "Mia" are two letters apart and
//      plainly different dogs, and a list full of those trains people to skip it.
//      A TRAILING number is dropped first (#dupnx): "Tiger 2" and "Tiger 3"
//      are siblings numbered on purpose (nextNumberedName) and no longer
//      warn; a digit anywhere else still counts as a letter.

/** Lower case, no accents, no punctuation, single spaces. Thai letters are kept. */
export function normaliseName(text: unknown): string {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}

/** other_names split into its names, normalised: "Bob, Bobby / ลัคกี้" → ["bob", "bobby", "ลัคกี้"] */
export function otherNameList(text: unknown): string[] {
  return String(text ?? "")
    .split(/[,;/\n]/)
    .map(normaliseName)
    .filter(Boolean);
}

const TRAILING_NUMBER = /^(.*\D)\s(\d+)$/;

/** "tiger 2" → { base: "tiger", number: "2" }; no trailing number → number null. */
function splitNumber(core: string): { base: string; number: string | null } {
  const m = core.match(TRAILING_NUMBER);
  return m ? { base: m[1].trim(), number: m[2] } : { base: core, number: null };
}

const BRACKETS = /[([{]([^)\]}]*)[)\]}]/g;

/** "Noon (Daeng)" → { core: "noon", tags: ["daeng"] } */
export function nameParts(name: unknown): { core: string; tags: string[] } {
  const text = String(name ?? "");
  const tags = [...text.matchAll(BRACKETS)]
    .flatMap((m) => m[1].split(/[,/]/))
    .map(normaliseName)
    .filter(Boolean);
  return { core: normaliseName(text.replace(BRACKETS, " ")), tags };
}

/** Levenshtein distance, stopping early once it passes `limit`. */
function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > limit) return limit + 1;
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Why `a` and `b` look like the same animal, or null if they don't. Each is
 * `{ name, thaiName, otherNames }`. An exact (case-insensitive) name match also returns
 * null: the loader refuses those on its own, and they need no second line.
 */
export function nearMatchReason(a: NamedResident, b: NamedResident): string | null {
  if (normaliseName(a.name) && normaliseName(a.name) === normaliseName(b.name)) return null;

  const pa = nameParts(a.name);
  const pb = nameParts(b.name);
  if (pa.core && pa.core === pb.core) return "the same name once the bracket tag is dropped";
  if ((pa.core && pb.tags.includes(pa.core)) || (pb.core && pa.tags.includes(pb.core))) {
    return "one name is the other's bracket tag";
  }

  const ta = normaliseName(a.thaiName);
  const tb = normaliseName(b.thaiName);
  if (ta && ta === tb) return "the same Thai name";

  const oa = otherNameList(a.otherNames);
  const ob = otherNameList(b.otherNames);
  const namesA = new Set([pa.core, ...oa].filter(Boolean));
  const namesB = new Set([pb.core, ...ob].filter(Boolean));
  const alias = oa.find((n) => namesB.has(n)) ?? ob.find((n) => namesA.has(n));
  if (alias) return `the same as another name it goes by ("${alias}")`;

  const na = splitNumber(pa.core);
  const nb = splitNumber(pb.core);
  if (na.base && na.base === nb.base) {
    // One numbered, one bare: the whole point of the numbering, so say it.
    // Both numbered, different numbers: siblings named on purpose, no warning.
    return na.number === null || nb.number === null ? "the same name with a number added" : null;
  }

  const shorter = Math.min(na.base.length, nb.base.length);
  const limit = shorter >= 8 ? 2 : shorter >= 4 ? 1 : 0;
  if (limit) {
    const d = distance(na.base, nb.base, limit);
    if (d <= limit) return `close spelling (${d} letter${d === 1 ? "" : "s"} different)`;
  }
  return null;
}

export type NamedResident = { name: unknown; thaiName?: unknown; otherNames?: unknown };

/** An exact clash, by the loader's own test: the same name once case, accents and punctuation go. */
export function sameName(a: unknown, b: unknown): boolean {
  const na = normaliseName(a);
  return na !== "" && na === normaliseName(b);
}

const NUMBERED = /^(.*?)\s+(\d+)$/;

/**
 * The name to offer when `name` is already taken: the base name and one more
 * than the highest number any resident already carries on it. A bare "Tiger"
 * counts as 1, so Tiger → "Tiger 2"; Tiger and Tiger 2 → "Tiger 3"; Tiger and
 * Tiger 5 → "Tiger 6" (one past the highest, never filling a gap, so the
 * newest Tiger always has the biggest number). Typing "Tiger 2" when it is
 * taken offers the next Tiger too. Null when nothing clashes.
 */
export function nextNumberedName(name: string, existing: readonly unknown[]): string | null {
  const typed = name.trim().replace(/\s+/g, " ");
  if (!existing.some((e) => sameName(e, typed))) return null;
  const typedNumber = typed.match(NUMBERED);
  const base = typedNumber ? typedNumber[1] : typed;
  let highest = 1;
  for (const e of existing) {
    const n = String(e ?? "").trim().match(NUMBERED);
    if (n && sameName(n[1], base)) highest = Math.max(highest, Number(n[2]));
  }
  return `${base} ${highest + 1}`;
}
