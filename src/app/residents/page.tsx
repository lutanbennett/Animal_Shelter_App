import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { placeName } from "@/lib/enclosures/names";
import { getTagOrigin } from "@/lib/tags/origin";
import { DECEASED, NOT_DECEASED } from "@/lib/residents/status";
import { ResidentsTable, type ResidentRow } from "./ResidentsTable";

/**
 * The name / zone / enclosure filters from the URL, applied the same way to
 * the list query and to the count behind it — "38 deceased hidden" has to
 * count the animals this list would have shown, not every animal that ever
 * died.
 */
type Filters = { q: string; zoneId: string; enclosureId: string };

function applyFilters<
  Q extends { or(filters: string): Q; eq(column: string, value: string): Q },
>(query: Q, { q, zoneId, enclosureId }: Filters): Q {
  let next = query;
  if (q) {
    const term = q.replace(/[,()%]/g, "");
    next = next.or(
      `name.ilike.%${term}%,thai_name.ilike.%${term}%,other_names.ilike.%${term}%`,
    );
  }
  if (zoneId) {
    next = next.eq("zone_id", zoneId);
  }
  if (enclosureId) {
    next = next.eq("enclosure_id", enclosureId);
  }
  return next;
}

export default async function ResidentsPage(props: PageProps<"/residents">) {
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const q = typeof searchParams.q === "string" ? searchParams.q.trim() : "";
  const zoneId = typeof searchParams.zone === "string" ? searchParams.zone : "";
  const enclosureId =
    typeof searchParams.enclosure === "string" ? searchParams.enclosure : "";
  // Deceased residents are hidden unless ?all=1 says otherwise.
  const showAll = searchParams.all === "1";
  const filters: Filters = { q, zoneId, enclosureId };

  /** The same list with the deceased toggle flipped, other filters kept. */
  function toggleHref(all: boolean) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (zoneId) params.set("zone", zoneId);
    if (enclosureId) params.set("enclosure", enclosureId);
    if (all) params.set("all", "1");
    const query = params.toString();
    return query ? `/residents?${query}` : "/residents";
  }

  const supabase = await createClient();

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
  // it says how many of the rows on screen are past animals.
  const deceasedCountQuery = supabase
    .from("resident_list_view")
    .select("resident_id", { count: "exact", head: true })
    .eq("current_status", DECEASED);

  const [zonesResult, enclosuresResult, tagOrigin, residentsResult, deceased] =
    await Promise.all([
      supabase.from("zones").select("id, name, name_th").order("name"),
      supabase
        .from("enclosures")
        .select("id, name, name_th, zone_id")
        .order("name"),
      getTagOrigin(),
      applyFilters(residentsQuery, filters).returns<ResidentRow[]>(),
      applyFilters(deceasedCountQuery, filters),
    ]);

  const { data: residents, error } = residentsResult;
  const zones = zonesResult.data ?? [];
  const enclosures = enclosuresResult.data ?? [];
  const shown = residents?.length ?? 0;
  const deceasedCount = deceased.count ?? 0;

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
                      href={toggleHref(true)}
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

      <form className="flex flex-wrap items-end gap-3" method="get">
        {/* Keep the deceased toggle on when the filters are submitted. */}
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
        {/* Zone / enclosure filters are desktop-only; phones browse by
            zone → enclosure → residents at /enclosures instead. */}
        <div className="hidden flex-col gap-1 md:flex">
          <label htmlFor="zone" className="text-sm font-medium text-muted">
            {t.residents.list.zone}
          </label>
          <select
            id="zone"
            name="zone"
            defaultValue={zoneId}
            className="w-48 rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{t.residents.list.allZones}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {placeName(locale, zone.name, zone.name_th)}
              </option>
            ))}
          </select>
        </div>
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
        {/* A link, not a checkbox: flipping it changes the list straight away
            rather than waiting for Filter. On phones too — it is the only way
            back to a resident who has died. */}
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
        {(q || zoneId || enclosureId) && (
          <Link
            href="/residents"
            className="text-sm font-medium text-muted hover:text-foreground"
          >
            {t.residents.list.clear}
          </Link>
        )}
      </form>

      {error && (
        <p className="text-sm text-danger">
          {t.residents.list.couldntLoad}: {error.message}
        </p>
      )}

      <ResidentsTable residents={residents ?? []} tagOrigin={tagOrigin} />
    </main>
  );
}
