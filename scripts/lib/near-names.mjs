// Do two resident names look like the same animal? Used by load-residents.mjs
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
//   3. close spelling, on the names without tags      "Lucky" ~ "Lucy"
//      one letter apart if both are 4+ letters, two if both are 8+.
//      Shorter names are left out: "Max" and "Mia" are two letters apart and
//      plainly different dogs, and a list full of those trains people to skip it.

/** Lower case, no accents, no punctuation, single spaces. Thai letters are kept. */
export function normaliseName(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .trim();
}

const BRACKETS = /[([{]([^)\]}]*)[)\]}]/g;

/** "Noon (Daeng)" → { core: "noon", tags: ["daeng"] } */
export function nameParts(name) {
  const text = String(name ?? "");
  const tags = [...text.matchAll(BRACKETS)]
    .flatMap((m) => m[1].split(/[,/]/))
    .map(normaliseName)
    .filter(Boolean);
  return { core: normaliseName(text.replace(BRACKETS, " ")), tags };
}

/** Levenshtein distance, stopping early once it passes `limit`. */
function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
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
 * `{ name, thaiName }`. An exact (case-insensitive) name match also returns
 * null: the loader refuses those on its own, and they need no second line.
 */
export function nearMatchReason(a, b) {
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

  const shorter = Math.min(pa.core.length, pb.core.length);
  const limit = shorter >= 8 ? 2 : shorter >= 4 ? 1 : 0;
  if (limit) {
    const d = distance(pa.core, pb.core, limit);
    if (d <= limit) return `close spelling (${d} letter${d === 1 ? "" : "s"} different)`;
  }
  return null;
}
