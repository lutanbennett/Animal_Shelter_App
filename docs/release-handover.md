# Release handover — written 2026-11-05 after `0.43.1`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-11-05-0-43-1.md`. **Both outrank this file.**

## START HERE

**`0.43.1` is deployed on both environments and it did NOT mail** — on his answer, and that absence is
verified at the inbox, not inferred. **All four builds came from `beabcf7f`**, and `origin/main` is
still `beabcf7f`, so the code-identity question needed no judgement for the first time in three
releases. **317 of 317 applied**, `0 pending` and no drift on both databases, `role-cells` and
`role-cards` byte-identical across the apply, `activities-grantable` unchanged at ten, every held card
fully applied, every cell backed by a card, `calendar-cron` healthy.

**The release cost two touches — the target.** His one answer and his one command.

**One thing is still outstanding and it is his:** a stray `next start -p 3100` in the **main
checkout**, which broke `npm ci` there (below).

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat beabcf7f..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## THE "MINOR RELEASE" TRAP FIRED THIS TIME, AND THE QUESTION IS WHAT CAUGHT IT

**The one thing in this edition to read before you start.** He said *"Let's do a minor release"* and
**meant no email**. Taken at face value it would have shipped as `0.44.0` **with** mail — because in
his usage *minor* has meant the middle-number bump, and that release mailed, while in this repo
`major` means *worth an email*.

- **Put the question with both words removed, every single time: *should this release email you?***
  Name what the notes say, that it reaches one address in practice, and that it cannot be unsent once
  his deploy runs.
- The last edition recorded the trap as *not firing*, only because he pre-empted it by saying *"a
  major release with email"* himself. **That was luck, not evidence.** Three of the last four
  releases have turned on this question.
- Ask it with the pending-plans question in the **same round**. He answered both in one message
  again, which is what keeps a release to two touches.

## New this release

- **`npm ci` IN THE MAIN CHECKOUT CAN FAIL AND LEAVE THE CHECKOUT UNABLE TO BUILD.** It failed with
  `EPERM … unlink node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node` **after** taking
  the tree from 484 packages to **37**. The main checkout is where both deploys run `next build`, so
  the next command would have failed in a way that looks nothing like its cause. **The holder was a
  stray `next start -p 3100` started in the main checkout that morning and still alive six hours
  later, with nothing listening on 3100** — almost certainly left from a Lighthouse pass, which needs
  `build` + `next start`. **Three things follow.** (1) **`npm install`, not `npm ci`, is the repair**:
  it restores the tree without unlinking the locked file, and its only diff was the stale version
  string below. (2) **Prove the checkout afterwards** — `npm run build` exited 0 and printed
  `▲ Next.js 16.4.2`, which is what made it safe to hand him his command. (3) **Stopping the process
  was refused** by the classifier as *Interfere With Workloads*, so it is on his list, not yours.
  **Add a look for stray `node` processes in the main checkout to your step-1 checks**, beside
  `git status --porcelain`.
- **Verify a no-mail release at the INBOX, with a presence control beside it.** A search for
  `from:releases@lannacare.org newer_than:2d` found `0.43.0` and `0.42.0` and **no `0.43.1`**. That is
  the runbook's absence-plus-presence rule applied to the thing itself rather than to a function, and
  it costs one call. The deploy's own `no major release new to production … so no email` line and the
  cut's `mail ABSENCE` assertion are both still worth having; this is the one that cannot be fooled.
- **`package-lock.json`'s own `version` field had been stale since `0.41.0`** (`0.41.0` against
  `package.json`'s `0.43.0`), because `cut-release.mjs` has never touched the lockfile. Harmless —
  `npm ci` compares dependency trees — but it is the kind of thing a later report reads. Both strings
  set to `0.43.1` in the cut; **the script change is backlog `#jhd8s`, so check whether it landed
  before you fix it by hand again.** Changing the lockfile also makes the PR's `audit` job run for
  real, which is a small bonus rather than a problem.
- **The production apply was refused by the classifier and succeeded on an immediate retry.** That is
  the **third episode** (`0.41.1` twice, `0.41.3`, now), which the last edition said is when to put
  the pattern to him. **It has now been put to him, in the release report.** Do not ask for an allow
  rule — settled against on `0.41.2`. Retry once; it has always cleared.
- **`release-prs.mjs` was NOT short a PR**, after five releases running where it was. Its exit 0 is
  still not proof: the `gh pr list --state merged` cross-check by `mergedAt` is one call and it agreed
  exactly. **Keep doing it** — the pattern breaking once does not mean the gap is closed.
- **Read paperwork rule 2 BEFORE you make a worktree for the record.** The record goes in the **cut's
  own worktree** (`git fetch && git checkout -b claude/record-<version> origin/main` there). A
  separate `record-…` worktree was created first here and had to be `done`'d; the wrong order costs an
  `npm ci` and leaves a second folder for `/clean-streams`.

## Corrections and closures to the last edition

- **`--base` was needed again, exactly as predicted**, for one note rather than five:
  `project-photos-approval`, whose step (`0316`) this release closed. **Two releases running. Expect it
  on any release that applies a migration streams were waiting on**, and commit the note first so
  `--verify --base <that commit>` still means something.
- **The deferred-note window was 20 and only ONE was real.** Seven were already answered by `0.43.0`'s
  own cut (`0310`–`0315` all applied there), `cutover-rehearsal` stays correctly open, and **the rest
  print the plan template's boilerplate instead of a reason — four editions running.** Read the plan,
  not the excerpt. Twenty candidates took about ten minutes.
- **The notes were read as a SET**, which is what caught a contradiction last release. None of these
  six disagreed. **Keep doing it: no check looks for this.**
- **Both Workers and both Pis agreed, so nothing was left behind** — the test Worker was level, unlike
  `0.42.0`'s.
- **The Server Actions key pairs matched**: production `cbd55beae8d8` on Worker and Pi, test
  `ecc41837fc0b` on both. Read both prints rather than one.
- **`doctor-cells` reads `MISSING 5 of 12`, unchanged for six releases**, same five names. Never
  restore its cards, never edit the check, never raise it.
- **The two hosts' stylesheets differ again** (99,042 against 99,067 bytes, different filenames) and it
  is **still not a finding**. Stop re-deriving this.
- **`guard-release` on the Pi could not ask production about migrations** (`SUPABASE_ACCESS_TOKEN` is
  not set there) and went ahead, which is the documented *warns and does not refuse* path. **Read
  `--status` yourself**; it was 317 of 317 before either deploy.
- **The edge-cache reading was `MISS` then `HIT`, and the `MISS` was `purge-cache`'s own probe.** Say
  which fetch was the miss rather than implying you watched a sequence.

## In flight and open

- **Four plans shipped signed `pending:`**, on his decision, listed in the record. **The one worth
  doing first is `release-0-43-0-fixes`** — three checks on things that were visibly broken, all now
  possible on the deployed build.
- **The stray `next start -p 3100` in the main checkout is still running.** Until it is stopped,
  `npm ci` there fails. `npm install` works; so does a build.
- **Seven of the last two releases' notes say their own Thai is unread by a Thai speaker.** Still a
  standing backlog, still worth putting to him as **one** decision rather than seven.
- **Nothing publicly visible shipped**, so the locked public site cost nothing this time. The release
  that unlocks it inherits `0.43.0`'s Events page, Campaigns and Sterilisation redirects, and this
  release's gated project photos, all at once.
- **Nothing behind sign-in was verified**, on either environment: no account.
- **Carried, re-measure each:** the restore drill, never exercised; the Worker-fallback 44-second gap
  from the power-pull drill. **`tee` under PowerShell still writes UTF-16** — `tr -d '\000'` before
  grepping, and **read his terminal** rather than the log file for the production deploy's own lines.

**Next free migration number: `0317`.** `0316` is the highest on `main`, and there is no number to
avoid: both databases read 317 of 317 with nothing applied that has no file. Check `origin/main` *and*
open `*-schema` PRs anyway.
