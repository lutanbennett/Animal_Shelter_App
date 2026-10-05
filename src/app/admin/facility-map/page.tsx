import { getT } from "@/lib/i18n/get-t";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { requirePermission } from "@/lib/permissions/require";
import { parseShape } from "@/lib/facility-map/geometry";
import { planImageUrl, type MapPlan } from "@/lib/facility-map/types";
import { MapEditor, type EditorEnclosure, type EditorZone } from "./MapEditor";

type PlanRow = Omit<MapPlan, "image_url"> & { image_path: string };

/**
 * Place enclosures on the facility plans (step 3 of 3 of the map). Drawing a polygon accurately is desk
 * work and the Director is the one person with a computer, so it is a "Best on a larger screen" page
 * (docs/decisions/2026-10-04-facility-map-editor.md); it still renders on a phone behind the notice.
 * Only physical, on-site places: the Lifecycle pseudo-zone and off-site zones are never on the map.
 */
export default async function FacilityMapAdminPage() {
  const { supabase } = await requirePermission("facility.enclosures");
  const { t } = await getT();

  const [zonesResult, enclosuresResult, plansResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal, map_shape").neq("name", "Lifecycle").eq("internal", true).order("name"),
    supabase.from("enclosures").select("id, name, name_th, zone_id, map_shape").order("name"),
    supabase.from("facility_maps").select("id, kind, zone_id, image_path, width, height").returns<PlanRow[]>(),
  ]);

  const zones: EditorZone[] = (zonesResult.data ?? []).map((z) => ({ id: z.id, name: z.name, name_th: z.name_th, shape: parseShape(z.map_shape) }));
  const zoneIds = new Set(zones.map((z) => z.id));
  const enclosures: EditorEnclosure[] = (enclosuresResult.data ?? [])
    .filter((e) => zoneIds.has(e.zone_id))
    .map((e) => ({ id: e.id, name: e.name, name_th: e.name_th, zone_id: e.zone_id, shape: parseShape(e.map_shape) }));
  const plans: MapPlan[] = (plansResult.data ?? [])
    .filter((p) => p.kind === "overview" || (p.zone_id && zoneIds.has(p.zone_id)))
    .map(({ image_path, ...p }) => ({ ...p, image_url: planImageUrl(image_path) }));

  const error = zonesResult.error ?? enclosuresResult.error ?? plansResult.error;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.admin.facilityMap.title}</h1>
        <p className="text-sm text-muted">{t.admin.facilityMap.subtitle}</p>
      </div>
      <LargerScreenNotice>
        {error ? <p className="text-sm text-danger">{t.admin.facilityMap.couldntLoad}</p> : <MapEditor plans={plans} zones={zones} enclosures={enclosures} />}
      </LargerScreenNotice>
    </main>
  );
}
