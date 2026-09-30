# 2026-09-30 — Sign-in `next` is parsed as a URL, not prefix-checked (WEB-1)

- **The hole:** `safeNextPath` refused `//` but not `/\`, which browsers read as
  `//`, so `/login?next=/\evil.com` redirected off-site immediately after a real
  sign-in — the most credible moment for a fake "session expired" page.
- **The fix closes the class, not the instance.** The value must start with `/`,
  contain no backslash or control character (URL parsers silently *drop* tab and
  newline, so `/<tab>/evil.com` would otherwise become `//evil.com`), and, parsed
  with `new URL(next, "http://x")`, keep the origin `http://x`. A second string
  check would have been the same bug waiting for its next variant.
- **Contract widened, deliberately:** it now returns the parsed
  `pathname + search`, not the input unchanged. Differences a caller can see: a
  `#fragment` is dropped and dot
  segments are normalised (`/a/../b` → `/b`). Percent-encoding is preserved
  (`%5C` stays `%5C`, which is not a separator). Every caller
  (`login/page.tsx`, `login/actions.ts` ×2, `auth/callback/route.ts`, the request
  proxy) puts the result into a redirect or back into the form's hidden field, so
  none depends on the raw value.
- **Tests:** `node scripts/check-next-path.mjs`, following the `check-*.mjs`
  pattern (there is no test runner in the repo). It covers deep links that must
  round-trip as well as the hostile variants.
