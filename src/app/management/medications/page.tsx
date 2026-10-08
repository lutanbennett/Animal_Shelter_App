import { ActionLink } from "@/components/ActionLink";
import { ClipboardCheck, ListChecks, Scale, ShoppingCart, Truck } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { MedicationStockCards, type MedicationStockRow } from "./MedicationStockCards";
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
import { requirePermission } from "@/lib/permissions/require";
import { canEditItemSettings } from "@/lib/permissions/item-settings";

type MedicationQueryRow = {
  id: string;
  name: string;
  dose_unit: string;
  // numeric(12, 4) since 0161: PostgREST normally hands this back as a JSON
  // number, but ForecastRow below shows it can arrive as a string, so it is
  // normalised once here rather than guessed at on the card.
  cost_per_unit: number | string | null;
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
  safety_stock: number | string | null;
  label_drive_file_id: string | null;
};

type ForecastRow = {
  medication_id: string;
  prescription_count: number;
  resident_count: number;
  dose_count: number;
  quantity: number | string | null;
};

/**
 * Management → Medication stock: what is in the cupboard, what it costs,
 * when to reorder, the label photo and the forecast. The stock half of the
 * split of 2026-10-08 (docs/decisions/2026-10-07-management-settings-split.md);
 * the medication list itself — names, units, merging, unit conversions — is
 * Settings → Medications (/admin/medications), Admin only.
 */
export default async function MedicationStockPage(props: PageProps<"/management/medications">) {
  const { supabase, perms } = await requirePermission("stock.medications");
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;

  // The fixed 7 / 30-day columns, plus a custom From/To window from the
  // picker when the query string carries one.
  const custom = parseCustomWindow(searchParams);
  const windows = forecastWindows(custom && "window" in custom ? custom.window : null);

  const [medicationsResult, ...forecastResults] = await Promise.all([
    supabase
      .from("medication")
      .select(
        "id, name, dose_unit, cost_per_unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock, label_drive_file_id",
      )
      .order("name")
      .returns<MedicationQueryRow[]>(),
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

  const medications: MedicationStockRow[] = (medicationsResult.data ?? []).map((medication) => {
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
      cost_per_unit: medication.cost_per_unit == null ? null : Number(medication.cost_per_unit),
      forecast,
      stock,
      stockReading: readStock(
        stock,
        forecast[rateWindow]?.quantity ?? 0,
        undefined,
        receivedSince.get(medication.id) ?? 0,
      ),
      purchaseUnit: inPurchaseUnit(stock.stock_on_hand, conversions.data[medication.id] ?? []),
      safetyStock: medication.safety_stock == null ? null : Number(medication.safety_stock),
      labelFileId: medication.label_drive_file_id,
      unitOptions: (conversions.data[medication.id] ?? []).map((c) => c.unit),
    };
  });

  const m = t.management.medications;
  const forecastError = forecastResults.find((r) => r.error)?.error;
  const forecastHeadings = windows.map((window) =>
    window.days != null
      ? m.table.forecastHeading(window.days)
      : t.management.forecastWindow.heading(formatDate(window.from, locale), formatDate(window.to, locale)),
  );

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
        {/* Outside LargerScreenNotice: the sheet is built for a phone. */}
        <div className="mt-3 flex flex-wrap gap-2">
          <ActionLink
            href="/stocktake?tab=medications"
            label={t.management.stock.stocktakeLink}
            icon={ClipboardCheck}
            iconOnlyOnMobile={false}
          />
          <ActionLink
            href="/management/stock-usage"
            label={t.management.stockUsage.link}
            icon={Scale}
            iconOnlyOnMobile={false}
          />
          <ActionLink
            href="/management/purchasing"
            label={t.management.purchasing.link}
            icon={ShoppingCart}
            iconOnlyOnMobile={false}
          />
          <ActionLink
            href="/deliveries"
            label={t.management.stock.deliveriesLink}
            icon={Truck}
            iconOnlyOnMobile={false}
          />
          {canEditItemSettings(perms, "medication") && (
            <ActionLink
              href="/admin/medications"
              label={m.settingsLink}
              icon={ListChecks}
              iconOnlyOnMobile={false}
            />
          )}
        </div>
      </div>

      {/* PR 3 of the split (the device-notice sweep) takes this notice off: this half is the phone page. */}
      <LargerScreenNotice>
        {medicationsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {medicationsResult.error.message}
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
          <ForecastWindowPicker
            from={custom && "window" in custom ? custom.window.from : ""}
            to={custom && "window" in custom ? custom.window.to : ""}
            invalid={custom != null && "invalid" in custom}
          />
          <MedicationStockCards medications={medications} forecastHeadings={forecastHeadings} />
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
          mode="price"
          items={medications.map((medication) => ({
            id: medication.id,
            name: medication.name,
            baseUnit: doseUnitLabel(t, medication.dose_unit),
            conversions: conversions.data[medication.id] ?? [],
            costPerBase: medication.cost_per_unit,
          }))}
        />
      </LargerScreenNotice>
    </main>
  );
}
