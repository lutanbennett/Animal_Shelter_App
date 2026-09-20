"use client";

import Link from "next/link";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { OccupancyIndicator } from "../OccupancyIndicator";

export type Enclosure = {
  id: string;
  name: string;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zone_name: string;
  zone_internal: boolean;
  isSystem: boolean;
};

export type EnclosureResident = {
  id: string;
  name: string;
  thai_name: string | null;
  animal_code: string;
  profile_photo_drive_file_id: string | null;
};

function ResidentThumbnail({ resident }: { resident: EnclosureResident }) {
  const { t } = useI18n();
  const displayName = resident.thai_name
    ? `${resident.name} (${resident.thai_name})`
    : resident.name;

  return (
    <Link
      href={`/residents/${resident.id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-2 transition hover:bg-surface-hover"
    >
      {resident.profile_photo_drive_file_id ? (
        <img
          src={driveImageUrl(resident.profile_photo_drive_file_id)}
          alt={displayName}
          className="aspect-square w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-hover text-center text-xs text-muted">
          {t.enclosures.hub.noPhoto}
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">
          {displayName}
        </span>
        <span className="text-xs text-muted">{resident.animal_code}</span>
      </div>
    </Link>
  );
}

export function EnclosureHub({
  enclosure,
  residents,
  isAdmin,
}: {
  enclosure: Enclosure;
  residents: EnclosureResident[];
  isAdmin: boolean;
}) {
  const { t } = useI18n();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link
        href={`/enclosures?zone=${enclosure.zone_id}`}
        className="text-sm text-muted hover:text-foreground"
      >
        {t.enclosures.hub.backToEnclosures}
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <ENCLOSURE_ICONS.enclosure
              aria-hidden="true"
              className="h-6 w-6 shrink-0 text-muted"
            />
            <h1 className="text-2xl font-semibold text-foreground">
              {enclosure.name}
            </h1>
            {enclosure.isSystem && (
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                {t.common.system}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted">
            <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-4 w-4" />
            {enclosure.zone_name}
            {" · "}
            {enclosure.isSystem
              ? t.enclosures.hub.system
              : enclosure.zone_internal
                ? t.enclosures.hub.internal
                : t.enclosures.hub.external}
          </p>
          {isAdmin && !enclosure.isSystem && (
            <Link
              href="/admin/enclosures"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t.enclosures.hub.manageInAdmin}
            </Link>
          )}
        </div>
        <div className="w-full md:w-64">
          <OccupancyIndicator
            count={residents.length}
            capacity={enclosure.capacity}
            size="lg"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <ENCLOSURE_ICONS.residents
              aria-hidden="true"
              className="h-5 w-5 text-muted"
            />
            <h2 className="text-lg font-semibold text-foreground">
              {t.enclosures.hub.residentsHeading}
            </h2>
            <span className="text-sm text-muted">({residents.length})</span>
          </div>
          {residents.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {residents.map((resident) => (
                <ResidentThumbnail key={resident.id} resident={resident} />
              ))}
            </div>
          ) : (
            <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
              {t.enclosures.hub.noResidents}
            </p>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="mb-2 text-sm font-medium text-muted">
              {t.enclosures.hub.notes}
            </h3>
            {enclosure.notes ? (
              <p className="whitespace-pre-line text-sm text-foreground">
                {enclosure.notes}
              </p>
            ) : (
              <p className="text-sm text-muted">{t.enclosures.hub.noNotes}</p>
            )}
          </div>

          {/* Maintenance stub: the planned feature lets staff log repairs /
              work needed on an enclosure for budgeting and tracking. Nothing
              is wired up yet — the `maintenance` table only has a zone_id
              today, so an enclosure_id column will be needed when this is
              built. Keep the card so the hub layout doesn't shift later. */}
          {!enclosure.isSystem && (
            <div
              aria-disabled="true"
              className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-surface/50 p-4 opacity-70"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <ENCLOSURE_ICONS.maintenance
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 md:h-4 md:w-4"
                  />
                  {t.enclosures.hub.maintenance}
                </span>
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                  {t.enclosures.hub.maintenanceComingSoon}
                </span>
              </div>
              <span className="text-xs text-muted">
                {t.enclosures.hub.maintenanceDetail}
              </span>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
