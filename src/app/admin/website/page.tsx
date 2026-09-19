import { requireAdminUser } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { StoryForm, type SiteContentRow } from "./StoryForm";
import { HeroPhoto } from "./HeroPhoto";
import { GalleryPhotos, type GalleryPhotoRow } from "./GalleryPhotos";

type SiteContentFullRow = SiteContentRow & { hero_drive_file_id: string | null };

export default async function WebsitePage() {
  await requireAdminUser();
  const { t } = await getT();

  const supabase = await createClient();

  const [contentResult, photosResult] = await Promise.all([
    supabase
      .from("site_content")
      .select(
        "hero_drive_file_id, tagline, story_heading, story_body, contact_email, contact_address",
      )
      .eq("id", true)
      .limit(1)
      .returns<SiteContentFullRow[]>(),
    supabase
      .from("site_content_photos")
      .select("id, drive_file_id")
      .order("sort_order")
      .returns<GalleryPhotoRow[]>(),
  ]);

  const content = contentResult.data?.[0];

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
          <StoryForm content={content} />
          <GalleryPhotos photos={photosResult.data ?? []} />
        </>
      )}
    </main>
  );
}
