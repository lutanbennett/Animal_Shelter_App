# 2026-10-21 — The last red harnesses, and a guard on the backlog branch

Follows `2026-10-13-red-harnesses.md`. The rulings of 2026-10-19 (Lutan) and the cells of `0230` / PR 766 had already
settled the permission questions, so this round re-ran all thirteen and fixed what was still red. Rule throughout: no
expectation was set to "whatever dev does"; each change is one of the four kinds below.

## Harnesses

| Harness | Kind | What changed |
|---|---|---|
| `check-2ic-role`, `check-medical-jobs`, `check-perm-convert-orphans` | cells vs `jobs.ts` / the doctor's cells | Nothing: already green after PR 766 and `0230`. |
| `check-maintenance-role` | stale expectation, two lines | (1) "translations of anything else": `0184` B (`map_rooms_translations_read`) lets anyone with app access read *approved* `map_rooms` translations on purpose, so the probe excludes that one table. (2) A doctor marking "another's" task done: the doctor holds no `recurring.do_own` (paper §4, Vet "–"; C11: vets are never offered as assignees), so is refused, as the paper says. Expectation moved to the paper, not to today's result. |
| `check-medication-rounds` | dev data (apply-day claim) | Dropped "no real frequency / prescription / diet reads none or mismatch". Staff have entered a 4-a-day "Every 6 hours" frequency and a diet that the status views rightly flag. What *none* and *mismatch* mean is still asserted on rows the harness makes (insert / visible / prescription / diet sections). |
| `check-permission-parity` | explanation missing | `maintenance.bills` is covered by `check-bills-roles.mjs`; recorded in `scripts/lib/permission-probes.mjs` `NO_DB_PROBE`. Paper now has 66 activities, so the four added since are explained there too (`appeal.medical_photo`, `photos.shelter_add`, `social.library`, `photos.approve`), each naming the harness that exercises it. Result: 0 mismatches. |
| `check-permission-tables` | stale baselines | 62→66 activities, 42/20→45/21, Management cells 56→57, 744→792 answers, expected cells 111→112. **Derived from the paper**, whose §4 gained the four rows for `0216`, `0217`, `0223`, `0224` (only `photos.approve` has a seeded cell: Management, `0224`). The parsed paper gives Management 57, Staff 38, doctor 13, which is what dev holds. |
| `check-impact-baselines` | replay over a later definition | Stopped replaying `0156` (it could not recreate `public_impact_figures` after `0204` added `since_year`; rule 1 of `2026-10-02-replay-or-assert-live.md`). Asserts the live schema. `since_year` added to the allowed public columns: `0204` makes it public on purpose. All 33 checks hold. |
| `check-facility-maps`, `check-fixed-outgoings`, `check-safety-stock`, `check-lifecycle-guards`, `check-medication-label`, `check-role-write-policies` | done 2026-10-13 | Re-run: green. |

Nothing was written to dev and no migration was added.

## Not in the thirteen — found red, left alone

- `check-bills-roles`: five lines, all "as doctor, expected refused". The doctor now holds `medical.visits` (PR 766 / home-screen
  fix), and `0189` opens the bills inbox to `medical.visits`. Probably an expectation that needs a ruling on whether a visiting vet
  should reach the inbox.
- `check-volunteer-narrowing`: "read translations: the volunteer was allowed" and a list of functions that still say `'volunteer'`
  (`is_public_drive_file`, `on_volunteer_floor`). Unexamined.

## The backlog-branch guard

`.githooks/pre-commit` gains `check_backlog_branch`: a commit on `backlog` that stages anything but `docs/backlog.md` is refused
with what to do instead. It is plain git (no node, no script), so the only way it fails open is the branch name being unreadable. A
commit anywhere else never reaches the `grep`. Scope is deliberately that of the hook: `git commit --no-verify` or a merge into
`backlog` is not covered, and `main` still has no branch protection.
