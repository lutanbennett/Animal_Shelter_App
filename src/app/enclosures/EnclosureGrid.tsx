"use client";

import Link from "next/link";
import { CopyTagLink } from "@/components/CopyTagLink";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { enclosureTagPath } from "@/lib/tags/links";
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
  /** A Lifecycle status bucket (Hospital, Fostered…), not a kennel. */
  is_system: boolean;
  resident_count: number;
  /** Maintenance jobs on this enclosure that aren't Completed. */
  open_jobs: number;
  /** Names of the residents here on a special diet (src/lib/diets/special.ts). */
  special_diet_residents: string[];
};

export type ZoneGroup = {
  id: string;
  name: string;
  name_th: string | null;
  internal: boolean;
  enclosures: EnclosureSummary[];
  /** Open jobs logged against the whole zone rather than one enclosure. */
  zone_wide_jobs: number;
};

function EnclosureCard({
  enclosure,
  tagOrigin,
}: {
  enclosure: EnclosureSummary;
  tagOrigin: string | null;
}) {
  const { t, locale } = useI18n();
  const name = placeName(locale, enclosure.name, enclosure.name_th);
  const special = enclosure.special_diet_residents;
  // The whole card opens the enclosure, via the name link's ::after
  // stretched over it; the copy button sits above that layer so a
  // batch of QR codes can be programmed straight off this page.
  return (
    <div className="relative flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ENCLOSURE_ICONS.enclosure
            aria-hidden="true"
            className="h-5 w-5 shrink-0 text-muted"
          />
          <Link
            href={`/enclosures/${enclosure.id}`}
            className="truncate font-medium text-foreground after:absolute after:inset-0 after:content-['']"
          >
            {name}
          </Link>
        </div>
        {/* The zone is the section heading already; the corner says what
            needs fixing here instead. Status buckets have nothing to fix
            and no door for a QR code. */}
        {!enclosure.is_system && (
          <span className="flex shrink-0 items-center gap-1">
            <span
              title={t.enclosures.openJobsTitle(enclosure.open_jobs)}
              className={`flex items-center gap-1 text-xs ${
                enclosure.open_jobs > 0 ? "font-medium text-foreground" : "text-muted"
              }`}
            >
              <ENCLOSURE_ICONS.maintenance aria-hidden="true" className="h-3.5 w-3.5" />
              {t.enclosures.openJobs(enclosure.open_jobs)}
            </span>
            <span className="relative z-10 -my-1">
              <CopyTagLink
                path={enclosureTagPath(enclosure.id)}
                origin={tagOrigin}
                name={name}
              />
            </span>
          </span>
        )}
      </div>
      <OccupancyIndicator
        count={enclosure.resident_count}
        capacity={enclosure.capacity}
      />
      {/* An icon and words, not a colour: the card's colour is capacity.
          <details> so a tap shows the names as well as a hover; it sits
          above the stretched link so the tap opens it instead. */}
      {special.length > 0 && (
        <details className="relative z-10 self-start text-xs">
          <summary
            title={t.enclosures.specialDietsTitle(special.join(", "))}
            className="flex cursor-pointer list-none items-center gap-1 font-medium text-foreground hover:underline [&::-webkit-details-marker]:hidden"
          >
            <ENCLOSURE_ICONS.specialDiet aria-hidden="true" className="h-3.5 w-3.5" />
            {t.enclosures.specialDiets(special.length)}
          </summary>
          <ul className="mt-1 flex flex-col gap-0.5 pl-5 text-muted">
            {special.map((resident, i) => (
              <li key={i}>{resident}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/**
 * Enclosure cards, either grouped under zone headings (the default zone →
 * enclosure drill-down) or as one flat grid when sorted by name/occupancy.
 */
export function EnclosureGrid({
  pinned,
  groups,
  flat,
  tagOrigin,
}: {
  /** Lifecycle status buckets, shown first without a heading. */
  pinned: EnclosureSummary[];
  groups: ZoneGroup[];
  /** When set, render the enclosures as one list instead of per-zone sections. */
  flat?: EnclosureSummary[];
  /** Origin for each card's QR-code link (src/lib/tags/origin.ts). */
  tagOrigin: string | null;
}) {
  const { t, locale } = useI18n();

  const total =
    pinned.length + (flat ? flat.length : groups.reduce((n, g) => n + g.enclosures.length, 0));
  if (total === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.enclosures.noMatches}
      </p>
    );
  }

  const pinnedGrid = pinned.length > 0 && (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {pinned.map((enclosure) => (
        <EnclosureCard key={enclosure.id} enclosure={enclosure} tagOrigin={tagOrigin} />
      ))}
    </div>
  );

  if (flat) {
    return (
      <div className="flex flex-col gap-6">
        {pinnedGrid}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flat.map((enclosure) => (
            <EnclosureCard key={enclosure.id} enclosure={enclosure} tagOrigin={tagOrigin} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {pinnedGrid}
      {groups.map((zone) => (
        <section key={zone.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              {placeName(locale, zone.name, zone.name_th)}
            </h2>
            <span className="text-xs text-muted">
              {zone.internal ? t.enclosures.hub.internal : t.enclosures.hub.external}
              {" · "}
              {t.enclosures.enclosuresCount(zone.enclosures.length)}
            </span>
            {zone.zone_wide_jobs > 0 && (
              <Link
                href={`/maintenance?zone=${zone.id}`}
                className="flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
              >
                <ENCLOSURE_ICONS.maintenance aria-hidden="true" className="h-3.5 w-3.5" />
                {t.enclosures.zoneWideJobs(zone.zone_wide_jobs)}
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zone.enclosures.map((enclosure) => (
              <EnclosureCard key={enclosure.id} enclosure={enclosure} tagOrigin={tagOrigin} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
