import { PhotoUploader } from "@/components/PhotoUploader";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import { isMedicalFolder } from "@/lib/google/drive-client";
import Link from "next/link";
import { can } from "@/lib/permissions/can";
import { loadPhotoShares } from "@/lib/social-shares";
import type { SectionContext } from "./types";

export async function renderPhotosSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, perms, supabase, photoSelect, t } = ctx;
  const [{ data: allPhotos }] = await Promise.all([
    supabase
      .from("attachments")
      .select(photoSelect)
      .eq("owner_type", "resident")
      .eq("owner_id", id)
      .order("uploaded_at", { ascending: true })
      .returns<PhotoRow[]>(),
  ]);
  // The database already returns no Medical row to a login without this read (0276); the page asks the same activity
  // so nothing Medical is drawn, counted or left as an empty group for it.
  const canReadMedical = can(perms, "photos.resident_medical", "read");
  const photos = canReadMedical ? allPhotos : (allPhotos ?? []).filter((p) => !isMedicalFolder(p.sub_folder));
  // Photos filed by a login that may not publish wait for one that does (0217); the approver can go straight to the queue.
  const waiting = (photos ?? []).filter((p) => p.approved_at === null).length;
  // Where each photo has been posted on social media (0223). One query for the grid, owner_type pinned inside.
  const shares = await loadPhotoShares(supabase, (photos ?? []).map((p) => p.id));
  // The same test the table's policies make: photos.resident_manage, and a role that sees all residents.
  const canMarkPosted = can(perms, "photos.resident_manage");
  return (
    <div className="flex flex-col gap-6">
      {waiting > 0 && can(perms, "photos.approve") && (
        <p className="text-sm text-foreground">
          {t.photoApproval.resident.waiting(waiting)}{" "}
          <Link href="/photos/approve" className="font-medium text-primary underline">
            {t.photoApproval.resident.review}
          </Link>
        </p>
      )}
      {/* Photos stay open after death (0052); the archive is refreshed
          by the upload route and the photo actions. */}
      {/* No drop zone for a card that cannot add photos: it would only refuse (Card review 1, 2026-10-26). */}
      {photoCategoriesFor(perms).length > 0 && (
        <PhotoUploader residentId={id} categories={photoCategoriesFor(perms)} canSeeMedical={canReadMedical} />
      )}
      <PhotoGallery
        residentId={id}
        photos={photos ?? []}
        profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
        moveCategories={photoCategoriesFor(perms)}
        shares={shares}
        canMarkPosted={canMarkPosted}
        canMakeMeme={can(perms, "social.library")}
        canManage={canMarkPosted}
        canFileToMedical={can(perms, "photos.medical_add") && (can(perms, "photos.resident_add") || can(perms, "photos.resident_manage"))}
      />
    </div>
  );
}
