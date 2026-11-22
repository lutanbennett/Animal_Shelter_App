# 2026-11-22 — Shelter logo upload capped at 1 MB (#oga26)

`#gyw6m` stopped asking Drive for a width so a transparent logo keeps its alpha; the cost is that every public page serves the original, and the upload accepted up to 15 MB.
The logo already on production is small (256 px / 19 KB, resized by hand), so this is a guard, not an emergency.

- **Cap: 1 MB** (`MAX_LOGO_BYTES`, new, beside `MAX_UPLOAD_BYTES` in `src/lib/uploads/limits.ts`). The slot is 52-64 px; a 256 px logo is 19 KB, so 1 MB is about 50x that. `MAX_UPLOAD_BYTES` (15 MB) is untouched.
- **Refuse, not resize.** `sharp` is not in `package.json` and does not run on the Worker (re-checked 2026-11-22). The refusal is checked in the browser (`ShelterLogo.tsx`) and again in `uploadShelterLogo`.
- **Strings, both languages:** new `t.admin.website.logo.tooLarge`; `logo.subtitle` said "up to 15 MB" and now says 1 MB, in en and th.
- **Elsewhere at full size?** Only the public header and the admin preview serve the logo original (`PublicHeader.tsx`, `ShelterLogo.tsx`). Shelter Friend logos are a different path and not touched.
- **Driven proof (2026-11-22, headless Chrome, dev, admin):** a 1.5 MB file refused with the new sentence in English and in Thai; subtitle reads 1 MB in both.
- **An already-uploaded oversized logo:** none exists (the one in play is 19 KB). The cap applies to new uploads only; an older big file keeps serving until replaced.
