/**
 * What the Add and Edit forms carry, and how the words are checked, in one place for the client and the Server
 * Actions. Plain functions, no imports, so a test can load it under node.
 */
export const MEME_TITLE_MAX = 120;
export const MEME_CAPTION_MAX = 2000;
export const MEME_TAG_MAX = 40;
export const MEME_TAGS_MAX = 30;
export const MEME_NOTE_MAX = 500;

export type MemeFields = {
  title: string;
  captionEn: string;
  captionTh: string;
  /** Comma-separated as typed; parseTags() normalises it. */
  tags: string;
  residentIds: string[];
};

/** "funny, Sad , funny" -> ["funny", "sad"]: lower-cased, trimmed, deduplicated, blanks dropped. */
export function parseTags(typed: string): string[] {
  const seen = new Set<string>();
  for (const raw of typed.split(/[,\n]/)) {
    const tag = raw.trim().toLowerCase().slice(0, MEME_TAG_MAX);
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, MEME_TAGS_MAX);
}

export type MemeFieldError = "title" | "titleLong" | "captionLong";

/** The first thing wrong with the words, or null. The database checks the title too; this is for a sentence. */
export function checkMemeFields(f: MemeFields): MemeFieldError | null {
  const title = f.title.trim();
  if (!title) return "title";
  if (title.length > MEME_TITLE_MAX) return "titleLong";
  if (f.captionEn.length > MEME_CAPTION_MAX || f.captionTh.length > MEME_CAPTION_MAX) return "captionLong";
  return null;
}

/** A share's link: optional, https only (the database refuses anything else). */
export function checkPostUrl(url: string): boolean {
  const u = url.trim();
  return u === "" || /^https:\/\/\S+$/.test(u);
}

/** Case-insensitive "does this meme's caption or title contain the words typed". */
export function matchesSearch(meme: { title: string; caption_en: string | null; caption_th: string | null }, typed: string): boolean {
  const term = typed.trim().toLowerCase();
  if (!term) return true;
  return [meme.title, meme.caption_en ?? "", meme.caption_th ?? ""].some((s) => s.toLowerCase().includes(term));
}
