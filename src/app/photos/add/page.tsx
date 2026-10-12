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
 *  - the folders: `photoCategoriesFor` (Shelter, Medical, Foster, Adoption for a login that may publish;
 *    Medical alone otherwise, as /medical/photos). The upload routes refuse anything else regardless.
 *  - the route: a login whose only folder is Medical and who sees every clinic (the Head of Medical)
 *    cannot read `residents`, so it files through her own route; everyone else through the hub's.
 */
export default async function AddPhotosPage() {
  const { perms } = await requirePermission("photos.resident_add");
  const { t } = await getT();
  const categories = photoCategoriesFor(perms);
  const route = categories.length === 1 && perms.scopes.clinical === "any" ? "medical" : "staff";

  const supabase = await createClient();
  const { residents, error } = await loadPickableResidents(supabase);

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t.addPhotos.title}</h1>
      <p className="text-base text-muted">{t.addPhotos.intro}</p>
      <AddPhotosFlow categories={categories} route={route} residents={residents} loadError={error} />
    </main>
  );
}
