# A silent check is a killed check, not a broken one

**2026-10-29.** `check-phone-width.mjs` was recorded as broken twice, by two different streams, and it was
correct both times. The second instance cost about two hours. This records why, so nobody re-derives it.

## What happened

- **2026-10-28**, the harness sweep (`docs/decisions/2026-10-28-harness-sweep-batch-7-triage.md`) filed it as
  **"no output, 170 s timeout"**, in a group of eighteen checks that had failed with `ECONNREFUSED` because
  that sweep ran **with no dev server up**. Seven of those eighteen later turned out never to have been broken.
- **2026-10-29**, a stream re-ran the eighteen with a server up. It ran `check-phone-width.mjs` for over two
  hours across several attempts and reported that it got **no output at all.**

Lutan asked, correctly, *"why is the harness rerun server trying to do 1700+ page loads"* and then *"after 2
hours of running it is stating it got no output. Something is not right."*

## Why — three facts that combine

1. **The script reports only at the end.** Every result is pushed into an array and `report()` runs once, after
   the whole matrix. `--verbose` also only prints at report time. **So a run killed for any reason leaves not
   one line**, which looks exactly like a check that produced no output because it is broken.
2. **A foreground command is killed at ten minutes** (two minutes by default), and the run is far longer than
   that. Measured against a live dev server: **`goto` costs 4–6 s per page**, because Turbopack compiles each
   route on first visit, and `settle()` runs twice per page view — about **6–8 s a page view**. The full matrix
   is 7 roles × 2 locales × ~119 pages ≈ **1,666 page views**, plus a `/home` load per combination to harvest
   each role's nav links and ~34 for the signed-out public pass: **2.5–3 hours.**
3. **`--pages` narrows less than it appears.** `onlyPages` filters only the signed-in targets. `publicPass()`
   always runs over all 16 `PUBLIC_PAGES` plus a resident, a story and the phone-menu check, and there is
   `--public-only` but no inverse. So there is a floor of ~20 page views whatever is passed.

**`networkidle` was the obvious suspect and is innocent: it settles in 1–2 s.** The cost is route compilation,
which is a dev-server property and would not occur against a built site.

## What is NOT wrong, and must not be "fixed"

- **The matrix is correct and deliberate.** It measures 375 px overflow and the 44 px tap rule, which has to be
  walked once per login because each login sees different pages. It is deliberately out of `gates.mjs` and CI
  (`docs/decisions/2026-10-05-phone-width-check.md`) and belongs in the release smoke test.
- **It must NOT be made card-shaped.** The roles here sample seven different page sets to measure **layout**,
  which `CLAUDE.md` puts outside the card rule (*"does it only decide layout or ordering? Then it is not
  security"*). 40 cards × 2 locales × 119 pages would be **9,500+ page views**.
- **Do not narrow the matrix to make it faster.** `--roles=`, `--locales=` and `--pages=` already exist for a
  narrowed run, which is the right answer when you only need to know that the check runs. A narrowed run
  (`--roles=admin --locales=en --pages=…` with four pages) completed in **about two and a half minutes**.

## What changed

- **The skill carries a standard brief block** for any stream that runs check scripts: start the dev server
  first, `timeout 60` per check, echo the name *before* each run, never loop an unsized list, background
  anything long with output redirected, and **establish whether a check was killed before concluding it is
  broken.** Plus the planner's half: **do not ask a stream to run something you have not sized** — the brief
  that caused this handed over an eighteen-check loop with one 3-hour job inside it.
- **A backlog item** (`## Architecture`) asks for the script to print one line per page view as it goes, print
  the planned total up front, gain a `--no-public` flag, and say in its own header that an unnarrowed run must
  be backgrounded. It is folded into the `harness-restate-nine` stream.

## The general lesson

**A silent instrument cannot be read, and its silence will be attributed to the thing it measures.** Of 186
`scripts/check-*.mjs`, only four drive a browser and the rest run in 1–3 seconds, so this is a narrow problem
today — but the same shape has already cost this project elsewhere: a background agent that died produced a
0-byte file, and the session waiting on it could not tell that from progress. **Print as you go, or be
unreadable.**
