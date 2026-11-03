/**
 * A delivery line typed as words instead of picked from Settings → Medications or → Diets (0308, item_kind
 * 'described'). It counts toward NO stock figure: no stocktake, no reorder warning, no purchasing list, no price
 * per kg. Two things live here, both pure: reading a typed line, and finding the wordings typed more than once, which
 * the deliveries page offers to add to Settings.
 *
 * The same wording is matched the way the database indexes it (stock_receipts_described_idx: lower(btrim(...))), with
 * runs of spaces folded to one, so "Dish  soap " and "dish soap" are one wording.
 */

import { parseBahtAmount } from "@/lib/format";
import { parseDeliveryQuantity } from "@/lib/management/stock-receipts";

export type DescribedLineInput = { description: string; unit: string; quantity: string; cost: string };

export type DescribedLineResolved =
  | { ok: true; description: string; unit: string; quantity: number; cost: number | null }
  | { ok: false; reason: "descriptionRequired" | "unitRequired" | "quantityInvalid" | "costInvalid" };

export function normaliseDescription(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function resolveDescribedLine(input: DescribedLineInput): DescribedLineResolved {
  const description = input.description.trim().replace(/\s+/g, " ");
  if (!description) return { ok: false, reason: "descriptionRequired" };
  const unit = input.unit.trim().replace(/\s+/g, " ");
  if (!unit) return { ok: false, reason: "unitRequired" };
  const quantity = parseDeliveryQuantity(input.quantity);
  if (!quantity.ok) return { ok: false, reason: "quantityInvalid" };
  const cost = parseBahtAmount(input.cost);
  if (!cost.ok) return { ok: false, reason: "costInvalid" };
  return { ok: true, description, unit, quantity: quantity.value, cost: cost.value };
}

export type DescribedRow = {
  id: string;
  description: string | null;
  unit: string | null;
  promoted_medication_id: string | null;
  promoted_diet_type_id: string | null;
};

export type PromotionOffer = {
  /** normaliseDescription() of the wording. */
  key: string;
  /** The wording as first typed, for the screen. */
  description: string;
  /** The typed unit of the first line, offered as the new item's unit. */
  unit: string;
  /** The lines that would be linked: every unlinked line with this wording. */
  lineIds: string[];
  /** How many lines say this in all (linked ones too). */
  total: number;
};

/**
 * The wordings typed on two or more lines where at least one line is not yet linked to a Settings item. "The second
 * time a description is typed" is exactly this: one line is a description, two are a pattern worth offering.
 */
export function promotionOffers(rows: DescribedRow[]): PromotionOffer[] {
  const groups = new Map<string, { first: DescribedRow; total: number; open: string[] }>();
  for (const row of rows) {
    const key = normaliseDescription(row.description ?? "");
    if (!key) continue;
    const g = groups.get(key) ?? { first: row, total: 0, open: [] };
    g.total += 1;
    if (!row.promoted_medication_id && !row.promoted_diet_type_id) g.open.push(row.id);
    groups.set(key, g);
  }
  return [...groups.entries()]
    .filter(([, g]) => g.total >= 2 && g.open.length > 0)
    .map(([key, g]) => ({
      key,
      description: (g.first.description ?? "").trim().replace(/\s+/g, " "),
      unit: (g.first.unit ?? "").trim(),
      lineIds: g.open,
      total: g.total,
    }));
}
