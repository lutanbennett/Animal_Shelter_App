# 2026-09-26 — Uploads are checked by their bytes, and replaced Website files go to Drive's trash

On 2026-09-25 a 3 MiB file of zero bytes named `mid3.jpg` became the dev
hero photo. It said `image/jpeg`, and every upload path trusted that — the
browser's type is only a guess from the file name. Replacing the hero also
called `files.delete` on the real photo, so it could not be put back.

- **One helper, `src/lib/uploads/file-signature.ts`,** beside `limits.ts`.
  It reads the first 1024 bytes and accepts: JPEG `FF D8 FF`; PNG's full
  8-byte signature; WebP `RIFF`…`WEBP`; GIF `GIF87a`/`GIF89a`; HEIC/HEIF
  as an `ftyp` box whose major or compatible brand is one of `heic heix
  heim heis hevc hevx hevm hevs mif1 msf1`; PDF as `%PDF-` anywhere in
  those 1024 bytes (the spec allows a preamble; some scanners write one).
  Each path keeps its own accepted set (the Website and logos take no GIF
  or PDF, attachments take PDF, projects take both), and the bytes must be
  in it. `mif1`/`msf1` also admit AVIF; that was judged better than
  refusing a real camera HEIC that uses them as its major brand.
- **It checks what the file is, not whether its name agrees.** A real PNG
  called `photo.jpg` is accepted and stored under `image/png` — the type
  the bytes prove — instead of being refused. The failure being fixed is
  content that is no image at all, not a wrong extension, and refusing a
  good photo over its name would be a new way to lose one.
- **All seven Drive upload paths call it** (Website hero and gallery,
  Shelter Friend logo, resident, project and maintenance photos, procedure
  and blood-test attachments), after the type and size checks and before
  any Drive call, and refuse with one en/th sentence (`t.uploads.notReadable`)
  naming the file and the formats that path takes. The browser-type check
  stays first: it still gives the quicker "Unsupported file type" answer.
- **Replace, then trash — Website and Shelter Friend logos only.** The new
  file is uploaded, read back from Drive (`confirmUploaded`: its `size`
  must equal the bytes sent), then the row is switched, and only then is the
  old file moved to Drive's **trash** (`trashFile`, `trashed: true`), which
  keeps it for 30 days. Removing a hero, gallery photo or logo also trashes.
  Scoped to these because they are the replace paths — the only place a
  single upload silently destroys an existing file. Resident, project and
  maintenance photos are added, never replaced, and their deliberate
  "Remove" still deletes; moving those to the trash is a separate question.
- **Not checked from this stream:** whether `lannacare.org`'s hero is
  broken too. That is the production database, which the 2026-09-25 upload
  test did not touch; it was handed to Lutan rather than read from a
  worktree.
