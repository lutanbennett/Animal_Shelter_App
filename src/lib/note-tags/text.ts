/**
 * Hashtags in a resident's notes (docs/decisions/2026-11-02-resident-tags-app.md). Pure and client-safe.
 *
 * The note keeps the name as it was written ("#Billy bit this resident"); the link stores the resident's id, picked
 * from the list, so a typed name is never matched against residents. A tag counts only while its "#name" is still in
 * the text: when the words are edited out, the link goes with them.
 */

export type NoteTag = { id: string; name: string };

/** The hidden field next to a note box carries its picks as JSON under this suffix. */
export const TAGS_FIELD_SUFFIX = "__tags";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** What the picker puts in the text for a resident. */
export function tagText(name: string): string {
  return `#${name}`;
}

/** Reads the hidden field defensively; anything malformed is no tags (and so no links). */
export function parseTagField(raw: unknown): NoteTag[] {
  if (typeof raw !== "string" || raw === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const out: NoteTag[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const { id, name } = item as { id?: unknown; name?: unknown };
    if (typeof id !== "string" || !UUID.test(id) || typeof name !== "string" || name.trim() === "") continue;
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: key, name: name.trim() });
  }
  return out;
}

/** The picks whose "#name" is still in the text, one per resident. */
export function tagsPresentIn(text: string | null | undefined, tags: readonly NoteTag[]): NoteTag[] {
  if (!text) return [];
  return tags.filter((tag) => text.includes(tagText(tag.name)));
}

export type NoteSegment = { text: string; tag?: NoteTag };

/**
 * Splits a note into plain text and tagged names, for showing the names as links. Longest name first, so "#Billy Bob"
 * wins over "#Billy" when both residents are tagged. A name that no longer matches the text is simply not a link.
 */
export function segmentNote(text: string, tags: readonly NoteTag[]): NoteSegment[] {
  const ordered = [...tags].sort((a, b) => b.name.length - a.name.length);
  const segments: NoteSegment[] = [];
  let rest = text;
  while (rest.length > 0) {
    let best: { index: number; tag: NoteTag } | null = null;
    for (const tag of ordered) {
      const index = rest.indexOf(tagText(tag.name));
      if (index === -1) continue;
      if (best === null || index < best.index) best = { index, tag };
    }
    if (best === null) {
      segments.push({ text: rest });
      break;
    }
    if (best.index > 0) segments.push({ text: rest.slice(0, best.index) });
    const written = tagText(best.tag.name);
    segments.push({ text: written, tag: best.tag });
    rest = rest.slice(best.index + written.length);
  }
  return segments;
}

/** The "#word" being typed at the caret, or null: what the picker searches on. */
export function openTagQuery(value: string, caret: number): { start: number; query: string } | null {
  const before = value.slice(0, caret);
  const hash = before.lastIndexOf("#");
  if (hash === -1) return null;
  if (hash > 0 && !/\s/.test(before[hash - 1])) return null;
  const query = before.slice(hash + 1);
  if (query.includes("\n") || query.length > 40) return null;
  return { start: hash, query };
}

/**
 * The public site shows a tagged name as an ordinary name (decision 2026-11-02, tags-remaining-boxes): no link and no
 * lookup, so nothing on the public pages points at another resident. The "#" is dropped from every "#word" that starts
 * a word, wherever it came from (the original or an approved translation).
 */
export function stripTagMarkup(text: string): string {
  return text.replace(/(^|\s)#(?=\S)/g, "$1");
}
