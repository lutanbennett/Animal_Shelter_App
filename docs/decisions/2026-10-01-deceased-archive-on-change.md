# 2026-10-01 — The deceased archive after a change: four gaps decided

Backlog item "Deceased residents: confirm what happens to the archive when
photos or the bio change after death" (customer question 2026-09-22). Read
against the code on 2026-10-01 rather than assumed.

**Confirmed still true.** The after-death bio edit (`edit/actions.ts`), photo
upload (`api/residents/[id]/photos/route.ts`), set-profile, delete and
move-folder (`photos/actions.ts`) and deleting an adoption update with photos
each call `refreshDeceasedArchiveIfNeeded()`, which re-runs
`archiveDeceasedResident()`: the folder move no-ops, and the summary PDF and
`index.html` are replaced in place by their stored Drive file ids. So the
archive follows the record. Nothing in `0117`, the microchip work or the move
to the Pi changed that path.

**1. Silent failure — surfaced, no migration.** Every caller used to drop the
`{ error }`. Now the person who made the edit is told, at the moment they make
it: the photo actions return `archiveWarning`, shown in the photo dialog; the
uploader shows it on the file's row instead of "Done"; the bio edit redirects
to the hub with `?archive=stale`, which shows a red notice in the deceased
banner. The edit itself still saves — a Drive outage must not lose a bio. The
banner also now has an always-present **Refresh archive** button (the same
`retryDeceasedArchive` action, which already worked on an archived resident)
so there is something to press.
*Declined: a `deceased_archive_stale_at` column.* It would make the warning
persistent, which is the real weakness of this fix: close the tab and the
notice is gone, and the next person sees nothing. It was declined for now
because it forces a schema-first split and a change to `0026`'s lock for one
flag, and because the warning reaches the one person who can act on it. **Reopen
if a stale archive is ever found in practice**, or when the six production PDFs
are regenerated and someone wants a way to list stale ones.
`refreshDeceasedArchiveIfNeeded()` still returns `{ refreshed, error? }`
unchanged — nothing for the `#441` sweeps to retranslate at that boundary.

**2. First archive never completed — message only.** An edit does not create
an archive that never existed; that stays with Retry archiving (which includes
everything saved so far). The banner now says so under the incomplete notice.

**3. One PDF per uploaded file — declined, no change.** Uploads are sequential
and only happen for the handful of photos added after a death. The cost was
reasoned from the code, not timed in production (no Drive available to this
stream), so it is "not worth debouncing without evidence", not "measured fast".
Batching would need a client round-trip after the last file. Reopen if someone
reports a slow multi-photo upload on a deceased resident.

**4. HEIC profile photo — already handled.** The item predates the fix that
makes `loadProfilePhoto()` try Drive's JPEG thumbnail first and the original
only as a fallback; Drive converts HEIC, so a phone photo chosen as profile
after death embeds. `EMBEDDABLE_IMAGE_TYPES` now only guards the fallback. Not
verified against a live Drive HEIC in this stream — it goes in the test plan's
manual list, and the production PDF regeneration is the place to confirm it.

**Kept as designed:** a Medical photo may appear in the (non-public) PDF;
photos stay editable after death.
