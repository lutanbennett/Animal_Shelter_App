import { PhotoUploader } from "@/components/PhotoUploader";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import type { SectionContext } from "./types";

export async function renderPhotosSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, perms, supabase, photoSelect } = ctx;
  const [{ data: photos }] = await Promise.all([
    supabase
      .from("attachments")
      .select(photoSelect)
      .eq("owner_type", "resident")
      .eq("owner_id", id)
      .order("uploaded_at", { ascending: true })
      .returns<PhotoRow[]>(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      {/* Photos stay open after death (0052); the archive is refreshed
          by the upload route and the photo actions. */}
      <PhotoUploader residentId={id} categories={photoCategoriesFor(perms)} />
      <PhotoGallery
        residentId={id}
        photos={photos ?? []}
        profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
        moveCategories={photoCategoriesFor(perms)}
      />
    </div>
  );
}
