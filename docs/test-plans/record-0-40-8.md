# Feature test plan — record `0.40.8` and the handover

## Header

| | |
|---|---|
| Feature | The `0.40.8` release record (`docs/releases/2026-10-27-0-40-8.md`) and the release handover's `0.40.8` edition |
| Backlog item | `docs/backlog.md` → n/a: the record and the handover are steps 8 and 4 of `docs/release-procedure.md`, not backlog items |
| Branch / worktree | `claude/record-0-40-8` @ `C:\Development\Animal_Shelter_cron-leaves-a-trace` — **a free leftover reused**, which is paperwork rule 2. Branch made with `git checkout -b claude/record-0-40-8 origin/main`, not `git reset --hard`, which the classifier refuses |
| Dev server | n/a: markdown only; nothing runs |
| PR | #1010 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `ad4a7000` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release that already shipped is written down, and the handover is replaced with its `0.40.8` edition
- [x] Files/areas touched listed — `docs/releases/2026-10-27-0-40-8.md` (new), `docs/release-handover.md` (replaced), `docs/test-plans/record-0-40-8.md` (this file). No code, no migration, no `worker/`
- [x] Roles affected identified — none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate**; `0.40.8` was deployed and verified before it existed. The correction to the **backlog** item went to the `backlog` branch, not here, because that is where backlog edits belong

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `ad4a7000` minutes before writing, and `git status -sb` read no ahead/behind
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: **a documents-only PR skips the heavy CI jobs by design** (paperwork rule 1), and three markdown files cannot change a typecheck, lint, test or build. The release's own gates ran on the cut and are recorded in `docs/test-plans/cut-release-0-40-8.md`
- [x] CI green on the PR (runs the same checks) — filled in from the PR; the docs-only gate skips `check`, `public-views` and the rest, leaving `changes` and `test-plan`
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, 16/16
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's one, `0274`, is applied; the next free number is `0275`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR; nothing reads a markdown file
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: there is no path. These are documents read by people and by the next release manager's session
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the boundary that matters for a handover is its **length ceiling**: paperwork rule 4 says aim for about 100 lines, treat 150 as the limit. Measured, not estimated: **135 lines**

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | these files | no route serves `docs/`; readable only in the repository, which is public | **as expected** — no route added, and nothing in `src/` reads `docs/releases/` or `docs/release-handover.md` |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: the record and handover describe a release to the people who run releases, not a feature for shelter users
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public, and these files were checked for anything that should not be in it** — no personal data, no resident or donor names, no tokens. The one identifying detail present is that Lutan received a status-alert email, which names no one else and is already in the backlog

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the nearest *readers* are the next release manager and `/plan-day`, and both read these files by path. Both paths are unchanged
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the one shared file and is read whole rather than by section, so replacing it cannot leave a stale fragment. The `0.40.7` edition is not lost: it is in git history and its release has its own record
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a as a tick, and deliberately so: **the cron item is not ticked, because production is fixed and test is not.** The correction that was owed — a title still claiming both environments were dead — was made **on the `backlog` branch**, which is where backlog edits belong, and included explicitly superseding this session's own earlier wrong conclusion
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new file: the record makes no design choice. The decisions of this release live in their own PRs, among them `docs/decisions/2026-10-27-cron-heartbeat.md`
- [x] `README.md` still accurate — unchanged by this PR and re-read: it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. `unreleased` is not touched by this PR
- [x] Commit messages say why, not just what — the commit records what the record establishes, and names the author's own wrong conclusion as the reason the correction section exists
- [x] **Claims in these documents were measured, not reasoned.** Four that could each have been asserted: the cron verdict was **re-run in this session** rather than taken from the peer's paste; the PR count was corrected by `gh pr view` on both squash-merged PRs rather than by trusting a script that exited 1; the Pi gap was read from the two endpoints rather than from "the site is up"; and the pin for the Pi was derived from the Worker's **creation timestamp** against the merge times of the two PRs that landed inside the window

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA, `429229cd`, is in the record's header with the tested SHA `65e076ec` beside it
- [x] Deployed SHA matches the tested SHA — for the **release**, the Worker and the Pi are both on `429229cd`, asserted in the record with the seven-file diff that made the pin necessary. For **this PR**, nothing is deployed

### On the deployed build

- [ ] Deployed to test — n/a: documents are not deployed. **That test itself is a release behind is a defect of the release and is recorded as one**, not hidden here
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents are not deployed, and test is on the old adapter, which the record states plainly
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today". Every time in the record is a literal UTC reading quoted from a tool
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into these documents is the tool's actual output, unedited** — the heartbeat lines, the version ids, the drift lines and the asset-check line are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached. It was done for the release, with the purge proved by `check-assets` on the Pi, and recorded as vacuous while the public site has not moved hosts

### Deploy safety

- [ ] The production deploy's Supabase project line read — n/a: this PR deploys nothing. **For the release it was NOT captured**, and that is recorded as defect 4 rather than inferred
- [ ] The `strip-baked-env` line seen in the deploy output — n/a: this PR deploys nothing. **For the release it was NOT captured**, breaking a ten-release run of `14`. The handover says to record the break rather than carry `14` forward
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: three markdown files

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither. The release's `0274` went on **before** the deploy — enforced rather than remembered, since `deploy.mjs --plan` refused until it had

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes the record of a release that still shipped, which is why it is bookkeeping rather than a gate. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | The record corrects a conclusion **this session published eight hours earlier** in the `0.40.7` handover — that the Cloudflare trigger was the remaining cause of the dead cron | **Corrected here and on the `backlog` branch**, in both cases by marking the wrong passage rather than deleting it. The measurement behind it was sound; the inference that the two listed candidates were exhaustive was not. Recorded because a handover is read as fact by the next session |
| 2 | none | The record does **not** tick the cron backlog item | **Correct and deliberate.** Production is fixed; **test is not**, and test is still on the old adapter. Ticking it would close an item that is half open |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The six items the **release** leaves for Lutan are listed in the record and are not copied here, because copying another plan's outstanding items gives them a second home that nothing closes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is three markdown files, no UI, no route and no behaviour. The release's own six items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
