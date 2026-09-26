import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/get-t";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { canStocktake, type StocktakeItem, type StocktakeKind } from "@/lib/management/stocktake";
import { StocktakeSheet } from "./StocktakeSheet";

type StockRow = {
  id: string;
  name: string;
  unit: string;
  // numeric: PostgREST can hand it back as a string.
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
};

/**
 * /stocktake — count every medication and diet in one go, and save once
 * (backlog, "Stocktake page: count everything in one go"). Outside
 * /management because the people who walk the shelves are staff and
 * volunteers (0091); the single stock cell on the Management tables stays
 * management-only.
 *
 * Name order for now: the backlog asks for the cupboard's own order once the
 * shelter can describe it.
 */
export default async function StocktakePage(props: PageProps<"/stocktake">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await supabase.rpc("current_user_role");
  if (!canStocktake(role)) redirect("/");

  const { t } = await getT();
  const searchParams = await props.searchParams;
  const initialTab: StocktakeKind = searchParams.tab === "diets" ? "diet" : "medication";

  const [medicationResult, dietResult] = await Promise.all([
    supabase
      .from("medication")
      .select("id, name, unit:dose_unit, stock_on_hand, stock_counted_at")
      .order("name")
      .returns<StockRow[]>(),
    supabase
      .from("diet_types")
      .select("id, name, unit, stock_on_hand, stock_counted_at")
      .order("name")
      .returns<StockRow[]>(),
  ]);

  const toItem =
    (unitLabel: (unit: string) => string) =>
    (row: StockRow): StocktakeItem => ({
      id: row.id,
      name: row.name,
      unit: unitLabel(row.unit),
      lastCount: row.stock_on_hand == null ? null : Number(row.stock_on_hand),
      lastCountedAt: row.stock_counted_at,
    });

  const s = t.stocktake;
  const loadError = medicationResult.error ?? dietResult.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
      </div>

      {loadError && (
        <p className="text-sm text-danger">
          {s.couldntLoad}: {loadError.message}
        </p>
      )}

      <StocktakeSheet
        initialTab={initialTab}
        items={{
          medication: (medicationResult.data ?? []).map(toItem((u) => doseUnitLabel(t, u))),
          diet: (dietResult.data ?? []).map(toItem((u) => dietUnitLabel(t, u))),
        }}
      />
    </main>
  );
}
