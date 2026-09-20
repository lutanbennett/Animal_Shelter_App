"use client";

import Link from "next/link";
import { VET_ICONS } from "@/components/hub-icons";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type VetSummary = {
  id: string;
  name: string;
  clinic_name: string | null;
  contact_info: string | null;
  /** Visits that happened (not cancelled, not in the future). */
  visitCount: number;
  /** Distinct animals across those visits. */
  animalCount: number;
  upcomingCount: number;
  overdueCount: number;
  lastVisit: string | null;
};

function VetCard({ vet }: { vet: VetSummary }) {
  const { t, locale } = useI18n();
  const scheduleTone =
    vet.overdueCount > 0
      ? "bg-danger/15 text-danger"
      : vet.upcomingCount > 0
        ? "bg-primary/15 text-primary"
        : "bg-surface-hover text-muted";
  const scheduleLabel =
    vet.overdueCount > 0
      ? t.vets.list.overdue(vet.overdueCount)
      : vet.upcomingCount > 0
        ? t.vets.list.upcoming(vet.upcomingCount)
        : t.vets.list.nothingScheduled;

  return (
    <Link
      href={`/vets/${vet.id}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <VET_ICONS.vet
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-muted"
            />
            <span className="truncate font-medium text-foreground">
              {vet.name}
            </span>
          </span>
          {vet.clinic_name && (
            <span className="ml-7 flex items-center gap-1 truncate text-xs text-muted">
              <VET_ICONS.clinic aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {vet.clinic_name}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${scheduleTone}`}
        >
          {scheduleLabel}
        </span>
      </div>

      {vet.contact_info && (
        <p className="line-clamp-2 whitespace-pre-line text-xs text-muted">
          {vet.contact_info}
        </p>
      )}

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.visits}</dt>
          <dd className="text-lg font-semibold text-foreground">{vet.visitCount}</dd>
        </div>
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.animals}</dt>
          <dd className="text-lg font-semibold text-foreground">{vet.animalCount}</dd>
        </div>
        <div className="rounded bg-background/60 px-2 py-1.5">
          <dt className="text-[11px] text-muted">{t.vets.list.lastVisit}</dt>
          <dd className="text-sm font-semibold leading-7 text-foreground">
            {vet.lastVisit ? formatDate(vet.lastVisit, locale) : t.common.dash}
          </dd>
        </div>
      </dl>
    </Link>
  );
}

export function VetGrid({ vets }: { vets: VetSummary[] }) {
  const { t } = useI18n();

  if (vets.length === 0) {
    return (
      <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
        {t.vets.list.noVets}
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {vets.map((vet) => (
        <VetCard key={vet.id} vet={vet} />
      ))}
    </div>
  );
}
