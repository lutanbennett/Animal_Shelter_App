"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { Check } from "lucide-react";
import { zoneColour } from "@/lib/zones/palette";
import { ENCLOSURE_PLACES, type EnclosurePlace } from "@/lib/enclosures/place";

export type PlaceZoneChip = {
  id: string;
  name: string;
  name_th: string | null;
  /** zones.colour (0162): the chip is tinted with it, solid when chosen; null keeps the plain chip. */
  colour: string | null;
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
    return `inline-flex min-h-11 shrink-0 items-center rounded-full border px-3 py-1.5 text-sm font-medium transition md:min-h-0 ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-foreground"
    }`;
  }

  /**
   * A zone with a colour wears it (Lutan, 2026-10-08): a tint with a full-colour edge when not
   * chosen, solid when chosen. Chosen text is near-black, which reads at 4.5:1 or better on every
   * swatch (src/lib/zones/palette.ts), and a tick says "chosen" so colour is never the only sign.
   */
  function zoneChip(colour: string | null, active: boolean) {
    const hex = zoneColour(colour);
    if (!hex) return { className: chipClass(active), style: undefined };
    return {
      className: `inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full border-2 px-3 py-1.5 text-sm font-medium transition md:min-h-0 ${
        active ? "text-[#121212]" : "text-foreground hover:brightness-125"
      }`,
      style: { borderColor: hex, backgroundColor: active ? hex : `${hex}2e` },
    };
  }

  function segmentClass(active: boolean) {
    return `inline-flex min-h-11 items-center rounded px-3 py-1.5 text-sm font-medium transition md:min-h-0 ${
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
        {zones.map((zone) => {
          const chip = zoneChip(zone.colour, zone.active);
          return (
            <Link
              key={zone.id}
              href={zone.href}
              aria-current={zone.active ? "true" : undefined}
              className={chip.className}
              style={chip.style}
            >
              {zone.active && chip.style && <Check aria-hidden="true" className="h-4 w-4 shrink-0" />}
              {placeName(locale, zone.name, zone.name_th)}
            </Link>
          );
        })}
      </div>
    </>
  );
}
