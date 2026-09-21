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
] as const;
export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

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
  return {
    title: localizedField(locale, page.title, page.translations, "title"),
    body: localizedField(locale, page.body, page.translations, "body"),
  };
}
