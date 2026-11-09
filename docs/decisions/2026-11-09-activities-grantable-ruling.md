# `activities-grantable` judges the live gaps against the dated rulings (2026-11-09)

Backlog `#av8rq`. Branch `claude/activities-grantable-ruling`.

## The problem

`node scripts/check-production.mjs activities-grantable` exited 1 on every run, on production and on dev, listing ten
activities as *"no card grants it, so only Admin can ever do it"*. At least one of them, `maintenance.delete`, is
Admin-only **by a ruling** (Lutan, 2026-10-28: *"Only admin can delete maintenance, keep it that way"*), and
`fault-maintenance-delete` in the same file asserts that no card grants it. Two checks in one file disagreed about the same
row, and the one that always failed was the one a reader learns to skip.

**Lutan chose shape (a) on 2026-11-08:** the check carries the activities ruled Admin-only with each ruling's date, exits 0
when the set matches, and fails loudly when one joins or leaves it.

## The hypothesis: does the SQL under-count grants? No (measured on dev, 2026-11-09)

The brief suspected that reading `card_grants` literally misses grants that arrive through `card_includes` or through
`jobs.ts`. Measured against **dev** (`qxkmhwybjggxvsfxsxbd`) on 2026-11-09, for all 83 catalogue activities, the highest level
granted was **identical** three ways:

| Source | How |
|---|---|
| literal | `max(level)` from `card_grants` per activity |
| closure | every card through `card_closure()` (follows `card_includes`), then `card_grants` |
| app | `bundleOfCards(CARD_KEYS)` from `cards.ts` via `scripts/lib/load-cards.mjs` (includes and job cards followed) |

`activity-level diffs: 0`; the database and `cards.ts` both hold the same 55 cards and the same 83 activities with the same
kinds. That is also what the schema predicts: an included card's grants are rows in `card_grants` under the included card, so
following an include can never reach an activity that no `card_grants` row names. Job cards are seeded into `card_grants`
like any other card (`maintenance.photos` is present in it). **So none of the ten rows was a measurement error.** Production
was not read (a worktree cannot); the same measurement there is not established.

## What the "17 against 10" actually was

Not dev against production. **Dev returns the same ten as production** (run on dev 2026-11-09 with
`--env test`: the identical ten names). The difference was granularity:

- `activities-grantable` asked per **activity**: is there any `card_grants` row at all?
- `check-ungranted-activities.mjs` asks per **activity and level**: an activity granted at read but never at edit is a gap
  at edit.

The 19 records in `docs/ungranted-activities-allowlist.json` are nine yes/no activities at edit, `reference.types` at read
and edit (the ten), plus eight level activities granted at read and never at edit (`facility.enclosures`,
`stock.medications`, `stock.diets`, `reports.cashflow`, `reports.expenses`, `roles.view`, `resident.who_and_where`,
`photos.resident_medical`). **The old check was blind to those eight**, which is a real defect: it would never have noticed
a card losing its edit grant while keeping read.

## The choice: keep `activities-grantable`, give it the allow-list (not retire it)

The two checks now share one verdict function, `scripts/lib/ungranted-allowlist.mjs` (`compareToAllowlist`), and one
allow-list file. Each computes its own gaps and hands them over:

- `check-ungranted-activities.mjs` from `cards.ts` (blocking in CI, every PR);
- `activities-grantable` from the **live** `card_grants` and `permission_activities`, per level.

**Why not retire it:** the live read is the only one that sees a grant edited on Settings → Who does what, which writes
`card_grants` directly and never touches `cards.ts`. Retiring it would leave production's actual card set unchecked
between releases. The cost of keeping it was only the disagreement, and sharing one verdict removes that.

**What "matches" means.** A gap on `adminOnlyOnPurpose` prints as a dated ruling. A gap on `foundNotRuled` prints as
`UNRULED` every run and does not fail: it is known, recorded with the date it was found, and waiting on a ruling. A gap on
**neither** list fails (an activity joined the Admin-only set). A record whose gap has closed fails (an activity left it).
This is the allow-list's existing rule from 2026-11-06 (`docs/decisions/2026-11-06-card-grant-checks.md`), applied to the
live check too. Making the sixteen unruled ones fail would put the check straight back to failing every run until each is
ruled, which is the fault this item exists to remove; they stay loud by being printed, not by failing.

## `maintenance.delete`: recorded, not ruled

Moved from `foundNotRuled` to `adminOnlyOnPurpose` with `ruled: 2026-10-28, by: Lutan`. This records the ruling he already
made (`docs/card-access-faults.md`; backlog `#539b8`); it makes no new one. `fault-maintenance-delete` and the allow-list
now agree: both pass on dev, and a card granting `maintenance.delete` would now fail both (the allow-list's *"which a card
now grants"* and the fault check's own row).

The other sixteen are left in `foundNotRuled`: each is Lutan's to rule, a card or Admin-only.

## The planted failure (dev, 2026-11-09)

Plant: the `stock.usage` record deleted from the allow-list (an activity **joining** the Admin-only set unrecorded), and a
ruling added for `maintenance.jobs` at read, which a card grants (an activity **leaving** it). Both checks exited 1 and named
both:

```
FAIL stock.usage at edit is granted by no card (Admin only) and is not on the allow-list
FAIL allow-list names maintenance.jobs at read, which a card now grants: delete the record
NOT CLEAN: 2 difference(s) from the ruled set above
```

The plant was undone with `git checkout`; both checks then exited 0. `scripts/check-production.test.mjs` now asserts the
same three outcomes (exact match passes, joining fails, leaving fails) on every `npm test`.

## What remains

Production: `node scripts/check-production.mjs activities-grantable` should exit 0 and end
`ok   the live Admin-only set matches the allow-list`. **Not run from this worktree.** Dev and production gave the same ten
activity-level rows in the `0.43.6` record and today, but the per-level gaps on production are not established. If
production differs, the check names the row, which is the point.
