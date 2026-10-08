import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { residentCodeTerm } from "@/lib/residents/code-search";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import { byShelterOrder, enclosuresInShelterOrder } from "@/lib/enclosures/order";
import { OFFSITE, parseZoneIds, readZonePick, zoneIdsOf } from "@/lib/enclosures/place";
import { NOT_DECEASED, UNASSIGNED } from "@/lib/residents/status";
import { WHO_AND_WHERE_COLUMNS } from "@/lib/residents/who-and-where";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The status chips beside Show all (Lutan, 2026-10-08): residents who are in no enclosure, one
 * status at a time. Each is `current_status` exactly (src/lib/residents/place.ts), in this order.
 */
export const STATUS_CHIPS = ["Adopted", "Fostered", "Hospitalised"] as const;
export type StatusChip = (typeof STATUS_CHIPS)[number];

/** `?status=fostered` → "Fostered". `?adopted=1`, the Adopted chip's link before there were three, still works. */
export function parseStatusChip(params: Record<string, string | string[] | undefined>): StatusChip | null {
  const value = typeof params.status === "string" ? params.status.toLowerCase() : "";
  const chip = STATUS_CHIPS.find((s) => s.toLowerCase() === value);
  if (chip) return chip;
  return params.adopted === "1" ? "Adopted" : null;
}

/**
 * The name / zone / enclosure filters from the URL, applied the same
 * way to the list query and to the count behind it — "38 deceased hidden"
 * has to count the animals this list would have shown, not every animal that
 * ever died.
 */
export type Filters = {
  q: string;
  /** The on-site zones picked, by id. */
  zoneIds: string[];
  /**
   * The Off-site chip: every zone with `internal = false`, by id, read when the page is (2026-10-08);
   * empty when the chip is not picked. Applied with `zoneIds`, as one more zone would be.
   */
  offsiteZoneIds: string[];
  enclosureId: string;
  /**
   * "No microchip": the residents that DO have a chip, left out. The list
   * view does not carry the column, and chipped residents are the few, so
   * their ids are read first and excluded rather than the reverse.
   */
  chippedIds: string[] | null;
  /**
   * An Adopted, Fostered or Hospitalised chip: only residents with that status. They sit in the
   * Lifecycle pseudo-zone, so zone and enclosure are not applied — the chips are offered only
   * where no zone chip, Unallocated or enclosure is set.
   */
  status: StatusChip | null;
  /**
   * The Unallocated chip, which sits with the zone chips: residents at the shelter with no
   * enclosure yet ('Unassigned'). Picked with zones, it adds to them, as another zone would.
   */
  unallocated: boolean;
  /**
   * A volunteer's list reads `resident_who_and_where`, which has no other names (0134): the search
   * matches name, Thai name and code only.
   */
  limited: boolean;
};

export function applyFilters<
  Q extends {
    or(filters: string): Q;
    eq(column: string, value: string): Q;
    in(column: string, values: readonly string[]): Q;
    not(column: string, operator: string, value: string): Q;
  },
>(query: Q, { q, zoneIds: onSiteIds, offsiteZoneIds, enclosureId, chippedIds, status, unallocated, limited }: Filters): Q {
  const zoneIds = [...onSiteIds, ...offsiteZoneIds];
  let next = query;
  if (q) {
    const term = q.replace(/[,()%]/g, "");
    next = next.or(
      `name.ilike.%${term}%,thai_name.ilike.%${term}%,${limited ? "" : `other_names.ilike.%${term}%,`}resident_code.ilike.%${residentCodeTerm(term)}%`,
    );
  }
  // By status rather than zone: Unassigned, Hospital, Fostered and Adopted
  // all sit in the Lifecycle pseudo-zone (src/lib/residents/place.ts).
  // Picking that zone itself listed the adopted too, which is why it is no
  // longer offered (2026-10-08).
  if (status) {
    next = next.eq("current_status", status);
  }
  if (unallocated && zoneIds.length) {
    next = next.or(`zone_id.in.(${zoneIds.join(",")}),current_status.eq.${UNASSIGNED}`);
  } else if (unallocated) {
    next = next.eq("current_status", UNASSIGNED);
  } else if (zoneIds.length) {
    next = next.in("zone_id", zoneIds);
  }
  if (enclosureId) {
    next = next.eq("enclosure_id", enclosureId);
  }
  if (chippedIds?.length) {
    next = next.not("resident_id", "in", `(${chippedIds.join(",")})`);
  }
  return next;
}

/** The columns the (non-volunteer) residents list reads from `resident_list_view`. */
const LIST_COLUMNS =
  "resident_id, name, resident_code, thai_name, other_names, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal, zone_colour";

type Params = Record<string, string | string[] | undefined>;

/**
 * What the URL asks of /residents, resolved once: the zone chips, the enclosure that survives
 * them, and the toggles. The page and the spreadsheet download both read it, so a file cannot differ
 * from the list above the button (the backlog's "exactly as on screen").
 */
export async function resolveListView(supabase: Supabase, searchParams: Params, limited: boolean) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  // Zones and enclosures come first: which ?zone= and ?enclosure= ids are
  // honoured depends on them, and the list query needs the survivors.
  const [zonesResult, enclosuresResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal, sort_order, colour"),
    supabase.from("enclosures").select("id, name, name_th, zone_id, sort_order"),
  ]);

  // Physical zones in the shelter's order (Settings → Zones), the Lifecycle
  // pseudo-zone last, as on /enclosures.
  const zones = [...(zonesResult.data ?? [])]
    .map((zone) => ({ ...zone, is_system: zone.name === SYSTEM_ZONE }))
    .sort((a, b) => Number(a.is_system) - Number(b.is_system) || byShelterOrder(a, b));
  // Zone by zone, each in its order (Settings → Enclosures), for the Enclosure select.
  const allEnclosures = enclosuresInShelterOrder(enclosuresResult.data ?? [], zones);

  // The Lifecycle pseudo-zone is not a zone chip here (2026-10-08): its place is taken by
  // Unallocated and the status chips. Only physical zones are picked, and its enclosures (Adopted,
  // Hospital …) are not in the Enclosure select.
  const physicalZones = zones.filter((zone) => !zone.is_system);
  const lifecycleZone = zones.find((zone) => zone.is_system);
  // The chips picked, as on /enclosures (readZonePick): on-site zone ids and `offsite`, the one
  // chip for every off-site zone. Stale zones are dropped, not obeyed (decisions.md, 2026-09-25).
  const zoneIds = readZonePick(physicalZones, searchParams.zone, searchParams.place);
  // A link from before 2026-10-08 that picked the Lifecycle zone ("Status") now means
  // Unallocated, and so does the old On-site place, which counted the unallocated as on site.
  const unallocated =
    searchParams.unallocated === "1" ||
    searchParams.place === "internal" ||
    Boolean(lifecycleZone && parseZoneIds(searchParams.zone).includes(lifecycleZone.id));

  /** The enclosures the Enclosure select offers under these chips: all of them when none is picked. */
  function enclosuresIn(nextZones: string[], nextUnallocated = false) {
    const ids = zoneIdsOf(physicalZones, nextZones);
    // Unallocated alone: those residents have no enclosure to pick.
    if (nextUnallocated && !ids.length) return [];
    const offered = new Set(ids.length ? ids : physicalZones.map((zone) => zone.id));
    return allEnclosures.filter((enclosure) => offered.has(enclosure.zone_id));
  }
  const enclosures = enclosuresIn(zoneIds, unallocated);
  const requestedEnclosure =
    typeof searchParams.enclosure === "string" ? searchParams.enclosure : "";
  // Dropped the same way when it is outside the place or the picked zones.
  const enclosureId = enclosures.some((e) => e.id === requestedEnclosure) ? requestedEnclosure : "";

  // Deceased residents are hidden unless ?all=1 says otherwise.
  const showAll = searchParams.all === "1";
  // "No microchip" (the encouraging-chipping nudge): kept across every
  // other filter, like the search.
  const noChip = !limited && searchParams.nochip === "1";
  // The status chips belong to a list with no zone, Unallocated or enclosure
  // picked: these animals are in no enclosure, so any of those would empty it.
  const status =
    zoneIds.length === 0 && !unallocated && !enclosureId
      ? parseStatusChip(searchParams)
      : null;
  const chippedIds = noChip
    ? ((
        await supabase
          .from("residents")
          .select("id")
          .not("microchip_number", "is", null)
          .returns<{ id: string }[]>()
      ).data ?? []).map((row) => row.id)
    : null;
  const filters: Filters = {
    q,
    zoneIds: zoneIds.filter((id) => id !== OFFSITE),
    offsiteZoneIds: zoneIds.includes(OFFSITE) ? zoneIdsOf(physicalZones, [OFFSITE]) : [],
    enclosureId,
    chippedIds,
    status,
    unallocated,
    limited,
  };

  return { q, zones, physicalZones, allEnclosures, enclosures, enclosuresIn, zoneIds, unallocated, enclosureId, showAll, noChip, status, chippedIds, filters };
}

export type ListView = Awaited<ReturnType<typeof resolveListView>>;

/** The list's view, its column list and its id column: a volunteer's is `resident_who_and_where`. */
export function listSource(limited: boolean) {
  return {
    table: limited ? "resident_who_and_where" : "resident_list_view",
    idColumn: limited ? "id" : "resident_id",
    // A plain string: the typed select parser cannot follow a column list that depends on the view.
    columns: (limited ? WHO_AND_WHERE_COLUMNS : LIST_COLUMNS) as string,
  };
}

/**
 * The residents the list shows for a view: the list's source, by name, deceased left out unless
 * Show all is on, every filter applied; `ids`, when given, narrows that to the ticked rows. The
 * caller adds `.returns<…>()`.
 */
export function listQuery(supabase: Supabase, view: ListView, limited: boolean, ids: string[] = []) {
  const source = listSource(limited);
  let query = supabase
    .from(source.table as "resident_list_view")
    .select(source.columns)
    .order("name");
  if (!view.showAll) {
    query = query.or(NOT_DECEASED);
  }
  const filtered = applyFilters(query, view.filters);
  return ids.length ? filtered.in(source.idColumn, ids) : filtered;
}
