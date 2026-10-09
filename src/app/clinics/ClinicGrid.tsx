"use client";

import Link from "next/link";
import { CLINIC_ICONS } from "@/components/hub-icons";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type ClinicSummary = {
  id: string;
  name: string;
  contact_info: string | null;
  /** Visits that happened (not cancelled, not in the future). */
  visitCount: number;
  /** Distinct residents across those visits. */
  residentCount: number;
  upcomingCount: number;
  overdueCount: number;
  lastVisit: string | null;
};

function ClinicCard({ clinic }: { clinic: ClinicSummary }) {
  const { t, locale } = useI18n();
  const scheduleTone =
    clinic.overdueCount > 0
      ? "bg-danger/15 text-danger"
      : clinic.upcomingCount > 0
        ? "bg-primary/15 text-primary"
        : "bg-surface-hover text-muted";
  const scheduleLabel =
    clinic.overdueCount > 0
      ? t.vets.list.overdue(clinic.overdueCount)
      : clinic.upcomingCount > 0
        ? t.vets.list.upcoming(clinic.upcomingCount)
        : t.vets.list.nothingScheduled;

  return (
    <Link
      href={`/clinics/${clinic.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <CLINIC_ICONS.clinic
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted"
            />
            <span className="min-w-0 break-words font-medium text-foreground sm:truncate">
              {clinic.name}
            </span>
          </span>
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${scheduleTone}`}
        >
          {scheduleLabel}
        </span>
      </div>

      {clinic.contact_info && (
        <p className="line-clamp-2 whitespace-pre-line text-xs text-muted">
          {clinic.contact_info}
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.visits}</dt>
          <dd className="text-lg font-semibold text-foreground">{clinic.visitCount}</dd>
        </div>
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.residents}</dt>
          <dd className="text-lg font-semibold text-foreground">{clinic.residentCount}</dd>
        </div>
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.lastVisit}</dt>
          <dd className="text-sm font-semibold leading-7 text-foreground">
            {clinic.lastVisit ? formatDate(clinic.lastVisit, locale) : t.common.dash}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

export function ClinicGrid({ clinics }: { clinics: ClinicSummary[] }) {
  const { t } = useI18n();

  if (clinics.length === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.vets.list.noVets}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clinics.map((clinic) => (
        <ClinicCard key={clinic.id} clinic={clinic} />
      ))}
    </div>
  );
}
