"use client";

import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBaht } from "@/lib/format";
import { DIET_UNITS, dietUnitLabel } from "@/lib/i18n/enum-labels";
import { formatQuantity } from "@/lib/diets/options";
import {
  parseLeadDays,
  parseStockCount,
  type StockFigures,
  type StockReading,
} from "@/lib/management/stock";
import { DaysOfStockCell, StockOnHandCell } from "@/components/StockCells";
import {
  deleteDietType,
  setStandardDietType,
  updateDietType,
  updateDietTypeStock,
  type DietTypeFields,
} from "./actions";

export type DietTypeRow = {
  id: string;
  name: string;
  /** The shelter's standard diet (0087); at most one row, possibly none. */
  is_standard: boolean;
  unit: string;
  cost_per_unit: number;
  daily_qty_small: number;
  daily_qty_medium: number;
  daily_qty_large: number;
  notes: string | null;
  /** Every resident_diets row ever written for it — any at all blocks delete. */
  diet_count: number;
  /**
   * One entry per forecast window (same order as the table's forecastHeadings):
   * residents fed at the shelter, the quantity in `unit` and the cost in
   * baht (0051 diet_forecast).
   */
  forecast: { residents: number; quantity: number; cost: number }[];
  /** Stock on hand, when it was counted and the reorder lead time (0083). */
  stock: StockFigures;
  /** Days-of-stock, computed on the server from the 30-day forecast. */
  stockReading: StockReading;
};

/** Columns besides the forecast windows: name, unit, cost, daily, stock, days, records, actions. */
const FIXED_COLUMNS = 8;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

const smallButton =
  "rounded border border-border px-2 py-1 text-xs font-medium text-muted hover:bg-surface-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

function fieldsOf(row: DietTypeRow): DietTypeFields {
  return {
    name: row.name,
    unit: row.unit,
    costPerUnit: String(row.cost_per_unit),
    dailyQtySmall: formatQuantity(row.daily_qty_small),
    dailyQtyMedium: formatQuantity(row.daily_qty_medium),
    dailyQtyLarge: formatQuantity(row.daily_qty_large),
    notes: row.notes ?? "",
    reorderLeadDays: row.stock.reorder_lead_days?.toString() ?? "",
  };
}

function DietTypeRowItem({
  dietType,
  standardName,
}: {
  dietType: DietTypeRow;
  /** The current standard's name, for the confirm; null when none is flagged. */
  standardName: string | null;
}) {
  const { t, locale } = useI18n();
  const m = t.management.diets;
  const [fields, setFields] = useState<DietTypeFields>(() => fieldsOf(dietType));
  const [editing, setEditing] = useState(false);
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const set = (key: keyof DietTypeFields) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  function reset() {
    setFields(fieldsOf(dietType));
    setEditing(false);
    setCounting(false);
  }

  function fail(err: unknown, fallback: string) {
    setMessage({ type: "error", text: err instanceof Error ? err.message : fallback });
  }

  function handleSave() {
    if (!parseLeadDays(fields.reorderLeadDays).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.leadDaysInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await updateDietType(dietType.id, fields);
        setEditing(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function openCount() {
    // Seeded when opened, not at mount: the row re-renders with the saved
    // count, and useState would keep the old one.
    setCount(dietType.stock.stock_on_hand?.toString() ?? "");
    setMessage(null);
    setCounting(true);
  }

  function handleCount() {
    if (!parseStockCount(count).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.countInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        await updateDietTypeStock(dietType.id, count);
        setCounting(false);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function handleMakeStandard() {
    if (!window.confirm(m.standard.confirm(dietType.name, standardName))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await setStandardDietType(dietType.id);
        setMessage({ type: "success", text: t.common.saved });
      } catch (err) {
        fail(err, t.common.failedToSave);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(m.deleteConfirm(dietType.name))) return;
    setMessage(null);
    startTransition(async () => {
      try {
        await deleteDietType(dietType.id);
      } catch (err) {
        fail(err, t.common.failedToDelete);
      }
    });
  }

  const unit = dietUnitLabel(t, dietType.unit);
  const quantityInput = (key: "dailyQtySmall" | "dailyQtyMedium" | "dailyQtyLarge") => (
    <input
      value={fields[key]}
      onChange={(e) => set(key)(e.target.value)}
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      className={`${inputClass} w-20`}
    />
  );

  return (
    <Fragment>
      <tr className="align-top hover:bg-surface-hover">
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex flex-col gap-1">
              <input
                value={fields.name}
                onChange={(e) => set("name")(e.target.value)}
                className={`${inputClass} min-w-48`}
              />
              <input
                value={fields.notes}
                onChange={(e) => set("notes")(e.target.value)}
                placeholder={m.createForm.notes}
                className={`${inputClass} min-w-48`}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
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
              </span>
              {dietType.notes && <span className="text-xs text-muted">{dietType.notes}</span>}
            </div>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <select
              value={fields.unit}
              onChange={(e) => set("unit")(e.target.value)}
              className={`${inputClass} min-w-24`}
            >
              {DIET_UNITS.map((u) => (
                <option key={u} value={u}>
                  {dietUnitLabel(t, u)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-muted">{unit}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <input
              value={fields.costPerUnit}
              onChange={(e) => set("costPerUnit")(e.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`${inputClass} w-24`}
            />
          ) : (
            <span className="text-muted">{formatBaht(dietType.cost_per_unit, locale)}</span>
          )}
        </td>
        <td className="px-4 py-2">
          {editing ? (
            <div className="flex gap-1">
              {quantityInput("dailyQtySmall")}
              {quantityInput("dailyQtyMedium")}
              {quantityInput("dailyQtyLarge")}
            </div>
          ) : (
            <span className="text-muted">
              {[dietType.daily_qty_small, dietType.daily_qty_medium, dietType.daily_qty_large]
                .map(formatQuantity)
                .join(" / ")}{" "}
              {unit}
            </span>
          )}
        </td>
        {dietType.forecast.map((window, i) => (
          <td key={i} className="px-4 py-2 text-muted">
            {window.residents > 0 ? (
              <>
                <span className="font-medium text-foreground">
                  {m.table.forecastQuantity(formatQuantity(window.quantity), unit)}
                </span>
                <br />
                <span className="text-xs">
                  {formatBaht(window.cost, locale)} · {m.table.forecastDetail(window.residents)}
                </span>
              </>
            ) : (
              m.table.noneDue
            )}
          </td>
        ))}
        <StockOnHandCell
          figures={dietType.stock}
          reading={dietType.stockReading}
          unit={unit}
          counting={counting}
          countValue={count}
          onCountChange={setCount}
        />
        <DaysOfStockCell
          figures={dietType.stock}
          reading={dietType.stockReading}
          editing={editing}
          leadDaysValue={fields.reorderLeadDays}
          onLeadDaysChange={set("reorderLeadDays")}
        />
        <td className="px-4 py-2 text-muted">{m.table.dietCount(dietType.diet_count)}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {editing || counting ? (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={editing ? handleSave : handleCount}
                  className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
                >
                  {t.common.save}
                </button>
                <button type="button" disabled={isPending} onClick={reset} className={smallButton}>
                  {t.common.cancel}
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setEditing(true)} className={smallButton}>
                  {t.common.edit}
                </button>
                <button type="button" onClick={openCount} className={smallButton}>
                  {t.management.stock.count}
                </button>
                {!dietType.is_standard && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleMakeStandard}
                    className={smallButton}
                  >
                    {m.standard.make}
                  </button>
                )}
                <button
                  type="button"
                  disabled={isPending || dietType.diet_count > 0}
                  title={dietType.diet_count > 0 ? m.errors.hasDiets(dietType.diet_count) : undefined}
                  onClick={handleDelete}
                  className="rounded border border-danger/40 px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t.common.delete}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
      {message && (
        <tr>
          <td
            colSpan={FIXED_COLUMNS + dietType.forecast.length}
            className={`px-4 pb-2 text-xs ${message.type === "error" ? "text-danger" : "text-success"}`}
          >
            {message.text}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

export function DietTypesTable({
  dietTypes,
  forecastHeadings,
}: {
  dietTypes: DietTypeRow[];
  /** One column heading per forecast window, in the order the rows' forecast arrays use. */
  forecastHeadings: string[];
}) {
  const { t, locale } = useI18n();
  const m = t.management.diets;
  const standardName = dietTypes.find((row) => row.is_standard)?.name ?? null;
  const totals = forecastHeadings.map((_, i) =>
    dietTypes.reduce((sum, row) => sum + (row.forecast[i]?.cost ?? 0), 0),
  );

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-muted">
          <tr>
            <th className="px-4 py-2 font-medium">{m.table.name}</th>
            <th className="px-4 py-2 font-medium">{m.table.unit}</th>
            <th className="px-4 py-2 font-medium">{m.table.cost}</th>
            <th className="px-4 py-2 font-medium">{m.table.dailyQuantities}</th>
            {forecastHeadings.map((heading) => (
              <th key={heading} className="px-4 py-2 font-medium">
                {heading}
              </th>
            ))}
            <th className="px-4 py-2 font-medium">{t.management.stock.stockHeading}</th>
            <th className="px-4 py-2 font-medium">{t.management.stock.daysHeading}</th>
            <th className="px-4 py-2 font-medium">{m.table.residents}</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {dietTypes.map((dietType) => (
            <DietTypeRowItem key={dietType.id} dietType={dietType} standardName={standardName} />
          ))}
          {dietTypes.length === 0 && (
            <tr>
              <td colSpan={FIXED_COLUMNS + forecastHeadings.length} className="px-4 py-6 text-center text-muted">
                {m.table.noDiets}
              </td>
            </tr>
          )}
        </tbody>
        {dietTypes.length > 0 && (
          <tfoot className="bg-surface text-muted">
            <tr>
              <td colSpan={4} className="px-4 py-2 font-medium">
                {m.table.forecastTotal}
              </td>
              {totals.map((total, i) => (
                <td key={i} className="px-4 py-2 font-medium text-foreground">
                  {formatBaht(total, locale)}
                </td>
              ))}
              <td colSpan={4} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
