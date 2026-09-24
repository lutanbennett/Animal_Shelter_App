"use client";

import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { ENCLOSURE_SORTS, type EnclosureSort } from "@/lib/enclosures/sort";
import { ENCLOSURE_PLACES, zoneInPlace, type EnclosurePlace } from "@/lib/enclosures/place";

type ZoneOption = {
  id: string;
  name: string;
  name_th: string | null;
  internal: boolean;
  /** The Lifecycle pseudo-zone: offered only under "all". */
  is_system: boolean;
};

function buildHref(params: {
  place?: EnclosurePlace;
  zones?: string[];
  q?: string;
  sort?: EnclosureSort;
  maint?: boolean;
}) {
  const search = new URLSearchParams();
  if (params.place && params.place !== "all") search.set("place", params.place);
  if (params.zones?.length) search.set("zone", params.zones.join(","));
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "zone") search.set("sort", params.sort);
  if (params.maint) search.set("maint", "open");
  // Commas read better than %2C in a shared link, and parse the same.
  const qs = search.toString().replace(/%2C/gi, ",");
  return qs ? `/enclosures?${qs}` : "/enclosures";
}

function offeredIn(zones: ZoneOption[], place: EnclosurePlace) {
  return zones.filter(
    (zone) => place === "all" || (!zone.is_system && zoneInPlace(zone.internal, place)),
  );
}

/**
 * Everywhere / On-site / Off-site (`?place=`), zone chips beneath it that
 * narrow to one or more of that place's zones (`?zone=a,b` — tap to add or
 * remove), an enclosure-name search, a sort picker and, for roles that can
 * read maintenance, a "Has open maintenance" toggle (`?maint=open`).
 * Everything is plain GET navigation so the browser's back button returns
 * to the same filtered view after opening an enclosure.
 */
export function EnclosureFilters({
  zones,
  place,
  zoneIds,
  q,
  sort,
  maintOpen,
  canFilterMaintenance,
}: {
  /** Every zone; the chips show the ones under `place`. */
  zones: ZoneOption[];
  place: EnclosurePlace;
  /** Chosen zones, already limited to `place` by the page. */
  zoneIds: string[];
  q: string;
  sort: EnclosureSort;
  maintOpen: boolean;
  canFilterMaintenance: boolean;
}) {
  const { t, locale } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = Boolean(
    place !== "all" || zoneIds.length || q || sort !== "zone" || maintOpen,
  );
  const rest = { q, sort, maint: maintOpen };

  const sortLabels: Record<EnclosureSort, string> = {
    zone: t.enclosures.sortZone,
    name: t.enclosures.sortName,
    occupancy: t.enclosures.sortOccupancy,
  };
  const placeLabels: Record<EnclosurePlace, string> = {
    all: t.enclosures.placeAll,
    internal: t.enclosures.hub.internal,
    external: t.enclosures.hub.external,
  };

  // Switching place keeps only the chosen zones that belong to the new
  // one — none, when going between On-site and Off-site — so the result
  // is the whole of that place rather than an empty grid.
  function placeHref(next: EnclosurePlace) {
    const allowed = new Set(offeredIn(zones, next).map((zone) => zone.id));
    return buildHref({ ...rest, place: next, zones: zoneIds.filter((id) => allowed.has(id)) });
  }

  function toggleHref(id: string) {
    const next = zoneIds.includes(id)
      ? zoneIds.filter((z) => z !== id)
      : [...zoneIds, id];
    return buildHref({ ...rest, place, zones: next });
  }

  function chipClass(active: boolean) {
    return `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
    }`;
  }

  function segmentClass(active: boolean) {
    return `rounded px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted hover:bg-surface-hover hover:text-foreground"
    }`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label={t.enclosures.placeLabel}
        className="flex w-fit gap-1 rounded-md border border-border bg-surface p-1"
      >
        {ENCLOSURE_PLACES.map((value) => (
          <Link
            key={value}
            href={placeHref(value)}
            aria-current={place === value ? "true" : undefined}
            className={segmentClass(place === value)}
          >
            {placeLabels[value]}
          </Link>
        ))}
      </div>

      {/* Horizontally scrollable on phones so a long zone list doesn't wrap
          into a tall block above the enclosures. */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Link
          href={buildHref({ ...rest, place })}
          aria-current={zoneIds.length === 0 ? "true" : undefined}
          className={chipClass(zoneIds.length === 0)}
        >
          {t.enclosures.allZones}
        </Link>
        {offeredIn(zones, place).map((zone) => (
          <Link
            key={zone.id}
            href={toggleHref(zone.id)}
            aria-current={zoneIds.includes(zone.id) ? "true" : undefined}
            className={chipClass(zoneIds.includes(zone.id))}
          >
            {placeName(locale, zone.name, zone.name_th)}
          </Link>
        ))}
      </div>

      {/* Keyed on the filters so Clear or a chip, which navigate on the
          client, remount the inputs instead of leaving their old defaults. */}
      <form
        key={`${place}|${zoneIds.join(",")}|${q}|${sort}|${maintOpen}`}
        ref={formRef}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        {place !== "all" && <input type="hidden" name="place" value={place} />}
        {zoneIds.length > 0 && <input type="hidden" name="zone" value={zoneIds.join(",")} />}
        <div className="flex min-w-0 flex-1 flex-col gap-1 md:flex-none">
          <label htmlFor="q" className="text-sm font-medium text-muted">
            {t.enclosures.search}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t.enclosures.searchPlaceholder}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sort" className="text-sm font-medium text-muted">
            {t.enclosures.sort}
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            onChange={() => formRef.current?.requestSubmit()}
            className="rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40 md:w-44"
          >
            {ENCLOSURE_SORTS.map((value) => (
              <option key={value} value={value}>
                {sortLabels[value]}
              </option>
            ))}
          </select>
        </div>
        {canFilterMaintenance && (
          // Its own line on phones, where it would otherwise squeeze the
          // search box (flex-1 from zero) down to nothing.
          <label className="flex w-full items-center gap-2 py-2 text-sm font-medium text-foreground md:w-auto">
            <input
              type="checkbox"
              name="maint"
              value="open"
              defaultChecked={maintOpen}
              onChange={() => formRef.current?.requestSubmit()}
              className="h-4 w-4 accent-primary"
            />
            {t.enclosures.hasOpenMaintenance}
          </label>
        )}
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          {t.enclosures.filter}
        </button>
        {hasFilters && (
          <Link
            href="/enclosures"
            className="py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            {t.enclosures.clear}
          </Link>
        )}
      </form>
    </div>
  );
}
