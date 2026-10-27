# Release handover — written 2026-10-28 after `0.40.8`

A **delta**. **Two releases shipped on 2026-10-27** and each has its own record —
`docs/releases/2026-10-27-0-40-7.md` and `docs/releases/2026-10-27-0-40-8.md`. The durable rules are
in `docs/release-procedure.md`. **All of those outrank this file.**

## START HERE

**`0.40.8` is deployed on production and verified.** Both endpoints agree, both databases read
**275 of 275** with `No drift`, cache purged and proved, 33 cards and all card checks clean.

**The headline is not the two notes. It is that the dead 15-minute cron is FIXED** — dead four days
and six hours, back at `2026-10-27T16:45:10Z`, confirmed by two independent sessions. The record has
the cause, the fix and the proof.

**TEST IS A FULL RELEASE BEHIND AND ON THE OLD ADAPTER.** Only production was deployed. **Test's cron
is still dead and test is NOT a valid pre-production check right now.** Do not read a green production
and assume both. **This is DECIDED, not open:** Lutan, 2026-10-28 — test comes up **inline with the
next release's ordinary test-Worker deploy**. Nothing to arrange and nothing to ask him.

## The correction this edition exists to make

**The previous edition said the Cloudflare trigger was the remaining candidate for the dead cron. That
was WRONG, and it is worth reading why, because the measurement behind it was sound.**

`0.40.7`'s handover reasoned: a Worker deploy did not restart the cron (true, measured across a whole
quarter-hour slot), therefore the trigger is what is left. **The inference was the error** — it assumed
the two candidates on the backlog item were exhaustive, when the real cause was a third thing nobody
had named: the Worker was crashing on startup. The honest statement at the time was *"cause not yet
established; a Worker deploy is ruled out"*, and that is all the evidence supported.

**What actually settled it was an instrument, not an argument.** The old check read a row written by
the **app's route**, so "the trigger never fired" and "the trigger fired into a crashing Worker" looked
identical. #999 added an unconditional heartbeat written by the **Worker itself**, before any guard,
and the two cases separated immediately.

**The framing that produced it is worth copying:** the planner's brief put the claim to the stream as
**NOT ESTABLISHED, with the command that would settle it**, rather than as a conclusion to defend. The
stream built the instrument instead of arguing. **When two sessions disagree about a cause, the useful
move is to name the measurement that would separate them.**

## Corrections and closures to the last edition

- **The cron item is CLOSED on production.** Cause: `942ea49f` (2026-10-23) bumped Next to 16.4.2,
  which added `server/preview-props.json`; adapter `@opennextjs/cloudflare` 1.20.6 throws on it.
  Fix: `244a1731` / #1005, adapter 1.20.13. **Both commits belong in any retelling — one is the cause,
  one is the fix, and they are four days apart.** Still open on **test**.
- **The Cloudflare trigger is exonerated BY OBSERVATION, dated to the 16:45:09Z fire** on an unchanged
  Cloudflare configuration with only the adapter changed. Not by anyone's reasoning, including mine.
- **`strip-baked-env` has NO reading this release** — the first break in eleven. The production deploy
  was run by Lutan after the classifier blocked the planner, with no `tee`, so the line was never
  captured. **The counter is broken, not continued at 14.** Do not write 14 from memory.
- **The OpenNext `Failed to copy` item stays CLOSED** (settled in the `0.40.7` edition by listing the
  built output). Do not reopen it.
- **The home-icon count held at 50** against 33 cards, as expected: `iconCatalogue()` counts pages.

## Where things stand

| | |
|---|---|
| Live, production | **`0.40.8`** — Worker `00c6926e` tagged `v0.40.8`, Pi at `429229cd`, both endpoints agree |
| Live, test | **`0.40.7`**, **old adapter**, **cron still dead** — not deployed, by omission rather than decision |
| Previous release SHA, for the next range | **`429229cd4680a04dc8a5f025cd7e6ea9b20371b3`** |
| Production database | **`275 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 275 of 275** |
| Next free migration number | **`0275`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **None**, correctly, on both of the day's releases |
| Cards | **33**, `cards-union` and `role-cards-coverage` both clean |
| Cron | **Healthy on production** (`verdict: healthy`), **dead on test** |

**Counters:** `npm ci` as step 1 **31**; no production-only guard **33**; **`strip-baked-env` BROKEN
this release — no reading** (was 14 for ten consecutive releases); **Server Actions keys**: production
`cbd55beae8d8` read on the `0.40.7` Pi build, **not read on `0.40.8`**.
**Releases that mailed: 1 in the last twelve.**

## The method that keeps paying

**Never verify a deploy with a check the fallback can satisfy.** This is `0.40.8`'s real lesson and it
cost 21 minutes of production serving the wrong release. The deploying session checked
`https://lannacare.org/ returns 200` and treated it as proof the deploy was whole — **but the Worker
answers that whether or not the Pi moved.** The two-endpoint comparison the runbook already prescribes
catches it instantly: `/api/version` is the app (the Pi), `/api/releases/current` is the Worker bundle.
**Run both, every time, and say both numbers out loud.**

**Read an exit code from the thing you are measuring.** Twice more today. `release-prs.mjs` **exited 1**
on `0.40.8` and would have recorded 7 PRs instead of 9 — both missing ones were **squash-merged**, so
neither left a `Merge pull request #N` commit. And on `0.40.7` a background wrapper reported a deploy
as exit 0 that had **exited 1**.

**Take the before-picture of the table the migration writes.** Carried from `0.40.7`, where it turned
the riskiest-looking change of the day into one line: deleting the `staff` role took nothing from
anybody.

**When `main` moves inside the cut-to-deploy window, pin the Pi to what the WORKER shipped.** On
`0.40.8` the Worker was built at 16:36:17Z, between the cut at 16:24:20Z and two further merges at
16:39:59Z and 16:43:57Z. Seven real code files separate the cut from `main`'s tip. The Pi was pinned
with `--ref 429229cd` for that reason. **The window is now routinely long enough for two PRs.**

## Two things a future release manager will meet

- **The auto-mode classifier blocks `[Production Deploy]` intermittently** — it stopped the planner's
  `apply-migrations --env production` and this session's `ssh … deploy-pi.sh`, the latter ninety
  minutes after the same session ran it successfully. **Try once, do not work around it, hand it to
  Lutan.** Both were unblocked that way within minutes.
- **Cloudflare's API can time out from this machine for minutes at a stretch** (`fetch failed`,
  `ConnectTimeoutError`), hitting `wrangler`, `purge-cache.mjs` and `check-production.mjs` alike. It is
  **not** bandwidth and **not** IPv6 — both measured and ruled out on `0.40.7`. **Retry; it clears.**
- **`git reset --hard` is refused by the classifier and the runbook's worktree-reuse recipe names it.**
  `git checkout -b <branch> origin/main` in a clean worktree does the same job. **Named by three
  editions now and still not corrected in `docs/release-procedure.md`** — it is one line.

## In flight and open

**Test is DECIDED, not open. Lutan, 2026-10-28, asked directly: *"For test we will get that inline
when we do the next release."*** So the next release's **ordinary test-Worker deploy** is what brings
test onto the new adapter — there is nothing to arrange, nothing to schedule, and **nothing to put to
him again**. Two things follow for whoever runs that release: **deploy test as usual, do not treat it
as a special step**; and **afterwards, one quarter-hour later, run
`node scripts/check-production.mjs calendar-cron --env test` and expect `verdict: healthy`**, which is
what ticks the backlog item. Until then test stays a release behind with a dead cron, and **that is
expected — do not report it as a fault**, and do not read a green production as covering test.

**Two user-visible changes shipped unlooked-at**: picking an appeal when recording a donation, and
replacing the welcome-page photo. Rows 1 and 2.

**The two deploy-log lines were never captured** and may be gone. Row 3. If Lutan's terminal has
scrolled, `strip-baked-env` simply has no value for `0.40.8`; **record that rather than carrying 14
forward**.

**Carried from `0.40.7` and unchanged: Send to hospital is held by no live role** until Manage medical
is assigned, and **the Translations card is held by nobody** by design. Rows 5 and 6.

**The four deleted vet-visit calendar entries are NOT restored** and will not come back by themselves —
Lutan's "records only for now", its own backlog item under Medical records. **No visit was ever wrongly
cancelled on production**, and #1002 proved itself on the 16:45 sweep by deleting nothing when four
days of backlog ran at once. **No release note may imply the calendar is whole.**

**Carried unchanged, nothing new to say, and RE-MEASURE EACH before repeating it:** `0257`'s stale
`-- consumer:` header; `who-does-what` items 2 and 3 and `stocktaking` item 3; the Thai wording of the
Units screen and of the Pages preview; the restore drill, still never exercised; and the two
unlooked-at items, the prescription form reading 4 and video playback on a real handset.
**`tee` under PowerShell still writes the deploy log as UTF-16** — `tr -d '\000'` before grepping.
