"use client";

import Link from "next/link";
import { CopyTagLink } from "@/components/CopyTagLink";
import { ENCLOSURE_ICONS } from "@/components/hub-icons";
import { driveImageUrl } from "@/lib/google/drive-client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { placeName } from "@/lib/enclosures/names";
import { formatDate } from "@/lib/format";
import type { MaintenanceJob } from "@/lib/maintenance/queries";
import {
  DUE_TONE,
  STATUS_TONE,
  dueState,
  maintenanceStatusLabel,
} from "@/lib/maintenance/status";
import { enclosureTagPath } from "@/lib/tags/links";
import { OccupancyIndicator } from "../OccupancyIndicator";

export type Enclosure = {
  id: string;
  name: string;
  name_th: string | null;
  capacity: number | null;
  notes: string | null;
  zone_id: string;
  zone_name: string;
  zone_name_th: string | null;
  zone_internal: boolean;
  isSystem: boolean;
};

export type EnclosureResident = {
  id: string;
  name: string;
  thai_name: string | null;
  resident_code: string;
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
        <span className="text-xs text-muted">{resident.resident_code}</span>
      </div>
    </Link>
  );
}

export function EnclosureHub({
  enclosure,
  residents,
  isAdmin,
  canWriteMaintenance,
  maintenanceJobs,
  tagOrigin,
}: {
  enclosure: Enclosure;
  residents: EnclosureResident[];
  isAdmin: boolean;
  /** Staff/admin may log jobs; volunteers only see them. */
  canWriteMaintenance: boolean;
  maintenanceJobs: MaintenanceJob[];
  /** Origin for the QR-code link (src/lib/tags/origin.ts). */
  tagOrigin: string | null;
}) {
  const { t, locale } = useI18n();
  const openJobs = maintenanceJobs.filter((job) => job.status !== "Completed");

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
              {placeName(locale, enclosure.name, enclosure.name_th)}
            </h1>
            {enclosure.isSystem && (
              <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
                {t.common.system}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-sm text-muted">
            <ENCLOSURE_ICONS.zone aria-hidden="true" className="h-4 w-4" />
            {placeName(locale, enclosure.zone_name, enclosure.zone_name_th)}
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
          {/* The address for the QR code on the kennel door; status
              buckets have no door. */}
          {!enclosure.isSystem && (
            <div className="mt-2 w-full md:w-96">
              <CopyTagLink
                field
                path={enclosureTagPath(enclosure.id)}
                origin={tagOrigin}
                name={placeName(locale, enclosure.name, enclosure.name_th)}
                label={t.tagLinks.enclosureLabel}
              />
            </div>
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

          {/* Maintenance: the open jobs for this enclosure, newest due first
              (loadMaintenanceJobs orders by due date), with the rest on the
              board filtered to this enclosure. Lifecycle pseudo-enclosures
              (Hospital, Fostered, …) aren't physical, so they get no card. */}
          {!enclosure.isSystem && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ENCLOSURE_ICONS.maintenance
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted md:h-4 md:w-4"
                  />
                  {t.enclosures.hub.maintenance}
                </span>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                    openJobs.length > 0
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-hover text-muted"
                  }`}
                >
                  {openJobs.length > 0
                    ? t.enclosures.hub.maintenanceOpen(openJobs.length)
                    : t.enclosures.hub.maintenanceNone}
                </span>
              </div>

              {openJobs.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {openJobs.slice(0, 4).map((job) => {
                    const due = dueState(job.due_date, job.status);
                    return (
                      <li key={job.id}>
                        <Link
                          href={`/maintenance/${job.id}`}
                          className={`flex flex-col gap-0.5 rounded border border-l-4 border-border px-2 py-1.5 text-sm hover:bg-surface-hover ${DUE_TONE[due].card}`}
                        >
                          <span className="truncate font-medium text-foreground">{job.title}</span>
                          <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            <span className={`flex items-center gap-1 ${STATUS_TONE[job.status].text}`}>
                              <span className={`h-2 w-2 rounded-full ${STATUS_TONE[job.status].dot}`} />
                              {maintenanceStatusLabel(t, job.status)}
                            </span>
                            {job.due_date && (
                              <span className={due !== "none" ? `rounded px-1 font-medium ${DUE_TONE[due].badge}` : ""}>
                                {formatDate(job.due_date, locale)}
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span className="text-xs text-muted">
                  {t.enclosures.hub.maintenanceDetail}
                </span>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                {canWriteMaintenance && (
                  <Link
                    href={`/maintenance/new?enclosureId=${enclosure.id}`}
                    className="rounded bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary-hover"
                  >
                    {t.enclosures.hub.maintenanceLog}
                  </Link>
                )}
                <Link
                  href={`/maintenance?enclosure=${enclosure.id}`}
                  className="text-primary hover:underline"
                >
                  {t.enclosures.hub.maintenanceViewAll}
                  {maintenanceJobs.length > 0 && ` (${maintenanceJobs.length})`}
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
