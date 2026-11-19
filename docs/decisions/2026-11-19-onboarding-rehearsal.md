# 2026-11-19 — Onboarding runbook rehearsal (`#onbrb`): partial, and where it stopped

**Step zero.** The gap was still there: `NOT YET POSSIBLE` answered at the six notes the brief named (plus the two
instruction lines, left alone). Merged work read: #1714 (create a shelter, map addresses), #1716 (Admin role, link a login),
#1728 / `0416` (default rows, `product_admin_set_shelter_receipts`).

## The six notes

| Was line | Verdict |
|---|---|
| 77, 85 (Step 1, create shelter and host) | **Closed.** Rewritten as a screen step (`[ADMIN SCREEN]`): create, add address, Admin role, link a login. Not pressed (see below). |
| 246 (names, `display_name`/`short_name`) | **Still true.** The create form sets only `key` and `name` (`0416`); no screen or script sets the two name columns. Note kept, narrowed. No backlog item exists; for the planner. |
| 254 (receipt series) | **Still true as a step, changed in kind.** `product_admin_set_shelter_receipts` now exists, but nothing calls it, so Lutan cannot press it. Note kept. Waits on a form (planner's to file, brief deliverable 12). |
| 267 (bill kinds, frequencies, group origins) | **Two of three closed.** Bill kinds and frequencies are seeded at creation. **Group origins** still has no screen and is not seeded. Note kept for that one. |
| 402 (a shelter leaving, removal) | **Still true.** No function deletes a shelter; unchanged. |

Step 6 was rewritten from `0416`: what is seeded (8 site pages with empty bodies, 4 stat switches, 14 bill kinds, 10 frequencies) and
what is **not** (`group_origins`, `donation_channels`, `site_content`, cards; also blood/immunisation/procedure types and units).

## What was rehearsed, and what was not

- **Run for real, on dev, from this worktree:** `connect-shelter-drive.mjs` with no secrets refuses with
  `Missing or malformed: Drive folder id, OAuth client id, OAuth client secret, refresh token` as Step 4 says.
- **FAULT FOUND, not fixed:** `connect-shelter-calendar.mjs` dies at start with `ERR_MODULE_NOT_FOUND`
  (`src/lib/google/shelter-drive-decide.ts` imports `./drive-credentials-crypto` with no extension; the Drive script loads the same file and
  starts). So Step 5 cannot be followed today. The runbook now says so. A code fix is outside this stream (`src/`); for the planner.
- **Not driven: every press on `/admin/product-admin`** (create-a-shelter, map-an-address, Admin role, link a login, step-up return).
  They need `aal2`; a `dev-signin.mjs` login is `aal1` and is not on the product-administrator list. Getting past it means standing up an
  authenticator, which the brief priced out. **`pending:` in the test plan, with that reason; it is not an app fault.** The Step 1 and Step 9 text
  comes from the screen's own dictionary strings (`src/lib/i18n/dictionaries/en.ts`, `productAdmin`) and the migrations, not from buttons pressed.
- **Not rehearsable by a stream:** Step 3 and the secrets of Steps 4 and 5 (Google account), Step 2 (Cloudflare), Step 8 (production deploy).
- **No shelter was created on dev, so nothing was left behind.** `test-shelter-2` and `proof-b` untouched; no credentials borrowed.
- Side observation: `populate-shelter-settings.mjs --help` ignores `--help` and ran its normal report ("lanna: already set"); it wrote nothing.
  The runbook does not name that script.

## Cost in time

About 20 minutes of one session to read, check scripts and rewrite the document. **That figure is not the answer Lutan asked for:** the
presses were not driven, so the time to onboard a shelter is **not measured**. What can be said: the document is now followable up to Step 4;
Step 5 is blocked by the crash above; names, receipts and group origins still need a developer, so today it is not a no-Claude job.

## Still not established

Whether the four presses work and read well; the step-up return; Steps 7 to 9 against a created shelter; whether a new shelter shows its own
name in the header (names unset, Step 6). `#onbrb` is **not ticked**: the rehearsal clause is not met, and screenshots are the planner's batch.
