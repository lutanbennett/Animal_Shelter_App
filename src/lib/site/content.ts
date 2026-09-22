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

/**
 * The typical-vet-visit estimate (0071): the flat figure the cashflow
 * forecast uses for a visit that is booked but not yet invoiced.
 *
 * Deliberately not part of SITE_CONTENT_COLUMNS, and so not in SiteContent.
 * It lives on site_content because that is the app's only singleton
 * settings row, but every public page loads SITE_CONTENT_COLUMNS and there
 * is no reason to ship an internal cost figure in the landing page's
 * payload. Only /admin/website and the forecast read it, through here.
 */
export async function loadVetVisitEstimate(
  supabase: SupabaseClient,
): Promise<number | null> {
  const { data } = await supabase
    .from("site_content")
    .select("vet_visit_estimate")
    .eq("id", true)
    .limit(1)
    .returns<{ vet_visit_estimate: number | string | null }[]>();
  // numeric(12, 2) can come back as a string from PostgREST.
  const raw = data?.[0]?.vet_visit_estimate;
  return raw == null ? null : Number(raw);
}
