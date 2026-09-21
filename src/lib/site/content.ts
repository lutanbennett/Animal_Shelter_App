import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";

/**
 * The site_content singleton (0018, 0041, 0059): the public site's
 * settings — hero photo, tagline, contact details, visiting hours, the
 * featured resident. Long-form copy lives in site_pages (see pages.ts).
 */
export type SiteContent = {
  hero_drive_file_id: string | null;
  hero_alt: string;
  hero_alt_th: string | null;
  tagline: string;
  tagline_th: string | null;
  contact_email: string | null;
  contact_address: string | null;
  contact_phone: string | null;
  contact_line: string | null;
  contact_map_url: string | null;
  visiting_hours: string | null;
  visiting_hours_th: string | null;
  featured_resident_id: string | null;
};

export const SITE_CONTENT_COLUMNS =
  "hero_drive_file_id, hero_alt, hero_alt_th, tagline, tagline_th, contact_email, contact_address, contact_phone, contact_line, contact_map_url, visiting_hours, visiting_hours_th, featured_resident_id";

export async function loadSiteContent(
  supabase: SupabaseClient,
): Promise<SiteContent | null> {
  const { data } = await supabase
    .from("site_content")
    .select(SITE_CONTENT_COLUMNS)
    .eq("id", true)
    .limit(1)
    .returns<SiteContent[]>();
  return data?.[0] ?? null;
}

/**
 * A paired-column label (`tagline` / `tagline_th`) in the reader's
 * language — the `name_th` rule: the Thai when set and wanted, else the
 * English. Empty strings count as unset.
 */
export function pairedText(
  locale: Locale,
  en: string | null | undefined,
  th: string | null | undefined,
): string {
  if (locale === "th" && th?.trim()) return th.trim();
  return en?.trim() ?? "";
}

/**
 * A LINE contact as a link. Admins type either an id ("@lannacare") or a
 * full add-friend URL; an id becomes the line.me "add friend" link, and
 * the label is always what they typed.
 */
export function lineLink(contactLine: string | null | undefined): {
  href: string;
  label: string;
} | null {
  const value = contactLine?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return { href: value, label: value };
  const id = value.replace(/^@/, "");
  return { href: `https://line.me/R/ti/p/~${encodeURIComponent(id)}`, label: value };
}

/** Visiting hours as lines, one per day or range. */
export function visitingHoursLines(
  locale: Locale,
  content: Pick<SiteContent, "visiting_hours" | "visiting_hours_th"> | null,
): string[] {
  return pairedText(locale, content?.visiting_hours, content?.visiting_hours_th)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
