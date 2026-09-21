import type { Locale } from "@/lib/i18n/locales";

/**
 * Free text across languages (0056). A translatable field is a
 * (table, column) pair listed in `translatable_fields`; each record's
 * field has at most one `translations` row — the text in the *other*
 * language — whose status a manager controls. See docs/decisions.md.
 */

export type TranslationStatus = "pending" | "draft" | "approved" | "stale";

/** A row of `translations` (and the first columns of `translation_queue`). */
export type TranslationRow = {
  id: string;
  table_name: string;
  row_id: string;
  column_name: string;
  source_lang: Locale;
  target_lang: Locale;
  /** The source as it is now (the trigger keeps it in step). */
  source_text: string;
  /** The source as it was when `text` was last written or approved. */
  reviewed_source_text: string | null;
  text: string | null;
  status: TranslationStatus;
  engine: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** `translation_queue`: a row plus what the manager needs to place it. */
export type TranslationQueueRow = TranslationRow & {
  /** The review path (0057): a manager approves 'reviewed'; 'machine' is shown labelled, unreviewed. */
  tier: "reviewed" | "machine";
  record_label: string | null;
  record_path: string | null;
};

/**
 * The `translations` jsonb on the public views: approved rows only, keyed
 * by column — `{ bio: { lang: "th", text: "…" } }` — or null when the
 * record has none.
 */
export type PublicTranslations = Record<
  string,
  { lang: Locale; text: string }
> | null;

/** `residents.bio` — the key the dictionary labels fields by. */
export function fieldKey(table: string, column: string) {
  return `${table}.${column}`;
}

export const ROW_COLUMNS =
  "id, table_name, row_id, column_name, source_lang, target_lang, source_text, reviewed_source_text, text, status, engine, reviewed_by, reviewed_at, created_at, updated_at";
