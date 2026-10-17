import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { requireAnyPermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { photoCategoriesFor } from "@/lib/google/drive-client";
import { loadPickableResidents } from "@/lib/medical/residents";
import { loadEnclosureChoices } from "@/lib/photos/pending";
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
 *  - the route: a Shelter-only login (a volunteer) files through /api/photos/shelter, which records the photo as
 *    waiting; a login whose only folder is Medical and who sees every clinic (the Head of Medical)
 *    cannot read `residents`, so it files through her own route; everyone else through the hub's.
 */
export default async function AddPhotosPage() {
  const { perms } = await requireAnyPermission(["photos.resident_add", "photos.shelter_add"]);
  const { t } = await getT();
  const categories = photoCategoriesFor(perms);
  // The folders come from the login (photoCategoriesFor), never from this page: a login that may file in Shelter
  // only has one folder and so no choice to make; Management keeps all four; the Head of Medical keeps Medical.
  const shelterOnly = categories.length === 1 && categories[0] === "Shelter";
  const route = shelterOnly ? "shelter" : categories.length === 1 && perms.scopes.clinical === "any" ? "medical" : "staff";
  // What this login files into Shelter waits for Management (0217's trigger decides; this only says so).
  const waits = shelterOnly && !can(perms, "photos.resident_publish");

  const supabase = await createClient();
  const { residents, error } = await loadPickableResidents(supabase);
  // "I don't know, tag the enclosure" (0218) files into Shelter, so it is offered to the logins that may file there;
  // the Head of Medical (Medical only) cannot file a pending photo.
  const mayTagEnclosure = categories.includes("Shelter") && route !== "medical";
  const enclosures = mayTagEnclosure ? await loadEnclosureChoices(supabase) : null;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-semibold text-foreground">{t.addPhotos.title}</h1>
      <p className="text-base text-muted">{t.addPhotos.intro}</p>
      <AddPhotosFlow categories={categories} route={route} waits={waits} residents={residents} loadError={error} enclosures={enclosures} />
    </main>
  );
}
