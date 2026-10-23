# Release handover — written 2026-10-23 after `0.39.4`

A **delta**. The release's own facts are in `docs/releases/2026-10-23-0-39-4.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## START HERE: nothing is pending, and re-measure that before you trust it

**`0.39.4` is complete.** All four builds are on **`e077f45b`** — production Pi, test
Pi, test Worker, production Worker — and `0.39.3`'s Worker gap is closed. The two
steps it deferred both ran, in the required order: the calendar `Reason:` back-fill
(5 visits marked, **after** the Worker deploy) and `sync-home-icons`. So **there is
no inherited work**, which has not been true for two releases.

**One thing is outstanding and it is Lutan's** — next section. **Ask him about it
before you cut anything**, because it concerns what the dogs are fed.

**And re-measure this section rather than trusting it.** Last edition's START HERE
said the `0.39.3` Worker gap was "one command"; by the next morning it was **no
command at all** — `main` had moved 11 PRs, `deploy.mjs` refuses while `unreleased`
has lines (it had three), and two migrations were pending. `deploy.mjs` takes **no
`--ref`**, so `c0bdf272` could not be built at all. **A handover's facts have a shelf
life of hours.** Run `git diff --stat <last SHA>..HEAD`, `gh pr list`,
`--status --env production` and the live `/api/version` before acting on any of it.

## The one finding that outranks everything else here

**`0.39.4` can quietly feed the dogs less, and that is an accepted decision rather
than a bug.** `0250` back-fills `qty_per_serving` from the **Small** amount, and the
app computes medium as `small × 1.5`, large as `small × 2`. A diet entered as
**1 : 2 : 3** therefore drops: on dev, **8 of 10 ingredient lines** are 1 : 2 : 3, so
Diabetic green beans for a medium dog reads **45 g where it read 60 g**.

**Lutan was asked before any deploy and chose *"deploy now, I will fix diets
after"*.** The remedy is per diet and takes seconds: **Settings → Diets → the diet →
*Servings by size* → 1 / 2 / 3** restores the old amounts exactly. Filed as a FOR
LUTAN backlog item. **Ask him whether he has done it.** Until he has, the kitchen's
feeding list shows reduced amounts and nothing on screen says so.

**Which production diets are affected was never established**, and is recorded as not
established: all five diets scripts are hard-locked to the dev project, and that
guard was left alone rather than worked around. **Do not assume dev's 8-of-10 shape
is production's.**

**And the safeguard is mute.** `0250` ends with a `do $report$` raising a NOTICE per
out-of-proportion line — *"Each is Lutan's call"* — but `apply-migrations.mjs` goes
through the Management API, **which drops notice output**. The production apply
printed `applying 0250 … ok` and nothing else. Backlog item filed. **Generalise it:
any migration relying on a NOTICE to tell a person something is invisible through
this path.** If you need to tell someone, write a check, not a notice.

**The wider lesson, and it is the useful one:** every gate passed — four local gates,
ten CI checks, a clean `--dry-run`, and a backup gate that correctly read `n/a`
because `0250` genuinely is additive. **Additive in the database is not the same as
harmless to the animals.** It was found by reading the migration, which nothing
required.

## Corrections to the last edition

- **It said the red `audit` was settled and not to re-derive it. It is now GREEN**, passing in 14s: the `next@16.4.2` bump (#869) merged inside this release, so all three advisories are gone. The planner's backlog item closed by shipping. Nothing to carry.
- **It said `release-prs.mjs` was six releases, six answers. Seven: exit 1, one orphan, #865**, squash-merged — **the same shape as #854.** Two consecutive identical failures is the signal to teach the script the squash case rather than hand-resolve a third. Read it **without a pipe**: `| tail` reports `tail`'s exit code, and the first run printed a DISAGREEMENT above a misleading `EXIT=0`.
- **It said `strip-baked-env` read 14 on test and production's was never read. Production reads 14 too**, same list including both calendar names. "Moved once then held" is now confirmed on both environments.
- **It said to take the one classifier retry. Twice, both cleared, and one was again a READ**: `| tee` on the production apply was refused with no explanation and the **bare command ran**; `--status --env production` was refused as `[Production Deploy]` and ran through **PowerShell**. **Ninth release, ninth behaviour**, cost nothing either time.
- **It said the "all four builds from one SHA" counter was broken and reset to 0. It is 1** — this release genuinely managed all four.

## New: a third way to read nothing and believe it

**PowerShell's `tee` writes UTF-16**, so every plain `grep` of the production deploy
log returns **nothing** on a 30 KB log that plainly contains the lines. Read it with
`Get-Content … | Select-String`. **Keep the `tee`** — it is what saves the pre-build
lines — but know you cannot `grep` the result. The runbook's existing "grep the
project ref, not the arrow" advice is a symptom of the same cause, not a separate
quirk. The test deploy, run with a plain `>` redirect, greps fine in Bash: **two logs
of one release, two tools.**

With the `git show <rev>:<path>` trap in `CLAUDE.md` and the `| tail` exit-code trap
above, that is **three** ways this shell hands back an empty result that looks like
an answer. **Treat a silent zero as unproven, never as a finding.**

## `npm ci` twice, and paperwork rule 2 needs a caveat

Rule 2 reuses a free leftover worktree to avoid a four-minute `npm ci`. **It saved
nothing**: the leftover was 71 commits behind and the range contains the Next bump,
so it had `next` **16.3.8** against a `package.json` saying **16.4.2** — the `0.28.0`
asymmetry, in the worktree this time.

**The caveat:** reuse saves the install only when **no dependency changed inside the
release range**. Check `require('next/package.json').version` against `package.json`
in any worktree you reuse. **No guard would have caught it**: the gates do not read
`node_modules`, and unlike `0.28.0` no deploy guard inspects a worktree.

## Where things stand

| | |
|---|---|
| Live | **`0.39.4`** @ `e077f45b` — **all four builds**, production Worker included |
| Production Worker | **`0.39.4`**, version `f4714abf`, tagged `v0.39.4`. Verified three ways: `wrangler deployments list`, the deploy log's `Current Version ID`, and a cache-bypassed `/api/releases/current` answering `0.39.4` with `x-lanna-served-by: worker` |
| Previous release SHA, for the next range | **`e077f45b`** |
| Production database | **`251 applied`, `0 pending`**, `No drift`, 0 each way. **Run it yourself** |
| Dev database | **`No drift`, 251 of 251** — clean, fifth release running |
| Next free migration number | **`0251`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| `unreleased` and open PRs | 0 notes at the cut; **#876 merged mid-release and `main` moved four more times.** Twelve editions have said 0 and been overtaken — **run `gh pr list` yourself** |
| Worktrees | The cut reused `Animal_Shelter_vet-visit-booking-polish` for its **third** release, and the record reused it again. **Its folder name does not match its branch**, so cleanup by name will miss it |

**Counters:** all four builds from one SHA **1**; `npm ci` as step 1 **21** (and
**twice** this release); first CI run green by construction **4** (10 of 10 first
run); no production-only guard **23**; `strip-baked-env` **16**, held at 14 on
**both** environments. **Server Actions keys** (twentieth check): production
`cbd55beae8d8`, test `ecc41837fc0b` — and each Pi printed `the build in .next.new
carries that key`, which is the evidence rather than the matching values.

## In flight and open

**The same three silent failures, unchanged as a set.** None is broken today and
none is a check to re-run — build-work wanting the same `status_alert_runs` → mail
plumbing: the public desexing sign-up that tells nobody; Drive space, amber at 80%
and red at 95%, that never emails; the nightly retention job's plumbing.

**Six of this release's test plans are `pending:` a person**, shipped as recorded
gaps on Lutan's decision — all "go and look at a screen" items, none able to fail
quietly. Listed in the record. **Do not copy them into a future cut plan's own
table**, which gives them a second home nothing closes.

**One red recorded as unresolved rather than explained away:**
`check-diets-per-serving-schema.mjs` fails `servings default to 1 / 1.5 / 2 - got 1`
on dev, alongside 11 passing checks. The benign reading — a diet whose servings were
edited, which is allowed by design — is **plausible and unverified**. Do not promote
it to a conclusion without measuring it.

**Still unlooked-at: the prescription form reading 4** (`0.38.1`) **and video
playback on a real handset** (`0.38.0`).

**His, and his only open ones: the diet *Servings by size* fix above**, and **book
one real vet visit on production and see it in "Lanna Care: vet visits."** Today's
grooming also asks him to share that calendar with the Director.

**Moved to `release-procedure.md`** (unchanged, both re-checked): "a major release
mails one person", "`test-plan` is advisory, permanently". **The first earned its
keep this release** — stating it plainly changed Lutan's answer from major to minor.
