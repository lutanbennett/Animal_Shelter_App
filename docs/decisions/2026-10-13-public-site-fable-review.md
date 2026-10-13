# The public-site review measured before it looked, and filed nothing

**Date:** 2026-10-13 · **Stream:** `claude/public-site-fable-review` · **Output:**
`docs/public-site-review-2026-10-13.md` and the screenshots in `docs/public-site-review/`

## What was decided

1. **Local dev server, signed out, dev database.** `next dev` on this branch has no
   `PUBLIC_SITE=locked` var, so a signed-out visitor sees exactly what the live site will show after
   go-live, which is the view the brief asks for. `test.lannacare.org` would have needed a sign-in
   and shown the staff states in the header; production was out of bounds. Nothing was written to
   the database.
2. **Every claim about layout is a measurement, not an impression.** A throwaway Playwright script
   (kept in the session's scratchpad, deliberately not committed: it is one-off review tooling, and
   `scripts/check-phone-width.mjs` is the repo's lasting check) loaded every public page at 375 × 812
   and 1280 × 800, English and Thai, and recorded overflow, sub-44 px controls, text contrast
   against the real background, headings, alt text, meta and share tags, small type, focus, weight,
   placeholders and English runs on Thai pages. The eye came second, on the full-page screenshots
   and in the browser pane. Where the report gives a number (93 px below the fold, 36 px tall, 200
   status) it came from that run, and the test plan records the run.
3. **The review raises no backlog items and ticks nothing.** Each suggestion is a ready-to-paste
   item in the report; Lutan picks after the walkthrough, as with the database review the same day.
   The only edit to `docs/backlog.md` on this branch is a status note on the review's own line.
4. **Nineteen screenshots, reduced, dev data only.** Seventy-eight full-size captures were reviewed;
   the nineteen the text refers to are committed as JPEGs at 600 or 1000 px wide (about a tenth of
   the PNG size) so the repository does not carry ten megabytes of pictures for one document. They
   show test animals, one test business, a dummy phone number and the shelter's already-public
   email; no person appears in any of them.
5. **Comparison sites are described, never quoted.** Soi Dog, Lanta Animal Welfare, The ARK
   (Chiang Mai) and the RSPCA were each read once and summarised in the review's words. One
   finding worth keeping outside the report: `carefordogs.org`, once a Chiang Mai rescue, now
   serves casino affiliate content; do not link to it anywhere.
6. **The PDF is rendered from the same Markdown.** `scripts`-free: the Markdown is converted to
   HTML with a small scratchpad script and printed by headless Chrome, so the Desktop copy cannot
   drift from the file in git. The same privacy rule covers both because they are the same text.

## Why

A review that changes nothing can only be trusted on the strength of its evidence, and "it felt
cramped" is not evidence. Measuring first also kept the review honest about what was *not* found:
no contrast failure, no sideways scroll, no missing alt text, which the report says as plainly as
the problems.

## What it cost

Nothing in the database or the code. One known limit: Chrome's phone emulation is not a phone, and
the Web Share sheet and LINE's hand-off were read from the links rather than tapped; the test plan's
manual list names them.
