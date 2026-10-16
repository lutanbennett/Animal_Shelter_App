# 2026-10-16 — Appeals schema (0210): what counts as "raised", Medical photos, and over-raising

**Context.** Sponsorship drives for sick residents (backlog, Lutan 2026-10-09, priority 2026-10-15) are three
streams: this schema half, then the public pages, then the staff side. This PR adds `appeals`, `appeal_photos`,
`donations.designation_appeal_id`, the `public_appeals` and `public_appeal_photos` views and the `appeal.run`
activity. **Nothing in `src/` reads any of it yet, so nobody can see or create an appeal when this merges.** The
backlog item is deliberately not ticked.

**1. Which gifts count towards "raised".** Only gifts designated to *this appeal*: `designation = 'appeal'` and
`designation_appeal_id = appeals.id`. Gifts designated to the resident do **not** count, even while an appeal is
live. A resident-designated gift may be for food or an earlier treatment; putting it on the bar would show money a
donor did not give for this, and the figure has to be one a donor can check against their own gift. The cost: gifts
recorded against the resident *before* the appeal exists (Chao Guay 2's biopsy fund) must be re-designated to the
appeal by staff once it is created. The staff half should offer that as a single step. Raised is the sum of
`donation_lines.amount`; an in-kind line has no amount and adds nothing. `raised_as_of` is the newest
`donations.created_at` for the appeal, so the page can say when the figure was last updated.

**2. Over-raising.** The schema allows raised to exceed the target; there is no cap and no check (asserted by
`check-appeals-schema.mjs`). The public page must state where the extra goes, the shelter's choice, in words, and
show the bar full rather than broken. That wording belongs to the public half.

**3. Medical photos stay off appeals.** An appeal may show only non-Medical image files of its own resident.
Enforced at write time (`appeal_photos_guard`, security definer so the caller needs no read on `attachments`) and
again at read time in both public views, so a photo refiled to Medical *later* leaves the public site and the
photo proxy at once (`is_public_drive_file` gained a `public_appeal_photos` branch). The alternative, an explicit
per-photo "show on this appeal" override for Medical photos, was considered and **not built**; if someone wants a
wound photo on an appeal, that is a decision for the item, with its own record, never a silent exception.

**4. Graphic content.** `appeal_photos.is_graphic` is a per-photo flag; the public views carry it (and
`cover_is_graphic`) so the page can blur behind a warning. Setting it is the staff half's job.

**5. No role gets `appeal.run` by default except Admin.** The brief said no new card, and
`check-cards-schema.mjs` requires every Management cell to come from a card or an extra, so a Management grant
would turn that check red. Admin holds every cell without a row. Delegating it is a Settings change, or a decision
for the staff half. The paper table (`docs/roles-and-permissions.md` §4) records the row, and the counts in
`check-permission-tables.mjs` and `check-permission-parity.mjs` move from 62 to 63 activities. A probe was added
to `scripts/lib/permission-probes.mjs`.

**6. Anon never sees a donor.** `public_appeals` selects a SUM and one timestamp from `donations` and
`donation_lines`; it names no donor, contact, note or method. Nothing records a donor's consent to be named, so no
names at all. `check-public-views.mjs` now lists both views, and `check-appeals-schema.mjs` asserts the view has no
`donor_name` column and that anon cannot read `donations` or `donation_lines`.

**7. Smaller choices.** Social-post links live in `appeals.social_links text[]`, https only, at most ten, checked
by `appeal_links_ok()` (the app validates first, through `src/lib/links/validate.ts`). `closed` needs an outcome
note. A draft cannot be `published`. An appeal with gifts cannot be deleted (`on delete restrict` on the gift's
column). `donations_appeal_designation` (appeal designation if and only if an appeal id) is `NOT VALID`: old rows
are not re-checked, every new or changed row is. A public appeal needs its resident to be `is_public_visible`; a
deceased resident's appeal can still show its outcome note.

**Verified.** `node scripts/check-appeals-schema.mjs`: 47 assertions under real admin, Management and anon
sessions, rolled back. `check-public-views.mjs` lists both views as anon-readable and unwritable.