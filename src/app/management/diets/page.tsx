import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateDietTypeForm } from "./CreateDietTypeForm";
import { DietTypesTable, type DietTypeRow } from "./DietTypesTable";
import { ForecastWindowPicker } from "@/components/ForecastWindowPicker";
import { formatDate } from "@/lib/format";
import { forecastWindows, parseCustomWindow } from "@/lib/management/forecast-window";
import { LargerScreenNotice } from "@/components/LargerScreenNotice";
import { STOCK_RATE_DAYS, readStock, stockFiguresOf } from "@/lib/management/stock";

type DietTypeQueryRow = Omit<DietTypeRow, "diet_count" | "forecast" | "stock" | "stockReading"> & {
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  reorder_lead_days: number | null;
};

type ForecastRow = {
  diet_type_id: string;
  diet_count: number;
  resident_count: number;
  quantity: number | string | null;
  cost: number | string | null;
};

/**
 * Management → Diets: the food product list and the food forecast, the
 * shape of Management → Medications. Each row is a diet type with its
 * cost and per-size daily quantities; the forecast columns are what the
 * residents living at the shelter will eat of it in the next 7 / 30 days
 * and what that costs (0051 diet_forecast).
 */
export default async function DietsManagementPage(props: PageProps<"/management/diets">) {
  await requireManagementUser();
  const { t, locale } = await getT();
  const searchParams = await props.searchParams;

  // The fixed 7 / 30-day columns, plus a custom From/To window from the
  // picker when the query string carries one.
  const custom = parseCustomWindow(searchParams);
  const windows = forecastWindows(custom && "window" in custom ? custom.window : null);

  const supabase = await createClient();
  const [typesResult, dietsResult, ...forecastResults] = await Promise.all([
    supabase
      .from("diet_types")
      .select(
        "id, name, unit, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large, notes, stock_on_hand, stock_counted_at, reorder_lead_days",
      )
      .order("name")
      .returns<DietTypeQueryRow[]>(),
    // One row per resident diet is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("resident_diets")
      .select("diet_type_id")
      .returns<{ diet_type_id: string }[]>(),
    ...windows.map(async (window) => {
      const { data, error } = await supabase.rpc("diet_forecast", {
        p_from: window.from,
        p_to: window.to,
      });
      return { data: (data ?? null) as ForecastRow[] | null, error };
    }),
  ]);

  const counts = new Map<string, number>();
  for (const row of dietsResult.data ?? []) {
    counts.set(row.diet_type_id, (counts.get(row.diet_type_id) ?? 0) + 1);
  }
  const forecasts = forecastResults.map(
    (result) => new Map((result.data ?? []).map((row) => [row.diet_type_id, row])),
  );

  // Days-of-stock reads the fixed 30-day column, never a custom window,
  // so it means the same thing whatever the picker shows.
  const rateWindow = windows.findIndex((window) => window.days === STOCK_RATE_DAYS);
  const now = Date.now();

  const dietTypes: DietTypeRow[] = (typesResult.data ?? []).map((type) => {
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
      unit: type.unit,
      notes: type.notes,
      cost_per_unit: Number(type.cost_per_unit),
      daily_qty_small: Number(type.daily_qty_small),
      daily_qty_medium: Number(type.daily_qty_medium),
      daily_qty_large: Number(type.daily_qty_large),
      diet_count: counts.get(type.id) ?? 0,
      forecast,
      stock,
      stockReading: readStock(stock, forecast[rateWindow]?.quantity ?? 0, now),
    };
  });

  const m = t.management.diets;
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
      </div>

      <LargerScreenNotice>
        {typesResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoad}: {typesResult.error.message}
          </p>
        )}
        {dietsResult.error && (
          <p className="text-sm text-danger">
            {m.couldntLoadUsage}: {dietsResult.error.message}
          </p>
        )}
        {forecastError && (
          <p className="text-sm text-danger">
            {m.couldntLoadForecast}: {forecastError.message}
          </p>
        )}

        <section className="flex flex-col gap-4">
          <CreateDietTypeForm />
          <ForecastWindowPicker
            from={custom && "window" in custom ? custom.window.from : ""}
            to={custom && "window" in custom ? custom.window.to : ""}
            invalid={custom != null && "invalid" in custom}
          />
          <DietTypesTable dietTypes={dietTypes} forecastHeadings={forecastHeadings} />
          <p className="text-xs text-muted">{m.table.forecastNote}</p>
          <p className="text-xs text-muted">{t.management.stock.note}</p>
        </section>
      </LargerScreenNotice>
    </main>
  );
}
