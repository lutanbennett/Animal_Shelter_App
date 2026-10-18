import { BackLink } from "@/components/BackLink";
import type { ResidentOption } from "@/components/ResidentPicker";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { MemeForm } from "../MemeForm";

/**
 * Add a meme: the image, its words, the residents in it. social.library at Edit. The residents offered are every one
 * this login may read (a deceased resident stays: a meme in their memory is a real case).
 */
export default async function NewMemePage() {
  const { supabase } = await requirePermission("social.library");
  const { t } = await getT();
  const { data, error } = await supabase
    .from("resident_list_view")
    .select("resident_id, name, thai_name, current_status")
    .order("name")
    .returns<(Omit<ResidentOption, "id"> & { resident_id: string })[]>();
  if (error) console.error("meme form: resident list failed", error);
  const residents: ResidentOption[] = (data ?? []).map(({ resident_id, ...r }) => ({ id: resident_id, ...r }));

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <BackLink href="/memes">{t.memes.page.back}</BackLink>
      <h1 className="text-2xl font-semibold text-foreground">{t.memes.form.newTitle}</h1>
      <MemeForm mode="new" initial={{ title: "", captionEn: "", captionTh: "", tags: "", residentIds: [] }} residents={residents} />
    </main>
  );
}
