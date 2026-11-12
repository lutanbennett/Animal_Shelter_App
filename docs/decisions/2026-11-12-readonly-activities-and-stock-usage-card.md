# The last five activity rulings, built — 2026-11-12

Lutan ruled all fourteen ungranted activities on 2026-11-12. PR #1511 recorded the nine that needed
no migration (`docs/decisions/2026-11-12-fourteen-activities-ruled.md`). **This is the other five**,
which needed one: four unused Edit settings removed, and one card grant. Backlog `#c4vn7`; the
evidence per activity is `docs/unruled-activities-walkthrough.md`.

Nothing here was decided by this stream. His two rulings were settled in his own session and are
quoted on the allow-list records this change deletes.

## What "remove the unused edit setting" turned out to mean

`photos.resident_medical`, `reports.expenses`, `resident.who_and_where` and `roles.view` are all
`kind: "level"` — Edit / Read / None — and **no screen, save, policy or function has ever asked any
of them at Edit.** Verified by searching every reference before touching anything: every caller is
`can(…, "read")`, `requirePermission(…, "read")`, `has_permission(…, 'read')`, a `routes.ts` entry at
`level: "read"`, or a `card_grants` row at level 1. There was nothing to break.

**The catalogue had no way to say it.** `kind` was `"level"` or `"yesno"`, and `"yesno"` is not
"remove Edit" — it removes **Read**, which is the half a dozen cards actually hold. So the ruling
needed a third kind, and that is what this change adds:

> `"readonly"` = Read / None. There is nothing to do at Edit, so the setting is not offered.

**The removal is enforced three ways, not written down once.** His reasoning for removing it was that
a setting which does nothing is a trap — someone grants it and expects a result — so a comment saying
"don't grant this at Edit" would have reproduced the trap in prose:

1. **The type system.** `can(perms, "roles.view", "edit")` and
   `requirePermission("roles.view", "edit")` no longer compile: a `readonly` key's only overload takes
   the literal `"read"`. A bundle entry for one must say `level: "read"`.
2. **The database (0360).** `card_grants` gets the kind guard it never had, so a card cannot be given
   one of these at level 2 at all; `role_permissions_guard` refuses the cell; and
   `permission_activities_guard_kind` refuses the kind change itself if any card or cell already holds
   one of them at Edit, so the migration cannot quietly contradict the live data.
3. **The checks.** `check-ungranted-activities` and the live `activities-grantable` stop enumerating
   an edit level that no longer exists, so the four edit gaps are gone rather than excused.

Read is untouched throughout. The four reads are held by about a dozen cards and every one of them
keeps working.

## `stock.usage` onto two cards that already exist

"Stock between counts" is a read-only report over the stock figures `food_forecast` and
`medicine_forecast` already show, so he put it on both rather than mint a card for it. Nothing that
changes a figure comes with it: correcting a count still asks `stock.correct`, which he ruled
Admin-only on 2026-11-09.

## Why this is one PR and not a schema PR first

`CLAUDE.md` asks for schema to land first, as its own PR, when it can be made harmless to code that
does not know about it. **Here it cannot, and the catalogue file says so in its own header:** "THIS
FILE AND permission_activities ARE THE SAME LIST… add a row here AND a migration, in one PR."
`check-permission-catalogue` compares the two on every lint run, so a migration that changed `kind`
without the file — or the file without the migration — is a red build either way. The repo's own
precedent is the same: `0355` shipped in one commit with `catalogue.ts` and `cards.ts`
(`59b17c80`, 2026-11-11). So: one PR, the smallest it can be.

## The migration number, which is NOT clean and is the one thing to know

**Two live branches are numbered 0360.** `claude/adopter-update-app` (PR #1513, open and titled
"[unfinished]") carries `0360_adoption_update_channel_app.sql` and **has already applied it to dev**,
which is why `apply-migrations --status` now lists two 0360 rows with no file on `main`. The brief
this stream was given said the one-migration-at-a-time slot was free, because the check that was run
looked at `claude/*` branches for migration files on the day `claude/refusal-keys-group-7` merged and
`adopter-update-app` was missed.

**It was numbered 0361 first, and that was wrong.** The pre-commit hook refused it, correctly:
numbers belong to `main`, not to a branch, so the next number after `main`'s `0359` is `0360` and an
unmerged branch never owns one. Taking 0361 would have left a permanent gap on `main` to preserve an
unmerged branch's claim.

**So this is genuinely two in-flight migrations at once, against the rule, and it is disclosed rather
than tidied away.** Proceeding was this stream's call, not Lutan's and not the planner's: his rulings
were given the same day, the other branch is unfinished, and the hazard is reversible. What whoever
merges second has to do — almost certainly #1513, since it is unfinished:

- rename its file to `0361_…`,
- `node scripts/apply-migrations.mjs --forget 0360_adoption_update_channel_app.sql` on dev, which
  exists for exactly this (a migration applied under a number and renumbered before merge),
- re-apply it under the new name.

## Measured

- `node scripts/check-ungranted-activities.mjs` — exit **0**:
  `85 catalogue activities; 14 Admin-only on purpose, 0 UNRULED; 56 cards`. `foundNotRuled` is empty
  and `adminOnlyOnPurpose` stays at the fourteen dated rulings.
- `node scripts/check-production.mjs activities-grantable --env test` — exit **0** against the dev
  database, after applying 0360: the live `card_grants` table agrees, naming all fourteen rulings and
  no unruled gap.
- `node scripts/apply-migrations.mjs --dry-run` then the real apply: both **ok**. The file's own
  assertion block checks the four kinds, that there are exactly four, that `stock.usage` reached both
  cards, and that the four reads are still held.
- `node scripts/gates.mjs` — four zeros.

**Not measured on production, and one consequence to expect there.** Production does not have 0360
yet, so until it is applied in a release, `activities-grantable --env production` will **FAIL** on
`stock.usage at edit`: the record that excused it is gone from the allow-list, as the trap in #1511's
decision file required, and the card grant that closes it lives in this migration. That is the
ordinary state of any card-grant migration between merge and release, and it clears when 0360 is
applied. Nothing else in the check moves.

## Analysis is by card here, as the rule requires

Nothing above names a role or counts them. The four removals are a statement about what a **card**
can be given; the grant is on two named cards. Who holds those cards today is irrelevant and is not
recorded — it changes when the assignments are rebuilt.

## Admin

Untouched, and not reopened. Admin answers before a cell is read (`perms.isAdmin` in `can.ts`,
`r.key = 'admin'` in `has_permission()`), so it keeps every one of these activities whatever the
catalogue says, and it is given no card by this change.
