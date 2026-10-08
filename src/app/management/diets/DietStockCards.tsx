"use client";

import { ActionButton } from "@/components/ActionButton";
import { useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBaht, formatUnitCost, parseUnitCost, UNIT_COST_DECIMALS } from "@/lib/format";
import { dietUnitLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import {
  parseLeadDays,
  parseSafetyStock,
  parseStockCount,
  type StockFigures,
  type StockReading,
} from "@/lib/management/stock";
import { DaysOfStockCell, StockOnHandCell } from "@/components/StockCells";
import { ACTION_ICONS } from "@/components/hub-icons";
import { updateDietStockSettings, updateDietTypeStock } from "./actions";

export type DietStockRow = {
  id: string;
  name: string;
  /** The shelter's standard diet (0087), shown as a badge; changed under Settings → Diets. */
  is_standard: boolean;
  unit: string;
  /** Baht per unit, up to 4 places (0161). Not null: 0 until priced. */
  cost_per_unit: number;
  /**
   * One entry per forecast window (same order as the page's forecastHeadings):
   * residents fed at the shelter, the quantity in `unit` and the cost in
   * baht (0051 diet_forecast).
   */
  forecast: { residents: number; quantity: number; cost: number }[];
  /** Stock on hand, when it was counted and the reorder lead time (0083). */
  stock: StockFigures;
  /** Days-of-stock, computed on the server from the 30-day forecast. */
  stockReading: StockReading;
  /** Stock on hand in the purchase unit (0118); null without one. */
  purchaseUnit: { quantity: number; unit: string } | null;
  /** Safety stock in base units; null = no floor, 0 = a floor of nothing (0128). */
  safetyStock: number | null;
  /** The item's other units by name, for typing the safety stock in one. */
  unitOptions: string[];
};

const inputClass =
  "w-full rounded border border-border bg-background px-3 py-2 text-base text-foreground outline-none focus:border-primary md:text-sm";

/**
 * Management → Diet stock, one card per diet: built for the phone. Count,
 * price and reorder. The name, unit, sizes and the standard diet are
 * changed under Settings → Diets.
 */
function DietCard({ dietType, forecastHeadings }: { dietType: DietStockRow; forecastHeadings: string[] }) {
  const { t, locale } = useI18n();
  const m = t.management.diets;
  const s = t.management.stock;
  const unit = dietUnitLabel(t, dietType.unit);
  const [mode, setMode] = useState<"view" | "edit" | "count">("view");
  const [cost, setCost] = useState("");
  const [leadDays, setLeadDays] = useState("");
  const [safetyValue, setSafetyValue] = useState("");
  const [safetyUnit, setSafetyUnit] = useState("");
  const [count, setCount] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Seeded when opened, not at mount: the card re-renders with the saved
  // figures, and useState would keep the old ones.
  function openEdit() {
    setCost(String(dietType.cost_per_unit));
    setLeadDays(dietType.stock.reorder_lead_days?.toString() ?? "");
    setSafetyValue(dietType.safetyStock?.toString() ?? "");
    setSafetyUnit("");
    setMessage(null);
    setMode("edit");
  }

  function openCount() {
    setCount(dietType.stock.stock_on_hand?.toString() ?? "");
    setMessage(null);
    setMode("count");
  }

  function handleSave() {
    if (!parseUnitCost(cost).ok) {
      setMessage({ type: "error", text: m.errors.costInvalid });
      return;
    }
    if (!parseLeadDays(leadDays).ok) {
      setMessage({ type: "error", text: s.errors.leadDaysInvalid });
      return;
    }
    if (!parseSafetyStock(safetyValue).ok) {
      setMessage({ type: "error", text: s.errors.safetyInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateDietStockSettings(dietType.id, {
        costPerUnit: cost,
        reorderLeadDays: leadDays,
        safetyStock: safetyValue,
        safetyUnit,
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  function handleCount() {
    if (!parseStockCount(count).ok) {
      setMessage({ type: "error", text: s.errors.countInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateDietTypeStock(dietType.id, count);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMode("view");
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded border border-border bg-surface p-4">
      <div className="min-w-0">
        <h2 className="break-words font-semibold text-foreground">
          {dietType.name}
          {dietType.is_standard && (
            <span
              title={m.standard.badgeHint}
              className="ml-2 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 align-middle text-xs font-medium text-foreground"
            >
              <span aria-hidden>★</span>
              {m.standard.badge}
            </span>
          )}
        </h2>
        <p className="text-sm text-muted">{m.stockCard.unit(unit)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted">{s.stockHeading}</span>
          <StockOnHandCell
            as="div"
            figures={dietType.stock}
            reading={dietType.stockReading}
            unit={unit}
            counting={mode === "count"}
            countValue={count}
            onCountChange={setCount}
            inPurchaseUnit={dietType.purchaseUnit}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-medium text-muted">{s.daysHeading}</span>
          <DaysOfStockCell
            as="div"
            figures={dietType.stock}
            reading={dietType.stockReading}
            editing={mode === "edit"}
            leadDaysValue={leadDays}
            onLeadDaysChange={setLeadDays}
            safety={{
              stored: dietType.safetyStock,
              baseUnitLabel: unit,
              unitOptions: dietType.unitOptions,
              value: safetyValue,
              unit: safetyUnit,
              onValueChange: setSafetyValue,
              onUnitChange: setSafetyUnit,
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-xs font-medium text-muted">{m.stockCard.cost}</span>
        {mode === "edit" ? (
          <label className="flex flex-col gap-1">
            <input
              type="number"
              min={0}
              step={10 ** -UNIT_COST_DECIMALS}
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={inputClass}
            />
            <span className="text-xs text-muted">{m.stockCard.costHint(unit)}</span>
          </label>
        ) : (
          <span className="text-foreground">{m.stockCard.costPerUnit(formatUnitCost(dietType.cost_per_unit, locale), unit)}</span>
        )}
      </div>

      <dl className="flex flex-col gap-1 text-sm">
        {dietType.forecast.map((window, i) => (
          <div key={i} className="flex flex-wrap justify-between gap-x-3">
            <dt className="text-muted">{forecastHeadings[i]}</dt>
            <dd className="text-right">
              {window.residents > 0 ? (
                <>
                  <span className="font-medium text-foreground">
                    {m.table.forecastQuantity(formatQuantity(window.quantity), unit)}
                  </span>{" "}
                  <span className="text-xs text-muted">
                    {formatBaht(window.cost, locale)} · {m.table.forecastDetail(window.residents)}
                  </span>
                </>
              ) : (
                <span className="text-muted">{m.table.noneDue}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap gap-2">
        {mode === "view" ? (
          <>
            <ActionButton icon={ACTION_ICONS.count} variant="primary" disabled={isPending} onClick={openCount}>
              {s.count}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.edit} disabled={isPending} onClick={openEdit}>
              {m.stockCard.editPrice}
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton
              icon={ACTION_ICONS.save}
              variant="primary"
              disabled={isPending}
              onClick={mode === "edit" ? handleSave : handleCount}
            >
              {t.common.save}
            </ActionButton>
            <ActionButton icon={ACTION_ICONS.clear} disabled={isPending} onClick={() => setMode("view")}>
              {t.common.cancel}
            </ActionButton>
          </>
        )}
      </div>

      {message && (
        <p role="status" className={`text-sm ${message.type === "error" ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </li>
  );
}

export function DietStockCards({
  dietTypes,
  forecastHeadings,
}: {
  dietTypes: DietStockRow[];
  /** One heading per forecast window, in the order the rows' forecast arrays use. */
  forecastHeadings: string[];
}) {
  const { t, locale } = useI18n();
  const m = t.management.diets;
  if (dietTypes.length === 0) return <p className="text-sm text-muted">{m.table.noDiets}</p>;
  const totals = forecastHeadings.map((_, i) =>
    dietTypes.reduce((sum, row) => sum + (row.forecast[i]?.cost ?? 0), 0),
  );
  return (
    <div className="flex flex-col gap-3">
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {dietTypes.map((dietType) => (
          <DietCard key={dietType.id} dietType={dietType} forecastHeadings={forecastHeadings} />
        ))}
      </ul>
      <dl className="flex flex-col gap-1 rounded border border-border bg-surface p-4 text-sm">
        <dt className="font-medium text-foreground">{m.table.forecastTotal}</dt>
        {forecastHeadings.map((heading, i) => (
          <dd key={heading} className="flex flex-wrap justify-between gap-x-3">
            <span className="text-muted">{heading}</span>
            <span className="font-medium text-foreground">{formatBaht(totals[i], locale)}</span>
          </dd>
        ))}
      </dl>
    </div>
  );
}
