# 2026-09-25 — Manual screenshots can be re-shot one at a time, and never show the DEV badge

Four manual topics pointed at PNGs that did not exist (`diet-new`,
`management-diets`, `management-cashflow`, `admin-blood-test-types`).
Two of them had no entry in `scripts/manual-screenshots.mjs` at all, so no
re-run would ever have produced them.

- **Filling the gap did not wait for the full re-run.** That re-run is
  deferred until the feature batch is done, and meanwhile users were seeing
  broken images. `--only=<name>,…` captures just the named screenshots and
  still rewrites `screenshot-sizes.json` from every PNG. Unknown names fail
  up front, because a typo that quietly captured nothing would read as success.
- **The four new PNGs are newer than their neighbours.** They show the
  current teal theme and nav, while most of the other 40 predate both. That is
  expected, and the full re-run evens it out. They are not deliberately made
  to match the old look.
- **The DEV / UAT badge is hidden in `settle()`,** the same place the
  signed-in email is swapped for a placeholder. The script runs against dev,
  but production has no badge, and the manual should look like what the reader
  has. It selects `header span[title]`, which is only the badge today. If the
  header gains another titled span, that span will vanish from screenshots
  too, so give the badge its own hook then.
