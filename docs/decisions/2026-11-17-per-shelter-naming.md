# Per-shelter naming (Part 8 slice 2, #b4cmn)

Extends `2026-11-17-per-shelter-settings.md` (slice 1, the Drive folder); same shape.

- **Two columns, `shelters.display_name` and `short_name` (0400),** read by `shelterNames()` beside `driveRootFolderId()`. Each falls back to `DEFAULT_SHELTER_NAMES` (`src/lib/shelter-names-default.ts`, no imports so `scripts/deploy.mjs` can load it). Lanna's values are filled by the migration.
- **Converted:** layout title (`generateMetadata`), release mail (`buildReleaseMail` now takes the names; deploy passes the defaults, a laptop has no request), status-mail sender and subject fallback, supplier-mail sender, resident summary PDF, archive index page, manual PDF (the prebuilt full manual uses the defaults).
- **Left on purpose:** `two-step.ts` authenticator issuer: the string is stored in every enrolled person's app, so changing it would change new enrolments only and leave old ones reading the old name; a per-shelter value is a later, deliberate move. `cart.ts` `lanna-merch-cart`: a storage key, not a name; changing it empties open carts. `mirror-read.ts` `SHELTER_DEFAULT = "lanna"`: a shelter key, Parts 4/5. Download file names, the backup prefix, `donations/issuer.ts` (Part 7's receipt issuers).
- **Public nav labels** come from the dictionaries, not `PublicNav.tsx` (its hit is a comment); dictionary prose stays recorded.
- **Proof Lanna is unchanged:** `check-shelter-settings.mjs --env` compares the stored names to the literals replaced; `release-mail.test.mjs` compares rendered text, not bytes (PDFs embed timestamps).
- **The check:** `check-no-lanna-literal.mjs`, in CI's `check` job, fails on any unrecorded file naming Lanna. 32 files are recorded with reasons.
