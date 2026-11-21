# 2026-11-21 — Shelter logo: the driven proofs (#shlog)

Driven with `signedInPage` (headless Chrome, `scripts/lib/driven-session.mjs`) against dev. The scratch script was deleted, not committed.
The `CLAUDE.md` snippet worked as written (admin login, `/admin/website`, `setInputFiles`, reload, read back).

## Proof one: a transparent PNG through `/api/photos/<id>?w=160` — IT IS FLATTENED, ONTO BLACK

- Drove: Admin → Website → Shelter logo → uploaded `public/lca-logo-transparent.png` (538x537, alpha; corner pixel 210,210,210 at alpha 90).
  After a reload the card read "Replace logo / Remove" and `site_content.logo_drive_file_id` held the new id (2026-11-21 04:43 UTC).
- `/api/photos/<id>?w=160` returned **200 `image/jpeg`, 160x160, no alpha channel** for `Accept: image/jpeg,image/png`, and **`image/webp`, also no alpha**,
  for a browser Accept. Corner pixel 41,41,41; centre 10,10,10 (the original's centre is 10,10,10 and opaque).
- **Colour of the flatten: black, not white.** On the public header (`bg-site-paper`) it shows as a black square around the roundel (screenshot read by eye; the bytes agree).
- **Which path served it:** a public file with a width goes to **Drive's own rendition** (`drive.downloadThumbnail`, a googleusercontent `=s160` URL), not `resizeMirrored`,
  which runs only for non-public files (`route.ts`, `!isPublicFile`). Evidence is inferred, not intercepted: a request that preferred PNG came back JPEG with the public
  cache header. The sharp path (`mirror-read.ts:152`, `.jpeg()`) would flatten the same way for a non-public file but was **not exercised**.
- **Without `?w=`** the proxy returns the original: `image/png`, 122,967 bytes, alpha intact.
- **Not fixed here, on purpose.** The flatten happens in Google's rendition, so the proxy cannot simply "keep alpha". Repairing it means decoding and resizing the
  original ourselves (`sharp` is not an app dependency and does not run on the Cloudflare Worker; it is only on the Pi mirror path), or serving the original at full size
  (up to the 15 MB upload limit) on every public page, or resizing at upload. Each reaches past this proof. **It needs its own stream.**
  Until then a shelter should upload a logo whose background is opaque and matches the page.

## Proof two: a second shelter shows its own name, never another shelter's logo

- Server restarted as `DEV_SHELTER_ID=<test-shelter-2 id> npm run dev -- --port 3006` (04:45 UTC). The first shelter's row held a logo; `/` on the second shelter had
  **no logo image at all**. The header text read "LCA" because a shelter with no `display_name`/`short_name` falls back to the default names; that text proves nothing either way.
- **Not driven: uploading a different logo to the second shelter.** Its admin page answered "Photo storage is not connected": test-shelter-2 has no Drive credentials on dev
  (`DRIVE_CREDENTIALS_KEY` unset in the server log). It is the existing readable refusal, and nothing was written.
- Server stopped by its own port's process id and restarted normally on the dev shelter (04:47 UTC); the first shelter's public header showed its logo again.
- Disposable dev logins were left in place (no `--remove`, other streams are running). The dev shelter's logo is now the black-boxed one; dev data is disposable.
