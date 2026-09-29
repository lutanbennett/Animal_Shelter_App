# 2026-09-26 — Standard diet flag, stocktake RPC, `is_known_drive_file` revoked (`0087`–`0089`)

One schema PR for the standard-diet and stocktake features, plus the revoke
that was waiting on 0.5.0.

- **The standard is a flag, not a name.** `diet_types.is_standard` with a
  partial unique index (`where is_standard`), so at most one. Zero is allowed
  (a database where the named row was renamed first). The existing standard
  is found by name only when nothing is flagged yet, so re-running `0087`
  after management moves the standard does not move it back. Moving it takes
  two statements, clear then set: a unique index is checked row by row, so
  one `set is_standard = (id = <new>)` can fail on whichever row it reaches
  first.
- **Diet-less residents were backfilled, not listed.** Default taken at
  planning (2026-09-25), kept by Lutan on the PR (2026-09-26). Every living
  resident with no *current* diet gets the standard from today, with a note
  saying so. It differs from `0069`'s seed on purpose: "no current diet"
  rather than "no diet at all" (an ended diet leaves the resident just as
  unfed today), dated today rather than from intake, and cut off the day
  before a diet that is already booked to start. Dev had four.
  **Addendum, 2026-09-26:** on **production** the backfill touched nobody — a
  read-only count found 0 backfilled rows and 0 living residents without a
  current diet, because all 69 already carried the `0069` seed and there have
  been no intakes since 2024-01-01. The release note describing it was
  therefore dropped from `unreleased` rather than shipped: it described a change
  no shelter user would see. The migration was still right to write — it is the
  guard that makes "every living resident has a diet" true going forward, and it
  did do work on dev.
- **`record_intake` still accepts a null diet.** The intake form still offers
  "None yet" and passes null, so the database cannot refuse it yet. The
  feature half changes form, action and RPC together.
- **`record_stocktake(p_medication, p_diet_types)` is one function for both
  tables**, so a sheet saved across both tabs is one transaction with one
  `stock_counted_at`. It is a plain `update … set stock_on_hand` so `0083`'s
  triggers still stamp: a listed item with an unchanged figure is restamped
  (the sheet's "same as last time" sends the old number), and `now()` is fixed
  per transaction, which is what gives every row the same time.
- **Absent means "not counted"; a null count is refused.** The single cell's
  "blank clears it" stays on the single cell. Letting null into the sheet
  would mix the two meanings the backlog item keeps apart. Negative counts,
  malformed or repeated ids (compared as uuid, so case doesn't hide a repeat)
  and ids not found are all refused before or during the write, and any
  refusal saves nothing. "Not found" also covers a row the caller's RLS hides.
- **The role check is in the function, null-safe, as well as in RLS.** It is
  security invoker, so the `admin_all_*` / `management_rw_*` policies still
  apply. Without its own check a staff caller would get "0 of 2 found"
  instead of "not authorized".
- **`is_known_drive_file` lost authenticated too, not just anon.** The photo
  proxy stopped calling it in #131 (in 0.5.0), and on dev no function, policy
  or view calls it. For a public_viewer or archived login it gave the same
  "yes for any internal file" answer it gave anon. service_role and the owner
  keep it; the harnesses that call it run as the owner.
- Evidence: `scripts/check-standard-diet.mjs` and `scripts/check-stocktake.mjs`,
  rollback harnesses on dev; `scripts/check-public-views.mjs` after the apply.
