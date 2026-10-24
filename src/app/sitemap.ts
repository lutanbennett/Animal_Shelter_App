import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isPublicSiteLocked } from "@/lib/public-site";
import { hiddenPagesOf, isPageHidden, sitemapPages } from "@/lib/public-pages";
import { loadSiteContent } from "@/lib/site/content";
import { getSiteOrigin } from "@/lib/site-origin";

// PUBLIC_SITE is a Worker var read at request time (src/lib/public-site.ts),
// and the entries come from the database: never baked at build time.
export const dynamic = "force-dynamic";

/**
 * The public pages a search engine should know about, with the pages that
 * do not exist as files: every public animal and every published story
 * (public site review 2026-10-13, §8.4). Locked (UAT, test): an empty list,
 * matching robots.ts's "disallow everything" — the file still answers, so a
 * crawler that already knows the address gets nothing rather than an error.
 *
 * Addresses are built on getSiteOrigin(), the host the request came in on
 * (or NEXT_PUBLIC_SITE_URL), so the public site's move to its own domain
 * changes nothing here.
 *
 * Only a story carries a date: public_projects exposes the story's date and
 * public_resident_profiles exposes no updated_at, so an animal's entry has
 * no lastModified rather than a made-up one. Adding the column to the view
 * is a migration, which this change deliberately does not carry.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isPublicSiteLocked()) return [];
  const [origin, supabase] = await Promise.all([getSiteOrigin(), createClient()]);
  if (!origin) return [];
  const abs = (path: string) => new URL(path, origin).toString();

  // A hidden page, or a section it sits in, is not listed, nor are the pages under it.
  const hidden = hiddenPagesOf((await loadSiteContent(supabase))?.hidden_public_pages);

  const [residents, projects, appeals] = await Promise.all([
    supabase.from("public_resident_profiles").select("id").returns<{ id: string }[]>(),
    supabase
      .from("public_projects")
      .select("id, sort_date")
      .returns<{ id: string; sort_date: string | null }[]>(),
    // Appeals still asking (live) or just funded; the list page covers the rest.
    supabase.from("public_appeals").select("id").in("status", ["live", "funded"]).returns<{ id: string }[]>(),
  ]);

  // The static public pages, the home page first; /adopt#how-to-adopt is a
  // fragment of /adopt and so not listed twice.
  const pages: MetadataRoute.Sitemap = sitemapPages()
    .filter((page) => !isPageHidden(page.key, hidden))
    .map((page) => ({
      url: abs(page.href),
      changeFrequency: page.sitemap.changeFrequency,
      priority: page.sitemap.priority,
    }));

  const animals: MetadataRoute.Sitemap = (isPageHidden("adopt", hidden) ? [] : residents.data ?? []).map((r) => ({
    url: abs(`/adopt/${r.id}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const stories: MetadataRoute.Sitemap = (isPageHidden("our-work", hidden) ? [] : projects.data ?? []).map((p) => ({
    url: abs(`/our-work/${p.id}`),
    ...(p.sort_date ? { lastModified: p.sort_date } : {}),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  const drives: MetadataRoute.Sitemap = (isPageHidden("appeals", hidden) ? [] : appeals.data ?? []).map((a) => ({
    url: abs(`/appeals/${a.id}`),
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...pages, ...animals, ...drives, ...stories];
}
