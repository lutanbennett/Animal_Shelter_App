# Two checks: activities no card grants, and future-dated decision files (backlog #n5r7k, #p7x2d)

2026-11-06, `claude/card-grant-checks`. No migration.

## Step zero
Neither check existed (`ls scripts`, `git log -S activities-grantable`: only release records mention it). `load-cards.mjs` and `check-cards-count.mjs` were the shape.
The catalogue has **78 activities**; **50 cards** (job cards included) are read.

## `scripts/check-ungranted-activities.mjs`
Resolves grants with `bundleOfCards(CARD_KEYS)` (includes followed, job cards in), so `maintenance.photos` (via `jobs.ts`) counts as granted, which a grep of `cards.ts` would miss.
A yes/no activity needs a grant; a level activity is tested at read and at edit separately, because edit can be ungranted while read is held (`facility.enclosures`).
Admin is not examined and is never given cards. Deliberate gaps are named, dated records in `docs/ungranted-activities-allowlist.json`: `adminOnlyOnPurpose`
(`facility.enclosures` edit, `placement.death_withdraw`, ruled by Lutan 2026-11-06) and `foundNotRuled`. A record whose gap a card now closes fails until deleted.
**Usage for the `social.library` split (#i7qkz): run it and confirm `social.library` is not listed as a FAIL or UNRULED.**

### Found on `main` today: 17 gaps beyond the two rulings (for the planner to file; no cards designed here)
Granted by no card at the level shown: `photos.resident_publish`, `projects.photos`, `projects.publish`, `stock.usage`, `stock.medications`, `stock.diets`, `stock.correct`,
`reports.cashflow`, `reports.expenses`, `system.status`, `maintenance.delete`, `appeal.medical_photo`, `roles.view`, `resident.who_and_where`, `photos.resident_medical` (all at edit),
and `reference.types` at **read and edit**, so nothing in the card system reaches it at all. Some edit levels may have no control; that is for whoever rules on each.
These are listed as `UNRULED` on every run and do **not** fail it. The check fails only on a gap on neither list.

## `scripts/check-decision-dates.mjs`
Reads files this branch **adds** under `docs/decisions/` (git added list against the merge-base with `origin/main`, plus untracked) and refuses a date after today.
Today is the later of the UTC and Asia/Bangkok date. `docs/releases/` is not looked at. Existing files are not judged.

## Rename: done
Six files were future-dated, not two (`2026-11-07-` x3, `2026-11-08-` x3). Citations: about 15 references in 6 files, a handful, so renaming was right. All six are now `2026-11-06-<same slug>.md`
and the citations in `docs/backlog.md` and four `docs/test-plans/` files follow. **One citation is left:** the comment in applied migration
`0319_profile_photo_medical_and_approval_guards.sql` (applied files are never edited); it names the old filenames.

## Wiring: both BLOCK in CI
`ungranted-activities` is green on `main` because every existing gap is a named record. `decision-dates` is green on `main` because no file is added there. Neither is a required check in branch protection (that is Lutan's call).
Proof of failure: a planted `2026-12-31-planted.md` failed the date check; removing the two rulings from the list failed the ungranted check naming both. Both planted cases removed.

## Release note
`n/a`: no shelter user would notice a check script.
