import { ActionButton } from "@/components/ActionButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { can } from "@/lib/permissions/can";
import { loadPermissions } from "@/lib/permissions/load";
import { chipFromSearch } from "@/lib/residents/microchip";
import { ScanChipBox } from "./ScanChipBox";
import { FocusSearch } from "./FocusSearch";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { OFFSITE, tidiedQuery, toggleZone, zoneChipOrder } from "@/lib/enclosures/place";
import { getTagOrigin } from "@/lib/tags/origin";
import { loadVetScope } from "@/lib/vets/scope";
import { DECEASED } from "@/lib/residents/status";
import { exportFilename } from "@/lib/residents/export";
import {
  applyFilters,
  listQuery,
  listSource,
  resolveListView,
  STATUS_CHIPS,
  type StatusChip,
} from "@/lib/residents/list-view";
import { PlaceZoneChips } from "@/components/PlaceZoneChips";
import { asListRow, readsWhoAndWhereOnly, type WhoAndWhere } from "@/lib/residents/who-and-where";
import { ResidentsTable, type ResidentRow } from "./ResidentsTable";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";

function buildHref(params: {
  zones: string[];
  q: string;
  enclosure: string;
  all: boolean;
  noChip: boolean;
  status: StatusChip | null;
  unallocated: boolean;
}) {
  const search = new URLSearchParams();
  if (params.zones.length) search.set("zone", params.zones.join(","));
  if (params.unallocated) search.set("unallocated", "1");
  if (params.q) search.set("q", params.q);
  if (params.enclosure) search.set("enclosure", params.enclosure);
  if (params.all) search.set("all", "1");
  if (params.noChip) search.set("nochip", "1");
  if (params.status) search.set("status", params.status.toLowerCase());
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
  const { zones, physicalZones, enclosures, enclosuresIn, zoneIds, unallocated, enclosureId, showAll, noChip, status, chippedIds, filters } = view;

  // An old ?place= link, an off-site zone's own id or the Lifecycle zone's is read as the chips
  // that mean the same (resolveListView), and the URL is tidied to them (2026-10-08).
  const tidied = tidiedQuery(searchParams, {
    zone: zoneIds.join(","),
    unallocated: unallocated ? "1" : "",
  });
  if (tidied !== null) redirect(tidied ? `/residents?${tidied}` : "/residents");

  /**
   * The list with a different set of zone chips, everything else kept that
   * still applies: the enclosure only if it is under the new chips.
   */
  function hrefFor(nextZones: string[], nextUnallocated = unallocated) {
    return buildHref({
      zones: nextZones,
      q,
      enclosure: enclosuresIn(nextZones, nextUnallocated).some((e) => e.id === enclosureId)
        ? enclosureId
        : "",
      all: showAll,
      noChip,
      // Dropped with a zone: they would contradict it.
      status: null,
      unallocated: nextUnallocated,
    });
  }

  /** The same list with the deceased toggle flipped, other filters kept. */
  function toggleHref(all: boolean) {
    return buildHref({ zones: zoneIds, q, enclosure: enclosureId, all, noChip, status, unallocated });
  }

  /** The same list with "No microchip" flipped, other filters kept. */
  function noChipHref(next: boolean) {
    return buildHref({ zones: zoneIds, q, enclosure: enclosureId, all: showAll, noChip: next, status, unallocated });
  }

  /** A status chip picked (or, null, taken off); on, it clears the zones, Unallocated and enclosure. */
  function statusHref(next: StatusChip | null) {
    return buildHref({
      zones: [],
      q,
      enclosure: "",
      all: showAll,
      noChip,
      status: next,
      unallocated: false,
    });
  }

  const { table: listTable, idColumn } = listSource(limited);

  // Counted in both modes: hidden, it is what the toggle would reveal; shown,
  // it says how many of the rows on screen are past animals.
  // Adopted, fostered and hospitalised animals matching a search are in no
  // enclosure, so a filter can hide them without a word — the same silent
  // miss the deceased count guards against. Any zone chip (Off-site too: they
  // sit in the Lifecycle zone, not an off-site one), Unallocated or enclosure
  // hides all three; another status chip hides all but its own. Counted
  // ignoring those filters, and only when hidden.
  const narrowed = zoneIds.length > 0 || unallocated || Boolean(enclosureId);
  const hiddenStatuses = q
    ? STATUS_CHIPS.filter((s) => s !== status && (status !== null || narrowed))
    : [];
  const deceasedCountQuery = supabase
    .from(listTable as "resident_list_view")
    .select(idColumn, { count: "exact", head: true })
    .eq("current_status", DECEASED);

  const [tagOrigin, vetScope, residentsResult, deceased, statusMatches] = await Promise.all([
    getTagOrigin(),
    loadVetScope(supabase),
    listQuery(supabase, view, limited).returns<(ResidentRow | WhoAndWhere)[]>(),
    applyFilters(deceasedCountQuery, filters),
    Promise.all(
      hiddenStatuses.map(async (s) => {
        const { count } = await applyFilters(
          supabase
            .from(listTable as "resident_list_view")
            .select(idColumn, { count: "exact", head: true })
            .eq("current_status", s),
          { q, zoneIds: [], offsiteZoneIds: [], enclosureId: "", chippedIds, status: null, unallocated: false, limited },
        );
        return { status: s, count: count ?? 0 };
      }),
    ),
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
  // Where a deceased name match is shown from: this list with the toggle on.
  const deceasedMatchesHref = toggleHref(true);
  // Show all, the status chips and No microchip share a look: a pill, 44 px tall on a phone.
  const toggleChip = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-3 py-2 text-sm font-medium md:min-h-0 ${
      on
        ? "border-primary bg-primary/10 text-primary"
        : "border-border bg-surface text-muted hover:text-foreground"
    }`;

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
        {statusMatches.map(
          (match) =>
            match.count > 0 && (
              <p key={match.status} className="text-sm text-muted">
                {t.residents.list.statusMatches[match.status](match.count)}
                {" — "}
                <Link
                  href={statusHref(match.status)}
                  className="font-medium text-primary hover:underline"
                >
                  {t.residents.list.deceasedMatchesShow}
                </Link>
              </p>
            ),
        )}
        {status && (
          <p className="text-sm text-muted">{t.residents.list.statusOnly[status]}</p>
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
          allZonesHref={hrefFor([], false)}
          // The same row as /enclosures: on-site zones, then Off-site for every off-site zone.
          zones={zoneChipOrder(physicalZones).map((zone) =>
            zone === OFFSITE
              ? {
                  id: OFFSITE,
                  name: t.enclosures.offsiteChip,
                  name_th: null,
                  colour: null,
                  href: hrefFor(toggleZone(zoneIds, OFFSITE)),
                  active: zoneIds.includes(OFFSITE),
                }
              : {
                  id: zone.id,
                  name: zone.name,
                  name_th: zone.name_th,
                  colour: zone.colour,
                  href: hrefFor(toggleZone(zoneIds, zone.id)),
                  active: zoneIds.includes(zone.id),
                },
          )}
          // In place of the Lifecycle zone ("Status"), which listed the adopted too (2026-10-08),
          // last in the row as /enclosures' Status chip is.
          extra={{
            label: t.residents.list.unallocatedFilter,
            href: hrefFor(zoneIds, !unallocated),
            active: unallocated,
          }}
        />

        {/* Keyed on the filters so a chip or Clear, which navigate on the
            client, remount the inputs instead of leaving their old values. */}
        <form
          key={`${zoneIds.join(",")}|${unallocated}|${q}|${enclosureId}|${showAll}|${noChip}|${status}`}
          className="flex flex-wrap items-end gap-3"
          method="get"
        >
          {/* Keep the zones and deceased toggle when the form is submitted. */}
          {zoneIds.length > 0 && (
            <input type="hidden" name="zone" value={zoneIds.join(",")} />
          )}
          {unallocated && <input type="hidden" name="unallocated" value="1" />}
          {showAll && <input type="hidden" name="all" value="1" />}
          {noChip && <input type="hidden" name="nochip" value="1" />}
          {status && <input type="hidden" name="status" value={status.toLowerCase()} />}
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
            <FocusSearch inputId="q" />
          </div>
          {/* The enclosure filter is desktop-only; phones browse by
              zone → enclosure → residents at /enclosures instead. It lists
              only the enclosures under the zone chips above. */}
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
              only way back to a resident who has died. */}
          <Link href={toggleHref(!showAll)} className={toggleChip(showAll)}>
            {showAll
              ? t.residents.list.hideDeceased
              : t.residents.list.showAllDeceased}
          </Link>
          {/* One at a time; tapping the one that is on takes it off. */}
          {zoneIds.length === 0 &&
            !unallocated &&
            !enclosureId &&
            STATUS_CHIPS.map((s) => (
              <Link
                key={s}
                href={statusHref(status === s ? null : s)}
                aria-current={status === s ? "true" : undefined}
                className={toggleChip(status === s)}
              >
                {t.residents.list.statusFilter[s]}
              </Link>
            ))}
          {!limited && (
            <Link href={noChipHref(!noChip)} className={toggleChip(noChip)}>
              {t.residents.list.noMicrochip}
            </Link>
          )}
          {(q || zoneIds.length > 0 || unallocated || enclosureId || noChip || status) && (
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
