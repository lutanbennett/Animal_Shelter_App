"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { StatCard, type StatCardTone } from "@/components/StatCard";
import { ActionLink } from "@/components/ActionLink";
import { ACTION_ICONS, VET_ICONS } from "@/components/hub-icons";
import { formatBaht, formatDate, formatDateTime } from "@/lib/format";
import { driveImageUrl } from "@/lib/google/drive-client";
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
  type ClinicVisit,
  type VisitPeriod,
} from "@/lib/clinics/stats";
import { VisitsChart } from "./VisitsChart";

export type Vet = {
  id: string;
  name: string;
  clinic_name: string | null;
  contact_info: string | null;
  notes: string | null;
};

export type VetHubVisit = ClinicVisit & {
  doctor_id: string | null;
  doctor_name: string | null;
  residents: {
    name: string;
    thai_name: string | null;
    resident_code: string;
    profile_photo_drive_file_id: string | null;
  } | null;
};

/**
 * What the Visits list is narrowed to. Each is a tile above it, and the
 * tile's own title is the chip's label, so the filter adds no wording.
 */
type VisitFilter = "all" | "spend" | "procedures" | "bloodTests" | "prescriptions";

const VISIT_FILTERS: VisitFilter[] = ["all", "spend", "procedures", "bloodTests", "prescriptions"];

/** The resident tab a filtered visit row opens: where its records are. */
const FILTER_SECTION: Record<VisitFilter, string> = {
  all: "vet-appointments",
  spend: "vet-appointments",
  procedures: "procedures",
  bloodTests: "blood-tests",
  prescriptions: "prescriptions",
};

/** A doctor on the clinic's list (doctors). */
export type HubDoctor = { id: string; name: string; active: boolean };

/** A medical record linked to one of this vet's visits. */
export type LinkedRecord = { id: string; clinic_visit_id: string };

export type LinkedRecords = {
  procedures: LinkedRecord[];
  bloodTests: LinkedRecord[];
  prescriptions: LinkedRecord[];
};

const RECENT_VISITS_LIMIT = 30;

/** The resident's profile photo on a Schedule row, or a placeholder. */
function ResidentThumb({ photoId, alt }: { photoId: string | null; alt: string }) {
  return photoId ? (
    // The 160 px thumbnail: a schedule is read on a phone, often on mobile data.
    <img
      src={driveImageUrl(photoId, 160)}
      alt={alt}
      className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
    />
  ) : (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-hover text-muted">
      <VET_ICONS.residents aria-hidden="true" className="h-5 w-5" />
    </div>
  );
}

export function ClinicHub({
  vet,
  visits,
  linked,
  doctors,
  canManage,
  canOpenVisits,
  now,
}: {
  vet: Vet;
  visits: VetHubVisit[];
  linked: LinkedRecords;
  doctors: HubDoctor[];
  canManage: boolean;
  /** medical.visits read: the Schedule rows' Edit link (the visit page refuses without it). */
  canOpenVisits: boolean;
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
    records.filter((r) => inPeriodIds.has(r.clinic_visit_id)).length;

  // The visits each record tile stands for: the ones it was logged against.
  const visitsWith = useMemo(() => {
    const ids = (records: LinkedRecord[]) =>
      new Set(records.map((r) => r.clinic_visit_id));
    return {
      procedures: ids(linked.procedures),
      bloodTests: ids(linked.bloodTests),
      prescriptions: ids(linked.prescriptions),
    };
  }, [linked]);
  const [visitFilter, setVisitFilter] = useState<VisitFilter>("all");
  const filteredVisits = useMemo(() => {
    if (visitFilter === "all") return inPeriod;
    if (visitFilter === "spend") return inPeriod.filter((v) => v.cost != null);
    const ids = visitsWith[visitFilter];
    return inPeriod.filter((v) => ids.has(v.id));
  }, [inPeriod, visitFilter, visitsWith]);
  // The tile's own number, so a chip and the tile that set it agree: the
  // record filters count records, though a visit may carry several, and the
  // list's heading then counts the visits.
  const filterCounts: Record<VisitFilter, number> = {
    all: inPeriod.length,
    spend: spend.withCost,
    procedures: countLinked(linked.procedures),
    bloodTests: countLinked(linked.bloodTests),
    prescriptions: countLinked(linked.prescriptions),
  };
  // A filter left on with nothing under it (the period changed) reads as all.
  const activeFilter: VisitFilter = filterCounts[visitFilter] > 0 ? visitFilter : "all";

  /**
   * A tile's link: the section it opens, with the visit filter set on the
   * way. Scrolled here rather than by the router, so tapping the same tile
   * twice still lands on its list.
   */
  const tileLink = (count: number, section: string, filter?: VisitFilter) => {
    if (count === 0) return {};
    return {
      href: `#${section}`,
      onClick: (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        if (filter) setVisitFilter(filter);
        document.getElementById(section)?.scrollIntoView({ block: "start" });
        window.history.replaceState(window.history.state, "", `#${section}`);
      },
    };
  };

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
  // Both counts when there are both, so the tile says everything its list holds.
  const scheduleValue =
    schedule.overdue.length > 0
      ? [
          t.vets.hub.overdue(schedule.overdue.length),
          schedule.upcoming.length > 0 && t.vets.hub.upcoming(schedule.upcoming.length),
        ]
          .filter(Boolean)
          .join(" · ")
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

  const shownVisits = activeFilter === visitFilter ? filteredVisits : inPeriod;
  const recentVisits = useMemo(
    () =>
      [...shownVisits]
        .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
        .slice(0, RECENT_VISITS_LIMIT),
    [shownVisits],
  );

  const periodLabel = t.vets.hub.periods[period ?? "all"];

  // Visits per doctor over the chosen period, so the list reads as "who
  // does this clinic's work", busiest first. Doctors who have left are only
  // counted, not listed.
  const doctorVisits = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of inPeriod) {
      if (v.doctor_id) counts.set(v.doctor_id, (counts.get(v.doctor_id) ?? 0) + 1);
    }
    return counts;
  }, [inPeriod]);
  const activeDoctors = useMemo(
    () =>
      doctors
        .filter((d) => d.active)
        .sort(
          (a, b) =>
            (doctorVisits.get(b.id) ?? 0) - (doctorVisits.get(a.id) ?? 0) ||
            a.name.localeCompare(b.name),
        ),
    [doctors, doctorVisits],
  );
  const leftDoctors = doctors.length - activeDoctors.length;

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <Link href="/clinics" className="inline-flex min-h-11 items-center text-sm text-muted hover:text-foreground md:min-h-0">
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
            <ActionLink href="/management/clinics" label={t.vets.manageInAdmin} icon={ACTION_ICONS.manage} iconOnlyOnMobile={false} />
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
                className={`rounded px-2 py-1.5 text-sm font-medium transition sm:px-3 ${
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
          {...tileLink(inPeriod.length, "visits", "all")}
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
          {...tileLink(byResident.length, "residents")}
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
          {...tileLink(schedule.overdue.length + schedule.upcoming.length, "schedule")}
          value={scheduleValue}
          detail={scheduleDetail}
          tone={scheduleTone}
        />
        <StatCard
          title={t.vets.hub.spend}
          icon={VET_ICONS.visits}
          {...tileLink(filterCounts.spend, "visits", "spend")}
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
          {...tileLink(filterCounts.procedures, "visits", "procedures")}
          value={`${countLinked(linked.procedures)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.bloodTests}
          icon={VET_ICONS.bloodTests}
          {...tileLink(filterCounts.bloodTests, "visits", "bloodTests")}
          value={`${countLinked(linked.bloodTests)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
        <StatCard
          title={t.vets.hub.prescriptions}
          icon={VET_ICONS.prescriptions}
          {...tileLink(filterCounts.prescriptions, "visits", "prescriptions")}
          value={`${countLinked(linked.prescriptions)}`}
          detail={t.vets.hub.linkedDetail}
          tone="neutral"
        />
      </div>

      {/* Every scheduled visit, whatever the period: overdue ones first (they
          need marking done or cancelled), then what is coming. The Visits
          list below is the past; together they are the clinic's whole
          picture. Headings reuse the tile's own wording. */}
      <section id="schedule" className="flex scroll-mt-4 flex-col gap-3">
        <div className="flex items-center gap-2">
          <VET_ICONS.upcoming aria-hidden="true" className="h-5 w-5 text-muted" />
          <h2 className="text-lg font-semibold text-foreground">{t.vets.hub.schedule}</h2>
        </div>
        {schedule.overdue.length + schedule.upcoming.length === 0 ? (
          <p className="rounded border border-border px-4 py-6 text-center text-sm text-muted">
            {t.vets.hub.nothingScheduled}
          </p>
        ) : (
          (
            [
              ["overdue", schedule.overdue, t.vets.hub.overdue(schedule.overdue.length)],
              ["upcoming", schedule.upcoming, t.vets.hub.upcoming(schedule.upcoming.length)],
            ] as const
          )
            .filter(([, rows]) => rows.length > 0)
            .map(([kind, rows, heading]) => (
              <div key={kind} className="flex flex-col gap-2">
                <h3
                  className={`text-sm font-medium ${
                    kind === "overdue" ? "text-danger" : "text-foreground"
                  }`}
                >
                  {heading}
                </h3>
                <ul
                  className={`divide-y rounded border ${
                    kind === "overdue"
                      ? "divide-danger/30 border-danger/40 bg-danger/10"
                      : "divide-border border-border bg-surface"
                  }`}
                >
                  {rows.map((visit) => (
                    <li key={visit.id} className="flex items-center gap-3 p-3">
                      <ResidentThumb
                        photoId={visit.residents?.profile_photo_drive_file_id ?? null}
                        alt={residentName(visit.resident_id)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={`/residents/${visit.resident_id}`}
                          className="truncate font-medium text-primary hover:underline"
                        >
                          {residentName(visit.resident_id)}
                        </Link>
                        <span
                          className={`text-xs ${
                            kind === "overdue" ? "font-medium text-danger" : "text-muted"
                          }`}
                        >
                          {formatDateTime(visit.appointment_date, locale)}
                        </span>
                        <span className="truncate text-xs text-muted">
                          {[visit.reason ?? t.residents.sections.vetVisitFallback, visit.doctor_name]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </div>
                      {canOpenVisits && (
                        <Link
                          href={`/clinic-visits/${visit.id}/edit`}
                          className="inline-flex min-h-11 shrink-0 items-center rounded border border-border bg-background px-3 text-sm font-medium text-primary hover:bg-surface-hover"
                        >
                          {t.common.edit}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </section>

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

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-foreground">
            {t.vets.hub.doctors.heading}{" "}
            <span className="text-muted">({activeDoctors.length})</span>
          </h2>
          {canManage && (
            <ActionLink href={`/management/clinics/${vet.id}/doctors`} label={t.vets.manageDoctors} icon={ACTION_ICONS.manage} iconOnlyOnMobile={false} />
          )}
        </div>
        {activeDoctors.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {activeDoctors.map((doctor) => (
              <li
                key={doctor.id}
                className="rounded-full border border-border bg-background px-3 py-1 text-sm text-foreground"
              >
                {doctor.name}
                <span className="ml-1.5 text-xs text-muted">
                  {t.vets.hub.doctors.visits(doctorVisits.get(doctor.id) ?? 0)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t.vets.hub.doctors.none}</p>
        )}
        {leftDoctors > 0 && (
          <p className="text-xs text-muted">{t.vets.hub.doctors.left(leftDoctors)}</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section id="residents" className="flex scroll-mt-4 flex-col gap-3">
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

        <section id="visits" className="flex scroll-mt-4 flex-col gap-3">
          <div className="flex items-center gap-2">
            <VET_ICONS.visits aria-hidden="true" className="h-5 w-5 text-muted" />
            <h2 className="text-lg font-semibold text-foreground">
              {t.vets.hub.visitsHeading}
            </h2>
            <span className="text-sm text-muted">
              {shownVisits.length > recentVisits.length
                ? t.vets.hub.showingOf(recentVisits.length, shownVisits.length)
                : `(${shownVisits.length})`}
            </span>
          </div>
          {/* Narrow to what a tile counted. Only filters with something under
              them are offered, and the tile titles are their labels. */}
          {VISIT_FILTERS.some((f) => f !== "all" && filterCounts[f] > 0) && (
            <div
              role="radiogroup"
              aria-label={t.vets.hub.visitsHeading}
              className="flex flex-wrap gap-2"
            >
              {VISIT_FILTERS.filter((f) => f === "all" || filterCounts[f] > 0).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={f === activeFilter}
                  onClick={() => setVisitFilter(f)}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition md:min-h-0 md:py-1 ${
                    f === activeFilter
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {t.vets.hub[f === "all" ? "visits" : f]}
                  <span className="tabular-nums opacity-80">{filterCounts[f]}</span>
                </button>
              ))}
            </div>
          )}
          {recentVisits.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {recentVisits.map((visit) => (
                <li key={visit.id}>
                  <Link
                    href={`/residents/${visit.resident_id}/${FILTER_SECTION[activeFilter]}`}
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
