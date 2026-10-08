import { getT } from "@/lib/i18n/get-t";
import { inShelterOrder } from "@/lib/enclosures/order";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { requirePermission } from "@/lib/permissions/require";
import { parseShape } from "@/lib/facility-map/geometry";
import { isRoomKind } from "@/lib/facility-map/rooms";
import { isStoredPlan, planImageUrl, type MapPlan } from "@/lib/facility-map/types";
import { readHistory, undoableReplace } from "@/lib/facility-map/plan-store";
import { MapEditor, type EditorEnclosure, type EditorPlan, type EditorRoom, type EditorZone } from "./MapEditor";

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

  const [zonesResult, enclosuresResult, plansResult, roomsResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal, map_shape, sort_order").neq("name", "Lifecycle").eq("internal", true),
    supabase.from("enclosures").select("id, name, name_th, zone_id, map_shape, sort_order"),
    supabase.from("facility_maps").select("id, kind, zone_id, image_path, width, height").returns<PlanRow[]>(),
    supabase.from("map_rooms").select("map_id, kind, shape").returns<{ map_id: string; kind: string; shape: unknown }[]>(),
  ]);

  // Listed in the shelter's order (Settings → Zones and Enclosures).
  const zones: EditorZone[] = inShelterOrder(zonesResult.data ?? []).map((z) => ({ id: z.id, name: z.name, name_th: z.name_th, shape: parseShape(z.map_shape) }));
  const zoneIds = new Set(zones.map((z) => z.id));
  const enclosures: EditorEnclosure[] = inShelterOrder(enclosuresResult.data ?? [])
    .filter((e) => zoneIds.has(e.zone_id))
    .map((e) => ({ id: e.id, name: e.name, name_th: e.name_th, zone_id: e.zone_id, shape: parseShape(e.map_shape) }));
  // Each uploaded plan's history (who replaced it, and what an Undo would put back) is a small file
  // beside its pictures in the store; a plan still committed under public/ has none.
  const plans: EditorPlan[] = await Promise.all(
    (plansResult.data ?? [])
      .filter((p) => p.kind === "overview" || (p.zone_id && zoneIds.has(p.zone_id)))
      .map(async ({ image_path, ...p }) => {
        const stored = isStoredPlan(image_path);
        const history = stored ? await readHistory(p.id) : [];
        const last = history.at(-1);
        const undo = undoableReplace(history, image_path);
        return {
          ...p,
          image_url: planImageUrl(image_path),
          stored,
          fileName: stored ? null : image_path,
          lastChange: last ? { at: last.at, by: last.by.name, action: last.action } : null,
          undo: undo ? { at: undo.at, by: undo.by.name, cleared: undo.shapes === "cleared" } : null,
        };
      }),
  );

  const rooms: EditorRoom[] = [];
  for (const r of roomsResult.data ?? []) {
    const shape = parseShape(r.shape);
    if (shape && isRoomKind(r.kind)) rooms.push({ kind: r.kind, map_id: r.map_id, shape });
  }

  const error = zonesResult.error ?? enclosuresResult.error ?? plansResult.error ?? roomsResult.error;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.admin.facilityMap.title}</h1>
        <p className="text-sm text-muted">{t.admin.facilityMap.subtitle}</p>
      </div>
      <LargerScreenNotice>
        {error ? <p className="text-sm text-danger">{t.admin.facilityMap.couldntLoad}</p> : <MapEditor plans={plans} zones={zones} enclosures={enclosures} rooms={rooms} />}
      </LargerScreenNotice>
    </main>
  );
}
