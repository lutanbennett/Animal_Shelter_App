# Resident hub: each tile follows the reader's cards (2026-10-26)

**Asked by Lutan, 2026-10-26:** *"show / hide tiles based on a users who does what card access. An example would be administering medication needs to be able to see prescriptions but should not see the residents blood tests."*

## What was wrong

Opening a tile was already card-checked, but the hub drew every tile for everyone. With no read, the database returns no rows, so a Blood tests tile said "0 · none": false, not hidden.

## What changed

- **One map**, `SECTION_READS` in `src/lib/residents/section-reads.ts`: section → the activity it is read under. The section page (`[section]/page.tsx`, via `sectionRead()`) and the hub page (`page.tsx`) both read it; nothing is copied, so a tile cannot be shown that will not open, or hidden that would.
- **The hub draws a tile only when `can(perms, activity, "read")`** (Admin short-circuits in `can.ts`; Admin is given no cards and has no entry anywhere).
- **A tile that will not be drawn is not queried** (`when()` in the hub page): an un-awaited builder never reaches the database. Immunisations skip the compliance read with them.
- **Empty groups go**: with no medical part readable, the Medical heading, the section and the phone's Medical tab are not drawn.

## How the non-medical tiles' activities were decided

The brief noted `SECTION_READS` covered the seven medical sections only. For the rest I read what the section page already enforced: with no entry it falls back to the plain resident read. So Housing, Photos and Adoption updates map to `resident.record`, the activity every hub visitor already holds to open the page. They are listed explicitly so the map is the whole story, with no behaviour change. Sponsorship drives (`appeal.run`) and memes (`social.library`) were already gated where they are read, are not parts of the record, and are left alone. **Diet** stays in the General group (where it was drawn) but takes `medical.diet`.

## Not changed

No role key, no new card, no grant. `check-hard-coded-security.mjs` is unaffected.
