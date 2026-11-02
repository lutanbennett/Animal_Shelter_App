# The unlisted-Thai-columns gate is a file-only CI check (2026-11-02)

`translations-unlisted` existed in `scripts/lib/readonly-checks.mjs` and nothing ran it. Registering a `_th` label in
`translatable_labels` is a hand step, missed twelve times since `0166`. This closes the gap.

## Shape chosen: a file-only CI check, `scripts/check-translations-unlisted.mjs`, job `translations-unlisted`

- **CI reads only the repo**, so it blocks the pull request that adds the column, the earliest moment, and cannot go red for a
  reason outside the PR (no credentials, no network, no live data). That is what lets it block without teaching anyone to ignore it.
- **The release check** (the live query, already there) sees a column that arrived by any route, but only when a person runs it
  and needs production credentials CI does not have. A blocking gate must not depend on that.
- **Not both, yet.** The cheap half is built. The other half is one line in `docs/release-procedure.md` running
  `check-production.mjs translations-unlisted --env production` and reading the list against `DELIBERATE`; it also needs
  `label_drafts.text_th` and `rounds.name_th` filtered, which the live query does not do. Not done here.

## How it works, and what it cannot see

It reads every migration in order, collects `_th` columns declared by `add column` and `create table`, forgets those later
dropped (`summary_th`, `caption_th` in `0056`), and collects the `(table, column, th_column ...)` rows of any file that inserts
into `translatable_labels`. Declared and not registered, and not in `DELIBERATE`, fails with the column and file named and
what to do. Comments are stripped first. It cannot see a column made by dynamic SQL or `execute format(...)`, or a rename; the
live check covers those. It also refuses to pass if it finds no `_th` columns at all, so a broken scan is not read as clean.

## The exceptions are in the gate, as data

`DELIBERATE` in the script maps `table.column` to a reason. Two entries, not the brief's one: `rounds.name_th` (seeded vocabulary,
`0166`) and `label_drafts.text_th` (a proposed translation held by Translations itself, `0293`). The live check's last release
record lists the same two. Both are asserted by name in the test.

## Evidence

`scripts/check-translations-unlisted.test.mjs`: an unregistered column fails; registering it (same or later file) passes; create
table, comment and drop forms; and a fixture folder (`scripts/test-fixtures/unlisted-th`) exits 1 naming `fixture_cats.name_th`
while the real `supabase/migrations` exits 0.

## Answer to the open question: should `NOT COUNTED` fail?

That wording belongs to `translations-open`, not this check. Its `failed` is `uncovered.length > 0`, so it already **fails**
rather than reports: a registered label the count has not been taught is a fault in the instrument. That is right for a gate.
But `translations-unlisted` itself has **no `failed` at all**: it lists columns and exits success even with a gap, and does
not filter the two deliberate ones, so it is a report, not a gate, and would be wrong to wire in as is. That is why the gate is a
new script. Wiring `translations-open` into CI is a separate matter: it needs the live database.

## For the planner to file

- `check-production.mjs translations-unlisted` should give the live query a `failed` and the same `DELIBERATE` list (release half).
- `assertSelectOnly()` fail-open: already filed; not touched. It did not affect any result here.
