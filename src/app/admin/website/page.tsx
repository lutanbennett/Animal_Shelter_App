import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadSiteContent } from "@/lib/site/content";
import { SITE_PAGE_SLUGS, type SitePageSlug } from "@/lib/site/pages";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { SiteSettingsForm } from "./SiteSettingsForm";
import { SitePageForm, type SitePageRow } from "./SitePageForm";
import { HeroPhoto } from "./HeroPhoto";
import { GalleryPhotos, type GalleryPhotoRow } from "./GalleryPhotos";
import { FeaturedResident, type FeaturedResidentOption } from "./FeaturedResident";
import { PublishedProjects, type PublishedProjectRow } from "./PublishedProjects";

type PublicResidentRow = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  profile_photo_drive_file_id: string | null;
};

/** Where each page shows on the site, for the "View on site" link. */
const PUBLIC_PATHS: Record<SitePageSlug, string> = {
  "our-story": "/",
  "how-to-adopt": "/adopt#how-to-adopt",
  foster: "/foster",
  volunteer: "/volunteer",
  donate: "/donate",
};

export default async function WebsitePage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();

  const [
    content,
    pagesResult,
    photosResult,
    publicResidentsResult,
    thaiNamesResult,
    publishedResult,
  ] = await Promise.all([
      loadSiteContent(supabase),
      supabase
        .from("site_pages")
        .select("id, slug, title, body")
        .returns<SitePageRow[]>(),
      supabase
        .from("site_content_photos")
        .select("id, drive_file_id")
        .order("sort_order")
        .returns<GalleryPhotoRow[]>(),
      // The featured-resident picker offers exactly what the public adoption
      // pages show, so it reads the same view they do rather than re-deriving
      // "publicly visible" from residents + resident_current_state here.
      supabase
        .from("public_resident_profiles")
        .select("id, name, species, breed, profile_photo_drive_file_id")
        .order("name")
        .returns<PublicResidentRow[]>(),
      // The view leaves out thai_name (it's not public); admins can read it
      // from residents directly so the picker can search on it too.
      supabase
        .from("residents")
        .select("id, thai_name")
        .eq("is_public_visible", true)
        .returns<{ id: string; thai_name: string | null }[]>(),
      // What /our-work shows right now: the same filter public_projects
      // applies (0042), read through the staff summary view for the
      // thumbnail. Most recently edited first, since a story just
      // published by mistake is the usual reason to be looking.
      supabase
        .from("project_folder_summary")
        .select(
          "id, name, name_th, top_level_category, project_date, photo_count, thumbnail_drive_file_id",
        )
        .eq("is_public", true)
        .not("parent_folder_id", "is", null)
        .order("updated_at", { ascending: false })
        .returns<PublishedProjectRow[]>(),
    ]);

  // In the app's order, not the table's; a page missing from the table
  // (it shouldn't be — 0059 seeds all five) is simply skipped.
  const pageRows = pagesResult.data ?? [];
  const pages = SITE_PAGE_SLUGS.map((slug) => pageRows.find((p) => p.slug === slug)).filter(
    (p): p is SitePageRow => Boolean(p),
  );
  const translations = await loadTranslations(
    supabase,
    "site_pages",
    pages.map((p) => p.id),
  );

  const thaiNames = new Map(
    (thaiNamesResult.data ?? []).map((r) => [r.id, r.thai_name]),
  );
  const publicResidents: FeaturedResidentOption[] = (
    publicResidentsResult.data ?? []
  ).map((r) => ({
    ...r,
    thai_name: thaiNames.get(r.id) ?? null,
    current_status: null,
  }));

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.website.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.website.subtitle}</p>
      </div>

      {!content && (
        <p className="text-sm text-danger">{t.admin.website.couldntLoad}</p>
      )}

      {content && (
        <>
          <HeroPhoto heroDriveFileId={content.hero_drive_file_id} />
          <FeaturedResident
            featuredResidentId={content.featured_resident_id}
            residents={publicResidents}
          />
          <SiteSettingsForm content={content} />

          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t.admin.website.pages.heading}
              </h2>
              <p className="text-sm text-muted">{t.admin.website.pages.subtitle}</p>
            </div>
            {pages.map((page) => (
              <SitePageForm
                key={page.id}
                page={page}
                translations={{
                  title: translations.get(translationKey(page.id, "title")),
                  body: translations.get(translationKey(page.id, "body")),
                }}
                // Admin is a superset of management, so always.
                canManageTranslations
                publicPath={PUBLIC_PATHS[page.slug]}
              />
            ))}
          </section>

          <GalleryPhotos photos={photosResult.data ?? []} />
          <PublishedProjects projects={publishedResult.data ?? []} />
        </>
      )}
    </main>
  );
}
