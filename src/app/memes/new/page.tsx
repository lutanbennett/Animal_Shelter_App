import { BackLink } from "@/components/BackLink";
import type { ResidentOption } from "@/components/ResidentPicker";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { loadMemeResidents } from "@/lib/memes/residents";
import { MemeForm } from "../MemeForm";

/**
 * Add a meme: the image, its words, the residents in it. social.library at Edit. The residents offered are every one
 * this login may read (a deceased resident stays: a meme in their memory is a real case).
 */
export default async function NewMemePage() {
  const { supabase, perms } = await requirePermission("social.library", "edit");
  const { t } = await getT();
  const { residents, emptyKind } = await loadMemeResidents(supabase, perms);
  const options: ResidentOption[] = residents.map((r) => ({ id: r.id, name: r.name, thai_name: r.thaiName, current_status: r.status, code: r.code }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/memes">{t.memes.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{t.memes.form.newTitle}</h1>
      <MemeForm mode="new" initial={{ title: "", captionEn: "", captionTh: "", tags: "", residentIds: [] }} residents={options} residentsEmptyNote={emptyKind ? t.memes.form[emptyKind === "cannot" ? "cannotSeeResidents" : "noResidentsOnFile"] : undefined} />
    </main>
  );
}
