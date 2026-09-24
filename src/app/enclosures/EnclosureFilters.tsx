"use client";

import Link from "next/link";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { ENCLOSURE_SORTS, type EnclosureSort } from "@/lib/enclosures/sort";

type ZoneOption = { id: string; name: string; name_th: string | null };

function buildHref(params: {
  zone?: string;
  q?: string;
  sort?: EnclosureSort;
  maint?: boolean;
}) {
  const search = new URLSearchParams();
  if (params.zone) search.set("zone", params.zone);
  if (params.q) search.set("q", params.q);
  if (params.sort && params.sort !== "zone") search.set("sort", params.sort);
  if (params.maint) search.set("maint", "open");
  const qs = search.toString();
  return qs ? `/enclosures?${qs}` : "/enclosures";
}

/**
 * Zone chips (tap to narrow to one zone), an enclosure-name search, a sort
 * picker and, for roles that can read maintenance, a "Has open maintenance"
 * toggle (`?maint=open`). Everything is plain GET navigation so the
 * browser's back button returns to the same filtered view after opening an
 * enclosure.
 */
export function EnclosureFilters({
  zones,
  zoneId,
  q,
  sort,
  maintOpen,
  canFilterMaintenance,
}: {
  zones: ZoneOption[];
  zoneId: string;
  q: string;
  sort: EnclosureSort;
  maintOpen: boolean;
  canFilterMaintenance: boolean;
}) {
  const { t, locale } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const hasFilters = Boolean(zoneId || q || sort !== "zone" || maintOpen);

  const sortLabels: Record<EnclosureSort, string> = {
    zone: t.enclosures.sortZone,
    name: t.enclosures.sortName,
    occupancy: t.enclosures.sortOccupancy,
  };

  function chipClass(active: boolean) {
    return `shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
    }`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Horizontally scrollable on phones so a long zone list doesn't wrap
          into a tall block above the enclosures. */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Link href={buildHref({ q, sort, maint: maintOpen })} className={chipClass(!zoneId)}>
          {t.enclosures.allZones}
        </Link>
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={buildHref({ zone: zone.id, q, sort, maint: maintOpen })}
            className={chipClass(zoneId === zone.id)}
          >
            {placeName(locale, zone.name, zone.name_th)}
          </Link>
        ))}
      </div>

      {/* Keyed on the filters so Clear or a zone chip, which navigate on the
          client, remount the inputs instead of leaving their old defaults. */}
      <form
        key={`${zoneId}|${q}|${sort}|${maintOpen}`}
        ref={formRef}
        method="get"
        className="flex flex-wrap items-end gap-3"
      >
        {zoneId && <input type="hidden" name="zone" value={zoneId} />}
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
