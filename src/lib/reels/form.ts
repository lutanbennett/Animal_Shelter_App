/**
 * What the reel forms carry and how the description's #tags are split, in one place for the client and the server.
 * Pure: the one import is the note-tags text module the resident notes and the meme library's residents already use
 * (src/lib/note-tags/text.ts), so a reel's "#Billy" means exactly what it means in a note.
 *
 * A reel has ONE text box, its description (0322). A "#name" picked from the resident list becomes a reel_residents
 * row; any other "#word" is a free hashtag and goes to reels.tags (cap 30, like memes.tags). Nothing is matched by
 * typing: a resident is linked only by being picked, so a hashtag that happens to be a resident's name stays a word.
 */
import { tagsPresentIn, tagText, type NoteTag } from "../note-tags/text";

export const REEL_DESCRIPTION_MAX = 2000;
export const REEL_TAG_MAX = 40;
export const REEL_TAGS_MAX = 30;
export const REEL_NOTE_MAX = 500;

export type ReelFields = {
  description: string;
  /** yyyy-mm-dd, typed by a person. */
  dateTaken: string;
  picks: NoteTag[];
};

export type ReelSplit = { residentIds: string[]; tags: string[] };

/** The residents still named in the text and the free hashtags left once those names are taken out. */
export function splitDescription(description: string, picks: readonly NoteTag[]): ReelSplit {
  const present = tagsPresentIn(description, picks);
  let rest = description;
  // Longest first, so "#Billy Bob" is removed whole before "#Billy" is looked for.
  for (const tag of [...present].sort((a, b) => b.name.length - a.name.length)) {
    rest = rest.split(tagText(tag.name)).join(" ");
  }
  const seen = new Set<string>();
  for (const match of rest.matchAll(/(^|\s)#([^\s#]+)/g)) {
    const word = match[2].replace(/[.,;:!?)\]}'"]+$/u, "").toLowerCase().slice(0, REEL_TAG_MAX);
    if (word) seen.add(word);
  }
  return { residentIds: present.map((p) => p.id), tags: [...seen].slice(0, REEL_TAGS_MAX) };
}

export type ReelFieldError = "descriptionLong" | "dateTaken";

/** The first thing wrong with the words or the date, or null. The description may be empty: the video is the reel. */
export function checkReelFields(f: { description: string; dateTaken: string }): ReelFieldError | null {
  if (f.description.length > REEL_DESCRIPTION_MAX) return "descriptionLong";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.dateTaken) || Number.isNaN(new Date(f.dateTaken).getTime())) return "dateTaken";
  return null;
}

/** Case-insensitive "does this reel's description, a tag or a tagged resident contain the words typed". */
export function matchesReelSearch(reel: { description: string; tags: readonly string[] }, typed: string): boolean {
  const term = typed.trim().toLowerCase().replace(/^#/, "");
  if (!term) return true;
  return reel.description.toLowerCase().includes(term) || reel.tags.some((t) => t.includes(term));
}

/** "1:05" from milliseconds; empty when the length is unknown. */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return "";
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
