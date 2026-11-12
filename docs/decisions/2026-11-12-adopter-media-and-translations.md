# 2026-11-12 — Adopter photos and video, the size limit and upload state, and the Translations route (#l5gxn)

Built to `2026-11-11-adoption-updates-schema.md` and on top of #1513 (`2026-11-12-adopter-update-app.md`, words only).

## The route's shape (deliverable 1)
Three route handlers under `src/app/adopter-update/media/` — `photo`, `video/start`, `video/finish`. They live under `/adopter-update` on purpose: the proxy already lets an adopter login reach that path and nothing else, so no proxy change was needed. The staff routes (`/api/residents/[id]/photos|videos`) are untouched; they ask `resident.adoption_news`, a card an adopter does not hold.

The sequence is: `sendAdopterUpdate` creates the words row first (now returns its id; words are optional when files come with it), then the browser sends each file against that update id. Every step asks **one** gate, `loadOwnUpdate()` in `src/lib/adopter/media.ts`: verified email -> live contact (`loadAdopterScope`), `adopter_may_submit(contact, resident)` (0357), and the update must be this contact's own `channel = 'app'` row about that resident. Anything else answers *"We cannot send news about this animal from this sign-in."* before Drive is touched. A cap of 6 files per update is checked at each step.

**No migration for the media itself.** `record_attachment` asks `has_permission()`, which is false for an adopter, so it is not called. Instead `recordAdopterFile()` does the one `attachments` insert in TypeScript with the service role, after the gate. It never names `approved_at`: `attachments_approval_stamp()` (0346) forces a resident file to be born unapproved whoever inserts it, so it cannot reach `public_adoption_updates` or `is_public_drive_file`. It sets no profile photo (that step in `record_attachment` needs an approved file). This is the shape Lutan ruled on (2026-11-12) rather than a new SQL function.

**Service-role call sites recorded** under `serviceRoleSites` in `docs/hard-coded-security-registry.json`, each with its gate: `src/lib/adopter/media.ts`, `media/photo/route.ts`, `media/video/start/route.ts`, `media/video/finish/route.ts`. Neither check script was changed. The precedent is the one Lutan's ruling cites: `account/password/actions.ts` — a signed-in person acting on their **own** data through a narrow service call after a check the code performs. The ruling is narrow: an adopter on their own adoption, nothing broader, and nothing about the portal (#d6wxo).

## The size limit and the upload state (deliverable 2)
- **Photos 15 MB**: the existing `MAX_UPLOAD_BYTES`, which is what the Worker and the proxy let a request body through at. A phone photo is 2–6 MB.
- **Videos 150 MB** (`ADOPTER_MAX_VIDEO_BYTES`), lower than staff's 500 MB. Basis: a 1–2 minute phone clip at 1080p is roughly 60–150 MB (a reasoned estimate, **not measured on a phone**); the video goes straight to Drive in 8 MB resumable chunks, so the Worker body limit does not apply and a dropped connection resumes. 150 MB was chosen so a weak mobile connection finishes in minutes rather than the 500 MB's much longer wait, and the number is easy to change in `src/lib/adopter/limits.ts`. The planner had not established it and neither did I from a measurement.
- **6 files per update**, so the review queue stays readable.
- Refused in the form before any bytes move (with the size in the message and "try a shorter clip" for a video) **and** again by the route, because the form is a courtesy and the route is the check.
- **Visible upload state**: each file shows a percentage and a progress bar; a `role="status"` banner says *"Sending file n of m. Please keep this page open until it says it is done."*; a weak connection shows *"The connection is weak. Still trying…"* (the resumable helper's retry); the Send button reads "Sending…" and the form's controls are disabled; a `beforeunload` guard warns if the page is closed mid-upload. If some files fail, the words are already saved and pressing Send again retries only the files (the update id is held), so a retry never creates a second update.
- **Reuse:** there was an upload-progress pattern in `AdoptionUpdateForm` (staff) and the shared `uploadResidentPhoto` XHR helper and `sendToDrive` chunk loop. The XHR helper got a fourth route (`"adopter"`); `resumable-video.ts` got `uploadAdopterVideo`, sharing `sendToDrive`. No staff behaviour changed.

## The Translations route (deliverable 3) — migration `0364`
**How prose reaches the queue:** each source registers itself — a row in `translatable_fields` plus a `queue_translations()` trigger on its table (0056) — and `private.translation_queue` names and links the record. It is not a join. `adoption_updates` was in none of these, so an adopter's words would have been kept in one language. `0364` registers `adoption_updates.note` **only for `channel = 'app'` rows** (a staff-typed note is internal and is not translated for anyone), adds the drop trigger, and teaches the queue view to label the row *"Adopter update · <animal>"* and link it to the resident's Adoption updates. The view keeps its columns and order (0336). Nothing about who can read or write changed; the trigger is the existing security-definer one. The machine drafts the other language and a person approves it in Management → Translations, as for any prose.

**Why a migration was unavoidable:** registering a field and a trigger, and extending the queue view, are database objects. Numbered `0364` as the brief directed, because `0363` is `refusal-keys-group-8`'s. `scripts/check-migration-numbers.mjs` objects to the gap until that lands on `main`, so the file is committed after `0363` merges and this branch is synced; it was applied to dev from this branch only and **must not be renumbered** (it would leave drift).

## Action controls
| Control | Drawn when | Activity its action asks |
|---|---|---|
| File picker, Send, Remove (`AdopterUpdateForm`) | the resident is in the adopter's `adopter_residents()` scope | none of the staff cards; `loadOwnUpdate` / `adopter_may_submit` asked again by each route |
No staff control is on this page. Found, not fixed: none.

## Driven (2026-11-12, dev, port 3002, `scripts/dev-adopter-signin.mjs`, as the disposable adopter)
- **Photo:** picked a JPEG and words, pressed Send through the real form; the upload bar and the "Sending file 1 of 1" banner showed; the thank-you appeared; the file is in Drive's dated folder; the `attachments` row has `media_kind = photo`, `approved_at` NULL, `uploaded_by` the adopter.
- **Video:** a 3 MB `video/mp4` through the real form and the resumable path (start, Drive chunks, finish); the row is `media_kind = video`, `approved_at` NULL; `video_uploads` is `complete`. (Placeholder bytes, not a real clip: Drive does not inspect them.)
- **Absent from the public view:** `public_adoption_updates` read **as anon** returned 0 rows for that resident, with the photo and the video attached.
- **Size limit:** a 151 MB `big.mp4` is refused in the form with *"big.mp4 is too big. Videos can be up to 150 MB: try a shorter clip."*; the same oversize sent straight to `/adopter-update/media/video/start` is refused 400 with the same message.
- **Another animal:** photo and video start against a resident the adopter did not adopt: both 403 *"We cannot send news about this animal from this sign-in."*
- **Translations:** the `translations` row exists (`adoption_updates` / `note`, en -> th, `pending`) and `translation_queue` returns *"Adopter update · Fixture l5gxn"* with its path.

## NOT driven
- **The staff approval queue rendering an adopter-submitted video.** `ApproveQueue.tsx` handles `media_kind`; I did not sign in as staff to look, and the dev file is placeholder bytes. (`0309` and `0303` already make the media born unapproved; that was driven at the database.)
- **Management → Translations page showing and approving the new row in the browser** (the queue view was read at the database, not the page).
- **A real phone connection**, so the 150 MB figure and the "a few minutes" wording are not measured.
- **A real Google sign-in as an adopter and the Thai wording on a phone** — Lutan's (deliverable 6). The Thai strings were written by me and have not been read by a Thai speaker.
- The `reviewed` tier on the translation field: chosen to match the other prose fields; not checked with the shelter.
