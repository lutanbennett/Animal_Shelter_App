"use client";

import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS } from "@/components/hub-icons";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { PlaceZoneChips } from "@/components/PlaceZoneChips";
import { ENCLOSURE_SORTS, type EnclosureSort } from "@/lib/enclosures/sort";
import { OFFSITE, toggleZone, zoneChipOrder } from "@/lib/enclosures/place";

type ZoneOption = {
  id: string;
  name: string;
  name_th: string | null;
  internal: boolean;
  colour: string | null;
  /** The Lifecycle pseudo-zone: its chip comes last, after Off-site. */
  is_system: boolean;
};

function buildHref(params: {
  zones?: string[];
  q?: string;
  sort?: EnclosureSort;
  maint?: boolean;
}) {
  const search = new URLSearchParams();
  if (params.zones?.length) search.set("zone", params.zones.join(","));
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "zone") search.set("sort", params.sort);
  if (params.maint) search.set("maint", "open");
  // Commas read better than %2C in a shared link, and parse the same.
  const qs = search.toString().replace(/%2C/gi, ",");
  return qs ? `/enclosures?${qs}` : "/enclosures";
}

/**
 * One row of zone chips that narrow to one or more zones (`?zone=a,b` — tap
 * to add or remove; `offsite` is the one chip for every off-site zone, and
 * the Status chip, the Lifecycle cards, comes last), an enclosure-name
 * search, a sort picker and, for roles that can
 * read maintenance, a "Has open maintenance" toggle (`?maint=open`).
 * Everything is plain GET navigation so the browser's back button returns
 * to the same filtered view after opening an enclosure.
 */
export function EnclosureFilters({
  zones,
  zoneIds,
  q,
  sort,
  maintOpen,
  canFilterMaintenance,
}: {
  /** Every zone, in the shelter's order; zoneChipOrder makes the chips. */
  zones: ZoneOption[];
  /** Chosen chips (zone ids and `offsite`), already read by the page (readZonePick). */
  zoneIds: string[];
  q: string;
  sort: EnclosureSort;
  maintOpen: boolean;
  canFilterMaintenance: boolean;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = Boolean(zoneIds.length || q || sort !== "zone" || maintOpen);
  const rest = { q, sort, maint: maintOpen };

  const sortLabels: Record<EnclosureSort, string> = {
    zone: t.enclosures.sortZone,
    name: t.enclosures.sortName,
    occupancy: t.enclosures.sortOccupancy,
  };

  return (
    <div className="flex flex-col gap-3">
      <PlaceZoneChips
        allZonesHref={buildHref(rest)}
        zones={zoneChipOrder(zones).map((zone) =>
          zone === OFFSITE
            ? {
                id: OFFSITE,
                name: t.enclosures.offsiteChip,
                name_th: null,
                colour: null,
                href: buildHref({ ...rest, zones: toggleZone(zoneIds, OFFSITE) }),
                active: zoneIds.includes(OFFSITE),
              }
            : {
                id: zone.id,
                name: zone.name,
                name_th: zone.name_th,
                colour: zone.colour,
                href: buildHref({ ...rest, zones: toggleZone(zoneIds, zone.id) }),
                active: zoneIds.includes(zone.id),
              },
        )}
      />

      {/* Keyed on the filters so Clear or a chip, which navigate on the
          client, remount the inputs instead of leaving their old defaults. */}
      <form
        key={`${zoneIds.join(",")}|${q}|${sort}|${maintOpen}`}
        ref={formRef}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
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
          className="min-h-11 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover md:min-h-0"
        >
          {t.enclosures.filter}
        </button>
        {hasFilters && (
          <ActionLink href="/enclosures" label={t.enclosures.clear} icon={ACTION_ICONS.clear} iconOnlyOnMobile={false} />
        )}
      </form>
    </div>
  );
}
