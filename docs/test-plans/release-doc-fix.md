# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Correct `0.47.10`'s record and handover: a test deploy token must **not** go in `.env.local` |
| Backlog item | `docs/backlog.md` → `#tstok`, corrected on the `backlog` branch in the same round |
| Branch / worktree | `claude/release-doc-fix` @ `C:\Development\Animal_Shelter_scoping-harness-rule` — **a free leftover reused**, as the paperwork budget requires, rather than a new worktree for three documents |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `f76be997c` |

## 1. Scope and risk

- [x] Change is described in one sentence — the `0.47.10` record, its test plan and the handover all said the fix for test's failed Worker deploy was a `CLOUDFLARE_API_TOKEN` in `.env.local`; that is the one place `docs/decisions/2026-11-16-deploy-cloudflare-api-token.md` forbids, so all three now say what the real options are
- [x] Files/areas touched — `docs/releases/2026-11-22-0-47-10.md`, `docs/test-plans/record-0-47-10.md`, `docs/release-handover.md`, and this plan. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered
- [x] Out of scope — **fixing the thing itself.** Neither `wrangler login` nor a `.env.deploy.test` happens in this PR; this PR only stops three documents sending the next reader to do the ruled-out thing

### Why this is a correction and not a tidy-up

**The documents were wrong in the expensive direction: they named an action.** A handover is read by the
next release manager, and `#tstok` is read by whoever picks it up, so *"paste a token into `.env.local`"*
would have been done — and `scripts/worktree.mjs new` copies `.env.local` into every worktree, so the
token would have been duplicated onto disk once per workstream and outlived each one.

**What was actually read, before anyone was handed a command:** `scripts/lib/env.mjs` line 39 —
`envFile("test")` returns `.env.local` and no `.env.deploy.test` exists — and the 2026-11-16 decision's
own words, *"It goes in `.env.deploy.production` and `.env.deploy.uat`, and NOT in `.env.local`."`

**The finding underneath is better than the one first written down.** That decision left test on the OAuth
login deliberately, reasoning *"test's deploys are Claude's and a retry costs nobody's attention"*. That
holds only while the login still exists to refresh. `0.47.10` is the day it expired outright, and then
there is no retry — which is a reason to revisit the decision, not merely a missing value.

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

- [x] Backlog item ticked on this branch — n/a: `#tstok` stays open, and its own correction went on the `backlog` branch where backlog edits belong
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **nothing is being decided here.** The choice between `wrangler login` and a `.env.deploy.test` is `#tstok`'s, and whichever is taken is to be written down with its date
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a correction to a release record or a handover.** None of the three is served, imported or rendered
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** `0.47.10` is live and unchanged by it
- [x] **It is not a gate** and is merged on green without asking, like the record it corrects
- [ ] Smoke test / UAT project line — n/a: nothing is deployed

### Rollback

- [x] Rollback position stated — reverting this PR restores three documents that name a forbidden location. **Nothing deployed changes**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (documentation) | **The `0.47.10` record, its plan and the handover all told the reader to put a deploy token in `.env.local`**, which the 2026-11-16 decision forbids with a stated reason | **fixed in this PR**, marked in place in all three, and `#tstok` corrected on the `backlog` branch. **Caught by reading the decision file before handing over a command**, which is the standing rule that found it |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **`#tstok` itself** — `wrangler login` once, or the durable `.env.deploy.test` | this machine | **open.** Not this PR's work; this PR only makes the documents point at it correctly |

**Nothing in this PR itself needs a person to look at it.**

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs --base origin/main`, the `env.mjs` line read directly and the decision file's wording quoted from it
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: three documents, nothing on screen

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — `#tstok` carries the remaining work, with both options and their costs

Result: pass
