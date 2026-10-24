# Release handover — written 2026-10-24 after `0.40.0`

A **delta**. The release's own facts are in `docs/releases/2026-10-24-0-40-0.md`
and the durable rules are in `docs/release-procedure.md`. **Both outrank this
file.**

## START HERE

**`0.40.0` is complete and it MAILED** — the first release in six to do so. One person,
delivered and verified in the inbox, not merely `sent 1`. All four builds serve `0.40.0`,
both databases read **254 of 254** with `No drift`, and `0252` and `0253` went on before
either deploy. **No inherited work.**

**Re-measure before trusting any of it.** `main` moved **twice during this release** — a
backlog grooming between the cut's merge and the Worker deploy, a planner handover between
the Worker deploy and the Pi build. Run `git diff --stat 9cdb4af2..HEAD`, `gh pr list`,
`--status --env production` and the live `/api/version` first.

## The counter that reset, and why it is not your fault

**"All four builds from one SHA" went from 2 to 0.** This release's four builds came from
**three** SHAs: test from `f2a691e3`, production Worker from `82666a58`, production Pi from
`9cdb4af2`.

**Every difference is documentation**, measured not assumed: `docs/backlog.md`, then
`.claude/skills/plan-day/SKILL.md` plus `docs/planner-handover.md` and a test plan. **The
served application code is byte-identical across all four.** The Pi was deliberately **not**
rebuilt at an older SHA to tidy the number.

**The cause is other sessions merging paperwork PRs inside the deploy window**, and each Pi
build checks out the current tip. **So the counter now measures something a release manager
cannot control.** `deploy.mjs` takes no `--ref`; `deploy-pi.sh` does. Three honest options,
none taken here because it is not a release manager's call: pin the Pi builds with
`--ref <release sha>`, ask streams to hold paperwork merges during a deploy, or **retire the
counter** and assert what actually matters — that the application code is identical, which is
a diff rather than a SHA comparison. **Do not keep reporting it as a streak; it will keep
breaking for reasons that have nothing to do with the software.**

## Stopping a background call does not stop what it started elsewhere

**An orphaned process from `0.39.5` was still running on the Pi, 13 hours later**: the
self-matching `while pgrep -f "deploy-pi.sh"; do sleep 10; done` waiter that release already
recorded as a fault. `TaskStop` killed the **local ssh client**; the **remote shell kept
going**. Killed this release (pid 79127).

**Two things follow.** A `ssh host 'setsid nohup … &'` command outlives the tool call that
launched it, so anything left looping on the Pi stays looping — check `pgrep -af` there when a
release ends. And it **actively misled this release**: a correctly written
`pgrep -f "[d]eploy-pi.sh"` (bracket trick, so it cannot self-match) reported **"STILL
BUILDING"** because it matched *that stale process*, not its own command line. The bracket
trick works; a stale twin defeats it anyway.

## A third way to read a working release as broken

**I nearly filed `/deliveries` as hung**, on DOM evidence that its content sat in a
`display: none` parent while a spinner had shown for **79 seconds**. A screenshot showed a
perfectly working page. Two traps compounded: **`performance.now()` counts from when the TAB
opened**, not the navigation, so "79 s" was just the tab's age; and an **`innerText` readiness
check** catches a brief loading state and reads exactly like a hang (`body.innerText` returned
55 characters while a hidden `<main>` already held 2,739).

**Second time in two days** a weak signal pointed at a working release being broken — the first
was counting sidebar nav links as home tiles. **Both times the fix was to look at the page
rather than reason about the DOM. Take the screenshot first.**

## Corrections to the last edition

- **It said both of #882's manual items were closed and that was the end of it.** True, and #886 then **fixed two of the three `dev-signin` faults filed the same day** — `dev-signin.mjs <role>`, the documented form, now works (confirmed by running it). The backlog item was retitled to say only part (3) remains. **Filed from a verification round, fixed by a stream, verified in the next release.**
- **It said `worktree.mjs done` "offers `--force` on a false premise". The planner found worse:** because `done` resolves the folder by name but the branch by branch, **`done <orphan branch name>` can target a LIVE worktree** — on 2026-10-23 the folder holding this session's own release branch. `--force` would have destroyed it mid-release *and* deleted an unrelated branch. Now its own `## Architecture` item. **Never `--force` `done` on a folder whose name does not match its branch**; a release creates that state routinely.
- **It said `audit` was green with nothing to carry. It is RED again** — `body-parser` and `undici`. **Not reachable; fix nothing.** Read `docs/decisions/2026-10-24-audit-body-parser-undici-not-reachable.md` rather than re-deriving it; the short version is that the 21 MB deployed bundle has **0** matches for either, and the undici "fix" moves wrangler **backwards**.
- **It said `strip-baked-env` was held at 14 on both environments. Still 14**, third consecutive release.

## Where things stand

| | |
|---|---|
| Live | **`0.40.0`** — production Pi `9cdb4af2`, production Worker `b3007932` tagged `v0.40.0` (from `82666a58`), both test builds from `f2a691e3` |
| Previous release SHA, for the next range | **`9cdb4af2`** (the production Pi's, the build users are served) |
| Production database | **`254 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`No drift`, 254 of 254** |
| Next free migration number | **`0254`**. **Check `origin/main` *and* open `*-schema` PRs anyway** |
| The mail | **Sent AND delivered.** One recipient, `skipped 0`, all three notes correct in the inbox. `[UAT]` prefix in the subject is current production behaviour while the app is pre-1.0 |
| `unreleased` and open PRs | 0 at the cut; `main` moved twice during the release. **Run `gh pr list` yourself** |
| Backlog | Nothing needed folding at step 1 (`main..backlog` empty — yesterday's notes were already merged overnight) |
| Worktrees | The cut's worktree was reused for the record, per paperwork rule 2, after checking `next` matched `package.json` |

**Counters:** all four builds from one SHA **0** (reset, see above); `npm ci` as step 1 **23**,
and done in the **main checkout** this time, which `0.39.5` skipped; first CI run green by
construction **6** (9 of 10, `audit` red by design); no production-only guard **25**;
`strip-baked-env` **18**, at **14** on both environments. **Server Actions keys** (twenty-second
check): production `cbd55beae8d8`, test `ecc41837fc0b`.

## A growing class of production facts no session can read

Worth naming, because it is now three releases running and it shapes what "verified" can mean.

**Every script that would answer these is hard-locked to the dev project**, and those guards
have been left alone each time rather than worked around:

- **Which production diets were affected** by `0250`'s per-serving back-fill (`0.39.4`) — still not established, and Lutan has since edited them by hand.
- **Whether any production role holds the Operations or Management card** after he exercised the toggle (`0.39.5`) — recorded as not established.
- **Whether the doctor role has `0230`'s medical cells on production** (#890, this release) — all **eight** doctor/medical check scripts refuse a non-dev project.

**So an increasing share of verification can only be done by Lutan**, and each release records
one more "not established". That is the honest state, not a complaint — but it is a question
worth putting to him: whether a **read-only** production check script is worth having, given
every existing one refuses by design. **Do not work around the guards to answer it.**

## In flight and open

**His, and his only open ones:** the **ten production sign-in checks** listed individually in
the record, all behind a login no session has; **the Thai wording of the new Units screen**
(`/admin/units` in Thai) — the one genuine `pending: a person` left from this release's PRs;
and **book one real vet visit on production and see it in "Lanna Care: vet visits."**

**A paperwork fault to be aware of rather than chase:** #890's plan is signed
`pending: the production 0230 status check above`, and its *Left for manual verification* table
is **empty** — the item is nowhere written down, so nobody can act on it, and the check itself
is in the class above. Reported in the record.

**The security rebuild continues and still shapes what to cut.** All hard-coded role settings
are still to come out (`JOBS_OF_ROLE`, `CURATED_HOME`, `OUTSIDE_REGISTRY`, `FIXED_FOR_NOW`,
role-key ordering, the no-cards fallback home), with the card walkthrough runs **on hold**.
Lutan, 2026-10-24: **card sections by feature goes first in the next plan**.

**Carried unchanged, nothing new to say:** the same three silent failures as a set (the public
desexing sign-up, Drive space thresholds, the retention job — all wanting the same
`status_alert_runs` → mail plumbing), and the two unlooked-at items, the prescription form
reading 4 (`0.38.1`) and video playback on a real handset (`0.38.0`).

**One red still unresolved rather than explained away:**
`check-diets-per-serving-schema.mjs` fails `servings default to 1 / 1.5 / 2 - got 1` on dev
alongside 11 passing checks. Still **plausible and unverified**, and Lutan's hand edits to
production diets make the dev reading no easier to interpret.

**Watch, do not act:** OpenNext `Failed to copy` errors on the test Worker build rose from
**one** to **three** (`age-encryption`, `color-string`, `data-uri-to-buffer`). Non-fatal — the
build bundled, uploaded and exited 0 — and not seen on the production build. A count that
keeps rising may eventually drop something that matters.
