"use client";

import { Minus, Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localLabel } from "@/lib/translations/labels";
import { formatQuantity } from "@/lib/diets/options";
import type { Locale } from "@/lib/i18n/locales";
import {
  MAX_PER_SIZE,
  OPEN_FRACTION,
  OPEN_LEVELS,
  countLines,
  linesBase,
  openChoices,
  sizeRows,
  touchedSizes,
  type CountLine,
  type OpenBag,
  type OpenLevel,
  type RowEntry,
  type StocktakeItem,
} from "@/lib/management/stocktake";

/** A size (the English unit name a count stamps) as the reader sees it; "" is loose stock in the base unit. */
export function sizeLabel(
  locale: Locale,
  item: StocktakeItem,
  unit: string,
  loose: (unit: string) => string,
): string {
  if (unit === "") return loose(item.unit);
  const conversion = item.conversions?.find((c) => c.unit === unit);
  return localLabel(locale, unit, conversion?.unitTh);
}

/**
 * Counting one item in the sizes it comes in: one whole-number row per size
 * with big + and − buttons, a way to say a bag is already open, and the total
 * written out. Nobody types a decimal or works out a weight. Used by the
 * list rows and the phone cards, so the two can never count differently.
 *
 * Controlled: `entry` is the row, `onChange` gets the whole next row. A size
 * the person has not touched has no key at all (left alone); a 0 they chose is
 * a key at 0 (none of this size).
 */
export function SizeCounter({
  item,
  entry,
  onChange,
  big,
}: {
  item: StocktakeItem;
  entry: RowEntry | undefined;
  onChange: (next: RowEntry) => void;
  /** The phone cards: taller rows. */
  big?: boolean;
}) {
  const { t, locale } = useI18n();
  const z = t.stocktake.sizes;
  const rows = sizeRows(item);
  const choices = openChoices(item);
  const sizes = entry?.sizes ?? {};
  const open = entry?.open ?? [];
  const touched = touchedSizes(entry);
  const label = (unit: string) => sizeLabel(locale, item, unit, z.loose);
  const h = big ? "min-h-14" : "min-h-12";

  const emit = (next: { sizes?: Record<string, number>; open?: OpenBag[] }) =>
    onChange({ value: "", same: false, unit: entry?.unit, sizes: next.sizes ?? sizes, open: next.open ?? open });
  const setSize = (unit: string, n: number) => {
    const clamped = Math.min(Math.max(Math.trunc(n), 0), MAX_PER_SIZE);
    emit({ sizes: { ...sizes, [unit]: clamped } });
  };
  const setOpen = (index: number, bag: OpenBag) => emit({ open: open.map((b, i) => (i === index ? bag : b)) });

  const lines = countLines(entry);
  const total = linesBase(item, lines);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{z.hint}</p>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => {
          const name = label(row.key);
          const n = sizes[row.key];
          return (
            <li key={row.key || "loose"} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 break-words text-base font-medium text-foreground">{name}</span>
              <button
                type="button"
                aria-label={z.fewer(name)}
                disabled={!n}
                onClick={() => setSize(row.key, (n ?? 0) - 1)}
                className={`${h} inline-flex w-14 shrink-0 items-center justify-center rounded border border-border bg-surface text-foreground disabled:opacity-40`}
              >
                <Minus aria-hidden="true" className="h-5 w-5" />
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                aria-label={z.howMany(item.name, name)}
                value={n == null ? "" : String(n)}
                placeholder="0"
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  if (digits === "") {
                    const rest = { ...sizes };
                    delete rest[row.key];
                    emit({ sizes: rest });
                  } else {
                    setSize(row.key, Number(digits));
                  }
                }}
                className={`${h} w-16 shrink-0 rounded border border-border bg-background px-1 text-center text-xl text-foreground outline-none focus:border-primary`}
              />
              <button
                type="button"
                aria-label={z.more(name)}
                onClick={() => setSize(row.key, (n ?? 0) + 1)}
                className={`${h} inline-flex w-14 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground`}
              >
                <Plus aria-hidden="true" className="h-5 w-5" />
              </button>
            </li>
          );
        })}
      </ul>

      {choices.length > 0 && (
        <fieldset className="flex flex-col gap-2 rounded border border-warning/40 bg-warning/10 p-3">
          <legend className="px-1 text-base font-semibold text-foreground">{z.openTitle}</legend>
          <p className="text-sm text-foreground">{z.openWarn}</p>
          {open.map((bag, index) => (
            <div key={index} className="flex flex-col gap-2 rounded border border-border bg-background p-2">
              <div className="flex items-center gap-2">
                <select
                  aria-label={z.openWhich}
                  value={bag.unit}
                  onChange={(e) => setOpen(index, { ...bag, unit: e.target.value })}
                  className={`${h} min-w-0 flex-1 rounded border border-border bg-background px-2 text-base text-foreground`}
                >
                  {choices.map((c) => (
                    <option key={c.key} value={c.key}>
                      {label(c.key)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label={z.openRemove}
                  onClick={() => emit({ open: open.filter((_, i) => i !== index) })}
                  className={`${h} inline-flex w-14 shrink-0 items-center justify-center rounded border border-border bg-surface text-foreground`}
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>
              <div role="radiogroup" aria-label={z.openHow} className="grid grid-cols-2 gap-2">
                {OPEN_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={bag.level === level}
                    onClick={() => setOpen(index, { ...bag, level })}
                    className={`${h} rounded border px-2 text-base font-medium ${
                      bag.level === level
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-foreground"
                    }`}
                  >
                    {z.levels[level]}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => emit({ open: [...open, { unit: choices[0].key, level: "half" }] })}
            className={`${h} rounded border border-border bg-surface px-3 text-base font-medium text-foreground`}
          >
            {open.length === 0 ? z.openAdd : z.openAnother}
          </button>
        </fieldset>
      )}

      {touched && total != null && (
        <p className="text-base font-semibold text-foreground" aria-live="polite">
          {open.length > 0 ? z.totalAbout(formatQuantity(total), item.unit) : z.total(formatQuantity(total), item.unit)}
        </p>
      )}
      {touched && (
        <button
          type="button"
          onClick={() => onChange({ value: "", same: false, unit: entry?.unit })}
          className="min-h-12 self-start rounded px-2 text-sm font-medium text-primary"
        >
          {z.clear}
        </button>
      )}
    </div>
  );
}

/** The counted lines as words for the review list: whole ones as "10 × bag (20 kg)", an open one as its size and how full. */
export function describeLines(
  locale: Locale,
  item: StocktakeItem,
  lines: CountLine[],
  z: { loose: (unit: string) => string; levels: Record<OpenLevel, string>; openLine: (size: string, level: string) => string },
): string {
  return lines
    .map((l) => {
      const size = sizeLabel(locale, item, l.unit, z.loose);
      if (Number.isInteger(l.quantity)) return `${formatQuantity(l.quantity)} × ${size}`;
      const level = OPEN_LEVELS.find((lv) => OPEN_FRACTION[lv] === l.quantity);
      return z.openLine(size, level ? z.levels[level] : formatQuantity(l.quantity));
    })
    .join(" + ");
}
