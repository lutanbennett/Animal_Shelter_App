import { can } from "@/lib/permissions/can";
import { requirePermission } from "@/lib/permissions/require";
import { getT } from "@/lib/i18n/get-t";
import { occupancyLevel } from "@/lib/enclosures/occupancy";
import { parseEnclosureSort } from "@/lib/enclosures/sort";
import { byShelterOrder, inShelterOrder, natural } from "@/lib/enclosures/order";
import {
  parseEnclosurePlace,
  parseZoneIds,
  zoneInPlace,
  zonesKeptIn,
} from "@/lib/enclosures/place";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadOccupants } from "@/lib/residents/who-and-where";
import { loadSpecialDiets } from "@/lib/diets/special";
import { todayIso } from "@/lib/format";
import { parseShape } from "@/lib/facility-map/geometry";
import { planImageUrl, type FacilityMapData } from "@/lib/facility-map/types";
import { isRoomKind } from "@/lib/facility-map/rooms";
import { EnclosureFilters } from "./EnclosureFilters";
import { FacilityMap } from "./map/FacilityMap";
import { ViewToggle } from "./ViewToggle";
import {
  EnclosureGrid,
  type EnclosureSummary,
  type ZoneGroup,
} from "./EnclosureGrid";

type EnclosureRow = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  map_shape: unknown;
  sort_order: number | null;
  zones: { name: string; name_th: string | null; internal: boolean } | null;
};

type PlanRow = {
  id: string;
  kind: "overview" | "zone";
  zone_id: string | null;
  image_path: string;
  width: number;
  height: number;
};

/** The Lifecycle pseudo-zone holds status buckets, not physical enclosures. */
const SYSTEM_ZONE = "Lifecycle";

/**
 * The Lifecycle buckets worth a card: where a resident is when they're not
 * in a kennel but might come back. Adopted and Deceased are history, not
 * housing, and stay off the browser (the residents list still filters on
 * them). Shown in this order, at the top, without a zone heading.
 */
const PINNED_STATUSES = ["Hospital", "Unassigned", "Fostered"];

// Rank so "Over capacity" sorts ahead of "Full", then by how full, then by
// raw count — enclosures without a capacity go last.
const LEVEL_RANK = { over: 0, full: 1, near: 2, ok: 3, unknown: 4 } as const;

function compareOccupancy(a: EnclosureSummary, b: EnclosureSummary) {
  const rank =
    LEVEL_RANK[occupancyLevel(a.resident_count, a.capacity)] -
    LEVEL_RANK[occupancyLevel(b.resident_count, b.capacity)];
  if (rank !== 0) return rank;
  const ratioA = a.capacity ? a.resident_count / a.capacity : 0;
  const ratioB = b.capacity ? b.resident_count / b.capacity : 0;
  if (ratioB !== ratioA) return ratioB - ratioA;
  return b.resident_count - a.resident_count || natural.compare(a.name, b.name);
}

export default async function EnclosuresPage(props: PageProps<"/enclosures">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const place = parseEnclosurePlace(searchParams.place);
  const sort = parseEnclosureSort(searchParams.sort);

  const { supabase, perms } = await requirePermission("facility.enclosures", "read");

  // Resident counts come from resident_list_view rather than a dedicated
  // occupancy view so no migration is needed; the shelter's headcount is
  // small enough that pulling one row per resident is cheap.
  // The map is for whoever holds facility.map (0132), and reads the same rows as the list.
  const canMap = can(perms, "facility.map");
  const [zonesResult, enclosuresResult, residentsResult, jobsResult, tagOrigin, specialDiets, plansResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal, map_shape, sort_order"),
    supabase
      .from("enclosures")
      .select("id, name, name_th, capacity, notes, zone_id, map_shape, sort_order, zones(name, name_th, internal)")
      .returns<EnclosureRow[]>(),
    loadOccupants(supabase),
    // Open maintenance per enclosure, and per zone for zone-wide jobs
    // (enclosure_id null). A vet can't read maintenance (0001) and simply
    // gets zeros — no error, RLS filters.
    supabase
      .from("maintenance")
      .select("enclosure_id, zone_id")
      .neq("status", "Completed")
      .returns<{ enclosure_id: string | null; zone_id: string }[]>(),
    getTagOrigin(),
    // Who is on a special diet, for the marker on each card (0087).
    loadSpecialDiets(supabase),
    canMap
      ? supabase.from("facility_maps").select("id, kind, zone_id, image_path, width, height").returns<PlanRow[]>()
      : Promise.resolve({ data: [] as PlanRow[] }),
  ]);

  // The open-maintenance filter is hidden from vets, and a ?maint=open link
  // is ignored for them, since RLS would leave it showing nothing at all.
  const canFilterMaintenance = can(perms, "maintenance.jobs", "read");
  const maintOpen = canFilterMaintenance && searchParams.maint === "open";

  const counts = new Map<string, number>();
  const specialByEnclosure = new Map<string, string[]>();
  for (const row of residentsResult.data) {
    counts.set(row.enclosure_id, (counts.get(row.enclosure_id) ?? 0) + 1);
    if (specialDiets.has(row.resident_id)) {
      specialByEnclosure.set(row.enclosure_id, [
        ...(specialByEnclosure.get(row.enclosure_id) ?? []),
        row.name,
      ]);
    }
  }
  const openJobs = new Map<string, number>();
  const zoneWideJobs = new Map<string, number>();
  for (const job of jobsResult.data ?? []) {
    if (job.enclosure_id) {
      openJobs.set(job.enclosure_id, (openJobs.get(job.enclosure_id) ?? 0) + 1);
    } else {
      zoneWideJobs.set(job.zone_id, (zoneWideJobs.get(job.zone_id) ?? 0) + 1);
    }
  }

  // Physical zones in the shelter's order (Settings → Zones), the Lifecycle pseudo-zone last.
  const zones = [...(zonesResult.data ?? [])]
    .map((zone) => ({ ...zone, is_system: zone.name === SYSTEM_ZONE }))
    .sort((a, b) => Number(a.is_system) - Number(b.is_system) || byShelterOrder(a, b));

  // A zone that isn't on offer under the place (offeredZones: Lifecycle is
  // neither On-site nor Off-site, decisions.md 2026-09-25) is dropped rather
  // than obeyed, so a link with ?place=external&zone=<an on-site zone> shows
  // every off-site enclosure instead of an empty page. The chips switching
  // place drop them the same way before they get here.
  const zoneIds = zonesKeptIn(zones, parseZoneIds(searchParams.zone), place);

  const term = q.toLowerCase();
  // In the shelter's order within each zone (Settings → Enclosures): the By zone view and the map read it.
  const summaries: EnclosureSummary[] = inShelterOrder(enclosuresResult.data ?? [])
    .map((row) => ({
      id: row.id,
      name: row.name,
      name_th: row.name_th,
      capacity: row.capacity,
      notes: row.notes,
      zone_id: row.zone_id,
      zone_name: row.zones?.name ?? t.common.dash,
      zone_name_th: row.zones?.name_th ?? null,
      zone_internal: row.zones?.internal ?? true,
      is_system: row.zones?.name === SYSTEM_ZONE,
      resident_count: counts.get(row.id) ?? 0,
      open_jobs: openJobs.get(row.id) ?? 0,
      special_diet_residents: specialByEnclosure.get(row.id) ?? [],
    }));
  const enclosures = summaries
    .filter((e) => !e.is_system || PINNED_STATUSES.includes(e.name))
    // On-site / Off-site leaves the Lifecycle cards out, as ?maint=open does.
    .filter((e) => place === "all" || (!e.is_system && zoneInPlace(e.zone_internal, place)))
    .filter((e) => zoneIds.length === 0 || zoneIds.includes(e.zone_id))
    // Only jobs on the enclosure itself, matching the count on its card;
    // zone-wide jobs stay on the zone heading (decisions.md, 2026-09-24).
    // That also drops the Lifecycle cards, which carry no jobs.
    .filter((e) => !maintOpen || (!e.is_system && e.open_jobs > 0))
    .filter(
      (e) =>
        !term ||
        e.name.toLowerCase().includes(term) ||
        (e.name_th ?? "").toLowerCase().includes(term),
    );

  // The status buckets go above the zones, in their fixed order, whatever
  // the sort; the physical enclosures are grouped or sorted below them.
  const pinned = PINNED_STATUSES.flatMap((name) =>
    enclosures.filter((e) => e.is_system && e.name === name),
  );
  const physical = enclosures.filter((e) => !e.is_system);

  const groups: ZoneGroup[] = zones
    .filter((zone) => !zone.is_system)
    .map((zone) => ({
      id: zone.id,
      name: zone.name,
      name_th: zone.name_th,
      internal: zone.internal,
      enclosures: physical.filter((e) => e.zone_id === zone.id),
      total_enclosures: summaries.filter((e) => e.zone_id === zone.id).length,
      zone_wide_jobs: zoneWideJobs.get(zone.id) ?? 0,
    }))
    .filter((zone) => zone.enclosures.length > 0);

  const flat =
    sort === "name"
      ? [...physical].sort((a, b) => natural.compare(a.name, b.name))
      : sort === "occupancy"
        ? [...physical].sort(compareOccupancy)
        : undefined;

  // The map shows the whole on-site shelter, unfiltered: it is its own way in (overview → zone →
  // enclosure), and a place or zone filter would only leave it empty. The Map toggle is offered
  // only once a plan image exists, so a shelter that has none yet sees no empty map.
  const plans = plansResult.data ?? [];
  const hasMap = canMap && plans.length > 0;
  const showMap = hasMap && searchParams.view === "map";
  let mapData: FacilityMapData | null = null;
  if (showMap) {
    // Residents on a current prescription (archived_at null, started, not yet ended: the hub's rule),
    // counted per enclosure. A role that cannot read prescriptions gets an empty list from RLS, so no marker.
    const today = todayIso();
    const { data: rx } = await supabase
      .from("prescriptions")
      .select("resident_id")
      .is("archived_at", null)
      .lte("start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .returns<{ resident_id: string }[]>();
    const onMedication = new Set((rx ?? []).map((r) => r.resident_id));
    const medicatedIn = new Map<string, number>();
    for (const row of residentsResult.data) {
      if (onMedication.has(row.resident_id)) medicatedIn.set(row.enclosure_id, (medicatedIn.get(row.enclosure_id) ?? 0) + 1);
    }
    // The Medical room, Kitchen and Storage (0157): not enclosures, so read from their own table.
    const { data: roomRows } = await supabase
      .from("map_rooms")
      .select("id, map_id, kind, shape")
      .returns<{ id: string; map_id: string; kind: string; shape: unknown }[]>();
    const rooms: FacilityMapData["rooms"] = [];
    for (const r of roomRows ?? []) {
      const shape = parseShape(r.shape);
      if (shape && isRoomKind(r.kind)) rooms.push({ id: r.id, map_id: r.map_id, kind: r.kind, shape });
    }
    const onSite = summaries.filter((e) => !e.is_system && e.zone_internal);
    const shapeOf = new Map((enclosuresResult.data ?? []).map((row) => [row.id, parseShape(row.map_shape)]));
    mapData = {
      rooms,
      plans: plans.map((p) => ({
        id: p.id,
        kind: p.kind,
        zone_id: p.zone_id,
        image_url: planImageUrl(p.image_path),
        width: p.width,
        height: p.height,
      })),
      zones: zones
        .filter((zone) => !zone.is_system && zone.internal)
        .map((zone) => {
          const inZone = onSite.filter((e) => e.zone_id === zone.id);
          const capacities = inZone.filter((e) => e.capacity != null);
          return {
            id: zone.id,
            name: zone.name,
            name_th: zone.name_th,
            shape: parseShape(zone.map_shape),
            enclosure_count: inZone.length,
            resident_count: inZone.reduce((n, e) => n + e.resident_count, 0),
            capacity: capacities.length ? capacities.reduce((n, e) => n + (e.capacity ?? 0), 0) : null,
          };
        }),
      enclosures: onSite.map((e) => ({
        id: e.id,
        name: e.name,
        name_th: e.name_th,
        zone_id: e.zone_id,
        shape: shapeOf.get(e.id) ?? null,
        capacity: e.capacity,
        resident_count: e.resident_count,
        open_jobs: e.open_jobs,
        special_diet_count: e.special_diet_residents.length,
        medication_count: medicatedIn.get(e.id) ?? 0,
      })),
    };
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t.enclosures.pageTitle}
          </h1>
          <p className="text-sm text-muted">{t.enclosures.pageSubtitle}</p>
        </div>
        {hasMap && <ViewToggle map={showMap} />}
      </div>

      {mapData ? (
        <FacilityMap data={mapData} />
      ) : (
        <>
      <EnclosureFilters
        zones={zones}
        place={place}
        zoneIds={zoneIds}
        q={q}
        sort={sort}
        maintOpen={maintOpen}
        canFilterMaintenance={canFilterMaintenance}
      />

      {enclosuresResult.error && (
        <p className="text-sm text-danger">
          {t.enclosures.couldntLoadEnclosures}: {enclosuresResult.error.message}
        </p>
      )}
      {residentsResult.error && (
        <p className="text-sm text-danger">
          {t.enclosures.couldntLoadResidents}: {residentsResult.error.message}
        </p>
      )}

      <EnclosureGrid pinned={pinned} groups={groups} flat={flat} tagOrigin={tagOrigin} />
        </>
      )}
    </main>
  );
}
