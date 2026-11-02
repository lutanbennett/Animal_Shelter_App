# 2026-11-02 — SEO re-check: method, so the next one is comparable

Report: `docs/seo-recheck-2026-11-02.md`. Baseline (unchanged): `docs/seo-audit-2026-10-14.md`.

- **Method matched to the baseline.** Lighthouse 12 (`lighthouse@12` + `chrome-launcher`, installed in
  the session scratchpad, never in the repo; `package.json` and the lockfile are unchanged), mobile
  preset (slow 4G), all four categories, signed out, a `locale` cookie for Thai. Speed from
  `next build` then `next start -p 3005`, not `next dev`. Chrome: the installed Windows Chrome, headless.
- **Pages:** the twelve baseline types plus `/appeals`, one appeal, `/services/desexing` and `/shop`,
  English and Thai: 32 runs, one each, about 15 s per run. One run per cell is not a mean; a move under
  about 5 speed points is noise (the baseline says the same of LCP).
- **Data:** the dev database, so photo sizes and body lengths are not production's.
- **Heading order:** settled by reading `parseBody()`, `parseInline()`, `SiteBodyView` and every caller,
  plus the accessibility score on the five rich-text pages. No code change.
- **No fix in this PR.** Nothing machine-facing was found that needed one; the logo swap (rank 4) was left
  because it is uncertain which paths the shared header serves.
- **Not done:** a bisect of the speed drop. Each build is several minutes; it is rank 1 in the report.
- **Next re-check:** repeat this, and add real data once the site is unlocked at the cutover.
