import { ActionLink } from "@/components/ActionLink";
import { ClipboardCheck, ListChecks, Scale, ShoppingCart, Truck } from "lucide-react";
import { getT } from "@/lib/i18n/get-t";
import { DietStockCards, type DietStockRow } from "./DietStockCards";
import { ForecastWindowPicker } from "@/components/ForecastWindowPicker";
import { formatDate } from "@/lib/format";
import { forecastWindows, parseCustomWindow } from "@/lib/management/forecast-window";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { STOCK_RATE_DAYS, readStock, stockFiguresOf } from "@/lib/management/stock";
import { UnitsPanel } from "@/components/UnitsPanel";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { inPurchaseUnit } from "@/lib/units";
import { loadConversions } from "@/lib/units-server";
import { loadReceipts } from "@/lib/management/receipts-server";
import { receivedSinceCount } from "@/lib/management/purchasing";
import { requirePermission } from "@/lib/permissions/require";
import { canEditItemSettings } from "@/lib/permissions/item-settings";

type DietTypeQueryRow = {
  id: string;
  name: string;
  unit: string;
  is_standard: boolean;
  cost_per_unit: number | string;
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
  safety_stock: number | string | null;
};

type ForecastRow = {
  diet_type_id: string;
  diet_count: number;
  resident_count: number;
  quantity: number | string | null;
  cost: number | string | null;
};

/**
 * Management → Diet stock: what is in the cupboard, what it costs, when to
 * reorder, and what the residents living at the shelter will eat of it in the
 * next 7 / 30 days and what that costs (0051 diet_forecast). The stock half
 * of the split of 2026-10-08 (docs/decisions/2026-10-07-management-settings-split.md);
 * the food list itself — names, units, per-size quantities, the standard diet,
 * unit conversions — is Settings → Diets (/admin/diets), Admin only.
 */
export default async function DietStockPage(props: PageProps<"/management/diets">) {
  const { supabase, perms } = await requirePermission("stock.diets");
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;

  // The fixed 7 / 30-day columns, plus a custom From/To window from the
  // picker when the query string carries one.
  const custom = parseCustomWindow(searchParams);
  const windows = forecastWindows(custom && "window" in custom ? custom.window : null);

  const [typesResult, ...forecastResults] = await Promise.all([
    supabase
      .from("diet_types")
      .select(
        "id, name, unit, is_standard, cost_per_unit, stock_on_hand, stock_counted_at, reorder_lead_days, safety_stock",
      )
      .order("name")
      .returns<DietTypeQueryRow[]>(),
    ...windows.map(async (window) => {
      const { data, error } = await supabase.rpc("diet_forecast", {
        p_from: window.from,
        p_to: window.to,
      });
      return { data: (data ?? null) as ForecastRow[] | null, error };
    }),
  ]);

  const forecasts = forecastResults.map(
    (result) => new Map((result.data ?? []).map((row) => [row.diet_type_id, row])),
  );

  // Days-of-stock reads the fixed 30-day column, never a custom window,
  // so it means the same thing whatever the picker shows.
  const rateWindow = windows.findIndex((window) => window.days === STOCK_RATE_DAYS);

  const conversions = await loadConversions(supabase, "diet");
  // Deliveries since each count are part of the cupboard now (stock.ts), so
  // days-of-stock agrees with Management → Purchasing.
  const receipts = await loadReceipts(supabase, "diet");
  const receivedSince = receivedSinceCount(
    receipts.data,
    new Map((typesResult.data ?? []).map((row) => [row.id, row.stock_counted_at])),
  );

  const dietTypes: DietStockRow[] = (typesResult.data ?? []).map((type) => {
    const forecast = forecasts.map((byType) => {
      const row = byType.get(type.id);
      return {
        residents: row?.resident_count ?? 0,
        quantity: Number(row?.quantity ?? 0),
        cost: Number(row?.cost ?? 0),
      };
    });
    const stock = stockFiguresOf(type);
    return {
      id: type.id,
      name: type.name,
      is_standard: type.is_standard,
      unit: type.unit,
      cost_per_unit: Number(type.cost_per_unit),
      forecast,
      stock,
      stockReading: readStock(
        stock,
        forecast[rateWindow]?.quantity ?? 0,
        undefined,
        receivedSince.get(type.id) ?? 0,
      ),
      purchaseUnit: inPurchaseUnit(stock.stock_on_hand, conversions.data[type.id] ?? []),
      safetyStock: type.safety_stock == null ? null : Number(type.safety_stock),
      unitOptions: (conversions.data[type.id] ?? []).map((c) => c.unit),
    };
  });

  const m = t.management.diets;
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
            href="/stocktake?tab=diets"
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
            href="/deliveries?tab=diets"
            label={t.management.stock.deliveriesLink}
            icon={Truck}
            iconOnlyOnMobile={false}
          />
          {canEditItemSettings(perms, "diet") && (
            <ActionLink href="/admin/diets" label={m.settingsLink} icon={ListChecks} iconOnlyOnMobile={false} />
          )}
        </div>
      </div>

      {/* PR 3 of the split (the device-notice sweep) takes this notice off: this half is the phone page. */}
      <LargerScreenNotice>
        {typesResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {typesResult.error.message}
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
          <DietStockCards dietTypes={dietTypes} forecastHeadings={forecastHeadings} />
          <p className="text-xs text-muted">{m.table.forecastNote}</p>
          <p className="text-xs text-muted">{t.management.stock.note}</p>
        </section>

        {conversions.error && (
          <p className="text-sm text-danger">
            {t.units.title}: {conversions.error}
          </p>
        )}
        <UnitsPanel
          kind="diet"
          mode="price"
          items={dietTypes.map((type) => ({
            id: type.id,
            name: type.name,
            baseUnit: dietUnitLabel(t, type.unit),
            conversions: conversions.data[type.id] ?? [],
            costPerBase: type.cost_per_unit,
          }))}
        />
      </LargerScreenNotice>
    </main>
  );
}
