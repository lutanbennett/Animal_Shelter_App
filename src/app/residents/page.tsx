import { ActionButton } from "@/components/ActionButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { chipFromSearch } from "@/lib/residents/microchip";
import { ScanChipBox } from "./ScanChipBox";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import {
  ENCLOSURE_PLACES,
  offeredZones,
  zonesKeptIn,
  type EnclosurePlace,
} from "@/lib/enclosures/place";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadVetScope } from "@/lib/vets/scope";
import { ADOPTED, DECEASED } from "@/lib/residents/status";
import { exportFilename } from "@/lib/residents/export";
import { applyFilters, listQuery, listSource, resolveListView } from "@/lib/residents/list-view";
import { PlaceZoneChips } from "@/components/PlaceZoneChips";
import { asListRow, readsWhoAndWhereOnly, type WhoAndWhere } from "@/lib/residents/who-and-where";
import { ResidentsTable, type ResidentRow } from "./ResidentsTable";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";

function buildHref(params: {
  place: EnclosurePlace;
  zones: string[];
  q: string;
  enclosure: string;
  all: boolean;
  noChip: boolean;
  adopted: boolean;
}) {
  const search = new URLSearchParams();
  if (params.place !== "all") search.set("place", params.place);
  if (params.zones.length) search.set("zone", params.zones.join(","));
  if (params.q) search.set("q", params.q);
  if (params.enclosure) search.set("enclosure", params.enclosure);
  if (params.all) search.set("all", "1");
  if (params.noChip) search.set("nochip", "1");
  if (params.adopted) search.set("adopted", "1");
  // Commas read better than %2C in a shared link, and parse the same.
  const qs = search.toString().replace(/%2C/gi, ",");
  return qs ? `/residents?${qs}` : "/residents";
}

export default async function ResidentsPage(props: PageProps<"/residents">) {
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";

  const supabase = await createClient();
  // A volunteer reads who and where and nothing else of a resident (0134): no chip search, no
  // chip filter, and the list comes from `resident_who_and_where`.
  const limited = await readsWhoAndWhereOnly();

  // A chip scanner types 15 digits and presses Enter. An exact match goes
  // straight to that resident whatever the place, zone or deceased filters
  // say (RLS still limits a vet to their clinic's residents); an unknown
  // chip offers a new resident. Anything else is the usual name search.
  const chipQuery = limited ? null : chipFromSearch(q);
  if (chipQuery) {
    const { data: hit } = await supabase
      .from("residents")
      .select("id")
      .eq("microchip_number", chipQuery)
      .limit(1)
      .returns<{ id: string }[]>();
    if (hit?.[0]) redirect(`/residents/${hit[0].id}`);
  }
  const canRegister = chipQuery ? can(await loadPermissions(), "resident.register") : false;

  const view = await resolveListView(supabase, searchParams, limited);
  const { place, zones, enclosures, enclosuresIn, zoneIds, enclosureId, showAll, noChip, adopted, chippedIds, filters } = view;

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
      noChip,
      // Dropped with a place or zone: they would contradict it.
      adopted: false,
    });
  }
  const placeHrefs = Object.fromEntries(
    ENCLOSURE_PLACES.map((next) => [next, hrefFor(next, zoneIds)]),
  ) as Record<EnclosurePlace, string>;

  /** The same list with the deceased toggle flipped, other filters kept. */
  function toggleHref(all: boolean) {
    return buildHref({ place, zones: zoneIds, q, enclosure: enclosureId, all, noChip, adopted });
  }

  /** The same list with "No microchip" flipped, other filters kept. */
  function noChipHref(next: boolean) {
    return buildHref({ place, zones: zoneIds, q, enclosure: enclosureId, all: showAll, noChip: next, adopted });
  }

  /** The Adopted chip flipped; on, it clears place, zone and enclosure. */
  function adoptedHref(next: boolean) {
    return buildHref({
      place: "all",
      zones: [],
      q,
      enclosure: "",
      all: showAll,
      noChip,
      adopted: next,
    });
  }

  const { table: listTable, idColumn } = listSource(limited);

  // Counted in both modes: hidden, it is what the toggle would reveal; shown,
  // it says how many of the rows on screen are past animals. Under a place
  // the dead are never in the list, so only a name search counts them —
  // matching the name alone, since "not on site" is exactly what they are.
  const countDeceased = place === "all" || Boolean(q);
  // Adopted animals matching a search are in no place, so an On-site /
  // Off-site, zone or enclosure filter hides them without a word — the
  // same silent miss the deceased count guards against. Counted ignoring
  // those filters, and only when one of them is hiding them.
  const adoptedHidden = Boolean(q) && !adopted && (place !== "all" || zoneIds.length > 0 || Boolean(enclosureId));
  const adoptedCountQuery = supabase
    .from(listTable as "resident_list_view")
    .select(idColumn, { count: "exact", head: true })
    .eq("current_status", ADOPTED);
  const deceasedCountQuery = supabase
    .from(listTable as "resident_list_view")
    .select(idColumn, { count: "exact", head: true })
    .eq("current_status", DECEASED);

  const [tagOrigin, vetScope, residentsResult, deceased, adoptedMatch] = await Promise.all([
    getTagOrigin(),
    loadVetScope(supabase),
    listQuery(supabase, view, limited).returns<(ResidentRow | WhoAndWhere)[]>(),
    countDeceased
      ? applyFilters(
          deceasedCountQuery,
          place === "all" ? filters : { q, place: "all", zoneIds: [], enclosureId: "", chippedIds, adopted: false, limited },
        )
      : Promise.resolve({ count: 0 }),
    adoptedHidden
      ? applyFilters(adoptedCountQuery, {
          q,
          place: "all",
          zoneIds: [],
          enclosureId: "",
          chippedIds,
          adopted: false,
          limited,
        })
      : Promise.resolve({ count: 0 }),
  ]);

  // RLS already limits a vet to their clinics' residents (0108); this only
  // names the clinics, so the list says whose it is.
  const vetClinicName =
    vetScope.kind === "clinics"
      ? ((
          await supabase.from("vets").select("name").in("id", vetScope.vetIds).order("name")
        ).data ?? [])
          .map((v) => v.name as string)
          .join(", ") || null
      : null;

  const { error } = residentsResult;
  // The who-and-where view names the id "id" and has no zone_internal; the zones read above has it.
  const zoneInternal = new Map(zones.map((zone) => [zone.id, zone.internal as boolean | null]));
  const residents: ResidentRow[] = (residentsResult.data ?? []).map((row) =>
    limited ? asListRow(row as WhoAndWhere, zoneInternal.get((row as WhoAndWhere).zone_id ?? "") ?? null) : (row as ResidentRow),
  );
  // The download asks the server for this same list: the page's own query string, nothing re-derived.
  const exportParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") exportParams.set(key, value);
  }
  const exportHref = `/residents/export${exportParams.size ? `?${exportParams}` : ""}`;
  const shown = residents?.length ?? 0;
  const deceasedCount = deceased.count ?? 0;
  // Where a deceased name match is shown from: this list with the toggle
  // on, or — under a place, where the dead never appear — Everywhere with
  // just the search.
  const deceasedMatchesHref =
    place === "all"
      ? toggleHref(true)
      : buildHref({ place: "all", zones: [], q, enclosure: "", all: true, noChip, adopted: false });
  const adoptedCount = adoptedMatch.count ?? 0;

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
        {adoptedCount > 0 && (
          <p className="text-sm text-muted">
            {t.residents.list.adoptedMatches(adoptedCount)}
            {" — "}
            <Link
              href={adoptedHref(true)}
              className="font-medium text-primary hover:underline"
            >
              {t.residents.list.deceasedMatchesShow}
            </Link>
          </p>
        )}
        {adopted && (
          <p className="text-sm text-muted">{t.residents.list.adoptedOnly}</p>
        )}
        {vetScope.kind === "clinics" && vetClinicName && (
          <p className="text-sm text-muted">{t.residents.list.vetScope(vetClinicName)}</p>
        )}
        {vetScope.kind === "unlinked" && (
          <p className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground">
            {t.residents.list.vetScopeNoClinic}
          </p>
        )}
      </div>

      {!limited && <ScanChipBox />}
      {chipQuery && (
        <p className="flex flex-wrap items-center gap-3 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground">
          {t.residents.list.chipNotFound(chipQuery)}
          {canRegister && (
            <ActionLink
              href={`/residents/new?chip=${chipQuery}`}
              label={t.residents.list.chipNewResident}
              icon={ACTION_ICONS.add}
              variant="primary"
              iconOnlyOnMobile={false}
            />
          )}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <PlaceZoneChips
          place={place}
          placeHrefs={placeHrefs}
          allZonesHref={hrefFor(place, [])}
          zones={offeredZones(zones, place).map((zone) => ({
            id: zone.id,
            name: zone.name,
            name_th: zone.name_th,
            colour: zone.colour,
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
          key={`${place}|${zoneIds.join(",")}|${q}|${enclosureId}|${showAll}|${noChip}|${adopted}`}
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
          {noChip && <input type="hidden" name="nochip" value="1" />}
          {adopted && <input type="hidden" name="adopted" value="1" />}
          <div className="flex min-w-0 basis-full flex-col gap-1 md:flex-none md:basis-auto">
            <label htmlFor="q" className="text-sm font-medium text-muted">
              {t.residents.list.search}
            </label>
            <input
              id="q"
              name="q"
              defaultValue={q}
              placeholder={limited ? t.residents.list.searchPlaceholderWhoAndWhere : t.residents.list.searchPlaceholder}
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
          <ActionButton type="submit" variant="primary" icon={ACTION_ICONS.filter}>
            {t.residents.list.filter}
          </ActionButton>
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
          {place === "all" && zoneIds.length === 0 && !enclosureId && (
            <Link
              href={adoptedHref(!adopted)}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${
                adopted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {t.residents.list.adoptedFilter}
            </Link>
          )}
          {!limited && (
            <Link
              href={noChipHref(!noChip)}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${
                noChip
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted hover:text-foreground"
              }`}
            >
              {t.residents.list.noMicrochip}
            </Link>
          )}
          {(q || place !== "all" || zoneIds.length > 0 || enclosureId || noChip || adopted) && (
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

      <ResidentsTable
        residents={residents}
        tagOrigin={tagOrigin}
        limited={limited}
        exportHref={exportHref}
        exportFilename={exportFilename({ ...filters, showAll, noChip }, 0)}
      />
    </main>
  );
}
