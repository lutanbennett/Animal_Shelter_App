"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatDate } from "@/lib/format";
import { formatQuantity } from "@/lib/diets/options";
import type { StockFigures, StockReading } from "@/lib/management/stock";

const inputClass =
  "w-full rounded border border-border bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-primary";

/**
 * The "In stock" cell on Management → Medications and → Diets. Never shows
 * a blank or "0" for an item nobody has counted — null and zero are
 * different answers (0083) — and always says how old the count is.
 */
export function StockOnHandCell({
  figures,
  reading,
  unit,
  counting,
  countValue,
  onCountChange,
  inPurchaseUnit,
}: {
  figures: StockFigures;
  reading: StockReading;
  /** Already translated. */
  unit: string;
  /** The same stock in the item's purchase unit (0118), when it has one. */
  inPurchaseUnit?: { quantity: number; unit: string } | null;
  counting: boolean;
  countValue: string;
  onCountChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const s = t.management.stock;

  if (counting) {
    return (
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            autoFocus
            value={countValue}
            onChange={(e) => onCountChange(e.target.value)}
            placeholder={s.countPlaceholder}
            aria-label={s.countLabel(unit)}
            className={`${inputClass} min-w-28`}
          />
          <span className="text-xs text-muted">{s.countLabel(unit)}</span>
        </div>
      </td>
    );
  }

  return (
    <td className="px-4 py-2">
      {figures.stock_on_hand == null ? (
        <span className="text-muted">{s.notCounted}</span>
      ) : (
        <>
          {figures.stock_on_hand === 0 ? (
            <span className="font-medium text-danger">{s.outOfStock}</span>
          ) : (
            <span className="font-medium text-foreground">
              {s.quantity(formatQuantity(figures.stock_on_hand), unit)}
            </span>
          )}
          {inPurchaseUnit && figures.stock_on_hand > 0 && (
            <>
              <br />
              <span className="text-xs text-muted">
                {t.units.onHand(formatQuantity(inPurchaseUnit.quantity), inPurchaseUnit.unit)}
              </span>
            </>
          )}
          <br />
          <span className="text-xs text-muted">{s.countedAgo(reading.countedDaysAgo ?? 0)}</span>
        </>
      )}
    </td>
  );
}

/**
 * The safety stock of one item (0128) as the "Days of stock" cell edits and
 * shows it. `stored` is in BASE units; the form may take it in one of the
 * item's other units (`unitOptions`), and the server converts on save.
 */
export type SafetyStockEdit = {
  /** As stored, base units. Null = no floor; 0 = a floor of nothing. */
  stored: number | null;
  /** The base unit's label, already translated. */
  baseUnitLabel: string;
  /** The item's other units, by name, for the unit picker. */
  unitOptions: string[];
  /** The text being typed, and the unit it is typed in ("" = base). */
  value: string;
  unit: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
};

/** The "Days of stock" cell: the computed figure, the reorder flag, the lead time and the safety stock. */
export function DaysOfStockCell({
  figures,
  reading,
  editing,
  leadDaysValue,
  onLeadDaysChange,
  safety,
}: {
  figures: StockFigures;
  reading: StockReading;
  /** The row's Edit mode — the lead time is edited with the item's other details. */
  editing: boolean;
  leadDaysValue: string;
  onLeadDaysChange: (value: string) => void;
  safety?: SafetyStockEdit;
}) {
  const { t, locale } = useI18n();
  const s = t.management.stock;

  if (editing) {
    return (
      <td className="px-4 py-2">
        <div className="flex flex-col gap-1">
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={leadDaysValue}
            onChange={(e) => onLeadDaysChange(e.target.value)}
            placeholder={s.leadDaysPlaceholder}
            aria-label={s.leadDaysLabel}
            className={`${inputClass} w-20`}
          />
          <span className="text-xs text-muted">{s.leadDaysLabel}</span>
          {safety && (
            <>
              <div className="mt-1 flex gap-1">
                <input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={safety.value}
                  onChange={(e) => safety.onValueChange(e.target.value)}
                  placeholder={s.safetyPlaceholder}
                  aria-label={s.safetyLabel}
                  className={`${inputClass} w-24`}
                />
                <select
                  value={safety.unit}
                  onChange={(e) => safety.onUnitChange(e.target.value)}
                  aria-label={s.safetyUnitLabel}
                  className={`${inputClass} w-auto`}
                >
                  <option value="">{safety.baseUnitLabel}</option>
                  {safety.unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-xs text-muted">{s.safetyLabel}</span>
            </>
          )}
        </div>
      </td>
    );
  }

  let main;
  switch (reading.state) {
    case "notCounted":
      main = <span className="text-muted">—</span>;
      break;
    case "out":
      main = <span className="font-medium text-danger">{s.outOfStock}</span>;
      break;
    case "runDown":
      main = <span className="font-medium text-danger">{s.runDown}</span>;
      break;
    case "notUsed":
      main = <span className="text-muted">{s.notUsed}</span>;
      break;
    case "days":
      main = (
        <>
          <span className="font-medium text-foreground">{s.daysLeft(reading.daysLeft ?? 0)}</span>
          <br />
          <span className="text-xs text-muted">
            {s.runsOut(formatDate(reading.runsOutOn, locale))}
          </span>
        </>
      );
      break;
  }

  return (
    <td className="px-4 py-2">
      {main}
      {safety && safety.stored != null && (
        <div className="mt-1 text-xs text-muted">
          {s.safetyShown(formatQuantity(safety.stored), safety.baseUnitLabel)}
        </div>
      )}
      {(reading.reorder || figures.reorder_lead_days != null) && (
        <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted">
          {reading.reorder && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 font-medium text-foreground">
              {s.reorder}
            </span>
          )}
          {figures.reorder_lead_days != null && (
            <span>{s.leadTime(figures.reorder_lead_days)}</span>
          )}
        </div>
      )}
    </td>
  );
}
