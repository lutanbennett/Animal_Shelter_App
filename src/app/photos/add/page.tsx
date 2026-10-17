import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requirePermission } from "@/lib/permissions/require";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { loadPickableResidents } from "@/lib/medical/residents";
import { AddPhotosFlow } from "./AddPhotosFlow";

/**
 * Add photos, photo first: take or choose the photos, then say who is in each
 * (docs/decisions/2026-10-12-photo-first-tagging.md). A third path beside the hub's Photos tab and
 * Add Medical Photos; it reuses their upload routes and `record_attachment`, so nothing here is new
 * server-side except this page.
 *
 * Two things are decided here, on the server, from the login:
 *  - the folder: Shelter only, and only if `photoCategoriesFor` allows this login Shelter. The upload route refuses
 *    anything else regardless. It files through the hub's route.
 */
export default async function AddPhotosPage() {
  const { perms } = await requirePermission("photos.resident_add");
  const { t } = await getT();
  // Shelter is the only folder this page offers (Lutan, 2026-10-17: no Medical, Foster or Adoption). Medical photos
  // have their own page, Add Medical Photos. A login the server does not allow Shelter gets a sentence, not a flow
  // that would be refused on every photo.
  const categories = photoCategoriesFor(perms).filter((c) => c === "Shelter");

  const supabase = await createClient();
  const { residents, error } = await loadPickableResidents(supabase);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t.addPhotos.title}</h1>
      <p className="text-base text-muted">{t.addPhotos.intro}</p>
      {categories.length > 0 ? (
        <AddPhotosFlow categories={categories} route="staff" residents={residents} loadError={error} />
      ) : (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground">{t.addPhotos.noShelter}</p>
      )}
    </main>
  );
}
