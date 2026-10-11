# Residents list sort (2026-10-11)

`?sort=<id|name|enclosure|zone|status|location>&dir=desc`, read by `resolveListView`
(`src/lib/residents/sort.ts`). The page and `/residents/export` both go through `resolveListView`,
`listQuery` and `inListOrder`, so the Download follows the sort with no code of its own; the page
hands the export its own query string.

- **ID, Resident, Status** are ordered by the database (`resident_code`, `name`, `current_status`),
  with name as the tiebreak.
- **Zone, Enclosure, On-site / Off-site** are ranked in the app, after the query. The list views
  carry names but not `sort_order` (0161), so the database cannot order by the shelter's own order
  without a schema change. The list is not paged, so this ranks the whole filtered set, not a page.
  A schema change was the alternative; it was not worth a migration number.
- Rows with no zone/enclosure/place (a dash on screen, the Lifecycle zone included) go last in both
  directions.
- Both the volunteer's `resident_who_and_where` and `resident_list_view` carry every column used.
