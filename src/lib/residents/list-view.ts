import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { residentCodeTerm } from "@/lib/residents/code-search";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import {
  offeredZones,
  parseEnclosurePlace,
  parseZoneIds,
  zonesKeptIn,
  type EnclosurePlace,
} from "@/lib/enclosures/place";
import { NOT_DECEASED, ADOPTED } from "@/lib/residents/status";
import { STATUSES_IN_PLACE } from "@/lib/residents/place";
import { WHO_AND_WHERE_COLUMNS } from "@/lib/residents/who-and-where";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The name / place / zone / enclosure filters from the URL, applied the same
 * way to the list query and to the count behind it — "38 deceased hidden"
 * has to count the animals this list would have shown, not every animal that
 * ever died.
 */
export type Filters = {
  q: string;
  place: EnclosurePlace;
  zoneIds: string[];
  enclosureId: string;
  /**
   * "No microchip": the residents that DO have a chip, left out. The list
   * view does not carry the column, and chipped residents are the few, so
   * their ids are read first and excluded rather than the reverse.
   */
  chippedIds: string[] | null;
  /**
   * The Adopted chip: only adopted residents. They sit in the Lifecycle
   * pseudo-zone and in no place, so place, zone and enclosure are not
   * applied — the chip is offered only where none of them is set.
   */
  adopted: boolean;
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
>(query: Q, { q, place, zoneIds, enclosureId, chippedIds, adopted, limited }: Filters): Q {
  let next = query;
  if (q) {
    const term = q.replace(/[,()%]/g, "");
    next = next.or(
      `name.ilike.%${term}%,thai_name.ilike.%${term}%,${limited ? "" : `other_names.ilike.%${term}%,`}resident_code.ilike.%${residentCodeTerm(term)}%`,
    );
  }
  // By status rather than zone: Unassigned is on site and Hospital /
  // Fostered are off it, though all three sit in the Lifecycle pseudo-zone
  // (src/lib/residents/place.ts).
  if (adopted) {
    next = next.eq("current_status", ADOPTED);
  }
  if (place !== "all") {
    next = next.in("current_status", STATUSES_IN_PLACE[place]);
  }
  if (zoneIds.length) {
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
  "resident_id, name, resident_code, thai_name, other_names, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal";

type Params = Record<string, string | string[] | undefined>;

/**
 * What the URL asks of /residents, resolved once: the place, the zones and enclosure that survive
 * it, and the toggles. The page and the spreadsheet download both read it, so a file cannot differ
 * from the list above the button (the backlog's "exactly as on screen").
 */
export async function resolveListView(supabase: Supabase, searchParams: Params, limited: boolean) {
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const place = parseEnclosurePlace(searchParams.place);

  // Zones and enclosures come first: which ?zone= and ?enclosure= ids are
  // honoured depends on the place, and the list query needs the survivors.
  const [zonesResult, enclosuresResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal").order("name"),
    supabase.from("enclosures").select("id, name, name_th, zone_id").order("name"),
  ]);

  // Physical zones first (alphabetical), the Lifecycle pseudo-zone last, as
  // on /enclosures.
  const zones = [...(zonesResult.data ?? [])]
    .map((zone) => ({ ...zone, is_system: zone.name === SYSTEM_ZONE }))
    .sort((a, b) => Number(a.is_system) - Number(b.is_system) || a.name.localeCompare(b.name));
  const allEnclosures = enclosuresResult.data ?? [];

  // Stale zones are dropped, not obeyed, exactly as on /enclosures
  // (decisions.md, 2026-09-25): a zone not on offer under the place.
  const zoneIds = zonesKeptIn(zones, parseZoneIds(searchParams.zone), place);

  /** The enclosures the Enclosure select offers under a place and zones. */
  function enclosuresIn(nextPlace: EnclosurePlace, nextZones: string[]) {
    const offered = new Set(
      nextZones.length ? nextZones : offeredZones(zones, nextPlace).map((zone) => zone.id),
    );
    return allEnclosures.filter((enclosure) => offered.has(enclosure.zone_id));
  }
  const enclosures = enclosuresIn(place, zoneIds);
  const requestedEnclosure =
    typeof searchParams.enclosure === "string" ? searchParams.enclosure : "";
  // Dropped the same way when it is outside the place or the picked zones.
  const enclosureId = enclosures.some((e) => e.id === requestedEnclosure) ? requestedEnclosure : "";

  // Deceased residents are hidden unless ?all=1 says otherwise. The toggle
  // belongs to Everywhere: the dead are in neither place, so under On-site
  // or Off-site it would change nothing, and ?all=1 there is ignored.
  const showAll = place === "all" && searchParams.all === "1";
  // "No microchip" (the encouraging-chipping nudge): kept across every
  // other filter, like the search.
  const noChip = !limited && searchParams.nochip === "1";
  // The Adopted chip belongs to Everywhere with no zone or enclosure picked,
  // like Show all: adopted animals are in no place and in the Lifecycle
  // zone, so any of those would empty the list.
  const adopted =
    place === "all" && zoneIds.length === 0 && !enclosureId && searchParams.adopted === "1";
  const chippedIds = noChip
    ? ((
        await supabase
          .from("residents")
          .select("id")
          .not("microchip_number", "is", null)
          .returns<{ id: string }[]>()
      ).data ?? []).map((row) => row.id)
    : null;
  const filters: Filters = { q, place, zoneIds, enclosureId, chippedIds, adopted, limited };

  return { q, place, zones, allEnclosures, enclosures, enclosuresIn, zoneIds, enclosureId, showAll, noChip, adopted, chippedIds, filters };
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
