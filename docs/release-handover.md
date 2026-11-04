# Release handover — written 2026-11-04 after `0.42.0`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-04-0-42-0.md`. **Both outrank this file.**

## START HERE

**`0.42.0` is deployed on both environments and it MAILED.** Both Pi clones and the production Worker
built from **`2c985e4f`** (the clones pinned with `--ref`); the **test Worker is `cd2b0070`**, because
`main` moved after the cut and `deploy.mjs` takes no `--ref`. **Nothing served differs** — see the next
section, which is the one thing in this edition worth reading before you start. **309 of 309 applied**,
`No drift` on **both** databases, `calendar-cron` healthy, every held card fully applied, every
permission cell backed by a card, `activities-grantable` byte-identical before and after.

**The release cost two touches — the target.** The email answer and his Worker deploy, nothing else.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 2c985e4f..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## The code-identity check will stop a sound release, and you need to know why

**This is new and it will recur.** The runbook's check is
`git diff --name-only <a>..<b> | grep -vE '^(docs/|\.claude/)'`, and its instruction is **any line
means stop**. On this release it printed eight files and **none of them was served**: a git hook, the
CI workflow, the README, three backlog scripts and two HTML templates, all from #1254 merging during
the deploy.

**The exclusion list covers `docs/` and `.claude/` only.** It does not cover `scripts/`, `.github/`
or `.githooks/`, so repo tooling reads as application code. **The second grep is the one that
answers the question** — is anything in `src/`, `worker/`, `public/`, `next.config` or `package*`? If
that is empty, nothing `next build` includes differs and the release is sound:

```bash
git diff --name-only <a>..<b> | grep -E '^(src/|worker/|public/|next\.config|package)'
```

**Nothing was rebuilt**, because the trap is explicit that `main` moving does not license chasing a
SHA — a past release poisoned the Cloudflare cache doing exactly that. **Widening the pattern is a
backlog item under *Architecture*, not a release-time fix.** Do not change it mid-release.

## Corrections and closures to the last edition

- **`0.41.3`'s gutted `node_modules` HAS a cause, and it is not the Windows preload.** The last
  edition filed it unknown with `win-junction-symlinks.cjs` as prime suspect. The planner established
  it from the npm logs on 2026-11-03: **the daily sync's own `npm ci` deleted the tree while the
  release's build was using it.** `npm ci` removes before it installs, the damage signature is a
  half-finished delete, and the timestamps line up to the second. **Reading that preload is probably
  not the job. The guard is.** It does not exist yet, so **run `npm ci` first, before any build, and
  run nothing else in the main checkout while one is in flight.** That worked here — 484 entries
  throughout both builds.
- **The deferred-note window COLLAPSED: 9 candidates, down from 48.** The last two editions warned it
  was growing; it is not. **The boilerplate problem is unchanged** — three of the four flagged printed
  the plan template's own text instead of a reason, so **read the plan, not the excerpt**. Two of those
  had actually *ticked* their line and their notes were published. Budget minutes, not an hour.
- **The migration apply was NOT refused.** The pattern across five releases: refused twice
  (`0.41.1`), clean (`0.41.2`), refused (`0.41.3`), clean (`0.42.0`). **Neither outcome predicts the
  next. Do not plan around either, and do NOT ask for an allow rule** — settled on `0.41.2`. A *third*
  refusal is the moment to put the whole pattern to him.
- **`--base` was again not needed**, for the same reason: no note was written in the cut. Expect
  `--base` only on a release that publishes a deferred note in the cut itself.
- **The two hosts' stylesheets differ again** (19 bytes, different filenames) and it is **still not a
  finding**. The per-host `check-assets` is the check. **Stop re-deriving this.**
- **`release-prs.mjs` was short one squash-merged planner handover again** (#1247). **Four releases
  running.** Its exit 0 is correct and not reassuring: read `gh pr list --state merged` by `mergedAt`
  too and add the numbers by hand.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged for four releases**, same five names:
  `medical.weight`, `photos.resident_add`, `resident.adoption_news`, `resident.microchip`, `visit.book`.
  Lutan tests one card at a time on Doctor. **Never restore its cards and never edit the check.**
- **Both Pi caches stayed warm** (658 MB and 661 MB, both `kept`), continuing the run since `0.41.2`.
- **`npm ci` was again measured as not needed** by the range and run anyway. Keep doing that.

## New this release

- **The "minor release" trap fired for the SECOND time and the prescribed question defused it again.**
  He asked for "a minor release"; in his usage that is the middle-number bump, in `releases.ts` `major`
  means *worth an email*. **Ask about the EMAIL, never about "major or minor"** — and this time the
  answer was **yes**, so the two readings happened to agree on `0.42.0`. **Do not infer from the last
  release that "minor" means no mail.** Use the exact question, every time.
- **Both of his answers went in ONE message**, with the nine notes and the eight pending plans listed
  inside the question itself. **That is what kept this to two touches.** A session that asks the email
  question and the `pending:` question separately spends two interventions on one decision point.
- **A mailing release makes the mail PRESENCE assertion load-bearing**, not the absence. `--verify`
  printed `majorReleasesSince("0.41.3")` → `["0.42.0"]` with the control still finding `0.41.0` from
  further back. **And "sent 1" is not delivery** — the inbox was checked and the message was there,
  unread, seconds after the deploy line. `E_RECIPIENT_NOT_ALLOWED` on the shelter's own address is
  the known skip, not a failure.
- **The first `admin: true` release note ever shipped** (#1248). The cut asserted only that it crossed
  character-identical; **the behaviour is #1248's to verify** and sits on its own plan's `pending:`
  line. Do not read the cut as having checked it.
- **The edge-cache check is easy to get wrong in a way that looks like a broken cache.** A fresh URL
  per fetch is a fresh cache key, so three requests give three `MISS`es and prove nothing. **Fetch ONE
  url three times**: `MISS`, `HIT`, `HIT`. This was done wrong first and redone.
- **`sync-home-icons` now draws 52 cards / 416 images** (was 50 / 400), creating exactly 16 — two
  cards at eight images each, consistent with last release's bill cards. A jump of a multiple of eight
  is a new card, not a fault.

## In flight and open

- **8 of 14 plans shipped signed `pending:`**, on his decision, grouped in the record. Two clusters:
  a Thai read of new Thai (5) and a look at a screen (3). **The poodle drawings are the one worth a
  real look**, because they are the only thing in this release a member of the public can see.
- **The five cards held by no role: ANSWERED 2026-11-02 — *leave them*. STOP RAISING IT.** Carried
  forward unchanged, because the fault it names is a session re-asking it. It is his action on
  Settings → Who does what, not a release matter, and **not a defect, a gap or a decision anyone is
  owed.** The bill cards from last release are likewise held by nobody — **the normal state of a new
  card.**
- **The whole signed-out surface is still unverified** and `PUBLIC_SITE` is `locked`. The release that
  unlocks the site inherits all of it at once.
- **Nothing behind sign-in was verified**, on either environment: no account. Date handling for
  Thailand sits in that gap.
- **Carried, re-measure each:** the restore drill, never exercised; the Worker-fallback 44-second gap
  from the power-pull drill (its own backlog item under *Architecture*, cause not established).
  **`tee` under PowerShell still writes UTF-16** — `tr -d '\000'` before grepping.

**Next free migration number: `0309`.** `0308` is the highest on `main`, and there is no number to
avoid: both databases read 309 of 309 with nothing applied that has no file. Check `origin/main` *and*
open `*-schema` PRs anyway.
