import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadReel } from "@/lib/reels/queries";
import { ReelForm } from "../../ReelForm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Edit a reel's description and date taken. The video is fixed: a different clip is a different reel. */
export default async function EditReelPage(props: PageProps<"/reels/[id]/edit">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("social.library");
  if (!UUID.test(id)) notFound();
  const { t } = await getT();
  const reel = await loadReel(supabase, id);
  if (!reel) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href={`/reels/${id}`}>{t.reels.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{t.reels.form.editTitle}</h1>
      <ReelForm
        mode="edit"
        reelId={id}
        initial={{ description: reel.description, dateTaken: reel.date_taken }}
        initialTags={reel.residents.map((r) => ({ id: r.id, name: r.name }))}
        today={todayIso()}
        canTag={can(perms, "resident.record", "read")}
      />
    </main>
  );
}
