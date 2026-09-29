# 2026-09-25 — Upload failures: the 1 MB Server Action limit, and one upload limit

- **The "Minified React error #441" on a Shelter Friend logo was not the
  Worker running out of resources.** The backlog item's theory was 1102.
  The cause, by every sign short of reading production's log, is Next's
  default `serverActions.bodySizeLimit` of 1 MB. Next
  enforces it while parsing the request, before the action's code runs, so
  the action's 15 MB check and its try/catch never saw a 1–15 MB file.
  Reproduced on dev: a 2 MB multipart POST to an action returned HTTP 500
  with `E394 Body exceeded 1 MB limit`. A production build strips that
  message, and the Shelter Friend card printed the stripped text it got
  (`err.message`). This fits "the same image failed twice, a smaller one
  worked", and it breaks the Website page's hero and gallery uploads in
  the same way. Those pages didn't catch the rejection at all.
- **The limit stays at 15 MB, and the framework now lets it through.**
  Lowering the app to 1 MB was the other option. It would have refused
  most phone photos, which the upload route handlers (resident and project
  photos, attachments) already accept at 15 MB on the same Worker, doing
  the same `formData()` parse. So `next.config.ts` sets
  `serverActions.bodySizeLimit` and `proxyClientMaxBodySize` to the limit
  plus 1 MB for multipart framing. `proxyClientMaxBodySize` matters because
  `proxy.ts` matches every route, and under `next dev` / `next start` it
  silently truncates bodies over 10 MB. That will be the Pi origin. The
  number lives once, in `src/lib/uploads/limits.ts`, in place of seven
  copies.
- **Every upload Server Action goes through `runUploadAction`.** It
  pre-checks the size, so an oversized file is refused without being sent.
  If the call rejects, it shows "the server couldn't process that file —
  try a smaller copy (under about 2 MB)". Anything that rejects an upload
  has that same answer, whether a framework limit, a real 1102 or a
  dropped connection. It never shows the error's own message, because in
  production that is the stripped React text. The XHR uploaders
  (`PhotoUploader`, `AttachmentUploader`) didn't need this: a non-JSON
  failure already reads "Upload failed (500)."
- **What a Worker can really process is still unmeasured.** A 15 MB
  upload on Cloudflare buffers the body several times over (the edge
  action path collects chunks into a Blob, `formData()` parses it, and
  `drive.uploadFile` assembles another multipart Blob), all within the
  free plan's CPU budget. If that ceiling turns out lower than 15 MB, the
  user now sees words rather than a code. The number should still be
  measured on test.lannacare.org and set from what works. That is a
  backlog item, not a guess in the code.
