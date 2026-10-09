import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { addDaysIso, formatDate, todayIso } from "@/lib/format";
import { loadVetVisitEstimate } from "@/lib/site/content";
import { ForecastWindowPicker } from "@/components/ForecastWindowPicker";
import {
  CASHFLOW_FIXED_DAYS,
  resolveCashflowWindow,
  type CashflowRow,
} from "@/lib/management/cashflow";
import { fixedOutgoingRows, type FixedOutgoing } from "@/lib/management/fixed-outgoings";
import { VET_HISTORY_DAYS, vetForecast, type ClinicVisit } from "@/lib/management/clinic-forecast";
import { CashflowView } from "./CashflowView";
import { requirePermission } from "@/lib/permissions/require";

type VetRow = { appointment_date: string; cost: number | string | null };

/**
 * Management → Cashflow: every outgoing the database can see, in baht,
 * for one window — the page the `cashflow_forecast` function (0072) exists
 * for. Food, medication, immunizations, vet visits and maintenance each
 * forecast in their own unit elsewhere in the app; this is the only place
 * they add up.
 *
 * Management and admin only, like the rest of the section. The guard here
 * is the server-side one — RLS on the underlying tables is what actually
 * protects the figures, and this redirect is what stops a signed-in
 * volunteer seeing the page frame at all.
 */
export default async function CashflowPage(props: PageProps<"/management/cashflow">) {
  await requirePermission("reports.cashflow");
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;
  const c = t.management.cashflow;

  // One window at a time: the 30 or 90-day button, or a custom From/To
  // from the same picker the Diets and Medications tables use.
  const { window, invalid } = resolveCashflowWindow(searchParams);
  const customFrom = window.days == null ? window.from : "";
  const customTo = window.days == null ? window.to : "";

  const supabase = await createClient();
  const today = todayIso();
  const [forecast, vetEstimate, vetBooked, vetHistory, fixed] = await Promise.all([
    supabase.rpc("cashflow_forecast", { p_from: window.from, p_to: window.to }),
    // Shown under the table so it is obvious which figure the vet row used
    // and where to change it.
    loadVetVisitEstimate(supabase),
    // The vet line is computed here, not by the RPC (vet-forecast.ts): the
    // visits still booked inside the window, and the completed ones of the
    // last quarter that give the typical rate and cost. A day either side
    // of each range is fetched loosely and trimmed on shelter dates below.
    supabase
      .from("clinic_visits")
      .select("appointment_date, cost")
      .is("archived_at", null)
      .eq("status", "scheduled")
      .gte("appointment_date", `${addDaysIso(window.from, -1)}T00:00:00Z`)
      .lte("appointment_date", `${addDaysIso(window.to, 2)}T00:00:00Z`)
      .returns<VetRow[]>(),
    supabase
      .from("clinic_visits")
      .select("appointment_date, cost")
      .is("archived_at", null)
      .eq("status", "completed")
      .gte("appointment_date", `${addDaysIso(today, -VET_HISTORY_DAYS - 1)}T00:00:00Z`)
      .lte("appointment_date", `${addDaysIso(today, 2)}T00:00:00Z`)
      .returns<VetRow[]>(),
    // The named monthly costs (0114), folded in below as one more category.
    supabase
      .from("fixed_outgoings")
      .select("id, label, label_th, monthly_amount, note, active, starts_on, ends_on")
      .returns<FixedOutgoing[]>(),
  ]);

  // Counted by the day, like every other category (fixedOutgoingRows).
  const fixedLines = fixed.data ?? [];
  const toVisits = (data: VetRow[] | null): ClinicVisit[] =>
    (data ?? []).map((r) => ({
      date: todayIso(new Date(r.appointment_date)),
      cost: r.cost == null ? null : Number(r.cost),
    }));
  const vet = vetForecast({
    from: window.from,
    to: window.to,
    today,
    booked: toVisits(vetBooked.data),
    history: toVisits(vetHistory.data).filter(
      (v) => v.date > addDaysIso(today, -VET_HISTORY_DAYS) && v.date <= today,
    ),
    estimate: vetEstimate,
  });
  const rows = [
    // The RPC's own vet rows (booked visits at the flat figure) are
    // superseded by vet.rows.
    ...((forecast.data ?? []) as CashflowRow[]).filter((r) => r.category !== "vet"),
    ...vet.rows,
    ...fixedOutgoingRows(fixedLines, window.from, window.to),
  ];
  const fixedMonthly = fixedLines
    .filter((l) => l.active)
    .reduce((sum, l) => sum + Number(l.monthly_amount), 0);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
        <p className="text-sm text-muted">{c.subtitle}</p>
      </div>

      {/* On the page, not only in the manual: this figure is not a budget
          and someone will eventually take a screenshot of it to a meeting. */}
      <p className="rounded border border-border bg-surface px-4 py-3 text-sm text-muted">
        <span className="font-medium text-foreground">{c.notABudgetLead}</span>{" "}
        {c.notABudget}
      </p>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {CASHFLOW_FIXED_DAYS.map((days) => {
            const current = window.days === days;
            return (
              <Link
                key={days}
                href={`/management/cashflow?days=${days}`}
                aria-current={current ? "page" : undefined}
                className={`rounded border px-4 py-2 text-sm font-medium transition ${
                  current
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-foreground hover:bg-surface-hover"
                }`}
              >
                {c.window.fixed(days)}
              </Link>
            );
          })}
          <span className="text-sm text-muted">
            {t.management.forecastWindow.heading(
              formatDate(window.from, locale),
              formatDate(window.to, locale),
            )}
          </span>
        </div>
        <ForecastWindowPicker from={customFrom} to={customTo} invalid={invalid} />
      </section>

      {forecast.error || fixed.error || vetBooked.error || vetHistory.error ? (
        <p className="text-sm text-danger">
          {c.couldntLoad}: {(forecast.error ?? fixed.error ?? vetBooked.error ?? vetHistory.error)?.message}
        </p>
      ) : (
        <CashflowView
          rows={rows}
          vetBasis={vet.basis}
          fixedMonthly={fixedLines.some((l) => l.active) ? fixedMonthly : null}
          from={window.from}
          to={window.to}
        />
      )}
    </main>
  );
}
