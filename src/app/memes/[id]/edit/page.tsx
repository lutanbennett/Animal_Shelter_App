import { notFound } from "next/navigation";
import { BackLink } from "@/components/BackLink";
import type { ResidentOption } from "@/components/ResidentPicker";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { loadMeme } from "@/lib/memes/queries";
import { loadMemeResidents } from "@/lib/memes/residents";
import { MemeForm } from "../../MemeForm";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Edit a meme's words, tags and residents. The image is fixed: a different picture is a different meme. */
export default async function EditMemePage(props: PageProps<"/memes/[id]/edit">) {
  const { id } = await props.params;
  const { supabase, perms } = await requirePermission("social.library", "edit");
  if (!UUID.test(id)) notFound();
  const { t } = await getT();
  const [meme, { residents, emptyKind }] = await Promise.all([loadMeme(supabase, id), loadMemeResidents(supabase, perms)]);
  if (!meme) notFound();
  const options: ResidentOption[] = residents.map((r) => ({ id: r.id, name: r.name, thai_name: r.thaiName, current_status: r.status, code: r.code }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href={`/memes/${id}`}>{meme.title}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{t.memes.form.editTitle}</h1>
      <MemeForm
        mode="edit"
        memeId={id}
        driveFileId={meme.drive_file_id}
        initial={{
          title: meme.title,
          captionEn: meme.caption_en ?? "",
          captionTh: meme.caption_th ?? "",
          tags: meme.tags.join(", "),
          residentIds: meme.residents.map((r) => r.id),
        }}
        residents={options}
        residentsEmptyNote={emptyKind ? t.memes.form[emptyKind === "cannot" ? "cannotSeeResidents" : "noResidentsOnFile"] : undefined}
      />
    </main>
  );
}
