# 2026-10-02 — The deceased archive follow-ups: walked end to end, five gaps closed or declined

Second pass on the backlog item "Deceased residents: confirm what happens to the
archive when photos or the bio change after death", after
`2026-10-01-deceased-archive-on-change.md`. That file answered gaps 1–4 from the
code; this one is the end-to-end walk it could not do (no Drive in that stream)
and what the walk changed.

**5. End to end in dev — done, and it passes.** A test resident (R-0080) was
recorded deceased, then in turn: bio changed, three photos uploaded, a different
profile photo chosen, a photo removed. After each step the summary PDF and
`index.html` in the resident's Drive folder were downloaded and read (PDF text
via `pdftotext`, index by grep), not just looked at in a browser. Every step was
reflected in both files within seconds: the bio text, the photo list, which photo
is the profile (the PDF grew when the first photo became the profile, the index's
header image switched on the profile change) and the removed photo gone from the
index, the PDF's file list and Drive itself.

**1. Silent failure — the warning works; persistence declined again.** With the
dev Drive refresh token invalidated, a bio edit saved, redirected to
`?archive=stale`, and the banner said the PDF and index were out of date. The
files really were stale (the new bio was in neither). After a plain reload the
notice was gone, which is the weakness 10-01 predicted; Refresh archive then
brought both files up to date. A `deceased_archive_stale_at` column would fix the
reload case but forces a schema-first split and a change to `0026`'s lock, for a
failure that needs Drive to be down at the moment of an edit. Still declined;
reopen if a stale archive turns up in practice. The manual now tells staff to
press Refresh archive before leaving the page. `refreshDeceasedArchiveIfNeeded()`
is unchanged.

**2. First archive never completed — closed (10-01).** The banner says an edit
does not create the archive; Retry archiving does. The manual says so too.

**3. One PDF per uploaded file — measured, declined.** In dev, a three-photo
sequential upload took 25 s, 15 s and 12 s per request (the first included
compiling the route); the bio edit, which is one refresh plus a save, took about
7 s, so a refresh is roughly half of each upload. Slow-ish but sequential and only
for photos added after a death. Not debounced: it would need a client round-trip
after the last file. Reopen if someone reports a slow upload on a deceased
resident.

**4. HEIC profile photo — not verified here.** No HEIC file was available to
upload in this stream, so the Drive-thumbnail path in `loadProfilePhoto()` is
still untested against a real iPhone photo. It stays on the backlog item and in
the test plan's manual list.

**Kept as designed:** a Medical photo may appear in the (non-public) PDF; photos
stay editable after death.

**Why the item stays open:** only gap 4 (HEIC) is neither closed nor consciously
declined.
