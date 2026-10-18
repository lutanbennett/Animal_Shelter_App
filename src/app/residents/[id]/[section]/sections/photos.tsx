import { PhotoUploader } from "@/components/PhotoUploader";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { PhotoGallery, type PhotoRow } from "@/components/PhotoGallery";
import Link from "next/link";
import { can } from "@/lib/permissions/can";
import { loadPhotoShares } from "@/lib/social-shares";
import type { SectionContext } from "./types";

export async function renderPhotosSection(ctx: SectionContext): Promise<React.ReactNode> {
  const { id, resident, perms, supabase, photoSelect, t } = ctx;
  const [{ data: photos }] = await Promise.all([
    supabase
      .from("attachments")
      .select(photoSelect)
      .eq("owner_type", "resident")
      .eq("owner_id", id)
      .order("uploaded_at", { ascending: true })
      .returns<PhotoRow[]>(),
  ]);
  // Photos filed by a login that may not publish wait for one that does (0217); the approver can go straight to the queue.
  const waiting = (photos ?? []).filter((p) => p.approved_at === null).length;
  // Where each photo has been posted on social media (0223). One query for the grid, owner_type pinned inside.
  const shares = await loadPhotoShares(supabase, (photos ?? []).map((p) => p.id));
  // The same test the table's policies make: photos.resident_manage, and a role that sees all residents.
  const canMarkPosted = can(perms, "photos.resident_manage") && perms?.scopes.residents === "all";
  return (
    <div className="flex flex-col gap-6">
      {waiting > 0 && can(perms, "photos.resident_publish") && (
        <p className="text-sm text-foreground">
          {t.photoApproval.resident.waiting(waiting)}{" "}
          <Link href="/photos/approve" className="font-medium text-primary underline">
            {t.photoApproval.resident.review}
          </Link>
        </p>
      )}
      {/* Photos stay open after death (0052); the archive is refreshed
          by the upload route and the photo actions. */}
      <PhotoUploader residentId={id} categories={photoCategoriesFor(perms)} />
      <PhotoGallery
        residentId={id}
        photos={photos ?? []}
        profilePhotoDriveFileId={resident.profile_photo_drive_file_id}
        moveCategories={photoCategoriesFor(perms)}
        shares={shares}
        canMarkPosted={canMarkPosted}
      />
    </div>
  );
}
