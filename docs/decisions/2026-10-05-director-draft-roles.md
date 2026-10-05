# 2026-10-05 — The Director's first draft, loaded on test (`director-draft-roles`)

Backlog: "Apply the Director's first draft of who does what, so she can see each role as it would be
(dev/test first)". **The item stays open**: it is done when she has looked at each role and signed the
draft or marked changes, and the agreed cells are ready for production as their own step.

## What this is

- **The draft is data.** `src/lib/roles-draft/draft-1.json` maps each of the sheet's 57 rows to its
  catalogue key(s) and the level a tick means, lists each role's ticks, the four marks that were not
  ticks, and the reads a tick starts from. `resolve.ts` turns it into cells; the loader, the review
  page and the summary PDF all call it. Draft two is a diff of that one file.
- **`scripts/load-role-draft.mjs`** writes the cells for `second_in_command`, `head_of_maintenance`,
  `head_of_medical`, `volunteer` and `vet` and prints every cell that changes. Dry run by default;
  `--apply` writes. A **replace**, not a merge: a named role ends up with exactly the draft. Management,
  Staff, Admin and the public viewer are untouched. `--env production` is refused without
  `--allow-production`, and even then it is not meant to run until she has approved.
- **Credentials.** `role_permissions` takes writes from an admin at `aal2` only, but that is RLS. The
  script goes through the Supabase Management API with `SUPABASE_ACCESS_TOKEN`, as `apply-migrations.mjs`
  does, which runs as the database owner. No login or 2-step code is involved.
- **Audit.** The table carries the `audit_log` trigger. The first load changed 46 cells and wrote
  **46 `audit_log` rows with no actor** (a script, not someone in Settings).
- **No migration.** Since `0132` a role's cells are rows.

## The preview: summaries first, then `/home`

Lutan chose "start with summaries, then extend `/home/[role]`". `/admin/role-draft` (Admin only,
English only: it is a one-reader review aid that goes when the draft is signed, so its words are not in
the dictionaries) shows each role in plain words: what it can do, what it cannot (kept, in a closed
list, not hidden), the notes, the marks that were not ticks, and its home tiles. It reads the cells as the
database holds them, and says so at the top if test does not hold the draft. `/home/[role]` links to the
role's section. **Previewing never acts as the role**: both pages are Admin-only reads. Extending
`/home/[role]` to menus and per-page buttons is a follow-up. A per-role summary PDF for her to mark up
as draft two is made by `scripts/role-draft-pdf.mjs`.

## Her scan, read twice

I read the scan page by page and it agrees with the backlog's transcription on every row. The four
marks, loaded as **no** as the item says: volunteers row 1 (dot), 2IC row 11 (dot), 2IC row 39
(scribbled out), Head of Medical row 49 (faint stroke). Lutan: loaded as no, listed on the preview.

## The reads a tick starts from (c)

The catalogue's `requires` is empty, so "the dependencies are managed by the system" has nothing to
read yet. The draft file carries two **implied** reads instead, shown apart from her ticks:
`resident.record` read (record a weight, move a resident, set a microchip all start from a resident)
and `facility.enclosures` read (the map is drawn on the enclosures page; moving picks an enclosure).
They were already held by every role they apply to, so on this load they **added no cell**; they stop
a later draft from removing them by omission. Not added, on purpose: the Head of Medical's medication
list. Her sheet has no prescriptions or "view residents" tick, so loaded as ticked the medication list,
diet and photo tiles go. That is a question for the Director, not a gap to fill silently.

## Where the draft meets earlier decisions

- **(a) Volunteers.** Row 1 (view residents) was a dot: loaded as no, so they **lose** the residents
  list (they had `resident.record` read since R1). Row 47 is ticked: `recurring.do_own` is loaded and
  the database now **allows** `record_recurring_job()` for a volunteer, because the function asks the
  cell; it refused only because no cell gave it. Whether a volunteer should hold it is Lutan's call.
- **(b) Vets** get the microchip and the read it starts from, nothing else: they lose booking, visits,
  prescriptions, procedures, blood tests, immunizations, weights, diets, photos and adopter news. A
  doctor login can set a microchip and see nothing clinical.
- **(d) 2IC** may prescribe, record immunizations, weights and diets but not book or record a vet
  visit, procedures or blood tests, nor register a resident. Worth a second look.
- **Rota.** `rota-eligibility` (`0146`) merged first and is on the test database, so row 47 is
  honoured for all four roles.

## What it does to the checks, on the test database

The scripts that assert the *previous* cells now go red against test, and should: `check-medical-role`
(the Head of Medical's bundle differs from `jobs.ts`), `check-maintenance-role`, `check-2ic-role`,
`check-volunteer-narrowing` (a volunteer now may record a recurring job), `check-permission-tables`
(cell counts) and `check-permission-parity` (27 mismatches, all in the cells above). They are the
before-picture of what changes; they go green again when production and the checks are updated for the
approved draft, or a draft that restores the old cells is loaded. **Do not "fix" them against
test until she has decided.**
