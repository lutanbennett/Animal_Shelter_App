# Vaccine stock columns (0185)

`vaccine-stock-forecast` found that vaccines had nowhere to record stock: `0083` gave `stock_on_hand`, `stock_counted_at` and `reorder_lead_days` to `medication` and `diet_types` only, though Lutan confirmed on 2026-10-10 that vaccines are bought ahead and kept. `0185` adds the same three columns to `immunization_types`, so the forecast reads vaccine stock the way Medications and Diets do rather than from a second source.

- **Unit is doses**, the unit `immunization_due_dates` counts in, so "doses due vs held" is a plain comparison.
- **Null is never counted; 0 is out of stock.** Nothing is back-filled (checked: 0 of 7 types have a count after applying).
- **The counted-at trigger function from `0083` is reused**, not copied; it only touches the row's own two columns.
- `interval_months` is `not null` on `immunization_types` (all 7 dev rows filled), so the forecast needs no "no interval" case.
- Schema only, `-- consumer: none`. Entering counts and the forecast are `claude/vaccine-stock-forecast`.
- Additive: older code ignores the columns, so a code rollback needs no down-migration.
