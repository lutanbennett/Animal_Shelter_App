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
}: {
  figures: StockFigures;
  reading: StockReading;
  /** Already translated. */
  unit: string;
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
          <br />
          <span className="text-xs text-muted">{s.countedAgo(reading.countedDaysAgo ?? 0)}</span>
        </>
      )}
    </td>
  );
}

/** The "Days of stock" cell: the computed figure, the reorder flag and the lead time. */
export function DaysOfStockCell({
  figures,
  reading,
  editing,
  leadDaysValue,
  onLeadDaysChange,
}: {
  figures: StockFigures;
  reading: StockReading;
  /** The row's Edit mode — the lead time is edited with the item's other details. */
  editing: boolean;
  leadDaysValue: string;
  onLeadDaysChange: (value: string) => void;
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
