# The by-name rule that kept doctors and public viewers off recurring jobs is deleted, not turned into a card

**Decided by Lutan, 2026-10-25**, asked directly whether to delete the rule or make it a card: **delete**. No card was created and there
is no migration.

## What was there

`NEVER_ASSIGNABLE = ["doctor", "public_viewer"]` in `src/lib/recurring-jobs/eligibility.ts` (and `ASSIGNABLE_KEY_FILTER`, built from it)
refused a login by the *name* of its role: it was dropped from the "Assigned to" picker (`loadAssignableUsers`, the recurring-jobs page and
the save check in `actions.ts`), and `canDoJob()` / `loadEligibility()` never counted it. It came from his 2026-09-27 ruling that a vet's
work comes from clinic visits. It was an offer rule only: `reassign_recurring_job()` and `record_recurring_job()` check cards, so the
database never enforced it, and deleting it opens no hole there.

## Why delete

*"Only a card gives access and the only access is what the card needs to perform the advertised activity."* The thing the rule expressed is
already expressible by cards: a role that should not be given recurring jobs does not hold the `recurring_jobs` or `my_tasks` card. The
Doctor role honours the 2026-09-27 ruling by not holding them (dev, 2026-10-25: Doctor holds three cards, none of them these;
`public_viewer` holds none). A card for "never assignable" would only have been a second way to say the same thing.

## What changes

- The picker lists every live login with app access, whatever its role is called. Which of them can do a job that links to a page is
  decided, as it already was for everyone else, by the role's cells for that page (`role_can()`).
- **A job with no link, or one linking to a page that asks for no cell (`/residents`, `/my`), asks for no card, so any login can now be
  given it, a doctor or public viewer included.** Before, they were refused by name even there. If that is not wanted, the way to
  say so is a card that those jobs require, which is its own decision.
- Production has one live `doctor` login, so a shelter user can see the difference: that person now appears in the picker for unlinked jobs.

Removed: the constants, their five uses, the registry's five `never-assignable-by-role-key` records. `scripts/check-recurring-job-eligibility.mjs`
no longer asserts the constants and expects the new answers for unlinked pages (V2, V3, V4, N2, and the `/residents` fixture row).
