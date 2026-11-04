import { getT } from "@/lib/i18n/get-t";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { requirePermission } from "@/lib/permissions/require";
import { loadWebsiteDrafts } from "@/lib/website/drafts";
import { PortalTabs, type PortalTab } from "./PortalTabs";
import { WebsiteDraftQueue } from "./WebsiteDraftQueue";
import { loadWaitingEventPhotos, loadWaitingPhotos } from "@/lib/photos/approval";
import { loadPendingPhotos } from "@/lib/photos/pending";
import { loadPickableResidents } from "@/lib/medical/residents";
import { ApproveQueue } from "./ApproveQueue";
import { PendingQueue } from "./PendingQueue";
import { EventPhotoQueue } from "./EventPhotoQueue";

/**
 * Photos to approve: the resident photos filed by a login that may not publish (0217), waiting for someone who may,
 * and above them the photos tagged to an enclosure by someone who did not know the animal (0218), waiting for
 * someone to say who is in them. Two lists and two cards on purpose
 * (docs/decisions/2026-10-17-photo-approval-queue.md): a pending photo has no resident yet.
 * Gated on photos.approve, the activity the database itself checks.
 */
export default async function ApprovePhotosPage() {
  // Each tab asks the activity its own approve action asks (photos.approve for the photo tabs, website.approve for page
  // changes). The page opens for either; a tab nobody may use is not drawn.
  const early = await loadPermissions();
  // Neither activity: the ordinary guard refuses (or sends a signed-out visitor to sign in).
  if (!can(early, "website.approve")) await requirePermission("photos.approve");
  const perms = early ?? (await loadPermissions());
  const { t } = await getT();
  const supabase = await createClient();
  const showPhotos = can(perms, "photos.approve");
  const showWebsite = can(perms, "website.approve");
  const [photos, pending, eventPhotos, drafts, { residents, error }] = await Promise.all([
    showPhotos ? loadWaitingPhotos(supabase) : [],
    showPhotos ? loadPendingPhotos(supabase) : [],
    showPhotos ? loadWaitingEventPhotos(supabase) : [],
    showWebsite ? loadWebsiteDrafts(supabase) : [],
    showPhotos ? loadPickableResidents(supabase) : { residents: [], error: null },
  ]);
  // Changing the resident of a waiting photo is managing it (the database asks photos.resident_manage).
  const canManage = can(perms, "photos.resident_manage");

  const tabs: PortalTab[] = [];
  if (showPhotos) {
    tabs.push({
      key: "residents",
      label: t.photoApproval.tabs.residents,
      count: photos.length,
      content: (
        <ApproveQueue photos={photos} canRemove={canManage} canReassign={canManage} residents={residents} loadError={error} othersWaiting={pending.length > 0} />
      ),
    });
    tabs.push({
      key: "who",
      label: t.photoApproval.tabs.who,
      count: pending.length,
      content: <PendingQueue photos={pending} residents={residents} loadError={error} />,
    });
    tabs.push({ key: "events", label: t.photoApproval.tabs.events, count: eventPhotos.length, content: <EventPhotoQueue photos={eventPhotos} /> });
  }
  if (showWebsite) {
    tabs.push({ key: "website", label: t.photoApproval.tabs.website, count: drafts.length, content: <WebsiteDraftQueue drafts={drafts} canDecide={showWebsite} /> });
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.photoApproval.title}</h1>
        <p className="text-base text-muted">{t.photoApproval.intro}</p>
      </div>
      <PortalTabs tabs={tabs} />
    </main>
  );
}
