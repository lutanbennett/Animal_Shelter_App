"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { ENCLOSURE_PLACES, type EnclosurePlace } from "@/lib/enclosures/place";

export type PlaceZoneChip = {
  id: string;
  name: string;
  name_th: string | null;
  /** Where tapping it goes: the list with this zone added or taken off. */
  href: string;
  active: boolean;
};

/**
 * Everywhere / On-site / Off-site, and beneath it the zone chips for that
 * place (tap to add or remove, All zones empties the list). The same control
 * on /enclosures and /residents; each page works out the hrefs, since what
 * else a link keeps (search, sort, the deceased toggle) is the page's own.
 * Every state is a plain GET URL, so back and bookmarks keep working.
 */
export function PlaceZoneChips({
  place,
  placeHrefs,
  allZonesHref,
  zones,
}: {
  place: EnclosurePlace;
  placeHrefs: Record<EnclosurePlace, string>;
  allZonesHref: string;
  /** The zones on offer under `place`, in display order. */
  zones: PlaceZoneChip[];
}) {
  const { t, locale } = useI18n();
  const noneActive = !zones.some((zone) => zone.active);

  const placeLabels: Record<EnclosurePlace, string> = {
    all: t.enclosures.placeAll,
    internal: t.enclosures.hub.internal,
    external: t.enclosures.hub.external,
  };

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
    <>
      <div
        role="group"
        aria-label={t.enclosures.placeLabel}
        className="flex w-fit gap-1 rounded-md border border-border bg-surface p-1"
      >
        {ENCLOSURE_PLACES.map((value) => (
          <Link
            key={value}
            href={placeHrefs[value]}
            aria-current={place === value ? "true" : undefined}
            className={segmentClass(place === value)}
          >
            {placeLabels[value]}
          </Link>
        ))}
      </div>

      {/* Horizontally scrollable on phones so a long zone list doesn't wrap
          into a tall block above the list. */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Link
          href={allZonesHref}
          aria-current={noneActive ? "true" : undefined}
          className={chipClass(noneActive)}
        >
          {t.enclosures.allZones}
        </Link>
        {zones.map((zone) => (
          <Link
            key={zone.id}
            href={zone.href}
            aria-current={zone.active ? "true" : undefined}
            className={chipClass(zone.active)}
          >
            {placeName(locale, zone.name, zone.name_th)}
          </Link>
        ))}
      </div>
    </>
  );
}
