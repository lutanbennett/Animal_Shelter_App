# Correcting a resident's intake date (0302)

2026-11-02, stream `intake-date-correction`. Lutan asked directly: all four dates the intake stamped move with the
intake date, not just the two he first named.

## The five values (read from `record_intake()`, 0248, not from the backlog prose)

`p_intake_date` is written to exactly five places, confirmed in the function body:

1. `residents.intake_date`
2. `residents.age_estimated_on`
3. the `placement_history` row with `placement_type = 'Intake'` (`start_date`, stamped `p_intake_date::timestamptz`)
4. the intake `weight` row (`date`), only when a weight was given
5. the first `resident_diets` row (`start_date`)

Nothing already corrects any of them, and no sixth value is written. (`group_origins.date` is written too, but only
when a new origin is named, and it is deliberately not moved: see below.)

## What `correct_intake_date(resident, new date, preview)` does

One `security definer` function, one transaction, `search_path` pinned, refusing at the top unless
`has_permission('resident.correct_intake_date')`. It changes only rows the intake made: the Intake placement, and the
diet and weight rows whose date still equals the old intake date. `age_estimated_on` moves only if it still equals the
old intake date, so a later re-estimate of the age is left alone. A later diet change, move or weighing is untouched.

`p_preview = true` does every check and writes nothing; with no date it returns the records as they stand. The page
uses it to show "the records it will move" before Save, and the refusal reasons, from one function rather than two.

### The refusal rule

A later date than the old one is refused, naming the record, when it would fall after a record that is NOT moving: a
later placement ("a move to <enclosure> on <date>"), a diet, a weight (archived ones ignored), a non-cancelled,
non-archived clinic visit. It is also refused if the Intake placement would not start before it ends, and for a date in
the future. An earlier date can fall after nothing, so it is never refused for that. A refused call changes nothing.

Clinic visits block rather than warn, as the item said. Reading the data did not make that look wrong: a clinic visit
before the arrival date is a history that cannot be true. A cancelled visit is ignored because it never happened.

### The one trigger change

`placement_history` rows are immutable (`enforce_placement_history_immutability`, last defined in 0119). 0302
recreates it with ONE added exemption: an Intake row's `start_date` may change while the transaction-local setting
`app.intake_date_correction` is `on`, which only this function raises, around one statement. It is the pattern 0119
already uses for `app.placement_close`: a flag around one statement, not an exemption by role. Every other column the
trigger protected it still protects.

## `group_origins.date` is untouched, and that is not decided

A group origin made at intake can be shared with other residents, so moving its date would move it for them too. The
backlog item says explicitly not to decide this here. It is left alone, the page says so in plain words, and it stays
an open question for a later item.

## The card

A new card, `correct_intake_date`, holding the one activity `resident.correct_intake_date` (yes/no, area residents,
sort 75) and including `view_residents` so the page can find a resident by name or code. It is one PR rather than the
two the item proposed, because `scripts/check-cards-count.mjs` asserts the exact card count (now 42) and
`check-card-grants.mjs` proves the database against `cards.ts`: neither half can merge alone.

No role is given the card. Whoever holds it is Lutan's assignment in Settings → Who does what. Nothing was granted to
Admin, which passes through the existing `perms.isAdmin` short-circuit, untouched. No existing card gained or lost
anything: `check-card-grants.mjs` reports "all 68 roles hold exactly what their cards require".

An existing card did not plainly already cover this: no card carries a "correct a resident's record" activity, and
`reference.types` is the setup-lists activity. A new card was right.

## The page, and what the control asks

Settings → **Correct an intake date**, `/admin/intake-date`. Route registry entry opens on
`resident.correct_intake_date`; the landing tile shows only to someone who can open it. The Save control sits in
`CorrectIntakeDateForm`, whose `canCorrect` prop defaults to false; the page passes
`can(perms, "resident.correct_intake_date")`, **the same activity the function asks** (read from the function body).
Proved with a one-card login (`dev-signin.mjs --cards correct_intake_date`): it sees the tile, finds a resident,
sees the records and Save, and a save moved the date. A login holding only `view_residents` is sent to the no-access
page and sees no tile and no control.

## What could not be settled, or is not covered

- **The refusal sentences are English only.** They are raised by the database and passed to the person as written
  (the Thai reader of this page sees an English refusal). Fixing it means the function returning a code the app
  translates; not done here.
- **Weights and diets "still dated the old intake date" are matched by date alone.** A later same-day weighing, or a
  diet change on the intake day, would move with the intake rows. The page lists exactly the rows it will move before
  Save, so it is visible, but it cannot tell them apart from the intake's own. A same-transaction check on
  `created_at` was considered and rejected because imported residents have no such match.
- **A deceased resident cannot be corrected.** The existing closed-record lock refuses with its own message
  ("This resident is deceased, their record is read-only"), which the page passes through. Found on dev: it showed as
  "something went wrong" until 23001 was passed through as well.
- **The Thai text on the page and the card has not been read by a Thai speaker.**
- **Production apply is Lutan's**, made in the release cut that also publishes this PR's release note (`0302` is the
  first pending file), so the note does not run ahead of it. Nobody holds the new card until Lutan assigns it, so
  Admin alone sees the page at first.
- Dev's `schema_migrations` carries a stale row `0302_retire_audit_activities.sql` (from #1204's renumbering to
  `0301`). A known filed item; seen here, not touched. `--drift test` therefore reports one "applied here, no file".
