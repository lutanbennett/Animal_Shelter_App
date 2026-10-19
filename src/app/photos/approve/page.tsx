import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadWaitingPhotos } from "@/lib/photos/approval";
import { loadPendingPhotos } from "@/lib/photos/pending";
import { loadPickableResidents } from "@/lib/medical/residents";
import { ApproveQueue } from "./ApproveQueue";
import { PendingQueue } from "./PendingQueue";

/**
 * Photos to approve: the resident photos filed by a login that may not publish (0217), waiting for someone who may,
 * and above them the photos tagged to an enclosure by someone who did not know the animal (0218), waiting for
 * someone to say who is in them. Two lists and two cards on purpose
 * (docs/decisions/2026-10-17-photo-approval-queue.md): a pending photo has no resident yet.
 * Gated on photos.approve, the activity the database itself checks.
 */
export default async function ApprovePhotosPage() {
  const { perms } = await requirePermission("photos.approve");
  const { t } = await getT();
  const supabase = await createClient();
  const [photos, pending, { residents, error }] = await Promise.all([
    loadWaitingPhotos(supabase),
    loadPendingPhotos(supabase),
    loadPickableResidents(supabase),
  ]);
  // Changing the resident of a waiting photo is managing it (the database asks photos.resident_manage).
  const canManage = can(perms, "photos.resident_manage");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.photoApproval.title}</h1>
        <p className="text-base text-muted">{t.photoApproval.intro}</p>
      </div>
      <PendingQueue photos={pending} residents={residents} loadError={error} />
      {pending.length > 0 && photos.length > 0 && (
        <h2 className="text-xl font-semibold text-foreground">{t.photoApproval.pending.residentsHeading(photos.length)}</h2>
      )}
      <ApproveQueue
        photos={photos}
        canRemove={canManage}
        canReassign={canManage}
        residents={residents}
        loadError={error}
        othersWaiting={pending.length > 0}
      />
    </main>
  );
}
