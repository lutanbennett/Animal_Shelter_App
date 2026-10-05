# 2026-10-05 — Bulk resident loads go through `scripts/load-residents.mjs`, from a CSV, dry-run by default

**Context.** Two bulk loads went into production on 2026-10-04: 38 dogs into the
Brown zone, then 62 into the Blue. Each was done with a script written into a
scratch folder for that load and thrown away afterwards. Three costs showed up
immediately:

1. Every load reviews untested code. The second script re-derived the same
   decisions as the first — intake via `record_intake`, the standard diet, the
   name-clash check — and got a different shape each time (the first wrote rows
   one at a time over REST, so a failure halfway left part of the load in).
2. Nothing could be permitted. Auto mode's classifier judges a command on its
   text alone, and refused the second load outright as a `Production Deploy`:
   a script at a path nobody has seen before, taking a `commit` argument,
   reads exactly like a deploy. The classifier refuses rather than prompting,
   so the user's "I'll approve it when it appears" never got a dialog. The load
   only ran after an allow rule was added for that one literal path —
   `Bash(node *scratchpad/load.mjs commit)`, which matches nothing the next
   load would run.
3. The record of what was loaded was the chat.

**Decision.** One script at a fixed path, `scripts/load-residents.mjs`, taking a
CSV. Dry run is the default; `--apply` is the only thing that writes.

- **Input is CSV, not the review workbook.** The review step produces an `.xlsx`,
  but `exceljs` is not a repo dependency and adding one to read a file a human
  has already signed off is the wrong trade. `scripts/lib/csv.mjs` already
  parses what a sheet exports. The CSV is also diffable and keepable, so what
  was loaded can sit beside the receipt.
- **Columns are matched loosely, extra columns are ignored and reported.** A
  review workbook carries reviewer comments and match notes; requiring them to
  be stripped first would mean editing the file after it was signed off. Only
  `name` is required.
- **A `hold` column keeps a row out of the load.** The duplicate-review
  workflow needs rows a human has not cleared to stay in the same file,
  visible, and be listed as held. Deleting them from the file loses the review.
- **Loading goes through `record_intake`.** Not direct inserts: it is what the
  intake form calls, so placement, diet and intake weight are created the same
  way, and the triggers behind them run.
- **One `begin … commit` for the whole load, with assertions inside it.** One
  resident per row, exactly one open placement each, a diet each, a weight for
  every row that carried one, a code each. Any failure rolls the load back.
  The first load's per-row REST writes could not offer this.
- **A name already in the target database refuses the whole load.**
  `--allow-name-clash` overrides it, for the real case (Tuta, 2026-10-04: "this
  is not a duplicate"). The default is refusal because the cost of a wrong
  guess is a duplicate animal in production, and the cost of the refusal is one
  flag.
- **`--size-from-weight`** uses Small under 10 kg, Medium 10–25, Large over 25 —
  the common vet-guide convention, and the split the Brown zone load agreed.
  There is no official standard, so it is opt-in and the limits are in one
  place in the script.

**Why not make it a migration.** It loads shelter data, not schema. Migrations
are numbered, applied once and never edited; a resident load is run when a
reviewed list is ready, against a file that differs every time.

**Limitations.**
- **Rows load with `created_by` null.** `record_intake` takes its author from
  `auth.uid()`, and the Management API has no user. Both 2026-10-04 loads did
  the same, so this is not a regression, but the audit trail shows these rows
  as having no author. The intake date, the CSV and `--receipt` are the record.
  Changing it means either an `update` after the fact or a loader that does its
  own inserts; neither was worth it for this.
- **`--apply` is not idempotent.** Re-running loads the rows again unless the
  name-clash check stops it, which it will for any row whose name is unchanged.
  There is no match-and-update mode; updating an existing resident is still a
  job for the app.
- Microchip, breed photos and medical history are not loaded — `record_intake`
  takes no microchip, and the rest has no column here.
- `process.exit()` is avoided once `fetch` holds a socket, for the libuv
  assertion `import-appsheet.mjs` already documents. Without that, a refusal
  exits 127 instead of 1 and anything reading the exit code is misled.

**The permission rule this is for.** `Bash(node scripts/load-residents.mjs *)`
in the main checkout's `.claude/settings.local.json`. One rule, one readable
script, and the dry run is what runs by default if the flag is left off.
