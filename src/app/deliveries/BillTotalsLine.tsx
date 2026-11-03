"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatBahtExact } from "@/lib/format";
import type { BillTotals } from "./actions";

/**
 * A bill's printed amount against its items added up (stock_delivery_totals, 0308). It informs and never refuses: a
 * bill that does not add up is saved all the same, because the shop's arithmetic, a discount or a delivery charge can be
 * the reason, and the person standing there knows which.
 */
export function BillTotalsLine({ totals }: { totals: BillTotals | null }) {
  const { t, locale } = useI18n();
  const b = t.deliveries.bill;
  if (!totals) return null;
  const baht = (n: number) => formatBahtExact(n, locale);
  const parts: string[] = [b.items(totals.lines)];
  if (totals.amount != null) parts.push(b.amount(baht(totals.amount)));
  if (totals.linesCost != null) parts.push(b.added(baht(totals.linesCost)));
  let verdict: string | null = null;
  let tone = "text-muted";
  if (totals.amount == null) verdict = b.noAmount;
  else if (totals.unpricedLines > 0) verdict = b.unpriced(totals.unpricedLines);
  else if (totals.difference != null) {
    const diff = Math.round(totals.difference * 100) / 100;
    if (diff === 0) {
      verdict = b.matches;
      tone = "text-success";
    } else {
      verdict = diff > 0 ? b.under(baht(diff)) : b.over(baht(-diff));
      tone = "text-warning";
    }
  }
  return (
    <p role="status" className="text-sm text-foreground">
      <span className="font-medium">{parts.join(" · ")}</span>
      {verdict && <span className={`ml-2 ${tone}`}>{verdict}</span>}
    </p>
  );
}
