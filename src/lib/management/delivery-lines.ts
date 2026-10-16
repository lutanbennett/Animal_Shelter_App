/**
 * One delivery, several lines (backlog, "Pack sizes, the rest", part a): each
 * line is a size, how many of it, and what it cost. The lines are added up in
 * the item's base unit and kept one-for-one in stock_receipts.entered.
 *
 * THE RULE THAT CAN HURT: every line's "how many" is multiplied by THAT line's
 * own factor, never another's. 2 × 20 kg + 1 × 14 kg + 3 × 5 kg is 69 kg, the
 * sum a person would do by hand. resolveDeliveryLines() does it and
 * scripts/check-delivery-lines.mjs holds it to that.
 *
 * Cost: a line with a price is paid for; a delivery is priced only when EVERY
 * line is, because item_latest_delivery_cost divides the receipt's cost by its
 * whole base quantity, and a free-looking line in a priced delivery would
 * quietly pull the price per kg down. 0 on a line = that line was donated.
 *
 * Pure: no database, no i18n.
 */

import { parseBahtAmount } from "@/lib/format";
import { enteredTotal, normaliseUnitName, resolveEntered, roundBase, type EnteredLine, type UnitConversion } from "@/lib/units";
import { parseDeliveryQuantity } from "@/lib/management/stock-receipts";

/** A line as typed. `unit` is a conversion's name, "" = the item's base unit. */
export type DeliveryLineInput = { quantity: string; unit: string; cost: string };

export type DeliveryLinesResolved =
  | { ok: true; base: number; entered: EnteredLine[] | null; cost: number | null }
  | {
      ok: false;
      reason: "noLines" | "quantityInvalid" | "unknownUnit" | "costInvalid" | "costIncomplete";
      /** Which line (0-based), when one is to blame. */
      line?: number;
    };

export function resolveDeliveryLines(
  lines: DeliveryLineInput[],
  conversions: UnitConversion[],
  baseNames: string[],
): DeliveryLinesResolved {
  if (lines.length === 0) return { ok: false, reason: "noLines" };

  const entered: EnteredLine[] = [];
  const costs: (number | null)[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const quantity = parseDeliveryQuantity(line.quantity);
    if (!quantity.ok) return { ok: false, reason: "quantityInvalid", line: i };
    const cost = parseBahtAmount(line.cost);
    if (!cost.ok) return { ok: false, reason: "costInvalid", line: i };
    costs.push(cost.value);

    const resolved = resolveEntered(quantity.value, typeof line.unit === "string" ? line.unit : "", conversions, baseNames);
    if (!resolved.ok) return { ok: false, reason: resolved.reason, line: i };
    // A line in the base unit has no `entered` of its own; beside other lines it
    // is written out with factor 1, so the array still adds up to the total.
    entered.push(
      resolved.entered?.[0] ?? { quantity: quantity.value, unit: normaliseUnitName(baseNames[0]) || "unit", factor: 1 },
    );
  }

  const priced = costs.filter((c) => c != null).length;
  if (priced > 0 && priced < costs.length) {
    return { ok: false, reason: "costIncomplete", line: costs.findIndex((c) => c == null) };
  }
  const cost = priced === 0 ? null : roundBase(costs.reduce<number>((sum, c) => sum + (c ?? 0), 0));

  const base = enteredTotal(entered);
  // One line in the base unit is exactly what a delivery looked like before: entered stays null.
  const unit = normaliseUnitName(lines[0].unit).toLowerCase();
  const baseOnly = lines.length === 1 && (unit === "" || baseNames.some((b) => normaliseUnitName(b).toLowerCase() === unit));
  return { ok: true, base, entered: baseOnly ? null : entered, cost };
}

/** Plain-words total for the form: the sum of the lines typed so far, in base units, or null if none is usable. */
export function previewBase(lines: DeliveryLineInput[], conversions: UnitConversion[]): number | null {
  let total = 0;
  let any = false;
  for (const line of lines) {
    const q = parseDeliveryQuantity(line.quantity);
    if (!q.ok) continue;
    const factor = line.unit ? conversions.find((c) => c.unit === line.unit)?.basePer : 1;
    if (!factor) continue;
    total += q.value * factor;
    any = true;
  }
  return any ? roundBase(total) : null;
}
