import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { loadSiteContent, loadClinicVisitEstimate } from "@/lib/site/content";
import { SITE_PAGE_SLUGS } from "@/lib/site/pages";
import { loadTranslations, translationKey } from "@/lib/translations/queries";
import { SiteSettingsForm } from "./SiteSettingsForm";
import { ClinicVisitEstimate } from "./ClinicVisitEstimate";
import { type SitePageRow } from "./SitePageForm";
import { HeroPhoto } from "./HeroPhoto";
import { GalleryPhotos, type GalleryPhotoRow } from "./GalleryPhotos";
import { FeaturedResident, type FeaturedResidentOption } from "./FeaturedResident";
import { ImpactBaselines } from "./ImpactBaselines";
import type { ImpactBaselineRow } from "@/lib/site/impact";
import { DonationChannels } from "./DonationChannels";
import { CHANNEL_COLUMNS, type DonationChannelRow } from "@/lib/site/donation-channels";
import { WebsiteTabs, WEBSITE_TABS } from "./WebsiteTabs";
import { PageCards, type PageEditorMeta } from "./PageCards";
import { PublishedProjects, type PublishedProjectRow } from "./PublishedProjects";
import Link from "next/link";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";

type PublicResidentRow = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  profile_photo_drive_file_id: string | null;
};

export default async function WebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // Opens at read: the photo card holds website.content at read and website.gallery. What each part of the page
  // offers is asked of its own activity below, and its actions ask the same one.
  const { perms } = await requirePermission("website.content", "read");
  const canContent = can(perms, "website.content");
  const canGallery = can(perms, "website.gallery");
  const { tab } = await searchParams;
  const { t } = await getT();

  const supabase = await createClient();

  const [
    content,
    clinicVisitEstimate,
    pagesResult,
    photosResult,
    publicResidentsResult,
    thaiNamesResult,
    publishedResult,
    baselinesResult,
    channelsResult,
  ] = await Promise.all([
      loadSiteContent(supabase),
      // Not part of loadSiteContent: it is an internal figure kept out of
      // the column list every public page loads (0071).
      loadClinicVisitEstimate(supabase),
      supabase
        .from("site_pages")
        .select("id, slug, title, body, updated_at")
        .returns<SitePageRow[]>(),
      supabase
        .from("site_content_photos")
        .select("id, drive_file_id, alt")
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
      // The starting numbers behind the homepage band (0156).
      supabase
        .from("impact_baselines")
        .select("key, label, label_th, baseline_count, baseline_date, since_year, set_at")
        .order("key")
        .returns<ImpactBaselineRow[]>(),
      // Every way to give, hidden ones too (website.content reads the table; /donate reads the view).
      supabase
        .from("donation_channels")
        .select(CHANNEL_COLUMNS)
        .order("sort_order")
        .order("created_at")
        .returns<DonationChannelRow[]>(),
    ]);

  // An editor that shows empty lists on a failed read invites the admin to re-enter what is already
  // there, so any failed read stops the page (docs/decisions/2026-10-11-silent-empty-reads.md).
  for (const [what, result] of [
    ["pages", pagesResult],
    ["gallery photos", photosResult],
    ["public residents", publicResidentsResult],
    ["Thai names", thaiNamesResult],
    ["published projects", publishedResult],
    ["impact baselines", baselinesResult],
    ["ways to give", channelsResult],
  ] as const) {
    if (result.error) throw new Error(`Website admin: could not read ${what}: ${result.error.message}`);
  }

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

  // What each page's card says about its wording: when it was last edited, and whether a
  // Thai translation exists but is still empty. The editor itself is a page of its own now
  // (/admin/website/pages/<slug>), so the tab reads only what the card shows.
  const pageEditors: Record<string, PageEditorMeta> = Object.fromEntries(
    pages.map((page) => [
      page.slug,
      {
        updatedAt: page.updated_at,
        thaiMissing: [
          translations.get(translationKey(page.id, "title")),
          translations.get(translationKey(page.id, "body")),
        ].some((r) => r && !r.text?.trim()),
      },
    ]),
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.admin.website.title}
        </h1>
        <p className="text-sm text-muted">{t.admin.website.subtitle}</p>
        {can(perms, "appeal.run") && (
          <p className="text-sm text-muted">
            {t.admin.website.appealsNote}{" "}
            <Link href="/management/appeals" className="underline underline-offset-4">
              {t.admin.website.appealsLink}
            </Link>
          </p>
        )}
      </div>

      {!content && (
        <p className="text-sm text-danger">{t.admin.website.couldntLoad}</p>
      )}

      {content && (
        <WebsiteTabs
          initial={tab}
          // Only the photo strip is open to a login that does not edit the page itself.
          tabs={canContent ? WEBSITE_TABS : ["gallery"]}
          ariaLabel={t.admin.website.tabs.aria}
          labels={t.admin.website.tabs.labels}
          panels={{
            home: (
              <>
                <HeroPhoto heroDriveFileId={content.hero_drive_file_id} canChange={canGallery} />
                <FeaturedResident
                  featuredResidentId={content.featured_resident_id}
                  residents={publicResidents}
                />
                <ImpactBaselines rows={baselinesResult.data ?? []} />
              </>
            ),
            contact: (
              <>
                <SiteSettingsForm content={content} />
                <ClinicVisitEstimate estimate={clinicVisitEstimate} />
              </>
            ),
            pages: (
              <PageCards
                hiddenPages={content.hidden_public_pages}
                canEdit={canContent}
                editors={pageEditors}
              />
            ),
            donate: <DonationChannels rows={channelsResult.data ?? []} />,
            gallery: (
              <>
                {/* A photo-strip login has no Home tab, so the hero control sits here for it. */}
                {!canContent && canGallery && (
                  <HeroPhoto heroDriveFileId={content.hero_drive_file_id} canChange />
                )}
                <GalleryPhotos photos={photosResult.data ?? []} canEdit={canGallery} />
              </>
            ),
            projects: <PublishedProjects projects={publishedResult.data ?? []} />,
          }}
        />
      )}
    </main>
  );
}
