import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The cooperjaidee.org product pages' words and photos (#pcmsx, 0441). One row per (page, key), English and Thai side by
 * side, so the Thai is approved the moment it is written: there is no translation queue for it to wait in, and so nothing
 * like `localizedField` is used here. Pages are 'home' and 'feature-<slug>'; a key is a dotted path ('heading',
 * 'bands.0.name'). A new page or a new line is rows, never a migration.
 */
export type ProductEntry = { en: string; th: string; driveFileId: string | null };
export type ProductPageContent = Map<string, ProductEntry>;

type Row = { key: string; en: string; th: string; drive_file_id: string | null };

/** Every row of one page, by key. A page with no rows (or a failed read) is an empty map, so a caller falls back to its own words. */
export async function loadProductPage(supabase: SupabaseClient, page: string): Promise<ProductPageContent> {
  const { data } = await supabase
    .from("public_platform_content")
    .select("key, en, th, drive_file_id")
    .eq("page", page)
    .returns<Row[]>();
  return new Map((data ?? []).map((r) => [r.key, { en: r.en, th: r.th, driveFileId: r.drive_file_id }]));
}

/**
 * A line in the reader's language. Thai that has not been written reads as the English rather than as blank, and a key with
 * no row (or a blank English) gives `fallback`, so the page never goes empty.
 */
export function productText(content: ProductPageContent, key: string, locale: Locale, fallback = ""): string {
  const e = content.get(key);
  if (!e) return fallback;
  const th = e.th.trim();
  const en = e.en.trim();
  if (locale === "th" && th) return th;
  return en || fallback;
}

/** The Drive file id of a key's photo, or null when it has none. */
export function productPhotoId(content: ProductPageContent, key: string): string | null {
  return content.get(key)?.driveFileId?.trim() || null;
}
