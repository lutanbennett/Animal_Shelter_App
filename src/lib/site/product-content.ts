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

/** The shapes the database accepts (0441 checks), so the console can refuse before asking. */
export const PRODUCT_PAGE_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
export const PRODUCT_KEY_RE = /^[A-Za-z0-9._-]{1,200}$/;

/**
 * The dictionary's words with the console's rows laid over them (#pcmsx). Walks `base` (a dictionary subtree, already in the
 * reader's language) and, for every string, asks the rows for `prefix + path` and keeps the dictionary's own string when there is
 * no row, so a missing or deleted row can never blank a page: the dictionary is the fallback, by design. Arrays are walked by
 * index and objects by key, matching the dotted keys the seed (0442) was generated with. `skip` names keys that are code, not
 * words (a link's slug, a nested subtree read as its own page), and they are copied as they are.
 */
export function overlayProductText<T>(content: ProductPageContent, locale: Locale, base: T, skip: readonly string[] = [], prefix = ""): T {
  if (typeof base === "string") return productText(content, prefix, locale, base) as T;
  if (Array.isArray(base)) return base.map((v, i) => overlayProductText(content, locale, v, skip, prefix ? `${prefix}.${i}` : `${i}`)) as T;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(base as Record<string, unknown>)) {
      out[k] = skip.includes(k) ? v : overlayProductText(content, locale, v, skip, prefix ? `${prefix}.${k}` : k);
    }
    return out as T;
  }
  return base;
}
