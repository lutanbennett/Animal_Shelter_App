# Refusal keys, group 6: correct an intake date (#3nuwy)

`correct_intake_date` (last defined in `0307`) now raises keys. Migration `0358`; body is 0307's with only the raise lines
changed (plus the blocker, below). `-- consumer:` names the action and the page.

## Count: 8 raises, 8 sentences, 8 keys — group 5's eight was right
permission (42501, kept), resident not found, no intake date, date required, already that date, date in the future, blocked
by a later record, first placement ends before the new start. Prefix `intake.`: `not_allowed`, `resident_not_found`,
`no_intake_date{name}`, `date_required`, `already_that_date{date}`, `date_in_future`, `blocked_by_record{kind,place,when,date}`,
`first_placement_ends{date,ends}`. SQLSTATE `P0001` kept except the permission one (`42501`).

## The blocker was an English phrase built in SQL
"a move to X on D" / "a diet that starts on D" / "a weight recorded on D" / "a clinic visit on D" were concatenated English
inside the sentence. Words must not be built in SQL, so `v_blocker` is now a jsonb of `{kind, place?, when}` and the dictionary
words each kind (en and th). One key, four kinds, rather than four keys for one sentence.

## The allow-list is gone, and a second raw read with it
`actions.ts` passed `P0001`/`23001` through as `error.message` and had its own `42501` branch; all three are replaced by
`dbRefusal("intakeDate.correct", error, t)`. **`page.tsx` also showed `error.message` raw** from the preview call
(`loadError`); without a change it would have printed a key, so it uses `dbRefusal(...).error` too. `grep -n "P0001\|23001\|error.message" src/app/admin/intake-date/` is empty. The `23001` closed-record trigger sentence is not this
function's and is not converted: it is now reached only through `databaseFailure`'s rules (the lock lets this write through
since 0307, so it is unreachable in practice).

## Proof (dev, 2026-11-11)
Calls in a `begin … rollback` harness (admin login at aal2, then a login with no roles). **Seen coming back, 5 of 8:**
`resident_not_found`, `date_required`, `already_that_date`, `date_in_future`, `not_allowed`. **Not provoked:** `no_intake_date`
(no resident without one found), `blocked_by_record`, `first_placement_ends` (needs a resident with a later record; the
SQL is the 0307 query with its result reshaped). Wording for all eight is covered by `check-sql-refusal-keys.mjs`. Fallback
for an unknown key is `src/lib/db-refusal.test.mjs` (group 3 proof): the generic message plus a reference, never the key.
Not driven on screen in Thai in this session.

## Meter
Before: 15 functions / 45 keyed, 44 person-read still English. After: **16 / 53, 36** (44 − 8).

## Thai
My own wording, unreviewed; for the planner to file onto `#y1dqu`.

## Found, not fixed
Page control gating on `/admin/intake-date` was not inspected (belongs to `control-drive-pane`).

## Next group (mechanism file's table)
Read the table in `2026-11-08-db-refusal-keys-mechanism.md`: the planner names the next from it (Placements / Resident photos / the three merge screens remain).
