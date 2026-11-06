import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { loadReels, reelTagsInUse } from "@/lib/reels/queries";
import { ReelLibrary } from "./ReelLibrary";

/**
 * The reels library (0322): every reel that is not archived, newest date taken first, with where each has been
 * posted. Opens at social.library Read; Add a reel shows at Edit, the activity the upload routes and the reels write
 * policy ask. Never public: the video plays through /api/reels/[id]/video, which asks the reels table as the caller.
 * docs/decisions/2026-11-06-reels-app.md.
 */
export default async function ReelsPage() {
  const { supabase, perms } = await requirePermission("social.library", "read");
  const { t } = await getT();
  const { reels, error } = await loadReels(supabase);
  if (error) throw new Error(`Reels library: could not read the reels: ${error}`);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t.reels.title}</h1>
          <p className="text-base text-muted">{t.reels.intro}</p>
        </div>
        {can(perms, "social.library") && (
          <ActionLink href="/reels/new" label={t.reels.add} icon={ACTION_ICONS.add} variant="primary" iconOnlyOnMobile={false} />
        )}
      </div>
      <ReelLibrary
        reels={reels.map(({ id, description, tags, duration_ms, date_taken, residents, platforms }) => ({
          id,
          description,
          tags,
          duration_ms,
          date_taken,
          residents,
          platforms,
        }))}
        tags={reelTagsInUse(reels)}
      />
    </main>
  );
}
