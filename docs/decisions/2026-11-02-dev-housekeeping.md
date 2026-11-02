# 2026-11-02 — Dev housekeeping: the orphaned migration row and the leaked harness roles

Two pieces of our own tooling's litter on the shared dev database (`qxkmhwybjggxvsfxsxbd`). **Database changes leave
no diff, so this file and the PR body are the only record of them.** Nothing was applied to production.

## Item A — the stale `0302_retire_audit_activities.sql` row

Before (2026-11-02, `node scripts/apply-migrations.mjs --drift test`):

```
Environment: test — project qxkmhwybjggxvsfxsxbd
Against origin/main f20a216b: 303 file(s), 304 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 1
    0302_retire_audit_activities.sql
Drift: test and origin/main disagree.
```

Route: a new narrow command, `node scripts/apply-migrations.mjs --forget <filename>`. The existing prohibition (never POST SQL
by hand or paste into the SQL editor) is about *applying* migrations; a hand-written delete would still have gone round the
script, so the script grew the one operation it needs. `--forget` refuses: production/uat (dev only), any name with a file on
`origin/main` (so it cannot drop a real record), a name not in `schema_migrations`, a failed `git fetch`, and any other mode flag.
It deletes exactly one row. Refusals were exercised: `--env production`, `0301_retire_audit_activities.sql` and
`0302_correct_intake_date.sql` (both on main), and `0999_nothing.sql` (no row) each deleted nothing.

Run:

```
Deleted one schema_migrations row: 0302_retire_audit_activities.sql (no file of that name on origin/main f20a216b).
```

After:

```
Against origin/main f20a216b: 303 file(s), 303 applied row(s).
  On origin/main, not applied here: 0
  Applied here, no file on origin/main: 0
No drift: test matches origin/main.
```

**Verdict on the named command: built, not a one-off.** A second release will hit the same renumbering, and the guard
(prove the row is an orphan before deleting) is the part a hand-written delete lacks. It is dev-only on purpose.

## Item B — the `harness_cards_*` roles

Count on dev at the start: **6**, each still holding one login (so these were runs killed mid-way, not runs that finished
without cleaning up):

| key | cards | created |
|---|---|---|
| harness_cards_ytzh0kg0 | book_clinic_visits | 2026-10-29 |
| harness_cards_odut6h5q | view_residents | 2026-10-29 |
| harness_cards_wel5ngx9 | administer_medication, record_weight, add_medical_photos, feed_special_diets | 2026-10-30 |
| harness_cards_634vrkno | (same four) | 2026-10-30 |
| harness_cards_nm0arpqg | view_residents | 2026-10-30 |
| harness_cards_y4x44tz9 | (same four) | 2026-10-30 |

Which harnesses: the four-card set is `check-medical-jobs-app.mjs` (`JOB_CARDS`); `view_residents` is one of several;
`book_clinic_visits` is `check-home-screens-live.mjs`. Every one of the fifteen `giveCards` callers was read: all but one await
`cleanup()` in a `finally`. The causes found:

1. **A killed run never reaches `finally`** (timeout, closed terminal). Two of the four-card roles were created in the same
   second, i.e. concurrent runs. No per-harness code fix can cover this, so `giveCards()` now calls
   `sweepStaleHarnessRoles()` first: any `harness_cards_` role older than 2 hours (a real run takes minutes) is removed with its
   `user_roles` and `role_cards`. The leak therefore cannot accumulate past one dead run.
2. **`check-home-screens-live.mjs --keep <file>` skipped the role cleanup by design** and `--cleanup <file>` removed only logins.
   The keep file now records `roleIds` and `--cleanup` removes them.

The sweep is keyed on a fixture prefix of roles only harnesses create; it grants and denies nothing, so it is not the
hard-coded-security or role-by-name fault.

## What I could not establish

- Which specific run was killed for each role — the roles hold no record of that, only the card set.
- Whether `role-cells` / `role-cards` should hide throwaway roles: not built. Deleting the roles makes the padding moot, and the
  sweep keeps it from returning; hiding by name would be a role-name rule.
- The logins that still hold these roles are not removed (not mine to tidy).

## The roles were deleted (last action)

Re-counted immediately before: the same six, none new. Deleted by the recorded keys only (`user_roles`, `role_cards`, then
`roles`), never a `dev_signin_cards_*` role, never `dev-signin.mjs --remove`:

```
now: harness_cards_nm0arpqg harness_cards_wel5ngx9 harness_cards_634vrkno harness_cards_odut6h5q harness_cards_y4x44tz9 harness_cards_ytzh0kg0
deleted (all six)
harness_cards after: 0 | dev_signin_cards untouched: 56
```

Both backlog items are ticked: the leak is fixed (sweep + `--keep` roles) and the six roles are gone.
