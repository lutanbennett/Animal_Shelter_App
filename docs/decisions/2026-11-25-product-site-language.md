# Product site language control (#ptlng)

**Step zero.** Measured on dev (port 3011): `/th/platform/about` 200, `/th/platform/features/money` 200, `/th/platform` 307 (the bare product home redirects, as for English). The Thai addresses serve; the gap was only the missing control. `/platform/enquire` has no Thai address (`thPathRest` admits only the home and feature pages), so no control is drawn there.

**Choice.** A two-link EN / ไทย pair in the platform shell's header (`src/app/platform/ProductLanguageLinks.tsx`, used by `layout.tsx`), not the existing `LanguageSwitcher`: that one sets the `locale` cookie, which would serve Thai at the English address, break hreflang/canonical and add a second edge-cache key. These are plain links to `/th` + the bare path, so one address stays one language. It sits in the shell rather than `ProductNav` so one control covers every product page, including future ones, since it keys off `isProductPage`. The labels are the language names themselves, as in `LanguageSwitcher`, so no dictionary entry is needed; the `aria-label` is bilingual.

**Proved by driving Chrome** on `/platform/about` and `/platform/features/money`: click ไทย lands on `/th/...` with `lang=th`, Thai h1 and canonical = the Thai address; click EN returns to the English address; hreflang pair is identical on both. No redirect by browser language was added.

Found, not fixed: the control sits in the shell header, so a sign-in-gated console page never shows it (no Thai address exists for it, by design).
