import Link from "next/link";
import { Truck } from "lucide-react";
import { requirePermission } from "@/lib/permissions/require";
import { can } from "@/lib/permissions/can";
import { getT } from "@/lib/i18n/get-t";
import { localLabel } from "@/lib/translations/labels";
import { dietUnitLabel, doseUnitLabel } from "@/lib/i18n/enum-labels";
import { type StocktakeItem, type StocktakeKind } from "@/lib/management/stocktake";
import { CONVERSION_COLUMNS, groupConversions, type ConversionRow } from "@/lib/units";
import { StocktakeSheet } from "./StocktakeSheet";

type StockRow = {
  id: string;
  name: string;
  name_th: string | null;
  unit: string;
  // numeric: PostgREST can hand it back as a string.
  stock_on_hand: number | string | null;
  stock_counted_at: string | null;
  /** Medications only (0129); diet_types has the column but nothing reads it. */
  label_drive_file_id?: string | null;
};

/**
 * /stocktake — count every medication and diet in one go, and save once
 * (backlog, "Stocktake page: count everything in one go"). Outside
 * /management because the people who walk the shelves are staff and
 * volunteers (0091); the single stock cell on the Management tables stays
 * management-only.
 *
 * In the cupboard's own order (0161 sort_order, set under "Cupboard order" on
 * Management → Medication stock and → Diet stock), name breaking a tie, so
 * whoever counts walks the shelves once.
 */
export default async function StocktakePage(props: PageProps<"/stocktake">) {
  const { supabase, perms } = await requirePermission("stock.count");

  const { t, locale } = await getT();
  const searchParams = await props.searchParams;
  const initialTab: StocktakeKind = searchParams.tab === "diets" ? "diet" : "medication";

  const [medicationResult, dietResult, conversionsResult] = await Promise.all([
    supabase
      .from("stock_medications")
      .select("id, name, name_th, unit:dose_unit, stock_on_hand, stock_counted_at, label_drive_file_id")
      .order("sort_order", { nullsFirst: false })
      .order("name")
      .returns<StockRow[]>(),
    supabase
      .from("stock_diet_types")
      .select("id, name, name_th, unit, stock_on_hand, stock_counted_at")
      .order("sort_order", { nullsFirst: false })
      .order("name")
      .returns<StockRow[]>(),
    supabase.from("item_unit_conversions").select(CONVERSION_COLUMNS).returns<ConversionRow[]>(),
  ]);
  const conversions = groupConversions(conversionsResult.data ?? []);

  const toItem =
    (unitLabel: (unit: string) => string) =>
    (row: StockRow): StocktakeItem => ({
      id: row.id,
      name: localLabel(locale, row.name, row.name_th),
      unit: unitLabel(row.unit),
      lastCount: row.stock_on_hand == null ? null : Number(row.stock_on_hand),
      lastCountedAt: row.stock_counted_at,
      labelFileId: row.label_drive_file_id ?? null,
      conversions: conversions[row.id] ?? [],
    });

  const s = t.stocktake;
  const loadError = medicationResult.error ?? dietResult.error ?? conversionsResult.error;

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{s.title}</h1>
        <p className="text-sm text-muted">{s.subtitle}</p>
        {/* Volunteers count but don't record deliveries (0096). */}
        {can(perms, "stock.delivery") && (
          <Link
            href={initialTab === "diet" ? "/deliveries?tab=diets" : "/deliveries"}
            className="mt-2 inline-flex min-h-12 items-center gap-2 rounded border border-border bg-surface px-4 text-base font-medium text-foreground hover:bg-surface-hover"
          >
            <Truck aria-hidden="true" className="h-5 w-5" />
            {s.deliveriesLink}
          </Link>
        )}
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
