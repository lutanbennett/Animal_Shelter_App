# 2026-09-28 — A non-image attachment shows a type icon, chosen from its file name

Lutan's Pass 1 (Vet): a PDF on a procedure opened fine but had nothing to
look at in the list.

- **The file name decides, not a stored type.** `attachments` has no MIME
  column (0001), and this was a no-migration quick win, so
  `fileKind()` (`src/lib/uploads/file-kind.ts`) reads the extension. That
  is less of a guess than it sounds: every upload route has already sniffed
  the bytes (`file-signature.ts`) against images plus PDF, so a stored
  `.pdf` really was one. The case it gets wrong is a real PDF saved under a
  `.jpg` name, which passes the sniff and shows as a broken thumbnail, as
  it did before. If that ever matters, record the sniffed type at upload
  (a `mime_type` column) and prefer it when present.
- **One rule and one icon, where there were four copies.** The same
  `isLikelyImage()` regex lived in the procedure, blood-test, maintenance and
  project-photo lists, each drawing an `aria-hidden` 📄. Resident photos,
  the public galleries and the contact / Shelter Friend logos accept images
  only, so they have no non-image case and are unchanged.
- **The icon is named, not decorative.** `FileTypeIcon` is `role="img"`
  with "PDF document" / "เอกสาร PDF" (and Document, Image, File), so a
  screen reader walking a list of mixed attachments hears which is the PDF.
  Lucide's generic `FileText` / `FileImage` / `File` are enough; PDFs are
  tinted `text-danger`, the usual PDF red, so they read at a glance.
- **Not here:** the public story gallery (`public_project_photos`) has no
  type filter, so a PDF in a public project folder would reach
  `/our-work/[id]` as a broken image. That needs a view migration and is on
  the backlog ("Keep PDFs out of the public story gallery").
