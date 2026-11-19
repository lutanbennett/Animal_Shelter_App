# Two shelters, two Google Drives: the upload proof (#cn7gk, last clause)

**Date:** 2026-11-19 · **Branch:** `claude/cn7gk-upload-proof` · **Code changed:** none. This is a proof, plus its record.

## What was proved
The item's done-when was *"two shelters upload to two different Google accounts and neither can read the other's folder, proved on dev with two real accounts."* The
isolation half was proved earlier the same day (each account's token is refused `HTTP 404` on the other's folder). This closes the **upload** half.

1. **How the running app decides which shelter it is** (read, then confirmed by running it). `actingShelterId()` (`src/lib/supabase/acting-shelter.ts`) takes the
   `x-shelter-id` header, and on `next dev` only, `DEV_SHELTER_ID` from `.env.local`. Both Drive readers use it and nothing else:
   `resolveDriveCredentials()` (the account) and `driveRootFolderId()` (the folder). So **pointing `.env.local` at the shelter is enough**; no other setting
   picks the shelter at upload time. A login must also belong to that shelter, which `dev-signin` arranges because it sends the same variable.
2. **Shelter 2.** With `DEV_SHELTER_ID` set to `test-shelter-2`, a login holding the `residents` and `add_photos` cards posted a PNG to the real route
   `POST /api/residents/<id>/photos` against a disposable resident of that shelter. The file was then **found by name with that shelter's own credentials** (a Drive read, not
   the route's reply): Google account `lutan.bennett3`, path `My Drive / CooperJaidee / Residents / <resident> / Photos / Shelter / 2611 / <file>`.
3. **Lanna (the negative).** The same upload as Lanna, restarted on Lanna's id with its own login and resident, landed in `lannaanimalfoundationbwm`'s Drive under
   Lanna's dev folder. Read back the same way: Lanna's account holds the Lanna file and **not** the shelter-2 file; shelter 2's account holds **neither** Lanna file nor
   (when asked by name) anything of Lanna's. So neither shelter's photo reached the other's account.
4. The two Google accounts differ, the folders differ, and the credentials used came from `shelter_drive_credentials` for shelter 2 and from the environment fallback for
   Lanna, exactly as `docs/decisions/2026-11-18-per-shelter-drive-app-half.md` designed.

## What it did NOT establish
- **The route answered `500 "You don't have permission to do that."` for both shelters**, after the Drive upload: the `record_attachment` step refused the cards the test login
  held. It is the same for Lanna, so it is not about the shelter, and the Drive destination is not affected (the file is in Drive before that call). The proof is of **where the
  file lands**, not of a clean end-to-end 200 with the attachment row written. Which card the refusal wants was not chased; for the planner to file if it matters.
- No browser **page** was driven: the upload was a `fetch` from a signed-in page in the built-in browser, which avoids its `requestAnimationFrame` trap but is not a click on the photo form.
- Only photos were tried. Other upload paths (videos, reports, bills) use the same two readers but were not each driven.
- Scope of the Google grant: see `#dscop`.

## Left behind on dev (disposable)
Two residents ("Proof Dog …", one per shelter), their folders and one small PNG each in the two Drives, and two `dev-signin` logins. Nothing was removed or renamed on
`proof-b`. The folder ids are not recorded here: the repository is public.

## How to repeat it
Set `DEV_SHELTER_ID` to the shelter, run `node scripts/dev-signin.mjs --cards residents,add_photos --port <port>`, post a file to the photo route as above, and read the
file back with that shelter's decrypted credentials (`DRIVE_CREDENTIALS_KEY`).
