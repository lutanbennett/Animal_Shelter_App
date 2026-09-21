import { requireManagementUser } from "@/lib/auth/require-management";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { CreateDietTypeForm } from "./CreateDietTypeForm";
import { DietTypesTable, type DietTypeRow } from "./DietTypesTable";

type ForecastRow = {
  diet_type_id: string;
  diet_count: number;
  resident_count: number;
  quantity: number | string | null;
  cost: number | string | null;
};

/** The forecast windows the table shows, in days from today inclusive. */
const FORECAST_DAYS = [7, 30] as const;

function isoDatePlus(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Management → Diets: the food product list and the food forecast, the
 * shape of Management → Medications. Each row is a diet type with its
 * cost and per-size daily quantities; the forecast columns are what the
 * residents living at the shelter will eat of it in the next 7 / 30 days
 * and what that costs (0051 diet_forecast).
 */
export default async function DietsManagementPage() {
  await requireManagementUser();
  const { t } = await getT();

  const supabase = await createClient();
  const today = isoDatePlus(0);
  const [typesResult, dietsResult, ...forecastResults] = await Promise.all([
    supabase
      .from("diet_types")
      .select("id, name, unit, cost_per_unit, daily_qty_small, daily_qty_medium, daily_qty_large, notes")
      .order("name")
      .returns<Omit<DietTypeRow, "diet_count" | "forecast">[]>(),
    // One row per resident diet is cheap at shelter scale and gives the
    // reference counts that gate the delete buttons.
    supabase
      .from("resident_diets")
      .select("diet_type_id")
      .returns<{ diet_type_id: string }[]>(),
    ...FORECAST_DAYS.map(async (days) => {
      const { data, error } = await supabase.rpc("diet_forecast", {
        p_from: today,
        p_to: isoDatePlus(days - 1),
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

  const dietTypes: DietTypeRow[] = (typesResult.data ?? []).map((type) => ({
    ...type,
    cost_per_unit: Number(type.cost_per_unit),
    daily_qty_small: Number(type.daily_qty_small),
    daily_qty_medium: Number(type.daily_qty_medium),
    daily_qty_large: Number(type.daily_qty_large),
    diet_count: counts.get(type.id) ?? 0,
    forecast: forecasts.map((byType) => {
      const row = byType.get(type.id);
      return {
        residents: row?.resident_count ?? 0,
        quantity: Number(row?.quantity ?? 0),
        cost: Number(row?.cost ?? 0),
      };
    }),
  }));

  const m = t.management.diets;
  const forecastError = forecastResults.find((r) => r.error)?.error;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{m.title}</h1>
        <p className="text-sm text-muted">{m.subtitle}</p>
      </div>

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
        <DietTypesTable dietTypes={dietTypes} forecastDays={[...FORECAST_DAYS]} />
        <p className="text-xs text-muted">{m.table.forecastNote}</p>
      </section>
    </main>
  );
}
