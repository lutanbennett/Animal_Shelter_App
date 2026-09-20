import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { StoryForm, type SiteContentRow } from "./StoryForm";
import { HeroPhoto } from "./HeroPhoto";
import { GalleryPhotos, type GalleryPhotoRow } from "./GalleryPhotos";
import { FeaturedResident, type FeaturedResidentOption } from "./FeaturedResident";
import { PublishedProjects, type PublishedProjectRow } from "./PublishedProjects";

type SiteContentFullRow = SiteContentRow & {
  hero_drive_file_id: string | null;
  featured_resident_id: string | null;
};

type PublicResidentRow = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  profile_photo_drive_file_id: string | null;
};

export default async function WebsitePage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();

  const [
    contentResult,
    photosResult,
    publicResidentsResult,
    thaiNamesResult,
    publishedResult,
  ] = await Promise.all([
      supabase
        .from("site_content")
        .select(
          "hero_drive_file_id, featured_resident_id, tagline, story_heading, story_body, contact_email, contact_address",
        )
        .eq("id", true)
        .limit(1)
        .returns<SiteContentFullRow[]>(),
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

  const content = contentResult.data?.[0];
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
        <p className="text-sm text-muted">
          {t.admin.website.subtitleBeforeCode}{" "}
          <code className="rounded bg-surface px-1 py-0.5">/</code>{" "}
          {t.admin.website.subtitleAfterCode}
        </p>
      </div>

      {contentResult.error && (
        <p className="text-sm text-danger">
          {t.admin.website.couldntLoad}: {contentResult.error.message}
        </p>
      )}

      {content && (
        <>
          <HeroPhoto heroDriveFileId={content.hero_drive_file_id} />
          <FeaturedResident
            featuredResidentId={content.featured_resident_id}
            residents={publicResidents}
          />
          <StoryForm content={content} />
          <GalleryPhotos photos={photosResult.data ?? []} />
          <PublishedProjects projects={publishedResult.data ?? []} />
        </>
      )}
    </main>
  );
}
