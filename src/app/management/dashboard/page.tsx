import Link from "next/link";
import {
  Ambulance,
  ChevronLeft,
  ChevronRight,
  Coins,
  Droplet,
  HeartCrack,
  HeartHandshake,
  PawPrint,
  RotateCcw,
  Scissors,
  Stethoscope,
  Syringe,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { addMonthsToKey, formatBaht, formatMonth, shelterMidnight } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { PrintButton } from "@/components/PrintButton";
import {
  entryTotal,
  monthReport,
  monthReportText,
  monthWindow,
  residentIndex,
  shiftMonth,
  snapshot,
  toMonthKey,
  trend,
  type AppointmentRow,
  type BloodTestRow,
  type ImmunizationRow,
  type MaintenanceRow,
  type NamedEntry,
  type PlacementRow,
  type ProcedureRow,
  type ResidentRow,
  type StateRow,
} from "@/lib/management/report";
import { ReportCard } from "./ReportCard";
import { CopyTextButton } from "./CopyTextButton";
import { TrendChart } from "./TrendChart";
import { requirePermission } from "@/lib/permissions/require";

const TREND_MONTHS = 12;

/** The placement types the month sections and the trend are built from. */
const REPORTED_PLACEMENTS = [
  "Intake",
  "Adopt",
  "Foster",
  "Deceased",
  "SendToHospital",
  "ReturnToShelter",
];

export default async function ManagementDashboardPage(
  props: PageProps<"/management/dashboard">,
) {
  await requirePermission("reports.dashboard");
  const searchParams = await props.searchParams;
  const { t, locale } = await getT();
  const d = t.management.dashboard;

  const now = new Date();
  const window = monthWindow(
    typeof searchParams.month === "string" ? searchParams.month : undefined,
    now,
  );
  // The trend ends with the selected month, so stepping back in time moves
  // the chart with the cards.
  const trendStart = shelterMidnight(`${addMonthsToKey(window.key, -(TREND_MONTHS - 1))}-01`);

  const supabase = await createClient();

  // Everything is loaded with a bound that keeps it well under PostgREST's
  // 1000-row cap at shelter scale: the trend window for placements (plus
  // any foster still open, for "continuing"), the month for tests and
  // procedures, and only what's still scheduled for the visit outlook.
  const [
    residentsResult,
    statesResult,
    placementsResult,
    monthVisitsResult,
    scheduledResult,
    bloodTestsResult,
    proceduresResult,
    immunizationsResult,
    maintenanceResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, species, ready_for_adoption, is_public_visible, microchip_number")
      .returns<(Omit<ResidentRow, "has_microchip"> & { microchip_number: string | null })[]>(),
    supabase
      .from("resident_current_state")
      .select("resident_id, current_status")
      .returns<StateRow[]>(),
    supabase
      .from("placement_history")
      .select("resident_id, placement_type, start_date, end_date")
      .in("placement_type", REPORTED_PLACEMENTS)
      .lt("start_date", window.end.toISOString())
      .or(
        `start_date.gte.${trendStart.toISOString()},and(placement_type.eq.Foster,or(end_date.is.null,end_date.gte.${window.start.toISOString()}))`,
      )
      .returns<PlacementRow[]>(),
    supabase
      .from("clinic_visits")
      .select("resident_id, appointment_date, status, cost")
      .is("archived_at", null)
      .gte("appointment_date", window.start.toISOString())
      .lt("appointment_date", window.end.toISOString())
      .neq("status", "cancelled")
      .returns<AppointmentRow[]>(),
    supabase
      .from("clinic_visits")
      .select("resident_id, appointment_date, status")
      .is("archived_at", null)
      .eq("status", "scheduled")
      .returns<AppointmentRow[]>(),
    supabase
      .from("blood_tests")
      .select("resident_id, date, clinic_visit_id")
      .gte("date", window.startDate)
      .lt("date", window.endDate)
      .returns<BloodTestRow[]>(),
    supabase
      .from("procedures")
      .select("resident_id, date, procedure_types(name)")
      .gte("date", window.startDate)
      .lt("date", window.endDate)
      .returns<ProcedureRow[]>(),
    supabase
      .from("immunization_records")
      // Through the picker view, as every other reader of vaccine names does:
      // immunization_types itself is not readable by every role that sees this.
      .select(
        "resident_id, date_administered, immunization_types:picker_immunization_types(name, name_th)",
      )
      // 0124: an archived dose is a deleted one.
      .is("archived_at", null)
      .gte("date_administered", window.startDate)
      .lt("date_administered", window.endDate)
      .returns<ImmunizationRow[]>(),
    supabase
      .from("maintenance")
      .select("status")
      .neq("status", "Completed")
      .returns<MaintenanceRow[]>(),
  ]);

  const results = [
    residentsResult,
    statesResult,
    placementsResult,
    monthVisitsResult,
    scheduledResult,
    bloodTestsResult,
    proceduresResult,
    immunizationsResult,
    maintenanceResult,
  ];
  const loadError = results.find((r) => r.error)?.error ?? null;

  // "Initial" vs "follow-up" needs to know whether each resident seen this
  // month had ever been seen before, so the earlier visits of just those
  // residents are fetched once the month's are known.
  const monthVisits = monthVisitsResult.data ?? [];
  const seenIds = [...new Set(monthVisits.map((v) => v.resident_id))];
  const priorVisitsResult =
    seenIds.length > 0
      ? await supabase
          .from("clinic_visits")
          .select("resident_id, appointment_date, status")
          .is("archived_at", null)
          .in("resident_id", seenIds)
          .lt("appointment_date", window.start.toISOString())
          .neq("status", "cancelled")
          .returns<AppointmentRow[]>()
      : { data: [], error: null };

  // Only whether a chip is on file travels further than this line.
  const residents: ResidentRow[] = (residentsResult.data ?? []).map(
    ({ microchip_number, ...row }) => ({ ...row, has_microchip: microchip_number !== null }),
  );
  const index = residentIndex(residents);
  const placements = placementsResult.data ?? [];

  const report = monthReport(window, now, {
    residents: index,
    placements,
    appointments: [...(priorVisitsResult.data ?? []), ...monthVisits],
    bloodTests: bloodTestsResult.data ?? [],
    procedures: proceduresResult.data ?? [],
    // Grouped under the vaccine's name in the reader's language.
    immunizations: (immunizationsResult.data ?? []).map((row) => {
      const type = row.immunization_types;
      const name = locale === "th" && type?.name_th ? type.name_th : type?.name;
      return { ...row, immunization_types: name ? { name } : null };
    }),
  });
  const current = snapshot(now, {
    residents,
    states: statesResult.data ?? [],
    appointments: scheduledResult.data ?? [],
    maintenance: maintenanceResult.data ?? [],
  });
  const buckets = trend(placements, TREND_MONTHS, window.key);

  // The first of the month as a date string, not window.start: that is the
  // shelter's midnight, 17:00 UTC the day before, and would read as the
  // previous month on a server running in UTC.
  const monthLabel = formatMonth(window.startDate, locale, true);

  // One list drives both the cards and the copied text, so the two cannot
  // drift apart.
  const { spent, invoiced, notInvoiced } = report.clinicSpend;
  const cards: {
    title: string;
    hint?: string;
    icon: LucideIcon;
    count: number | string;
    detail?: string;
    entries?: NamedEntry[];
    groups?: { label: string; entries: NamedEntry[] }[];
  }[] = [
    { title: d.month.intakes, icon: PawPrint, count: report.intakes.length, entries: report.intakes },
    { title: d.month.adopted, icon: HeartHandshake, count: report.adopted.length, entries: report.adopted },
    {
      title: d.month.fostered,
      icon: HeartHandshake,
      count: report.fosteredNew.length + report.fosteredContinued.length,
      groups: [
        { label: d.month.fosteredNew, entries: report.fosteredNew },
        { label: d.month.fosteredContinued, entries: report.fosteredContinued },
      ],
    },
    { title: d.month.died, icon: HeartCrack, count: report.died.length, entries: report.died },
    { title: d.month.hospitalised, icon: Ambulance, count: report.hospitalised.length, entries: report.hospitalised },
    { title: d.month.returned, icon: RotateCcw, count: report.returned.length, entries: report.returned },
    {
      title: d.month.bloodWorkInHouse,
      hint: d.month.bloodWorkInHouseHint,
      icon: Droplet,
      count: entryTotal(report.bloodWorkInHouse),
      entries: report.bloodWorkInHouse,
    },
    {
      title: d.month.bloodWorkVetVisit,
      hint: d.month.bloodWorkVetVisitHint,
      icon: Droplet,
      count: entryTotal(report.bloodWorkClinicVisit),
      entries: report.bloodWorkClinicVisit,
    },
    {
      title: d.month.vetVisitsInitial,
      hint: d.month.vetVisitsInitialHint,
      icon: Stethoscope,
      count: entryTotal(report.clinicVisitsInitial),
      entries: report.clinicVisitsInitial,
    },
    {
      title: d.month.vetVisitsFollowUp,
      hint: d.month.vetVisitsFollowUpHint,
      icon: Stethoscope,
      count: entryTotal(report.clinicVisitsFollowUp),
      entries: report.clinicVisitsFollowUp,
    },
    {
      title: d.month.clinicSpend,
      hint: d.month.clinicSpendHint,
      icon: Coins,
      count: formatBaht(spent, locale),
      detail:
        invoiced + notInvoiced > 0 ? d.month.clinicSpendDetail(invoiced, notInvoiced) : d.month.none,
    },
    {
      title: d.month.procedures,
      hint: d.month.proceduresByType,
      icon: Scissors,
      count: report.procedures.reduce((n, g) => n + g.count, 0),
      groups: report.procedures.map((g) => ({ label: g.type || d.other, entries: g.entries })),
    },
    {
      title: d.month.vaccinations,
      hint: d.month.vaccinationsByVaccine,
      icon: Syringe,
      count: report.immunizations.reduce((n, g) => n + g.count, 0),
      groups: report.immunizations.map((g) => ({ label: g.type || d.other, entries: g.entries })),
    },
  ];
  const monthText = monthReportText({
    heading: d.month.heading(monthLabel),
    none: d.month.none,
    lines: cards.map((c) => ({
      label: c.title,
      count: typeof c.count === "number" ? c.count : undefined,
      detail: typeof c.count === "string" ? [c.count, c.detail].filter(Boolean).join(" — ") : undefined,
      entries: c.entries,
      groups: c.groups,
    })),
  });
  const isCurrentMonth = window.key === toMonthKey(now);
  const speciesSummary = current.bySpecies
    .map(
      (s) =>
        `${s.count} ${s.species ? speciesLabel(t, s.species) : d.other}`,
    )
    .join(" · ");

  const monthNavClass =
    "inline-flex h-11 w-11 items-center justify-center rounded border md:h-8 md:w-8 border-border text-muted hover:bg-surface-hover hover:text-foreground";

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6">
      {/* Print the month section alone: everything that neither contains it
          nor sits inside it goes, app chrome included, so nothing leaves
          blank pages behind. Black on white whatever the theme. */}
      <style>{`@media print {
  body *:not(:has(#month-report)):not(#month-report):not(#month-report *) { display: none !important; }
  body { background: #fff !important; }
  #month-report, #month-report * { color: #000 !important; background: transparent !important; }
  #month-report nav { display: none !important; }
}`}</style>
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{d.title}</h1>
        <p className="text-sm text-muted">{d.subtitle}</p>
      </div>

      {(loadError || priorVisitsResult.error) && (
        <p className="text-sm text-danger">
          {d.couldntLoad}: {(loadError ?? priorVisitsResult.error)?.message}
        </p>
      )}

      {/* Right now — independent of the month picker */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">{d.now.heading}</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            href="/residents"
            title={d.now.inCare}
            value={String(current.inCare)}
            detail={speciesSummary || d.now.inCareDetail}
            tone="success"
          />
          <StatCard
            title={d.now.inShelter}
            value={String(current.inShelter)}
          />
          <StatCard
            title={d.now.inHospital}
            value={String(current.inHospital)}
            tone={current.inHospital > 0 ? "warning" : "neutral"}
          />
          <StatCard
            title={d.now.fostered}
            value={String(current.fostered)}
          />
          <StatCard
            title={d.now.readyForAdoption}
            value={String(current.readyForAdoption)}
            detail={d.now.readyForAdoptionDetail(current.publicVisible)}
            href="/adopt"
          />
          <StatCard
            title={d.now.unassigned}
            value={String(current.unassigned)}
          />
          <StatCard
            title={d.now.outreach}
            value={String(current.outreach)}
            detail={d.now.outreachDetail}
          />
          {/* Encouraging chipping: a nudge, not a target. */}
          <StatCard
            href="/residents?nochip=1"
            title={d.now.noMicrochip}
            value={String(current.notMicrochipped)}
            detail={d.now.noMicrochipDetail(current.microchipped)}
          />
          <StatCard
            href="/clinics"
            title={d.now.vetVisitsDue}
            value={String(current.clinicVisitsDue)}
            detail={
              current.clinicVisitsOverdue > 0
                ? d.now.vetVisitsOverdue(current.clinicVisitsOverdue)
                : undefined
            }
            tone={current.clinicVisitsOverdue > 0 ? "danger" : "neutral"}
          />
          <StatCard
            href="/maintenance"
            title={d.now.openMaintenance}
            value={String(current.openMaintenance)}
            detail={
              current.blockedMaintenance > 0
                ? d.now.openMaintenanceDetail(current.blockedMaintenance)
                : undefined
            }
            tone={current.blockedMaintenance > 0 ? "warning" : "neutral"}
          />
        </div>
      </section>

      {/* The month — what the monthly report asks for, and the only part that prints */}
      <section id="month-report" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {d.month.heading(monthLabel)}
          </h2>
          <nav className="flex items-center gap-2">
            <Link
              href={`/management/dashboard?month=${shiftMonth(window, -1)}`}
              aria-label={d.previousMonth}
              title={d.previousMonth}
              className={monthNavClass}
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </Link>
            <span className="min-w-28 text-center text-sm font-medium text-foreground">
              {monthLabel}
            </span>
            <Link
              href={`/management/dashboard?month=${shiftMonth(window, 1)}`}
              aria-label={d.nextMonth}
              title={d.nextMonth}
              aria-disabled={isCurrentMonth}
              className={`${monthNavClass} ${isCurrentMonth ? "pointer-events-none opacity-40" : ""}`}
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            {!isCurrentMonth && (
              <Link
                href="/management/dashboard"
                className="text-sm font-medium text-primary hover:underline"
              >
                {d.thisMonth}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <CopyTextButton
            text={monthText}
            label={d.month.copyText}
            copiedLabel={d.month.copied}
            promptLabel={d.month.copyPrompt}
          />
          <PrintButton label={d.month.print} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
          {cards.map((card) => (
            <ReportCard key={card.title} {...card} none={d.month.none} />
          ))}
        </div>
      </section>

      {/* Trend */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{d.trend.heading}</h2>
          <p className="text-sm text-muted">{d.trend.subheading}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3 md:p-4">
          <TrendChart buckets={buckets} />
        </div>
      </section>
    </main>
  );
}
