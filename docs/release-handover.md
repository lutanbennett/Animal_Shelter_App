# Release handover — written 2026-11-23 after `0.49.0`

A **delta** on the last edition, not a runbook. `docs/release-procedure.md` is the runbook and outranks
this file; `docs/releases/2026-11-23-0-49-0.md` is this release's record and holds the figures. Where
this file and either of those disagree, they are right.

## START HERE

**`0.49.0` is live on all four hosts, both endpoints, every one served by the Pi and every one reporting
`9fc01bdc6`. It mailed.** Subject `[Production] …`, sender `Lanna Care Production`, delivered 05:07 UTC.

**`#w4k9n` (e) was closed by `0.48.0` yesterday, NOT by this release.** Today is a re-confirmation on a
second consecutive mailing release. **Do not announce that proof a third time** — a record that
re-announces a settled question is how a settled thing gets re-opened.

**No migration, and none pending** — both deploy databases were already at `436 applied, 0 pending`
before the cut, and both read `No drift` after. First release in several with no database step at all.

**Cost to Lutan: two touches, the target met.** His answer about the email (unprompted, in his first
sentence) and the one command. `0.48.0` cost the same two plus **four progress checks** caused by my
silence; this release reported at each build boundary instead, and he asked for nothing.

**Re-measure before trusting any of this.** Every figure was read on 2026-11-23.

## THE LESSON OF THIS RELEASE: THE 24-HOUR LOOP IS REAL, SO WRITE THE GAP DOWN PROPERLY

`#thpfx` — the `/th` addresses returning 500 — was **found during `0.48.0`'s own verification yesterday,
filed with its full measurement, fixed by a stream (#1847) overnight, and proved on production today.**

| address | before (`0.48.0`) | after (`0.49.0`) |
|---|---|---|
| `cooperjaidee.org/th/platform/about` | **500** | **200** |
| `lannacareforanimals.org/th` · `test` · `uat` | **500** each | **200** each |
| `lannacareforanimals.org/th/adopt` | 307 | 307, unchanged (the lock) |

**Two things made that loop work, and both are cheap to repeat.** The item carried the *pattern* rather
than the symptom — where the rewrite had to render it failed, where it only redirected it didn't — which
is what let a stream fix it without rediscovering anything. And it said in terms that **the production
proof was not a stream's**, so the release manager knew to take it rather than leaving it pending.

**Take the BEFORE reading while the old release is still live.** I captured all four hosts at 500 before
the deploy, so the fix has a measured before-and-after instead of an assertion. Thirty seconds, and it is
the difference between a proof and a claim. **And prove it by reading the page, not the status code:**
`/th/platform/about` returns 6,249 Thai characters with `lang="th"` and a Thai `<h1>`.

## PRODUCTION'S EDGE WENT STALE AND THE ASSET CHECK CAUGHT IT — BELIEVE THAT CHECK

Production's Pi deploy ended **`check-assets: FAILED`**: the served page still referenced
`1c08nzsjqn8gi.css`, **yesterday's** stylesheet, absent from this build. The script's own words:
*"This is what a poisoned Cloudflare cache looks like: the app renders with no styling."*

**Purge, then re-run the check.** Both production hosts then served `28fyh-mrlfqlu.css`, 95,498 bytes,
identical to the build. Two minutes, because the check was believed rather than argued with.

**Test's and UAT's checks passed first time**, same build, same minute. **Why production's zone alone
went stale is NOT established** and the record says so rather than inventing a cause. What follows for
the next release manager is only this: **the purge is not a formality, and a red asset check is right.**

## STOP CARRYING: `sync-home-icons` WORKS AGAIN

It exited **1** on `0.47.10` and on `0.48.0`, both times on *"`PLATFORM_DRIVE_FOLDER_ID` is not set for
production"*, and both records carried it as an open gap. **#1841 registered that name this release and
the script now uploads for real** (536 images across 67 pages). **That also settles what `0.48.0`'s
record could only state**: `0.47.9`'s claimed exit 0, two later releases got exit 1, and the cause was a
missing variable the whole time.

**The tell was in the deploy output, not in the script:** `strip-baked-env` removed **23** env vars
against 22 yesterday, and naming the new one found it. Reading that count rather than skimming it is
worth the ten seconds.

## A DOCUMENTED TRAP, MET IN PRACTICE

An hour before the release, during `/clean-streams`, `node … done <slug> | tail` printed **`EXIT: 0` for
a script that had crashed part-way**. That is the runbook's *Read an exit code from the script, never
through a pipe*, exactly as written. Re-running without the pipe showed the real state and finished the
job, and all three places were then checked by hand.

**Every exit code in the release itself was read from the command**, and the record says so. **Reading
that paragraph is not the same as having been bitten by it** — if you have not, assume you will be.

## Traps that cost nothing this time but will

- **His log is UTF-16.** `head -c 2` printed `377 376`; `tr -d '\000'` before grepping is what made it
  readable. The runbook's paragraph is correct — follow it, don't rediscover it.
- **The three Server Actions keys look like a fault if compared across environments.** Production
  `cbd55beae8d8`, test `ecc41837fc0b`, UAT `cdeca9cbc4de`, each matching its own Pi build. Within an
  environment only.
- **`audit:register` passing is not `audit:prod` passing.** The register admits high and critical only,
  so the same **moderate** (`GHSA-g3hv-75wg-m249`, `minimatch`, build-time tooling) sits outside it by
  design. Read both, and cite the previous release rather than re-deriving it.
- **The OpenNext bundling stage can go quiet for minutes and be perfectly healthy.** UAT's wrote 0 files
  for ~180 s while a node process grew to **1,877 MB with 238 s of CPU**. **When the file-age check is
  ambiguous, read the process** — that settles it in one command.
- **Watch the directory the current stage writes.** During `next build` that is `.next`, not
  `.open-next`, which can sit untouched for ten minutes while everything is fine.
- **One Pi build at a time.** Swap peaked at 2.6 GiB of 6 GiB on a 4 GiB box; three at once is not
  possible, and that is why `setup.sh` adds the swap.

## What is still open — six items, all his

- **The money page's 375px view and its Thai wording** (#1842) — **this release's only note describes
  that page, so the headline and the biggest gap are the same thing.**
- **Two reels uploads from his phone** (#1846, then #1849, which needs the first).
- **The Calendar console look and a real connect** (#1845).
- **His decision on `#rlbat`'s metadata behaviour** — a decision, not a test; named so it is not
  mistaken for an unchecked box.
- **The pinned backlog page after a republish** (#1839), cosmetic.

**`#pnote` is filed and is nobody's blocker:** two consecutive notes now tell every shelter user about
the product site. `0.48.0`'s record observed it, this one did not observe it twice — it is a backlog item
with its three shapes and a warning never to alter a note during a cut.

**Dev still carries one extra `schema_migrations` row**, `0422_keep_an_admin_per_shelter.sql`, with no
file ever in git under that name. Known, dev-only, **unchanged across three releases** — not drift to
chase.

## Now routine — stop treating these as open

UAT's three one-time needs are done (since 2026-11-09), the mesh alias to the Pi is in place, and
`test-plan` is **advisory, permanently**. All three are in the runbook; none is a decision he owes.

## The two touches that are his, and stay his

**The email question** — put as *"should this release email you?"*, never as the two words — and the
**production Worker deploy**. He has now answered the first unprompted three releases running.

**And tell him the mail reaches one person.** The shelter's own address is not on the production admin
list and `lannacareforanimals@gmail.com` is skipped with `E_RECIPIENT_NOT_ALLOWED`, so "mails every
admin" overstates the lever. He knows; say it anyway rather than implying a wider audience.
