# 2026-09-27 — Correcting a weight edits it; a taken day turns logging into a correction

The form half of `0106` (one weight per visit, one per resident per day).

- **A correction is always an edit of the row.** There was no way to change
  a weight at all, so under a per-day rule a typo would have been permanent.
  `/weight/[id]/edit` (Edit on each Weight-tab row, Edit weight on a visit
  that has its reading) and `updateWeight` in `src/lib/weight/record.ts`,
  scoped by resident as well as id so a posted form can't move another
  resident's reading.
- **Logging on a taken day becomes a correction, said up front.** The form
  knows the resident's readings, so as soon as the chosen date has one it
  says "12 kg is already recorded for this day … saving corrects that
  reading", relabels the button, and posts that reading's id. This is the
  intake case: a vet weighing an animal on its intake day corrects the
  intake reading and links it to the visit. Refusing would have sent the
  vet off to find the Edit link; silently overwriting would have been a
  surprise. On the correction, blank notes and a blank visit **keep** the
  reading's own — the new form defaults both to empty, so treating empty as
  "clear" would have unlinked a visit nobody meant to touch. The edit page,
  which shows every field, does clear them.
- **An edit may not move onto another reading's day**: the same notice,
  and Save is disabled. Merging two readings is not something an edit
  should do implicitly.
- **The index still decides.** A second tab that loaded before the first
  saved gets `weight_one_per_day` / `weight_one_per_visit` back as a
  sentence (`writeError`), as does the assistant, which shares
  `recordWeight`.
- **The picker helper is shared on purpose**: `loadLinkableVisits`
  (`src/lib/vets/linkable.ts`) with `onePerVisit`, `notInFuture` and `keep`.
  Weight uses the first two — a future visit would default the date to a
  day the save refuses — and the prescription item takes `notInFuture`.
  A visit's date is the leading date of `appointment_date`, as every
  linked-visit form already reads it; stored visits sit at 02:00 UTC
  (09:00 at the shelter), where that is the shelter's date too.
- **The importer applies both rules as the migration would** (later row in
  the sheet kept on a same day, earlier visit links unset), noting each in
  the report, so a future snapshot loads rather than failing on the index.
  The 2026-09-22 snapshot trips neither (`--report` output unchanged).
