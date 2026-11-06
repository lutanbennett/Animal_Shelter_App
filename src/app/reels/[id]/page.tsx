import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadReel } from "@/lib/reels/queries";
import { ReelView } from "./ReelView";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One reel: the video, its description, who is in it and where it has been posted. Opens at social.library Read, as the
 * library does; Record where it was posted, Edit and Archive ask Edit. An archived reel still opens here (marked), so it
 * can be brought back.
 */
export default async function ReelPage(props: PageProps<"/reels/[id]"> & { searchParams?: Promise<{ links?: string }> }) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("social.library", "read");
  if (!UUID.test(id)) notFound();
  const { t } = await getT();
  const reel = await loadReel(supabase, id);
  if (!reel) notFound();
  const linksFailed = (await props.searchParams)?.links === "failed";

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/reels">{t.reels.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{reel.description.split("\n")[0].slice(0, 80) || t.reels.noDescription}</h1>
      {linksFailed && <p role="status" className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{t.reels.form.linksFailed}</p>}
      <ReelView reel={reel} canEdit={can(perms, "social.library")} today={todayIso()} />
    </main>
  );
}
