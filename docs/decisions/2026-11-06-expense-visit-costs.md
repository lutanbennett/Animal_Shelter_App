# 2026-11-07 — vet visit costs in the expense report (0321)

**One type, Veterinary. Lutan, 2026-11-05, asked directly:** every clinic visit counts as ONE type. He was offered a per-reason breakdown and *"say they're excluded"* and chose neither. So no column was added anywhere (`clinic_visits` still has no `kind_id`), and a visit row comes back from `expense_report()` with `kind_id`/`kind_label` null and source `clinic_visit`; the page prints the translated heading *Veterinary*.

**A migration was needed after all (0321), against the brief's "add nothing".** `expense_report()` is a security-definer function and the card that opens the page (`view_expenses`, `reports.expenses` read) cannot read `clinic_visits` (that needs `medical.visits`). Reading visits in the page would have shown the accountant card a silently low month, the exact fault this item exists to close. The brief allows a forbidden file where a deliverable needs it. Numbered 0321 because stream 3008 had already applied 0319 and 0320 to dev. It replaces the 0317 function; nothing else changes.

**What a visit row exposes:** date and cost only. No resident, no reason, no note. Counted: not archived, not cancelled, cost recorded, by appointment day in Bangkok time.

**The receipt choice (deliverable 3): a visit row never links a receipt and says "invoice is on the visit record".** Attachments on a visit are lab reports and medical photos as often as invoices, and `bill_owner_can()` correctly asks `medical.visits` for them. Opening them to `reports.expenses` would hand a money-only card medical documents, and picking "the invoice" out of them is a guess. The row is honest instead: it neither claims a missing receipt nor links something it cannot vouch for.

**Totals, dev database (qxkmhwybjggxvsfxsxbd), before and after applying 0321, read on the page signed in with only `view_expenses`:**

| Month | Before | Visit sum (SQL) | After |
|---|---|---|---|
| Nov 2026 | 4,581 | 0 | 4,581 |
| Oct 2026 | 16,163 | 4,350.00 (4 visits) | 20,513 |
| Sep 2026 | 500 | 1,450.00 (1) | 1,950 |
| Aug 2026 | none | 1,234.50 (1) | 1,235 |
| Year | 21,244 | 7,034.50 | 28,279 (28,278.50 shown rounded) |

Each difference equals that month's `clinic_visits.cost` sum by the same filter.

**The button rule (deliverable 5).** The page has no Print or Download CSV, no form, input or button (checked in the running page: only the year link and receipt links). The brief expected two; they do not exist here. Nothing found, nothing to gate. Medical spend now appears on a page held by `view_expenses`; it is an aggregate cost with no resident or reason, and the card's stated purpose is the shelter's expenses for an outside accountant, so that is intended. If a CSV is ever added it carries the same rows and needs the same reading.

**`#t5k9r` (general bill photos cannot be filed) is NOT changed by this and is left open.** Visits have no receipt link here by design; general bills still mostly show "no receipt".

**Thai is unreviewed:** `veterinary`, `onVisitRecord`, `sources.clinic_visit` and the rewritten `basis` sentence.

**Production:** 0321 must be applied before the deploy, since the page code only prints what the function returns and an old function simply returns no visit rows (safe either way).
