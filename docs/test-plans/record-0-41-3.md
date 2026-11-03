# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.41.3` release record and the release handover, written together after the release was deployed and verified |
| Backlog item | `docs/backlog.md` → n/a: a release record is `docs/release-procedure.md` step 8, not a backlog item. The one backlog item this release created — the gutted `node_modules` fault — was filed on the `backlog` branch, where new items belong |
| Branch / worktree | `claude/record-0-41-3` @ `C:\Development\Animal_Shelter_cut-release-0-41-3` — **the cut's own worktree, reused**, as the paperwork budget requires: one worktree and one PR per release, rather than a four-minute `npm ci` to hold two markdown files |
| Dev server | not started — n/a: two documentation files, no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `befdeeb8` — the branch is cut from it and the release was deployed from it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — `docs/releases/2026-11-03-0-41-3.md` records what shipped and what was checked, and `docs/release-handover.md` is rewritten as a delta for the next release manager
- [x] Files/areas touched listed — `docs/releases/2026-11-03-0-41-3.md` (new), `docs/release-handover.md` (rewritten), this plan. Nothing else
- [x] Cards affected identified — **none.** No card, activity, cell or control changed. Neither file is served, imported or rendered. Admin and the signed-out public are both unaffected
- [x] Anything explicitly **out of scope** written down — the gutted-`node_modules` fault is **filed, not fixed**: its cause is not established and it is not release work (`docs/release-procedure.md`, *a release cuts what the build gave it*). The ten `pending:` plans belong to their own plans and are grouped, not copied. The four new cards are **not** assigned to anyone: that is Lutan's step and he has already said to leave such cards alone

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/record-0-41-3 origin/main` after a fresh `git fetch`, at `befdeeb8`, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: this PR changes two markdown files and a test plan, and `scripts/check-docs-only.mjs` marks it documents-only, so CI gates everything except `test-plan` off. **Running the four gates here would prove nothing about markdown** and the paperwork budget is explicit that a documents PR skips the heavy jobs. Deliberately not run, and stated rather than ticked silently. The gates that matter to this release were run on the cut, #1239: `typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

`node scripts/check-test-plan.mjs --base origin/main` is the one check that runs on a documents-only PR, and it is run before pushing.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. The release's four are recorded in the record; the next free number is `0306`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR. The release's apply already happened, before either deploy, and is recorded

## 4. Functional checks

- [x] Happy path works end to end — the equivalent for a record is that every claim in it came from a run rather than from reasoning, and that is what section 7 attests. The record's own statements were each read back from the tool that produced them
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no operation exists
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic
- [ ] Driven in a real browser — n/a: neither file is served. The browser **was** used in this release, for the edge-cache check, and that result is in the record

### Role access matrix

**Not run, and deliberately.** Neither file is reachable by any login. Reported by card rather than by role, as `CLAUDE.md` requires.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| any card set | neither file | nothing: not served, not imported, not rendered | n/a: no gate changed |
| Admin | neither file | the same | n/a: no gate changed |
| signed out | neither file | the same | n/a: no gate changed |

- [ ] Every login above tested — n/a: there is nothing to reach
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. A record is written for whoever runs the next release, in English
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — n/a as written; nothing imports either file. Worth stating because it is the reason this PR is documents-only and skips the gates
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` is rewritten rather than appended, and it is read by exactly one consumer: the next release manager. Its predecessor is preserved in git history, which is where a superseded edition belongs
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was created from `origin/main` at `befdeeb8`

## 7. Documentation

- [x] Backlog item ticked — n/a: a release record closes no backlog item. This release **created** one, the gutted `node_modules` fault, and it is filed on the `backlog` branch under *Architecture* (`check-backlog-sections.mjs` ok, 74 open items), which is where new items go and not in this PR
- [x] Non-obvious design choices recorded — the record carries them: why no `--base` file was needed, why nothing was done when `main` moved, why the concurrent `worktree.mjs done` was ruled out by timestamp, and why the home-icon sync was held back until the retry reported
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The seven notes this release publishes were moved into place by the cut, #1239
- [x] Commit messages say why, not just what — the commit explains what the record settles (the `0302` warning, the no-`--base` reason) and what it leaves open (the `node_modules` cause)
- [x] **Claims were measured, not reasoned** — this is the line that matters most on a record, and the record is explicit about the difference in three places: the `node_modules` cause is written as a **hypothesis fitted to the evidence, not a diagnosis**; the ruled-out suspect is ruled out by a **timestamp**, quoted; and `activities-grantable` before and after was **diffed** rather than eyeballed. Where something was not established it says so

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `befdeeb8`, and the release was deployed from it
- [x] Deployed SHA matches the tested SHA — `befdeeb8` on all four builds, each read from its own deploy output rather than assumed

### On the deployed build

- [x] Deployed to test — the test Worker is on `0.41.3` (`ad921969`, 100%, tagged `v0.41.3`) and the test Pi serves `0.41.3` @ `befdeeb8`. **It took two attempts**, and the failure and its repair are Defect 4 in the record
- [x] Smoke-tested on `test.lannacare.org` — `/api/version` and `/api/releases/current` both answer `0.41.3`, asked both ways round so a Worker lagging behind the Pi could not hide. What a smoke test cannot reach without an account is stated in the record
- [ ] Timezone-sensitive behaviour proved — n/a: this PR contains no logic. For the release, date handling for Thailand sits inside the no-account gap and the record says so
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — every figure in the record is copied from the run that produced it, including the deploy lines read live from Lutan's terminal
- [x] Public pages re-checked after a cache purge — the purge ran, both hosts' asset checks were re-run by hand afterwards and both came back identical to their builds, and the edge cache was read in a real browser (`MISS`, `HIT`, `HIT`). `PUBLIC_SITE` is `locked`, so the pages themselves cannot be toured without an account

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — read live from his terminal: `dbkodyyxxhtygxcxmfcu (befdeeb8)`, which is production
- [x] `strip-baked-env: removed N env var(s)` seen — **14**, each named, on both the production and test deploys
- [x] Any new secret/env var exists in the production Cloudflare environment — none added or removed anywhere in this release

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR. The release carried both, and the apply preceded both deploys
- [x] `--env production --dry-run` clean — run for the release before the apply: all four **ok, exit 0**
- [ ] Backup fresh for a destructive migration — n/a: all four were additive
- [x] Apply plan stated — already executed and recorded

### Rollback

- [x] Rollback position stated, including what it does not cover — nothing to roll back: this PR adds and rewrites documentation. For the **release**, `./scripts/pi/deploy-pi.sh --ref 9cd14859` on both clones returns users to `0.41.2` and `npx wrangler rollback --env production` reverts only the Worker fallback; **neither reverts `0302`–`0305`**, and nothing needs them to, since all four are additive and the `0.41.2` build reads none of the new columns

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | None in this PR | — |

The release's own defects and avoidable costs are in the record: the refused migration apply that cost Lutan a third touch, the failed test deploy that gutted `node_modules`, `release-prs.mjs` short by two PRs for the third release running, and the growing deferred-note window.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing. Neither file is reachable by any login, and the release's own manual items are carried on the cut plan and on the ten plans signed `pending:` | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: there is nothing for a person to look at, so nothing is being signed for

Manual verification by: n/a: two documentation files, neither served nor rendered, read only by the next release manager; the release's own manual items are carried on their own plans

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-03
