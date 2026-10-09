import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { loadOuting, loadOutingPhotos, loadPlaces } from "@/lib/outreach/outings";
import { OutingForm } from "../../OutingForm";
import { OutingPhotos } from "./OutingPhotos";

/**
 * /outreach/[id]/edit: correct a note, manage its photos, or delete it.
 * Edit on community.outings is write, correct and remove alike (0169, A8).
 */
export default async function EditOutingPage(props: PageProps<"/outreach/[id]/edit">) {
  const { id } = await props.params;
  const { t } = await getT();
  const { supabase } = await requirePermission("community.outings");

  const [outing, photos, { places }] = await Promise.all([
    loadOuting(supabase, id),
    loadOutingPhotos(supabase, id),
    loadPlaces(supabase),
  ]);
  if (!outing) notFound();

  // A place archived since keeps its notes; offer it on its own note so the form still shows it.
  const withCurrent =
    places.some((p) => p.id === outing.place_id) || !outing.community_places
      ? places
      : [{ id: outing.place_id, ...outing.community_places }, ...places];

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <Link href="/outreach" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
        {t.outreach.backToList}
      </Link>
      <h1 className="text-2xl font-semibold text-foreground">{t.outreach.editTitle}</h1>
      <OutingForm mode="edit" places={withCurrent} initial={outing} />
      <OutingPhotos outingId={outing.id} photos={photos} />
    </main>
  );
}
