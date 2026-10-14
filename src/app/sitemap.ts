import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { isPublicSiteLocked } from "@/lib/public-site";
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

  const [residents, projects] = await Promise.all([
    supabase.from("public_resident_profiles").select("id").returns<{ id: string }[]>(),
    supabase
      .from("public_projects")
      .select("id, sort_date")
      .returns<{ id: string; sort_date: string | null }[]>(),
  ]);

  // The static public pages, the home page first; /adopt#how-to-adopt is a
  // fragment of /adopt and so not listed twice.
  const pages: MetadataRoute.Sitemap = [
    { url: abs("/"), changeFrequency: "weekly", priority: 1 },
    { url: abs("/adopt"), changeFrequency: "daily", priority: 0.9 },
    { url: abs("/our-work"), changeFrequency: "weekly", priority: 0.8 },
    { url: abs("/donate"), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/foster"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/volunteer"), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/adopt/international"), changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/friends"), changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/friends/join"), changeFrequency: "yearly", priority: 0.3 },
    { url: abs("/privacy"), changeFrequency: "yearly", priority: 0.1 },
  ];

  const animals: MetadataRoute.Sitemap = (residents.data ?? []).map((r) => ({
    url: abs(`/adopt/${r.id}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const stories: MetadataRoute.Sitemap = (projects.data ?? []).map((p) => ({
    url: abs(`/our-work/${p.id}`),
    ...(p.sort_date ? { lastModified: p.sort_date } : {}),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...pages, ...animals, ...stories];
}
