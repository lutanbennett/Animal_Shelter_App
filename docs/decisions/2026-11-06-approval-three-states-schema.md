# 2026-11-06 — approval flag, schema half (`#7aev4`, migration 0318)

**What shipped:** `attachments` gains `private_only_at` / `private_only_by` and a generated `approval` column:
`public_ok` (approved_at set), `private_only` (refused), `NULL` (not reviewed). One answer at a time (check constraint
plus the stamp trigger, which clears the other when one is chosen, stamps who/when in the database, and needs
`can_approve_photos()` from a signed-in caller).

**Why `approved_at` keeps its meaning.** Every public view, `is_public_drive_file()`, the queue and the running app already
ask `approved_at is not null`. Keeping that as "Public ok" makes the back-fill the identity (dev: 403 rows, 399 public_ok,
4 not reviewed, 0 private_only; nothing moved), changes no view, and means a Private only photo cannot reach anon because
its `approved_at` is null. The alternative (a new column every view must test) risked emptying the site if one view was missed.

**Not done here, deliberately, both waiting on numbers Lutan must see first:**

1. Removing 0217's approve-on-save (Lutan, 2026-11-05: "Every photo and any text will be reviewed by the Director"). It
   changes what goes live on save and rewrites the assertions of `check-photo-approval`, `check-adoption-media-approval`
   and `check-fundraising-events-schema`. Medical stays excluded (his answer); `medical_ok` stays that photo's only gate.
   Script-written (`auth.uid()` null) photos would land blank and need the Director's queue. Weekly volume still to be counted.
2. The `ready_for_adoption` to `is_public_visible` link, both ways, as a trigger on the tick changing (never an equality
   or a back-fill), and the production counts of ready-but-not-visible animals.

Other content types (adoption-update media, events, projects, appeals) all ride `attachments.approved_at`, so they carry
the three values already. Any table that is public without `attachments` is still to be enumerated in the app half.
Page management is untouched. Videos are `attachments` rows and are covered.

**App half outstanding:** the Private only control on every approval screen, and a queue that hides Private only.
