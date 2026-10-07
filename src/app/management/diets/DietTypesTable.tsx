"use client";

import { ActionButton } from "@/components/ActionButton";
import { useConfirm } from "@/components/ConfirmProvider";
import { Fragment, useState, useTransition } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBaht } from "@/lib/format";
import { DIET_UNITS, dietUnitLabel } from "@/lib/i18n/enum-labels";
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
import { RowActionButton } from "@/components/RowAction";
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
  /** Stock on hand in the purchase unit (0118); null without one. */
  purchaseUnit: { quantity: number; unit: string } | null;
  /** Safety stock in base units; null = no floor, 0 = a floor of nothing (0128). */
  safetyStock: number | null;
  /** The item's other units by name, for typing the safety stock in one. */
  unitOptions: string[];
};

/** Columns besides the forecast windows: name, unit, cost, daily, stock, days, records, actions. */
const FIXED_COLUMNS = 8;

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

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
    safetyStock: row.safetyStock?.toString() ?? "",
    safetyUnit: "",
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
  const confirm = useConfirm();
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

  function handleSave() {
    if (!parseLeadDays(fields.reorderLeadDays).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.leadDaysInvalid });
      return;
    }
    if (!parseSafetyStock(fields.safetyStock).ok) {
      setMessage({ type: "error", text: t.management.stock.errors.safetyInvalid });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await updateDietType(dietType.id, fields);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setEditing(false);
      setMessage({ type: "success", text: t.common.saved });
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
      const result = await updateDietTypeStock(dietType.id, count);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setCounting(false);
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleMakeStandard() {
    if (!await confirm({ body: m.standard.confirm(dietType.name, standardName) })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await setStandardDietType(dietType.id);
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: t.common.saved });
    });
  }

  async function handleDelete() {
    if (!await confirm({ body: m.deleteConfirm(dietType.name), confirmLabel: t.common.delete })) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteDietType(dietType.id);
      if (!result.ok) setMessage({ type: "error", text: result.error });
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
          inPurchaseUnit={dietType.purchaseUnit}
        />
        <DaysOfStockCell
          figures={dietType.stock}
          reading={dietType.stockReading}
          editing={editing}
          leadDaysValue={fields.reorderLeadDays}
          onLeadDaysChange={set("reorderLeadDays")}
          safety={{
            stored: dietType.safetyStock,
            baseUnitLabel: unit,
            unitOptions: dietType.unitOptions,
            value: fields.safetyStock,
            unit: fields.safetyUnit,
            onValueChange: set("safetyStock"),
            onUnitChange: set("safetyUnit"),
          }}
        />
        <td className="px-4 py-2 text-muted">{m.table.dietCount(dietType.diet_count)}</td>
        <td className="px-4 py-2">
          <div className="flex flex-wrap items-center gap-2 md:min-w-[11rem]">
            {editing || counting ? (
              <>
                <ActionButton icon={ACTION_ICONS.save} variant="primary" compact disabled={isPending} onClick={editing ? handleSave : handleCount}>
                  {t.common.save}
                </ActionButton>
                <ActionButton icon={ACTION_ICONS.clear} compact disabled={isPending} onClick={reset}>
                  {t.common.cancel}
                </ActionButton>
              </>
            ) : (
              <>
                <RowActionButton
                  onClick={() => setEditing(true)}
                  label={t.common.edit}
                  subject={dietType.name}
                  icon={ACTION_ICONS.edit}
                />
                <RowActionButton
                  onClick={openCount}
                  label={t.management.stock.count}
                  subject={dietType.name}
                  icon={ACTION_ICONS.count}
                />
                {!dietType.is_standard && (
                  <RowActionButton
                    disabled={isPending}
                    onClick={handleMakeStandard}
                    label={m.standard.make}
                    subject={dietType.name}
                    icon={ACTION_ICONS.makeStandard}
                  />
                )}
                <RowActionButton
                  disabled={isPending || dietType.diet_count > 0}
                  onClick={handleDelete}
                  label={t.common.delete}
                  hint={dietType.diet_count > 0 ? m.errors.hasDiets(dietType.diet_count) : undefined}
                  subject={dietType.name}
                  icon={ACTION_ICONS.delete}
                  tone="danger"
                />
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
