import type { SupabaseClient } from "@supabase/supabase-js";
import type { Locale } from "@/lib/i18n/locales";
import { localizedField } from "@/lib/translations/localize";
import type { PublicTranslations } from "@/lib/translations/types";

/**
 * The public site's long-form pages (0059): a fixed set of slugs, each a
 * title and a body the admin edits on /admin/website, with the title and
 * body translated through the manager's queue like any other prose.
 */
export const SITE_PAGE_SLUGS = [
  "our-story",
  "how-to-adopt",
  "foster",
  "volunteer",
  "donate",
  // 0099 as relocation, renamed by 0104; at /adopt/international, under
  // Adopt in the menu and the footer and from the adoption listing.
  "international-adoption",
  // 0099; at /friends/join, from the homepage Shelter Friends band,
  // /friends, /donate and Get involved in the menu.
  "shelter-friends-join",
] as const;
export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

/**
 * Where each page shows on the site: its own route, or the section of
 * another page it is part of. The Website admin's "View on site" link and
 * each page's Open Graph url both read this, so a page whose route is not
 * its slug (shelter-friends-join) only has to be told once.
 */
export const SITE_PAGE_PATHS: Record<SitePageSlug, string> = {
  "our-story": "/",
  "how-to-adopt": "/adopt#how-to-adopt",
  foster: "/foster",
  volunteer: "/volunteer",
  donate: "/donate",
  "international-adoption": "/adopt/international",
  "shelter-friends-join": "/friends/join",
};

export function isSitePageSlug(value: string): value is SitePageSlug {
  return (SITE_PAGE_SLUGS as readonly string[]).includes(value);
}

/** A row of public_site_pages: the page plus its approved translations. */
export type PublicSitePage = {
  id: string;
  slug: SitePageSlug;
  title: string;
  body: string;
  translations: PublicTranslations;
};

const COLUMNS = "id, slug, title, body, translations";

export async function loadSitePage(
  supabase: SupabaseClient,
  slug: SitePageSlug,
): Promise<PublicSitePage | null> {
  const { data } = await supabase
    .from("public_site_pages")
    .select(COLUMNS)
    .eq("slug", slug)
    .limit(1)
    .returns<PublicSitePage[]>();
  return data?.[0] ?? null;
}

export async function loadSitePages(
  supabase: SupabaseClient,
): Promise<Map<SitePageSlug, PublicSitePage>> {
  const { data } = await supabase
    .from("public_site_pages")
    .select(COLUMNS)
    .returns<PublicSitePage[]>();
  return new Map((data ?? []).map((page) => [page.slug, page]));
}

/** Title and body in the reader's language, falling back to the original. */
export function sitePageText(page: PublicSitePage, locale: Locale) {
  const body = localizedField(locale, page.body, page.translations, "body");
  return {
    title: localizedField(locale, page.title, page.translations, "title"),
    body,
    /** The reader is not on English and the body shown is still the original. */
    bodyIsOriginal: locale !== "en" && body !== "" && body === page.body.trim(),
  };
}
