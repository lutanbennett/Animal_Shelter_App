import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import { getT } from "@/lib/i18n/get-t";
import { todayIso } from "@/lib/format";
import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { loadMeme } from "@/lib/memes/queries";
import { MemeView } from "./MemeView";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One meme: full size, caption, residents, where it has been shared. Opens at social.library Read, as the library
 * does; Record a share, Edit and Archive ask Edit. An archived meme still opens here (marked), so it can be brought back.
 */
export default async function MemePage(props: PageProps<"/memes/[id]">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("social.library", "read");
  if (!UUID.test(id)) notFound();
  const { t } = await getT();
  const meme = await loadMeme(supabase, id);
  if (!meme) notFound();

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/memes">{t.memes.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{meme.title}</h1>
      <MemeView meme={meme} canEdit={can(perms, "social.library")} today={todayIso()} />
    </main>
  );
}
