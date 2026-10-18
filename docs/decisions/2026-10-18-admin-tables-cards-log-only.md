# Only the audit log becomes cards; the three settings tables stay tables

Backlog item "Wide admin tables on a phone could become cards" (2026-10-17).

- `/admin/recent-changes` is a read-only table, so it was converted with CSS alone
  (below `md` each row is a bordered card; every cell carries a `data-label`
  taken from the column heading, shown above its value). No column is dropped
  and nothing is truncated.
- `/admin/diets`, `/admin/frequencies`, `/admin/immunization-types` have inline
  edit, merge and delete controls per row. Reflowing those is a behaviour risk
  out of proportion to a "low priority, nothing hidden" item, so they were left
  scrolling. Reuse the `data-label` + `before:content-[attr(data-label)]` pattern
  in `recent-changes/page.tsx` if one is converted later.
- Contrast: the appeals list wrapped `AppealProgressDisplay` (built for the cream
  public site, `text-site-ink`) in the dark app surface, giving dark text on a
  dark card. The wrapper in `management/appeals/page.tsx` now remaps those site
  colour variables to the app's `--foreground`/`--muted`.
