"use client";

import Link from "next/link";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { OccupancyIndicator } from "./OccupancyIndicator";

export type EnclosureSummary = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zone_name: string;
  zone_name_th: string | null;
  zone_internal: boolean;
  resident_count: number;
};

export type ZoneGroup = {
  id: string;
  name: string;
  name_th: string | null;
  internal: boolean;
  isSystem: boolean;
  enclosures: EnclosureSummary[];
};

function EnclosureCard({ enclosure }: { enclosure: EnclosureSummary }) {
  const { locale } = useI18n();
  return (
    <Link
      href={`/enclosures/${enclosure.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ENCLOSURE_ICONS.enclosure
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted"
          />
          <span className="truncate font-medium text-foreground">
            {placeName(locale, enclosure.name, enclosure.name_th)}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
          <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-3.5 w-3.5" />
          {placeName(locale, enclosure.zone_name, enclosure.zone_name_th)}
        </span>
      </div>
      <OccupancyIndicator
        count={enclosure.resident_count}
        capacity={enclosure.capacity}
      />
    </Link>
  );
}

/**
 * Enclosure cards, either grouped under zone headings (the default zone →
 * enclosure drill-down) or as one flat grid when sorted by name/occupancy.
 */
export function EnclosureGrid({
  groups,
  flat,
}: {
  groups: ZoneGroup[];
  /** When set, render the enclosures as one list instead of per-zone sections. */
  flat?: EnclosureSummary[];
}) {
  const { t, locale } = useI18n();

  const total = flat
    ? flat.length
    : groups.reduce((n, g) => n + g.enclosures.length, 0);
  if (total === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.enclosures.noMatches}
      </p>
    );
  }

  if (flat) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {flat.map((enclosure) => (
          <EnclosureCard key={enclosure.id} enclosure={enclosure} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((zone) => (
        <section key={zone.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {placeName(locale, zone.name, zone.name_th)}
            </h2>
            <span className="text-xs text-muted">
              {zone.isSystem
                ? t.enclosures.hub.system
                : zone.internal
                  ? t.enclosures.hub.internal
                  : t.enclosures.hub.external}
              {" · "}
              {t.enclosures.enclosuresCount(zone.enclosures.length)}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zone.enclosures.map((enclosure) => (
              <EnclosureCard key={enclosure.id} enclosure={enclosure} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
