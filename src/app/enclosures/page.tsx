import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { occupancyLevel } from "@/lib/enclosures/occupancy";
import { parseEnclosureSort } from "@/lib/enclosures/sort";
import { EnclosureFilters } from "./EnclosureFilters";
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
  zones: { name: string; name_th: string | null; internal: boolean } | null;
};

/** The Lifecycle pseudo-zone holds status buckets, not physical enclosures. */
const SYSTEM_ZONE = "Lifecycle";

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
  return b.resident_count - a.resident_count || a.name.localeCompare(b.name);
}

export default async function EnclosuresPage(props: PageProps<"/enclosures">) {
  const searchParams = await props.searchParams;
  const { t } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const zoneId = typeof searchParams.zone === "string" ? searchParams.zone : "";
  const sort = parseEnclosureSort(searchParams.sort);

  const supabase = await createClient();

  // Resident counts come from resident_list_view rather than a dedicated
  // occupancy view so no migration is needed; the shelter's headcount is
  // small enough that pulling one row per resident is cheap.
  const [zonesResult, enclosuresResult, residentsResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal").order("name"),
    supabase
      .from("enclosures")
      .select("id, name, name_th, capacity, notes, zone_id, zones(name, name_th, internal)")
      .order("name")
      .returns<EnclosureRow[]>(),
    supabase
      .from("resident_list_view")
      .select("enclosure_id")
      .not("enclosure_id", "is", null)
      .returns<{ enclosure_id: string }[]>(),
  ]);

  const counts = new Map<string, number>();
  for (const row of residentsResult.data ?? []) {
    counts.set(row.enclosure_id, (counts.get(row.enclosure_id) ?? 0) + 1);
  }

  const term = q.toLowerCase();
  const enclosures: EnclosureSummary[] = (enclosuresResult.data ?? [])
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
      resident_count: counts.get(row.id) ?? 0,
    }))
    .filter((e) => !zoneId || e.zone_id === zoneId)
    .filter(
      (e) =>
        !term ||
        e.name.toLowerCase().includes(term) ||
        (e.name_th ?? "").toLowerCase().includes(term),
    );

  // Physical zones first (alphabetical), the Lifecycle pseudo-zone last.
  const zones = [...(zonesResult.data ?? [])].sort((a, b) => {
    const aSys = a.name === SYSTEM_ZONE ? 1 : 0;
    const bSys = b.name === SYSTEM_ZONE ? 1 : 0;
    return aSys - bSys || a.name.localeCompare(b.name);
  });

  const groups: ZoneGroup[] = zones
    .map((zone) => ({
      id: zone.id,
      name: zone.name,
      name_th: zone.name_th,
      internal: zone.internal,
      isSystem: zone.name === SYSTEM_ZONE,
      enclosures: enclosures.filter((e) => e.zone_id === zone.id),
    }))
    .filter((zone) => zone.enclosures.length > 0);

  const flat =
    sort === "name"
      ? [...enclosures].sort((a, b) => a.name.localeCompare(b.name))
      : sort === "occupancy"
        ? [...enclosures].sort(compareOccupancy)
        : undefined;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t.enclosures.pageTitle}
        </h1>
        <p className="text-sm text-muted">{t.enclosures.pageSubtitle}</p>
      </div>

      <EnclosureFilters zones={zones} zoneId={zoneId} q={q} sort={sort} />

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

      <EnclosureGrid groups={groups} flat={flat} />
    </main>
  );
}
