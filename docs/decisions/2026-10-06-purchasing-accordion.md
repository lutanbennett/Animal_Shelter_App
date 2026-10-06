# 2026-10-06 — Purchasing folds the "nothing to buy" rows, but only the trustworthy ones

**What folds.** Under each table on Management → Purchasing (Medicines, Food), a
row folds into one native `<details>` ("N items need nothing for this period",
closed on every visit, no stored preference) when `buy` is 0 **and** the figure
behind it is trustworthy. Folded rows keep their full working, so "counted 40 on
…, need 25" is still one tap away. Lutan ruled removal out for exactly that reason.

**What never folds.** A row whose `state` is `notCounted` or whose `stale` flag is
set (both read from `purchaseRow()` in `src/lib/management/purchasing.ts`, not
inferred from the rendered text). A never-counted item is assumed to have nothing
on the shelf, so a sum of zero means it is not used in the period, not that it is
covered; a stale count may be wrong. In either case "nothing to buy" is a guess,
which is what the warning exists for.

**Order.** Items to buy → never-counted / stale at zero → the fold. Each group
keeps the table's existing order (name, with the standard diet last).

**Empty case.** When nothing is visible but items exist, the table says "Nothing to
buy for this period" (`p.list.empty`, the same sentence the shopping list uses) and
the fold sits beneath it.

**Other views, confirmed.**
- *Printable / CSV list:* built from `buy > 0` only; unchanged.
- *Phone (`PurchasingPhone.tsx`):* lists only the `lines` (items to buy), so it never
  showed zero rows and needs no fold. Unchanged.
- *Noted, not changed:* a never-counted item whose need is 0 appears on neither the
  phone nor the "not counted" banner (both count `needed > 0`), because there is
  nothing to buy and nothing assumed. On the desk table it now stays visible. Filed
  as a follow-up rather than widened here.

**Layout.** The folded rows live in a second table inside the `<details>`; both
tables share a `<colgroup>` (`table-fixed`) so the columns line up.
