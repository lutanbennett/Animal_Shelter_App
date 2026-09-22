import Link from "next/link";
import {
  Ambulance,
  ChevronLeft,
  ChevronRight,
  Droplet,
  HeartCrack,
  HeartHandshake,
  PawPrint,
  RotateCcw,
  Scissors,
  Stethoscope,
} from "lucide-react";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { speciesLabel } from "@/lib/i18n/enum-labels";
import { formatMonth } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import {
  entryTotal,
  monthReport,
  monthWindow,
  residentIndex,
  shiftMonth,
  snapshot,
  toMonthKey,
  trend,
  type AppointmentRow,
  type BloodTestRow,
  type MaintenanceRow,
  type PlacementRow,
  type ProcedureRow,
  type ResidentRow,
  type StateRow,
} from "@/lib/management/report";
import { ReportCard } from "./ReportCard";
import { TrendChart } from "./TrendChart";

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
  await requireManagementUser();
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
  const trendStart = new Date(
    window.start.getFullYear(),
    window.start.getMonth() - (TREND_MONTHS - 1),
    1,
  );

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
    maintenanceResult,
  ] = await Promise.all([
    supabase
      .from("residents")
      .select("id, name, species, ready_for_adoption, is_public_visible")
      .returns<ResidentRow[]>(),
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
      .from("vet_appointments")
      .select("resident_id, appointment_date, status")
      .gte("appointment_date", window.start.toISOString())
      .lt("appointment_date", window.end.toISOString())
      .neq("status", "cancelled")
      .returns<AppointmentRow[]>(),
    supabase
      .from("vet_appointments")
      .select("resident_id, appointment_date, status")
      .eq("status", "scheduled")
      .returns<AppointmentRow[]>(),
    supabase
      .from("blood_tests")
      .select("resident_id, date, vet_appointment_id")
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
          .from("vet_appointments")
          .select("resident_id, appointment_date, status")
          .in("resident_id", seenIds)
          .lt("appointment_date", window.start.toISOString())
          .neq("status", "cancelled")
          .returns<AppointmentRow[]>()
      : { data: [], error: null };

  const residents = residentsResult.data ?? [];
  const index = residentIndex(residents);
  const placements = placementsResult.data ?? [];

  const report = monthReport(window, now, {
    residents: index,
    placements,
    appointments: [...(priorVisitsResult.data ?? []), ...monthVisits],
    bloodTests: bloodTestsResult.data ?? [],
    procedures: proceduresResult.data ?? [],
  });
  const current = snapshot(now, {
    residents,
    states: statesResult.data ?? [],
    appointments: scheduledResult.data ?? [],
    maintenance: maintenanceResult.data ?? [],
  });
  const buckets = trend(placements, TREND_MONTHS, window.start);

  const monthLabel = formatMonth(window.start, locale, true);
  const isCurrentMonth = window.key === toMonthKey(now);
  const speciesSummary = current.bySpecies
    .map(
      (s) =>
        `${s.count} ${s.species ? speciesLabel(t, s.species) : d.other}`,
    )
    .join(" · ");

  const monthNavClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-border text-muted hover:bg-surface-hover hover:text-foreground";

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-6">
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
          <StatCard
            href="/vets"
            title={d.now.vetVisitsDue}
            value={String(current.vetVisitsDue)}
            detail={
              current.vetVisitsOverdue > 0
                ? d.now.vetVisitsOverdue(current.vetVisitsOverdue)
                : undefined
            }
            tone={current.vetVisitsOverdue > 0 ? "danger" : "neutral"}
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

      {/* The month — what the monthly report asks for */}
      <section className="flex flex-col gap-3">
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

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ReportCard
            title={d.month.intakes}
            icon={PawPrint}
            count={report.intakes.length}
            entries={report.intakes}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.adopted}
            icon={HeartHandshake}
            count={report.adopted.length}
            entries={report.adopted}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.fostered}
            icon={HeartHandshake}
            count={report.fosteredNew.length + report.fosteredContinued.length}
            groups={[
              { label: d.month.fosteredNew, entries: report.fosteredNew },
              { label: d.month.fosteredContinued, entries: report.fosteredContinued },
            ]}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.died}
            icon={HeartCrack}
            count={report.died.length}
            entries={report.died}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.hospitalised}
            icon={Ambulance}
            count={report.hospitalised.length}
            entries={report.hospitalised}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.returned}
            icon={RotateCcw}
            count={report.returned.length}
            entries={report.returned}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.bloodWorkInHouse}
            hint={d.month.bloodWorkInHouseHint}
            icon={Droplet}
            count={entryTotal(report.bloodWorkInHouse)}
            entries={report.bloodWorkInHouse}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.bloodWorkVetVisit}
            hint={d.month.bloodWorkVetVisitHint}
            icon={Droplet}
            count={entryTotal(report.bloodWorkVetVisit)}
            entries={report.bloodWorkVetVisit}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.vetVisitsInitial}
            hint={d.month.vetVisitsInitialHint}
            icon={Stethoscope}
            count={entryTotal(report.vetVisitsInitial)}
            entries={report.vetVisitsInitial}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.vetVisitsFollowUp}
            hint={d.month.vetVisitsFollowUpHint}
            icon={Stethoscope}
            count={entryTotal(report.vetVisitsFollowUp)}
            entries={report.vetVisitsFollowUp}
            none={d.month.none}
          />
          <ReportCard
            title={d.month.procedures}
            hint={d.month.proceduresByType}
            icon={Scissors}
            count={report.procedures.reduce((n, g) => n + g.count, 0)}
            groups={report.procedures.map((g) => ({
              label: g.type || d.other,
              entries: g.entries,
            }))}
            none={d.month.none}
          />
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
