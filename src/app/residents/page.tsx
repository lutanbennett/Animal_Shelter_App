import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { SYSTEM_ZONE } from "@/lib/enclosures/options";
import {
  ENCLOSURE_PLACES,
  offeredZones,
  parseEnclosurePlace,
  parseZoneIds,
  zonesKeptIn,
  type EnclosurePlace,
} from "@/lib/enclosures/place";
import { getTagOrigin } from "@/lib/tags/origin";
import { DECEASED, NOT_DECEASED } from "@/lib/residents/status";
import { STATUSES_IN_PLACE } from "@/lib/residents/place";
import { PlaceZoneChips } from "@/components/PlaceZoneChips";
import { ResidentsTable, type ResidentRow } from "./ResidentsTable";

/**
 * The name / place / zone / enclosure filters from the URL, applied the same
 * way to the list query and to the count behind it — "38 deceased hidden"
 * has to count the animals this list would have shown, not every animal that
 * ever died.
 */
type Filters = {
  q: string;
  place: EnclosurePlace;
  zoneIds: string[];
  enclosureId: string;
};

function applyFilters<
  Q extends {
    or(filters: string): Q;
    eq(column: string, value: string): Q;
    in(column: string, values: readonly string[]): Q;
  },
>(query: Q, { q, place, zoneIds, enclosureId }: Filters): Q {
  let next = query;
  if (q) {
    const term = q.replace(/[,()%]/g, "");
    next = next.or(
      `name.ilike.%${term}%,thai_name.ilike.%${term}%,other_names.ilike.%${term}%`,
    );
  }
  // By status rather than zone: Unassigned is on site and Hospital /
  // Fostered are off it, though all three sit in the Lifecycle pseudo-zone
  // (src/lib/residents/place.ts).
  if (place !== "all") {
    next = next.in("current_status", STATUSES_IN_PLACE[place]);
  }
  if (zoneIds.length) {
    next = next.in("zone_id", zoneIds);
  }
  if (enclosureId) {
    next = next.eq("enclosure_id", enclosureId);
  }
  return next;
}

function buildHref(params: {
  place: EnclosurePlace;
  zones: string[];
  q: string;
  enclosure: string;
  all: boolean;
}) {
  const search = new URLSearchParams();
  if (params.place !== "all") search.set("place", params.place);
  if (params.zones.length) search.set("zone", params.zones.join(","));
  if (params.q) search.set("q", params.q);
  if (params.enclosure) search.set("enclosure", params.enclosure);
  if (params.all) search.set("all", "1");
  // Commas read better than %2C in a shared link, and parse the same.
  const qs = search.toString().replace(/%2C/gi, ",");
  return qs ? `/residents?${qs}` : "/residents";
}

export default async function ResidentsPage(props: PageProps<"/residents">) {
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const place = parseEnclosurePlace(searchParams.place);

  const supabase = await createClient();

  // Zones and enclosures come first: which ?zone= and ?enclosure= ids are
  // honoured depends on the place, and the list query needs the survivors.
  const [zonesResult, enclosuresResult] = await Promise.all([
    supabase.from("zones").select("id, name, name_th, internal").order("name"),
    supabase
      .from("enclosures")
      .select("id, name, name_th, zone_id")
      .order("name"),
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
  const enclosureId = enclosures.some((e) => e.id === requestedEnclosure)
    ? requestedEnclosure
    : "";

  // Deceased residents are hidden unless ?all=1 says otherwise. The toggle
  // belongs to Everywhere: the dead are in neither place, so under On-site
  // or Off-site it would change nothing, and ?all=1 there is ignored.
  const showAll = place === "all" && searchParams.all === "1";
  const filters: Filters = { q, place, zoneIds, enclosureId };

  /**
   * The list with a different place or zone set, everything else kept that
   * still applies: zones and enclosure only if they belong to the new
   * place, the deceased toggle only under Everywhere.
   */
  function hrefFor(nextPlace: EnclosurePlace, nextZones: string[]) {
    const kept = zonesKeptIn(zones, nextZones, nextPlace);
    return buildHref({
      place: nextPlace,
      zones: kept,
      q,
      enclosure: enclosuresIn(nextPlace, kept).some((e) => e.id === enclosureId)
        ? enclosureId
        : "",
      all: showAll && nextPlace === "all",
    });
  }
  const placeHrefs = Object.fromEntries(
    ENCLOSURE_PLACES.map((next) => [next, hrefFor(next, zoneIds)]),
  ) as Record<EnclosurePlace, string>;

  /** The same list with the deceased toggle flipped, other filters kept. */
  function toggleHref(all: boolean) {
    return buildHref({ place, zones: zoneIds, q, enclosure: enclosureId, all });
  }

  let residentsQuery = supabase
    .from("resident_list_view")
    .select(
      "resident_id, name, resident_code, thai_name, other_names, current_status, enclosure_id, enclosure_name, enclosure_name_th, zone_id, zone_name, zone_name_th, zone_internal",
    )
    .order("name");
  if (!showAll) {
    residentsQuery = residentsQuery.or(NOT_DECEASED);
  }

  // Counted in both modes: hidden, it is what the toggle would reveal; shown,
  // it says how many of the rows on screen are past animals. Under a place
  // the dead are never in the list, so only a name search counts them —
  // matching the name alone, since "not on site" is exactly what they are.
  const countDeceased = place === "all" || Boolean(q);
  const deceasedCountQuery = supabase
    .from("resident_list_view")
    .select("resident_id", { count: "exact", head: true })
    .eq("current_status", DECEASED);

  const [tagOrigin, residentsResult, deceased] = await Promise.all([
    getTagOrigin(),
    applyFilters(residentsQuery, filters).returns<ResidentRow[]>(),
    countDeceased
      ? applyFilters(
          deceasedCountQuery,
          place === "all" ? filters : { q, place: "all", zoneIds: [], enclosureId: "" },
        )
      : Promise.resolve({ count: 0 }),
  ]);

  const { data: residents, error } = residentsResult;
  const shown = residents?.length ?? 0;
  const deceasedCount = deceased.count ?? 0;
  // Where a deceased name match is shown from: this list with the toggle
  // on, or — under a place, where the dead never appear — Everywhere with
  // just the search.
  const deceasedMatchesHref =
    place === "all"
      ? toggleHref(true)
      : buildHref({ place: "all", zones: [], q, enclosure: "", all: true });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">
          {t.residents.list.pageTitle}
        </h1>
        {!error && (
          <p className="text-sm text-muted">
            {t.residents.list.count(shown)}
            {deceasedCount > 0 && (
              <>
                {" · "}
                {showAll ? (
                  t.residents.list.deceasedIncluded(deceasedCount)
                ) : q ? (
                  // A name search must never tell staff that a past animal
                  // does not exist. The list stays as it is and points at the
                  // deceased matches, rather than silently changing mode.
                  <>
                    {t.residents.list.deceasedMatches(deceasedCount)}
                    {" — "}
                    <Link
                      href={deceasedMatchesHref}
                      className="font-medium text-primary hover:underline"
                    >
                      {t.residents.list.deceasedMatchesShow}
                    </Link>
                  </>
                ) : (
                  t.residents.list.deceasedHidden(deceasedCount)
                )}
              </>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <PlaceZoneChips
          place={place}
          placeHrefs={placeHrefs}
          allZonesHref={hrefFor(place, [])}
          zones={offeredZones(zones, place).map((zone) => ({
            id: zone.id,
            name: zone.name,
            name_th: zone.name_th,
            href: hrefFor(
              place,
              zoneIds.includes(zone.id)
                ? zoneIds.filter((id) => id !== zone.id)
                : [...zoneIds, zone.id],
            ),
            active: zoneIds.includes(zone.id),
          }))}
        />

        {/* Keyed on the filters so a chip or Clear, which navigate on the
            client, remount the inputs instead of leaving their old values. */}
        <form
          key={`${place}|${zoneIds.join(",")}|${q}|${enclosureId}|${showAll}`}
          className="flex flex-wrap items-end gap-3"
          method="get"
        >
          {/* Keep the place, zones and deceased toggle when the form is
              submitted. */}
          {place !== "all" && <input type="hidden" name="place" value={place} />}
          {zoneIds.length > 0 && (
            <input type="hidden" name="zone" value={zoneIds.join(",")} />
          )}
          {showAll && <input type="hidden" name="all" value="1" />}
          <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-none">
            <label htmlFor="q" className="text-sm font-medium text-muted">
              {t.residents.list.search}
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder={t.residents.list.searchPlaceholder}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:w-64"
            />
          </div>
          {/* The enclosure filter is desktop-only; phones browse by
              zone → enclosure → residents at /enclosures instead. It lists
              only the enclosures under the place and zones above. */}
          <div className="hidden flex-col gap-1 md:flex">
            <label
              htmlFor="enclosure"
              className="text-sm font-medium text-muted"
            >
              {t.residents.list.enclosure}
            </label>
            <select
              id="enclosure"
              name="enclosure"
              defaultValue={enclosureId}
              className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
            >
              <option value="">{t.residents.list.allEnclosures}</option>
              {enclosures.map((enclosure) => (
                <option key={enclosure.id} value={enclosure.id}>
                  {placeName(locale, enclosure.name, enclosure.name_th)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            {t.residents.list.filter}
          </button>
          {/* A link, not a checkbox: flipping it changes the list straight
              away rather than waiting for Filter. On phones too — it is the
              only way back to a resident who has died. Offered under
              Everywhere only, like /enclosures' Lifecycle chip. */}
          {place === "all" && (
            <Link
              href={toggleHref(!showAll)}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${
                showAll
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {showAll
                ? t.residents.list.hideDeceased
                : t.residents.list.showAllDeceased}
            </Link>
          )}
          {(q || place !== "all" || zoneIds.length > 0 || enclosureId) && (
            <Link
              href="/residents"
              className="text-sm font-medium text-muted hover:text-foreground"
            >
              {t.residents.list.clear}
            </Link>
          )}
        </form>
      </div>

      {error && (
        <p className="text-sm text-danger">
          {t.residents.list.couldntLoad}: {error.message}
        </p>
      )}

      <ResidentsTable residents={residents ?? []} tagOrigin={tagOrigin} />
    </main>
  );
}
