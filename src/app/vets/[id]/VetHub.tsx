"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatCard, type StatCardTone } from "@/components/StatCard";
import { VET_ICONS } from "@/components/hub-icons";
import { formatBaht, formatDate, formatDateTime } from "@/lib/format";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { appointmentStatusLabel } from "@/lib/i18n/enum-labels";
import {
  DEFAULT_VISIT_PERIOD,
  VISIT_PERIODS,
  periodStart,
  scheduleSummary,
  visitsByMonth,
  visitsByResident,
  visitsInPeriod,
  spendSummary,
  type VetVisit,
  type VisitPeriod,
} from "@/lib/vets/stats";
import { VisitsChart } from "./VisitsChart";

export type Vet = {
  id: string;
  name: string;
  clinic_name: string | null;
  contact_info: string | null;
  notes: string | null;
};

export type VetHubVisit = VetVisit & {
  doctor_name: string | null;
  residents: { name: string; thai_name: string | null; resident_code: string } | null;
};

/** A medical record linked to one of this vet's visits. */
export type LinkedRecord = { id: string; vet_appointment_id: string };

export type LinkedRecords = {
  procedures: LinkedRecord[];
  bloodTests: LinkedRecord[];
  prescriptions: LinkedRecord[];
};

const RECENT_VISITS_LIMIT = 30;

export function VetHub({
  vet,
  visits,
  linked,
  canManage,
  now,
}: {
  vet: Vet;
  visits: VetHubVisit[];
  linked: LinkedRecords;
  canManage: boolean;
  /** Server-computed timestamp (ISO string) — avoids calling Date.now() during render. */
  now: string;
}) {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<VisitPeriod>(DEFAULT_VISIT_PERIOD);
  const nowDate = useMemo(() => new Date(now), [now]);

  // Everything below is derived from the one visit list: the period
  // selector only changes which rows are counted, nothing is re-fetched.
  const inPeriod = useMemo(
    () => visitsInPeriod(visits, period, nowDate),
    [visits, period, nowDate],
  );
  const inPeriodIds = useMemo(() => new Set(inPeriod.map((v) => v.id)), [inPeriod]);
  const cancelledInPeriod = useMemo(() => {
    const start = periodStart(period, nowDate)?.getTime() ?? -Infinity;
    return visits.filter(
      (v) =>
        v.status === "cancelled" && new Date(v.appointment_date).getTime() >= start,
    ).length;
  }, [visits, period, nowDate]);
  const schedule = useMemo(() => scheduleSummary(visits, nowDate), [visits, nowDate]);
  const byResident = useMemo(() => visitsByResident(inPeriod), [inPeriod]);
  const spend = useMemo(() => spendSummary(inPeriod), [inPeriod]);
  const chartMonths = period ?? 12;
  const buckets = useMemo(
    () => visitsByMonth(visits, chartMonths, nowDate),
    [visits, chartMonths, nowDate],
  );
  const hasChartData = buckets.some((b) => b.count > 0);

  const countLinked = (records: LinkedRecord[]) =>
    records.filter((r) => inPeriodIds.has(r.vet_appointment_id)).length;

  // The resident embed is repeated on every visit row; index it once.
  const residentsById = useMemo(() => {
    const map = new Map<string, NonNullable<VetHubVisit["residents"]>>();
    for (const v of visits) {
      if (v.residents && !map.has(v.resident_id)) map.set(v.resident_id, v.residents);
    }
    return map;
  }, [visits]);
  const residentName = (residentId: string) => {
    const r = residentsById.get(residentId);
    if (!r) return t.vets.hub.unknownResident;
    return r.thai_name ? `${r.name} (${r.thai_name})` : r.name;
  };

  // The two counts differ only when a resident went more than once; say
  // so on the card, since "6 visits / 6 residents" otherwise reads as the
  // same number twice.
  const repeatVisits = inPeriod.length - byResident.length;

  const scheduleTone: StatCardTone =
    schedule.overdue.length > 0
      ? "danger"
      : schedule.upcoming.length > 0
        ? "warning"
        : "neutral";
  const scheduleValue =
    schedule.overdue.length > 0
      ? t.vets.hub.overdue(schedule.overdue.length)
      : schedule.upcoming.length > 0
        ? t.vets.hub.upcoming(schedule.upcoming.length)
        : t.vets.hub.nothingScheduled;
  const scheduleDetail = schedule.upcoming[0]
    ? t.vets.hub.nextVisit(
        formatDate(schedule.upcoming[0].appointment_date, locale),
        residentName(schedule.upcoming[0].resident_id),
      )
    : schedule.overdue.length > 0
      ? t.vets.hub.pastDue
      : t.vets.hub.noUpcomingDetail;

  const recentVisits = useMemo(
    () =>
      [...inPeriod]
        .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
        .slice(0, RECENT_VISITS_LIMIT),
    [inPeriod],
  );

  const periodLabel = t.vets.hub.periods[period ?? "all"];

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/vets" className="text-sm text-muted hover:text-foreground">
        {t.vets.hub.backToVets}
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <VET_ICONS.vet aria-hidden="true" className="h-6 w-6 shrink-0 text-muted" />
            <h1 className="text-2xl font-semibold text-foreground">{vet.name}</h1>
          </div>
          {vet.clinic_name && (
            <p className="flex items-center gap-1 text-sm text-muted">
              <VET_ICONS.clinic aria-hidden="true" className="h-4 w-4" />
              {vet.clinic_name}
            </p>
          )}
          {vet.contact_info ? (
            <p className="flex items-start gap-1 whitespace-pre-line text-sm text-foreground">
              <VET_ICONS.contact aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              {vet.contact_info}
            </p>
          ) : (
            <p className="text-sm text-muted">{t.vets.hub.noContact}</p>
          )}
          {vet.notes && (
            <p className="whitespace-pre-line text-sm text-muted">{vet.notes}</p>
          )}
          {canManage && (
            <Link
              href="/management/vets"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t.vets.manageInAdmin}
            </Link>
          )}
        </div>

        {/* Period selector: which months the counts, the resident list and the
            visit list cover. Upcoming/overdue always look at the whole
            schedule, since the future isn't part of any past window. */}
        <div className="flex flex-col gap-1 md:items-end">
          <span className="text-xs font-medium text-muted">{t.vets.hub.showing}</span>
          <div
            role="radiogroup"
            aria-label={t.vets.hub.showing}
            className="flex gap-1 rounded-lg border border-border bg-background p-1"
          >
            {VISIT_PERIODS.map((p) => (
              <button
                key={p ?? "all"}
                type="button"
                role="radio"
                aria-checked={p === period}
                onClick={() => setPeriod(p)}
                className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                  p === period
                    ? "bg-primary text-primary-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t.vets.hub.periods[p ?? "all"]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          title={t.vets.hub.visits}
          icon={VET_ICONS.visits}
          value={`${inPeriod.length}`}
          detail={
            cancelledInPeriod > 0
              ? t.vets.hub.visitsDetailCancelled(periodLabel, cancelledInPeriod)
              : t.vets.hub.visitsDetail(periodLabel)
          }
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.residentsSeen}
          icon={VET_ICONS.residents}
          value={`${byResident.length}`}
          detail={
            byResident.length === 0
              ? t.vets.hub.noResidents
              : t.vets.hub.residentsSeenDetail(repeatVisits)
          }
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.schedule}
          icon={VET_ICONS.upcoming}
          value={scheduleValue}
          detail={scheduleDetail}
          tone={scheduleTone}
        />
        <StatCard
          title={t.vets.hub.spend}
          icon={VET_ICONS.visits}
          value={spend.withCost > 0 ? formatBaht(spend.total, locale) : "—"}
          detail={
            spend.withCost > 0
              ? t.vets.hub.spendDetail(periodLabel, spend.withCost, inPeriod.length)
              : t.vets.hub.noSpend
          }
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.procedures}
          icon={VET_ICONS.procedures}
          value={`${countLinked(linked.procedures)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.bloodTests}
          icon={VET_ICONS.bloodTests}
          value={`${countLinked(linked.bloodTests)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.prescriptions}
          icon={VET_ICONS.prescriptions}
          value={`${countLinked(linked.prescriptions)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {t.vets.hub.chart.heading}
          </h2>
          <span className="text-xs text-muted">
            {t.vets.hub.chart.subheading(chartMonths)}
          </span>
        </div>
        {hasChartData ? (
          <VisitsChart buckets={buckets} />
        ) : (
          <p className="py-6 text-center text-sm text-muted">
            {t.vets.hub.chart.empty}
          </p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <VET_ICONS.residents aria-hidden="true" className="h-5 w-5 text-muted" />
            <h2 className="text-lg font-semibold text-foreground">
              {t.vets.hub.residentsHeading}
            </h2>
            <span className="text-sm text-muted">({byResident.length})</span>
          </div>
          {byResident.length > 0 ? (
            <div className="overflow-x-auto rounded border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t.vets.hub.table.resident}</th>
                    <th className="px-3 py-2 text-right font-medium">{t.vets.hub.table.visits}</th>
                    <th className="px-3 py-2 font-medium">{t.vets.hub.table.lastVisit}</th>
                    <th className="hidden px-3 py-2 font-medium md:table-cell">
                      {t.vets.hub.table.reasons}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {byResident.map((row) => {
                    const code = residentsById.get(row.resident_id)?.resident_code;
                    return (
                      <tr key={row.resident_id} className="hover:bg-surface-hover">
                        <td className="px-3 py-2">
                          <Link
                            href={`/residents/${row.resident_id}/vet-appointments`}
                            className="flex flex-col hover:underline"
                          >
                            <span className="font-medium text-foreground">
                              {residentName(row.resident_id)}
                            </span>
                            {code && (
                              <span className="text-xs text-muted">{code}</span>
                            )}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-foreground">
                          {row.visitCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted">
                          {formatDate(row.lastVisit, locale)}
                        </td>
                        <td className="hidden max-w-xs px-3 py-2 text-muted md:table-cell">
                          <span className="line-clamp-2">
                            {row.reasons.join(", ") || t.common.dash}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
              {t.vets.hub.noResidentsInPeriod}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <VET_ICONS.visits aria-hidden="true" className="h-5 w-5 text-muted" />
            <h2 className="text-lg font-semibold text-foreground">
              {t.vets.hub.visitsHeading}
            </h2>
            <span className="text-sm text-muted">
              {inPeriod.length > recentVisits.length
                ? t.vets.hub.showingOf(recentVisits.length, inPeriod.length)
                : `(${inPeriod.length})`}
            </span>
          </div>
          {recentVisits.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recentVisits.map((visit) => (
                <li key={visit.id}>
                  <Link
                    href={`/residents/${visit.resident_id}/vet-appointments`}
                    className="flex items-center justify-between gap-3 rounded border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-hover"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-foreground">
                        {residentName(visit.resident_id)}
                      </span>
                      <span className="truncate text-xs text-muted">
                        {visit.reason ?? t.residents.sections.vetVisitFallback}
                        {visit.doctor_name && ` · ${visit.doctor_name}`}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-xs text-muted">
                        {formatDateTime(visit.appointment_date, locale)}
                      </span>
                      <span
                        className={`text-xs capitalize ${
                          visit.status === "scheduled" ? "text-danger" : "text-muted"
                        }`}
                      >
                        {appointmentStatusLabel(t, visit.status)}
                        {visit.cost != null && ` · ${formatBaht(Number(visit.cost), locale)}`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
              {t.vets.hub.noVisitsInPeriod}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
