# 2026-10-19 — Words beside icons on a phone

Dry run F-08. No single shared component covered all six surfaces, so the change is small and per surface:

- `RowAction` gained an optional `word`, shown beside the icon below `md` and screen-reader-only above it. Used on recurring-job rows and Shelter Friends Up/Down. Existing strings reused; Up/Down are new in both dictionaries.
- `ActionLink` already supported `iconOnlyOnMobile={false}`; the residents-list toolbar now uses it, in a 2x2 grid at phone width (four labelled buttons on one line do not fit, and a column of four pushed the list down ~200 px). The toolbar is two lines tall where it was one.
- `StatCard` actions (the 30 px hub-card circles) are now labelled pills.
- Edit and Record death on the resident header show their words on separate lines, so the two stay distinct.

Checked at 375 px in English and Thai. **Not done:** the per-row copy-link and pencil icons inside each residents-list row. A word there would wrap every row on the screen used most; left as icons.
