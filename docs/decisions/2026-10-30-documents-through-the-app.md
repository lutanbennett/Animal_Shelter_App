# Staff open filed receipts and deceased-archive documents through the app (2026-10-30)

Backlog item: *Staff open PDFs and reports through the app, not in Drive* (decided by Lutan 2026-10-29: "Yes, staff should be able to open PDF and reports through the app"). App only, no schema.

## What step zero found: most of it was already built
The brief expected blood-test, clinic and attachment reports to open in Drive. They do not. Every attachment surface (`BloodTestList`, `ProcedureList`, `clinic-visits/[id]/ReportSection`, the `sections/` attachment cards) links `driveImageUrl(fileId)`, which is `/api/photos/[fileId]`. That route already checks `can_see_drive_file`, reads the Pi mirror (`readMirroredFile`, since the pi-file-cache work) and renders PDFs inline. So those documents are already served from the mirror. (`2026-10-29-pi-mirror-videos.md` says no app route serves documents; that sentence was wrong about attachments and right about the two kinds below.)

`driveFileUrl()` had exactly three call sites, and they were the whole gap:
- `ReceiptActions.tsx`: the filed copy of a donation receipt (`donation_receipts.drive_file_id`).
- `DeceasedBanner.tsx` twice: the summary PDF and the offline index (`residents.deceased_summary_drive_file_id`, `deceased_index_drive_file_id`).

## What was built
`/api/documents/[fileId]` beside the photo route, and `driveDocumentUrl()` replacing `driveFileUrl()` (now removed: no caller was left). The three links open it in a new tab. Same order as the photo route: validate the id, **ask who is asking before any disk or Drive read**, mirror copy if present, Drive otherwise (so the Worker and `next dev` keep working), `private, no-store`, `nosniff`.

## The access rule (deliverable 3)
The photo route asks a row, not an activity, and so does this one, as the caller so RLS answers. The three kinds are not all in `can_see_drive_file` (`0193`/`0218`: attachments, project/maintenance/outing photos, Friend logos, medication labels, pending photos). **Receipts and the deceased archive columns are not**, so `/api/photos` would answer 404 for them. With no migration allowed, the route asks them in app code, the same shape as the memes check in the photo route:
- a `donation_receipts` row with that `drive_file_id`: its read policy is `donation.receipt` (`0168`), so the route asks the same card the receipt page and its PDF route ask;
- a `residents` row with that summary or index id: visible only to a login that can read that resident, which is what the deceased banner already requires.

The links are drawn only on those two pages, whose own data loads already come from the same rows under the same RLS, so a link is not drawn to a login whose session cannot fetch the file. **Not found as a fault:** no link is drawn that the route would refuse. Follow-up for the next schema PR: fold both row checks into `can_see_drive_file`.

## Inline safety (deliverable 4)
Kept as in the photo route: `safeToRenderInline` allows raster images and PDFs only; anything else downloads as an attachment. Measured on dev: the summary PDF and receipt PDF answer `inline`, and the offline index (HTML) answers `attachment`. **One behaviour change to know about:** the offline index used to open as a Drive preview; it now downloads, because it is HTML and must not run as a page on our origin. Opening it from the download is how it was meant to be used (offline).

## Not done
- No migration (the slot belongs to `prescription-forecast-function`).
- The link inside the generated offline index (`src/lib/archive/resident-index-html.ts:59`) stays a Drive link on purpose: that page is read offline, off our origin.
- Mirror: the Pi serves only types `readMirroredFile` knows (images, PDF). A receipt or summary not yet mirrored falls through to Drive bytes. Latency on the Pi is unmeasured here.
