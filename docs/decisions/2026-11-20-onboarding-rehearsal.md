# 2026-11-20 — Onboarding runbook rehearsal (`#onbrb`): driven on dev, three faults found

**Step zero.** The gap was still there: the 2026-11-19 pass could not press the console (no aal2). Today `scripts/dev-signin.mjs --aal2`
(#dvaal) and #1750 / #1752 made it runnable, so the runbook was followed literally on a throwaway shelter.

**What was created on the shared dev database, and cannot be removed** (a shelter owning any row cannot be deleted, by design):
shelter key `rehearsal-2026-11-20` ("Rehearsal Shelter (disposable)"), host `rehearsal-2026-11-20.example.invalid` (a throwaway; the one real
value named), one first-Admin login `rehearsal-admin-2026-11-20@example.invalid` (temporary password shown once, not recorded), receipt
letters `ZRH`, and one `dev-signin-admin-s1f1618@example.invalid` login on that shelter. `lanna` and `test-shelter-2` were not touched.
Browser driven about 20:04 to 20:12 UTC on 2026-11-20 (a measurement by another stream near then may be off by that).

## The rehearsal log, Steps 1 to 9

| Step | What was done | Seen | Document right? |
|---|---|---|---|
| 1 Create the shelter | Opened the console, pressed Create shelter, Save names, Add address, Give it an Admin role, Create a login, Set receipt numbers | Each press worked; checklist ticked in order; Starting content already ticked on creation | **No: wrong address.** The console is `/platform`, not Settings → Product admin or `/admin/product-admin`. Wrong claims removed: "screen cannot create a login", "paste an account id" (it is the email now). Rewritten. |
| 2 Cloudflare | Not done | | `[LUTAN ONLY]`. pending: Lutan, needs his Cloudflare account. |
| 3 Google account | Not done | | `[LUTAN ONLY]`. pending: Lutan, needs a Google account he creates. |
| 4 Connect the Drive | Ran the script on test with no secrets | `Missing or malformed: OAuth client id, OAuth client secret, refresh token`; stored nothing; a harmless Node warning prints first | Right; warning noted. The secrets half is pending: Lutan. |
| 5 Connect the calendar | Same | Same refusal | Right. |
| 6 Names, receipts, lookups | Names and receipts done on the console (Step 1). Settings page loaded as the new shelter's Admin | Four lookup tiles (blood test, immunisation, procedure types, units) present; no Group origins tile; page says Drive "not connected" | Names and receipts notes were **stale** (#1752, #rcpfm) and are deleted. Group origins note **still true**, kept. The **Add** presses were not driven. |
| 7 Roles and cards | Settings → Who does what, as the new shelter's Admin | **Crash:** `Who does what: invalid input syntax for type uuid: ""` | **No: cannot be followed today.** See fault 1. |
| 8 Deploy | Not done | | `[LUTAN ONLY]` for production. pending: Lutan, a released `main` and his deploy command. |
| 9 Check it | Items 1, 2, 3, 6 | Sign-in page title is the shelter's name; the header badge still reads **LCA**; Settings says no Drive connected; the console lists the shelter with a full checklist | Item 2 said "header shows the shelter's own name": corrected. Items 4 and 5 need Steps 4 and 8: pending. |
| Leaving | Ran `shelter-export.mjs` with a misspelled flag, then correctly, then `--prove` | The flag is refused by name; no recipient key on this machine; `--prove` refuses (fault 2) | Rewritten. |

The console's checklist order (host, role, login, receipts, defaults) matches the runbook's order; the runbook's "step" numbers are
shelter-level, the screen's are the first six, so the document now says to work down the checklist.

## Faults found, not fixed (the band stops at the report; for the planner to file)

1. **`/admin/who-does-what` crashes on a new shelter.** `src/app/admin/who-does-what/roles.ts` `loadRoles()` filters `kind <> 'fixed'`, so a
   shelter whose only role is the console-made Admin has none; `page.tsx` then queries with `role?.id ?? ""` (an empty uuid) and throws. The
   page that makes the first role cannot open. Blocks Step 7 for every new shelter.
2. **`shelter-export.mjs` refuses on every database now**: `product_admin_login_grants`, `product_admin_lookups` and `product_admins` have no
   `shelter_id` and no `exportTreatment` in the registry. The shelter-leaving step cannot run, and the registry check is doing its job.
3. **The Drive and Calendar lines on the console say "the shelter's own Admin does this in its Settings"**, but Settings only shows status
   (`DriveStatus.tsx`, `CalendarStatus.tsx` have no control). Connecting is Steps 4 and 5, in a terminal. Wording in
   `src/lib/i18n/dictionaries/en.ts` (`driveNotStarted`, `calNotStarted`).
4. **The header badge reads "LCA" on every shelter**: `t.header.shortName` is a fixed dictionary word (`src/app/AppHeader.tsx:105`), not the
   shelter's `short_name`. The sign-in page title does use the name.
5. **Observed, not investigated:** the new shelter's My tasks showed "5 waiting for a role" access requests. They may be people with no
   shelter yet, or another shelter's rows; not established.
6. `scripts/dev-signin.mjs admin` with no `--shelter` fails (`PGRST116`, four rows) once several shelters have an `admin` role, as the
   2026-11-19 console decision already recorded; `--shelter lanna` is the working form.

## Button rule, read as a walker (deliverable 9)

Found, not fixed: on the console's Create a shelter form the two inputs have **no accessible name** (the visible labels are not associated),
so a screen reader reads two unnamed boxes; likewise the receipt fields. `src/app/platform/ProductAdminPanel.tsx`. Not a card-gating fault:
every write control was drawn only at aal2 and the lookup controls only for the Admin; nothing was drawn for a login that could not use it.

## Tags re-checked

Step 1 stays `[ADMIN SCREEN]` (product administrator): it now covers names, the first login and receipts, which were `[TERMINAL]`/a developer
before. Step 6 is now `[ADMIN SCREEN]` for the same reason. Steps 2, 3 and 8's production half stay `[LUTAN ONLY]`; 4 and 5 stay `[TERMINAL]`.

## Cost in time (a person following the document)

- **Parts anyone can do:** Step 1 and Step 6's console half, about **five minutes** of clock (20:04:20 to 20:08:15 on the stamps taken, with
  a few seconds per press). Steps 4 and 5 are a few minutes each once the three secrets exist.
- **Parts only Lutan can do, not timed:** Step 2 (Cloudflare record and a `wrangler.jsonc` change), Step 3 (a Google account, a Drive folder, a
  calendar, an OAuth client and two tokens) and Step 8 (a release and the production deploy). Those are his own time and a release's, so this
  rehearsal cannot say whether the whole is an afternoon or a week; **the console half is minutes, the Google and Cloudflare half is the
  bulk, and two faults above (7 and the export) need a developer before it is a no-Claude job.**

## Screenshots

`runbook-settings-lookups` and `runbook-who-does-what` were registered in `scripts/manual-screenshots.mjs` beside `runbook-product-admin`.
**The capture is deferred** to the full manual re-run at the end of the batch; nothing was captured by hand.

## Not ticked

`#onbrb` is **not ticked**: Step 7 and the shelter export are faults, so a person cannot finish alone. Its title now says so (backlog branch).
