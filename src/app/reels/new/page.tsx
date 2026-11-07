import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { ReelForm } from "../ReelForm";

/**
 * Add a reel: the video, its description and the date taken. social.reels at Edit. The # picker is offered only to a
 * login that may also use its search (resident.who_and_where at Read, see ReelForm); the rest is the same form without it.
 */
export default async function NewReelPage() {
  const { perms } = await requirePermission("social.reels", "edit");
  const { t } = await getT();
  const today = todayIso();
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/reels">{t.reels.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{t.reels.form.newTitle}</h1>
      <ReelForm mode="new" initial={{ description: "", dateTaken: today }} today={today} canTag={can(perms, "resident.who_and_where", "read")} />
    </main>
  );
}
