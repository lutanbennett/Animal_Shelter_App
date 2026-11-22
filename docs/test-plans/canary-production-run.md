# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The production tenancy canary ran: its decision file, a pointer from this morning's predecessor, and the stale `#cnypd`/`#ykefa` lines corrected |
| Backlog item | `docs/backlog.md` → `#ykefa`, which names this decision file as the one thing still outstanding, and `#cnypd`. **Both already ticked**, so there is nothing to tick here |
| Branch / worktree | `claude/canary-production-run` @ `C:\Development\Animal_Shelter_backlog-waiting-state` — **the same free leftover reused again**, rather than a four-minute `npm ci` for four documents |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `5d1a68d98` |

## 1. Scope and risk

- [x] Change is described in one sentence — Lutan ran the tenancy canary against production and it found nothing, so this PR adds the decision file `#ykefa` names as owed, points this morning's *not run on production* file at its successor, and corrects the record and handover lines that still called `#cnypd` and `#ykefa` open
- [x] Files/areas touched — a new `docs/decisions/2026-11-22-tenancy-canary-run-on-production.md`, plus `docs/decisions/2026-11-22-tenancy-canary-not-run-on-production.md`, `docs/releases/2026-11-22-0-48-0.md`, `docs/release-handover.md` and this plan. No code, no schema, no configuration. **Line endings preserved deliberately** — every file here is CRLF in this checkout and each edit detects the file's own EOL, so the diffs are lines rather than whole-file rewrites
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered
- [x] Out of scope — **running the canary again, and making it a gate.** Neither happens here, and the second is not possible: it plants rows in the real database and cannot run on the pull-request path, so it stays a run someone triggers

### The one thing this plan is really certifying: WHO SAW IT

**This PR records a verification I did not witness, so the plan's job is to be exact about that** — the
project's own rule is that a signature which does not correspond to someone having looked is worse than
none, and a decision file is the first artifact anyone reaches for when something has gone wrong.

**What was checked before anything was written, and one check disagreed.** The run was reported by the
backlog manager session. I looked for it myself first: `read_terminal` shows one Terminal tab whose
scrollback **ends at the `0.48.0` deploy with no canary after it**; `check-tenancy-canary.mjs` calls no
`writeFile` and leaves nothing in `.local/`, so a completed run has **no footprint**; and
`git grep i-understand-this-plants-rows-in-production -- docs/` returned only the flag's own decision
file. **So I held the file and said why.**

**What resolved it, and why it is not simply taking a peer's word.** The account came back first-hand and
specific: Lutan pasted **two screenshots** of his own PowerShell window, one showing the attempt refused
because a **trailing full stop** had come through on the end of the flag, one showing the command without
it and the output. **It also explained my disconfirming check rather than talking past it** —
`read_terminal` reads only the app's Terminal panel, not his own terminal window, which is exactly why
that scrollback ends at the deploy. A failed first attempt that was diagnosed live is not something an
inference arrives with.

**Why that distinction was worth the round trip.** Earlier the same day the same session relayed an
*inferred* UAT canary run as fact; asked, it confirmed it was inferred. **So the question was asked and
answered on its merits, not on trust**, and the decision file names the run as Lutan's, the observation
as that session's from his screenshots, and the parts I verified myself — separately, in its own section.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `f76be997c` and nothing was merged in
- [ ] `node scripts/gates.mjs` — n/a: documents-only, so the four gates have nothing to compile and `ci.yml` skips the heavy jobs. **Not to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — must not print STALE: the handover still names `docs/releases/2026-11-22-0-47-10.md`, which this PR does not rename
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha`**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: no migration. `0434` is applied and both deploy databases read `435 applied, 0 pending`

## 4. Functional checks

- [x] **The claim being corrected was checked in the source, not inferred** — `scripts/lib/env.mjs` line 39 read directly, and the prohibition quoted from the decision file rather than paraphrased
- [x] **The correction is marked in place rather than silently rewritten.** Each of the three documents says it was corrected the same day and what it first said, so a reader who saw the earlier version knows which way it went — the repository's standing rule for superseded passages
- [x] **No new claim is made about what fixes it.** Two options are named with their costs; neither is presented as done
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: three documents in `docs/`
- [x] **No credential value appears anywhere in the change.** The tokens were counted, never printed, and the correction is about *where* a token may live

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files; `docs/` is not part of any build
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by `check-release-handover.mjs`, run above, and by the next release manager. The record's header, figures and verification sections are untouched
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: nothing to tick. `#tstok` was already ticked by the record PR this one corrects, and `#thpfx` is open on the `backlog` branch where it belongs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — **yes: `docs/decisions/2026-11-22-tenancy-canary-run-on-production.md` is the substance of this PR**, and it carries the three judgements worth keeping — that `is_trusted_caller: false` is the whole of what the run proves, that the instrument's two blind spots are stated in its own words so nobody reads it as wider, and that the refused first attempt is a measurement of the flag rather than a user error
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a correction to a release record or a handover.** None of the three is served, imported or rendered
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** `0.48.0` @ `050b44b0f` is live on all four hosts and unchanged by it, and the reader this PR is about is still outside that commit
- [x] **It is not a gate** and is merged on green without asking, like the record it corrects
- [ ] Smoke test / UAT project line — n/a: nothing is deployed

### Rollback

- [x] Rollback position stated — reverting this PR restores three documents that name a forbidden location. **Nothing deployed changes**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (documentation) | **The record and the handover both still called `#cnypd` and `#ykefa` open and Lutan's**, which went stale within the hour when he ran the canary and both items were ticked | **fixed in this PR**, marked in place in both, and the handover trimmed back to its 150-line ceiling rather than allowed to grow past it |
| 2 | low (usability, not a fault) | **The production flag is long enough that a copy picks up a stray character.** His first attempt carried a trailing full stop and was refused | **recorded in the decision file as a measurement of the flag, not a user error.** The guard named the exact flag it wanted and pointed at the file to read first, which is `#cnypd`'s intent working on its first real encounter with a human. **Nothing here argues for shortening it** — the length is the price of being unmistakable |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **Nothing in this PR.** Four documents; no screen, no behaviour, no command | — | n/a |
| 2 | **The run this PR records was performed by a person — Lutan** — and that is the manual verification, belonging to the canary rather than to this documents PR | his own terminal | **done by him.** I have NOT signed his line for him: the project's rule is that *Manual verification by* is signed only by the person who looked, and he has not asked me to sign it. The decision file credits the run to him and the observation to the backlog manager, in its own section |

**Nothing in this PR itself needs a person to look at it**, which is why the signature below is `n/a`.
**That `n/a` is about the four documents, not about the run** — the run was performed, by him, and the
decision file says exactly how that is known and what I could not check myself.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs` (not STALE, and the handover re-trimmed to its 150-line ceiling), `check-test-plan.mjs --base origin/main`, the flag's behaviour read directly in `scripts/check-tenancy-canary.mjs`, `git grep` for any prior committed record of a production run, and `read_terminal` plus `.local/` for a trace. **The one thing I could not verify is named as such in the decision file rather than ticked here**
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance for this PR's four documents, and row 2 above records the run that WAS performed by a person, attributed rather than signed on his behalf

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — nothing is owed. The reader ships with the next release against a column already on production and UAT, which the record now says in those words

Result: pass
