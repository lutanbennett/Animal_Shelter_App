import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadWaitingPhotos } from "@/lib/photos/approval";
import { ApproveQueue } from "./ApproveQueue";

/**
 * Photos to approve: the resident photos filed by a login that may not publish (0217), waiting for someone who may.
 * Gated on photos.resident_publish, the activity the database checks when `approved_at` is set.
 */
export default async function ApprovePhotosPage() {
  const { perms } = await requirePermission("photos.resident_publish");
  const { t } = await getT();
  const supabase = await createClient();
  const photos = await loadWaitingPhotos(supabase);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t.photoApproval.title}</h1>
      <p className="text-base text-muted">{t.photoApproval.intro}</p>
      <ApproveQueue photos={photos} canRemove={can(perms, "photos.resident_manage")} />
    </main>
  );
}
