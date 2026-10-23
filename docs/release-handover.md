# Release handover — written 2026-10-23 after `0.39.5`

A **delta**. The release's own facts are in `docs/releases/2026-10-23-0-39-5.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## START HERE: nothing pending blocks a cut, and re-measure that anyway

**`0.39.5` is complete.** All four builds are on **`55a23450`** — production Pi, test
Pi, production Worker, test Worker — which is **two releases running** with all four in
step. Both databases read 252 of 252 with `No drift`. `0251` went on before both
deploys, which was this release's one ordering requirement. **No inherited work.**

**And re-measure rather than trusting the table below.** This edition is written minutes
after the deploy, and `main` already moved **once mid-release** — a backlog grooming merge
landed between the cut's merge and the production deploy. That one was harmless, and it
was *read* rather than assumed (`docs/backlog.md` only, no code), but two editions running
have now been overtaken within the hour. Run `git diff --stat 55a23450..HEAD`,
`gh pr list`, `--status --env production` and the live `/api/version` before believing any
of this.

## The one finding worth acting on before your next verification round

**`node scripts/dev-signin.mjs <role>` — the form `CLAUDE.md` documents — always fails,**
and has since `a5ba4761`. `scripts/dev-signin.mjs:99` picks the positional argument with
`i !== cardsIdx + 1`; when `--cards` is absent `cardsIdx` is `-1`, so the filter excludes
index **0**, which is exactly where the role sits. Both `dev-signin.mjs admin` and
`dev-signin.mjs admin --port 3003` throw the script's **own usage error**.

**Workaround: put the flag first** — `dev-signin.mjs --port 3003 admin` works, and was
used throughout this release.

**Why this is more than a typo.** `CLAUDE.md` elevated this script to *the* route
specifically so `pending: no signed-in session` would count as a fault rather than a
state. A command that fails with its own usage message reads as *your* mistake, so the
natural response is to re-read the arguments and give up, not to suspect the script. That
is a strong candidate for why streams kept reporting no session after the route was
supposedly settled on 2026-10-22. **The fix is one line**
(`cardsIdx >= 0 ? cardsIdx + 1 : -1`, same for `portIdx`). Filed on `backlog` with two
neighbours: `check-home-screens-live.mjs` **cannot run at all** — it still asks for the
`staff` role, retired by `0173`, so the database refuses it and it exits 1 having checked
nothing, and it is not in CI, which is why nobody noticed — and
`dev-signin.mjs --remove admin` fails repeatably with `Database error deleting user`, so
`--remove` cannot be trusted to have left nothing behind.

## Two ways to get a confident wrong answer, both mine, both this release

Recorded because neither produced an error. Each produced an **answer**.

**A whole-page text search counted sidebar nav links as home tiles**, and so reported the
Operations tile present on *every* role — the release having failed. It was matching the
**menu**, which keeps those links by design. Scoping to the home grid gave the truth: no
role has the tile. **The dangerous direction — a false red invites a rollback.**

**A `pgrep -f "deploy-pi.sh"` waiter matched its own command line**, so the loop could
never exit; it sat "waiting" minutes after the deploy had finished. The same shape as the
`| tail` exit-code and PowerShell UTF-16 traps, and now the **fourth** way this
environment hands back a non-answer that looks like one.

## Corrections to the last edition

- **It said #878 was open and "not a release manager's PR to merge". It merged** at 10:57 on 2026-10-23, inside this release's range, as paper only. Nothing was needed from the release manager after all.
- **It said the diets *Servings by size* fix was outstanding and his. Done** — Lutan in chat, 2026-10-23: *"Yes I have corrected the diets"*. Ticked on `backlog` **with the title rewritten**, not merely ticked, because an item still headed "FOR LUTAN, AFTER `0.39.4` DEPLOYS" goes on reading as open to anything that skims. **Recorded as his confirmation, not a measured check**: the diets scripts are locked to dev, so *which* production diets had been affected stays **not established**.
- **It said the "all four builds from one SHA" counter was 1. It is 2.**
- **It said `release-prs.mjs` was seven releases, seven answers, the last an orphan from a squash. Eighth: clean** — 5 PRs, exit 0, and it checked the 6 added migration/test-plan files against the list with no orphan. Still read it **without a pipe**.
- **It said to expect a classifier refusal and take the one retry. Tenth release, none at all** — the production apply, both drift reads, `wrangler deployments list` and the purge each ran first time.

## Where things stand

| | |
|---|---|
| Live | **`0.39.5`** @ `55a23450` — **all four builds**, production Worker included |
| Production Worker | **`0.39.5`**, version `d0b60726`, tagged `v0.39.5`. Verified three ways: `wrangler deployments list` at 100%, the deploy log's `Current Version ID`, and a cache-bypassed `/api/releases/current` answering `0.39.5` with `x-lanna-served-by: worker` |
| Previous release SHA, for the next range | **`55a23450`** |
| Production database | **`252 applied, 0 pending`**, `No drift`, 0 each way. **Run it yourself** |
| Dev database | **`No drift`, 252 of 252** — clean, sixth release running |
| Next free migration number | **`0252`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| `unreleased` and open PRs | 0 notes at the cut — **and that nearly hid the whole release, see below.** Thirteen editions have said 0 and been overtaken: **run `gh pr list` yourself** |
| Backlog | Two edits this release, both on the `backlog` branch where they belong: the diets step closed, the dev sign-in faults filed. **Not yet folded into `main`** — that is `/plan-day`'s daily step |
| Worktrees | The cut's worktree was removed by another session's cleanup **mid-release** (correctly — its branch had merged, and it broke nothing). The record reused `Animal_Shelter_auto-tiles-out`, whose **folder name does not match its branch**, so cleanup by name will miss it |

**Counters:** all four builds from one SHA **2**; `npm ci` as step 1 **22** — and the
reuse caveat earned its keep, the record worktree being reused without an install after
checking `require('next/package.json').version` against `package.json`; first CI run green
by construction **5** (10 of 10); no production-only guard **24**; `strip-baked-env`
**17**, held at 14 on **both** environments. **Server Actions keys** (twenty-first check):
production `cbd55beae8d8`, test `ecc41837fc0b` — each Pi printing `the build in .next.new
carries that key`, which is the evidence rather than the matching values.

## Promoted out of this file

**"An empty `unreleased` is not proof that nothing user-visible shipped"** — the lesson
`0.39.5` was made of — now lives in **`docs/release-procedure.md` step 4**, per paperwork
rule 4. Read it there before your next cut.

## In flight and open

**His, and his only open ones:** the **ten production sign-in checks** listed individually
in the record — no Dev badge, both sign-ins, `/residents`, a resident hub, the dashboard,
`/admin` and its Drive line, nav, console — none able to fail quietly, all behind a login
no session has; and **book one real vet visit on production and see it in "Lanna Care: vet
visits."**

**Both of #882's manual items are now CLOSED by Lutan, within the hour of the deploy.**
Written in rather than left to be re-raised, which is what this file is for.

- *The Who does what toggle* — **done on production**, Lutan 2026-10-23: *"I have removed and added the operations and management tiles from profiles on production"*. This is the item no session could do: the page opens at aal1 but the buttons demand the authenticator app (*"To give or remove cards, verify with your authenticator app first"*) and dragging is off. **It needed him, he did it, and it works.** Its effect had already been verified from the other end — `0251`'s seeded cards draw their tiles on all five roles, read on the deployed test build.
- *The Thai wording of the two new cards* — **fine**, Lutan 2026-10-23: *"yes the Thai wording is fine"*. Both cards had real Thai strings in `th.ts` (`งานปฏิบัติการ`, `การจัดการ`), so this was only ever phrasing, and the phrasing passed.

**One thing this release could NOT establish, and it is a live gap rather than a loose
end.** Exercising that toggle on production means production's `role_cards` may no longer
match what `0251` seeded. `0251` deliberately granted Operations and Management to
**nobody** ("drop operations from every role... same with Management"), and both the record
and the table above were written on that basis. **Whether any role was left holding either
card is NOT established.** He was asked in one line and answered the Thai question
instead, so this is recorded as unknown rather than inferred — the diets lesson, and the
Home Assistant disk size before that. **No session can read it**: every script that would
is hard-locked to the dev project, and those guards were left alone. **So do not repeat
"no role holds either" as current.** Ask him, or read `/admin/who-does-what` with the
authenticator, before anything depends on it.

**The security rebuild continues and still shapes what to cut.** #882 was the quick patch
Lutan chose; **all hard-coded role settings are still to come out** (`JOBS_OF_ROLE`,
`CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`, role-key ordering, and the fallback
home a role with no cards gets), with the card walkthrough runs **on hold** meanwhile.
`check-menu-coverage.mjs` on dev went from 25 to 107 unexplained orphans **by design** —
each is a card for Lutan to give or not, and none was acted on.

**Carried unchanged, nothing new to say and nothing to re-run:** the same three silent
failures as a set (the public desexing sign-up, Drive space thresholds, the retention
job — all three wanting the same `status_alert_runs` → mail plumbing), and the two
unlooked-at items, the prescription form reading 4 (`0.38.1`) and video playback on a real
handset (`0.38.0`).

**One red still unresolved rather than explained away:**
`check-diets-per-serving-schema.mjs` fails `servings default to 1 / 1.5 / 2 - got 1` on dev
alongside 11 passing checks. The benign reading — a diet whose servings were edited, which
is allowed by design — is **plausible and still unverified**, and Lutan has now edited
production diets too, which makes the dev reading no easier to interpret, not easier.

**Moved to `release-procedure.md`** (unchanged, re-checked): "a major release mails one
person", "`test-plan` is advisory, permanently".
