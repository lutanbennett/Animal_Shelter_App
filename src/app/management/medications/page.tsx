import Link from "next/link";
import { ClipboardCheck, Scale, ShoppingCart, Truck } from "lucide-react";
import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateMedicationForm } from "./CreateMedicationForm";
import { MedicationsTable, type MedicationRow } from "./MedicationsTable";
import { ForecastWindowPicker } from "@/components/ForecastWindowPicker";
import { formatDate } from "@/lib/format";
import { forecastWindows, parseCustomWindow } from "@/lib/management/forecast-window";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { STOCK_RATE_DAYS, readStock, stockFiguresOf } from "@/lib/management/stock";
import { UnitsPanel } from "@/components/UnitsPanel";
import { doseUnitLabel } from "@/lib/i18n/enum-labels";
import { inPurchaseUnit } from "@/lib/units";
import { loadConversions } from "@/lib/units-server";
import { loadReceipts } from "@/lib/management/receipts-server";
import { receivedSinceCount } from "@/lib/management/purchasing";

type MedicationQueryRow = {
  id: string;
  name: string;
  dose_unit: string;
  // numeric(12, 2): PostgREST normally hands this back as a JSON number, but
  // ForecastRow below shows it can arrive as a string, so it is normalised
  // once here rather than guessed at in the table.
  cost_per_unit: number | string | null;
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
  safety_stock: number | string | null;
};

type ForecastRow = {
  medication_id: string;
  prescription_count: number;
  resident_count: number;
  dose_count: number;
  quantity: number | string | null;
};

export default async function MedicationsAdminPage(props: PageProps<"/management/medications">) {
  await requireManagementUser();
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;

  // The fixed 7 / 30-day columns, plus a custom From/To window from the
  // picker when the query string carries one.
  const custom = parseCustomWindow(searchParams);
  const windows = forecastWindows(custom && "window" in custom ? custom.window : null);

  const supabase = await createClient();
  const [medicationsResult, prescriptionsResult, ...forecastResults] =
    await Promise.all([
      supabase
        .from("medication")
        .select(
          "id, name, dose_unit, cost_per_unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock",
        )
        .order("name")
        .returns<MedicationQueryRow[]>(),
      // One row per prescription is cheap at shelter scale and gives the
      // reference counts that gate the delete buttons.
      supabase
        .from("prescriptions")
        .select("medication_id")
        .returns<{ medication_id: string }[]>(),
      // Whole doses due in each window, from each prescription's own start
      // date (0044) — a weekly tablet is counted on the days it falls.
      ...windows.map(async (window) => {
        const { data, error } = await supabase.rpc("medication_forecast", {
          p_from: window.from,
          p_to: window.to,
        });
        return { data: (data ?? null) as ForecastRow[] | null, error };
      }),
    ]);

  const medicationCounts = new Map<string, number>();
  for (const row of prescriptionsResult.data ?? []) {
    medicationCounts.set(
      row.medication_id,
      (medicationCounts.get(row.medication_id) ?? 0) + 1,
    );
  }
  const forecasts = forecastResults.map(
    (result) => new Map((result.data ?? []).map((row) => [row.medication_id, row])),
  );

  // Days-of-stock reads the fixed 30-day column, never a custom window,
  // so it means the same thing whatever the picker shows.
  const rateWindow = windows.findIndex((window) => window.days === STOCK_RATE_DAYS);

  const conversions = await loadConversions(supabase, "medication");
  // Deliveries since each count are part of the cupboard now (stock.ts), so
  // days-of-stock agrees with Management → Purchasing.
  const receipts = await loadReceipts(supabase, "medication");
  const receivedSince = receivedSinceCount(
    receipts.data,
    new Map((medicationsResult.data ?? []).map((row) => [row.id, row.stock_counted_at])),
  );

  const medications: MedicationRow[] = (medicationsResult.data ?? []).map((medication) => {
    const forecast = forecasts.map((byMedication) => {
      const row = byMedication.get(medication.id);
      return {
        residents: row?.resident_count ?? 0,
        doses: row?.dose_count ?? 0,
        quantity: Number(row?.quantity ?? 0),
      };
    });
    const stock = stockFiguresOf(medication);
    return {
      id: medication.id,
      name: medication.name,
      dose_unit: medication.dose_unit,
      cost_per_unit:
        medication.cost_per_unit == null ? null : Number(medication.cost_per_unit),
      prescription_count: medicationCounts.get(medication.id) ?? 0,
      forecast,
      stock,
      stockReading: readStock(
        stock,
        forecast[rateWindow]?.quantity ?? 0,
        Date.now(),
        receivedSince.get(medication.id) ?? 0,
      ),
      purchaseUnit: inPurchaseUnit(stock.stock_on_hand, conversions.data[medication.id] ?? []),
      safetyStock: medication.safety_stock == null ? null : Number(medication.safety_stock),
      unitOptions: (conversions.data[medication.id] ?? []).map((c) => c.unit),
    };
  });

  const m = t.management.medications;
  const forecastError = forecastResults.find((r) => r.error)?.error;
  const forecastHeadings = windows.map((window) =>
    window.days != null
      ? m.table.forecastHeading(window.days)
      : t.management.forecastWindow.heading(
          formatDate(window.from, locale),
          formatDate(window.to, locale),
        ),
  );

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
        {/* Outside LargerScreenNotice: the sheet is built for a phone. */}
        <Link
          href="/stocktake?tab=medications"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
          {t.management.stock.stocktakeLink}
        </Link>
        <Link
          href="/management/stock-usage"
          className="mt-2 ml-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Scale aria-hidden="true" className="h-4 w-4" />
          {t.management.stockUsage.link}
        </Link>
        <Link
          href="/management/purchasing"
          className="mt-2 ml-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ShoppingCart aria-hidden="true" className="h-4 w-4" />
          {t.management.purchasing.link}
        </Link>
        <Link
          href="/deliveries"
          className="mt-2 ml-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Truck aria-hidden="true" className="h-4 w-4" />
          {t.management.stock.deliveriesLink}
        </Link>
      </div>

      <LargerScreenNotice>
        {medicationsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {medicationsResult.error.message}
          </p>
        )}
        {prescriptionsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoadUsage}: {prescriptionsResult.error.message}
          </p>
        )}
        {receipts.error && (
          <p className="text-sm text-danger">
            {t.management.stock.couldntLoadReceipts}: {receipts.error}
          </p>
        )}
        {forecastError && (
          <p className="text-sm text-danger">
            {m.couldntLoadForecast}: {forecastError.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <CreateMedicationForm />
          <ForecastWindowPicker
            from={custom && "window" in custom ? custom.window.from : ""}
            to={custom && "window" in custom ? custom.window.to : ""}
            invalid={custom != null && "invalid" in custom}
          />
          <MedicationsTable medications={medications} forecastHeadings={forecastHeadings} />
          <p className="text-xs text-muted">{m.table.forecastNote}</p>
          <p className="text-xs text-muted">{t.management.stock.note}</p>
        </section>

        {conversions.error && (
          <p className="text-sm text-danger">
            {t.units.title}: {conversions.error}
          </p>
        )}
        <UnitsPanel
          kind="medication"
          items={(medicationsResult.data ?? []).map((medication) => ({
            id: medication.id,
            name: medication.name,
            baseUnit: doseUnitLabel(t, medication.dose_unit),
            conversions: conversions.data[medication.id] ?? [],
            costPerBase: medication.cost_per_unit == null ? null : Number(medication.cost_per_unit),
          }))}
        />
      </LargerScreenNotice>
    </main>
  );
}
