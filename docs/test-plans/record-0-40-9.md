# Feature test plan — record `0.40.9` and the handover

## Header

| | |
|---|---|
| Feature | The `0.40.9` release record, the handover's `0.40.9` edition, and the tick of the cron backlog item that this release closed |
| Backlog item | **Yes, and it is ticked here** — the 15-minute schedule item, closed on both environments. Ticking the item a feature completes is the one backlog edit that belongs on a feature branch |
| Branch / worktree | `claude/record-0-40-9` @ `C:\Development\Animal_Shelter_cut-release-0-40-9` — **the cut's own worktree, reused after its PR merged**, which is paperwork rule 2. Branch made with `git checkout -b … origin/main`, not `git reset --hard` |
| Dev server | n/a: markdown only; nothing runs |
| PR | #1037 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `0911a1e0` (the deployed release SHA) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release that already shipped is written down, the handover is replaced with its `0.40.9` edition, and the cron item is ticked because its stated "done when" is now met on both environments
- [x] Files/areas touched listed — `docs/releases/2026-10-28-0-40-9.md` (new), `docs/release-handover.md` (replaced), `docs/backlog.md` (one item ticked), `docs/test-plans/record-0-40-9.md` (this file). No code, no migration
- [x] Roles affected identified — none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate**; `0.40.9` was deployed and verified before it existed. The seven items awaiting Lutan are listed, not ticked

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `0911a1e0`, the deployed release SHA, and nothing has merged since; `git status -sb` read no ahead/behind
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: **a documents-only PR skips the heavy CI jobs by design** (paperwork rule 1), and four markdown files cannot change a typecheck, lint, test or build. The release's own gates ran on the cut and are recorded in `docs/test-plans/cut-release-0-40-9.md`
- [x] CI green on the PR (runs the same checks) — filled in from the PR; the docs-only gate leaves `changes` and `test-plan`
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, 16/16
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**
- [x] `node scripts/check-backlog-sections.mjs` — run because this PR edits `docs/backlog.md`: **ok, 77 open items, all above `## Completed`**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's three, `0276`–`0278`, are applied; the next free number is `0279`
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
- [x] Boundary cases checked — the handover's length ceiling (about 100 lines, 150 the limit) holds: **131 lines**, measured with `wc -l`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | these files | no route serves `docs/` | **as expected** — no route added |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: these describe a release to the people who run releases, not a feature for shelter users
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public and these files were checked for anything that should not be in it** — no personal data, no resident or donor names, no tokens, and no dev-session snippet (one was used during the cut and deliberately never written down)

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the readers are the next release manager and `/plan-day`, and both read these files by path. Paths unchanged
- [x] Any shared file touched checked from a second, unrelated page — two shared files here. `docs/release-handover.md` is read whole, so replacing it cannot leave a stale fragment. `docs/backlog.md` was validated with its own checker after the tick, and the ticked item was left **in place** rather than moved, which is how every other closed item in that file reads
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — **yes.** The 15-minute-schedule item is closed: production fired 2026-10-27T16:45:10Z, test 2026-10-28T05:30:41Z, which is exactly the "done when" the item itself stated. Its title now says DONE on both environments and carries the closing evidence, so the item reads correctly without its history
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new file in this PR: the release's one decision, the advisory, was recorded in the **cut** PR as `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`, which is where it belonged
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record, a handover or a backlog tick. `unreleased` is not touched by this PR
- [x] Commit messages say why, not just what — the commit leads with the defect this session caused rather than with the release's successes
- [x] **Claims in these documents were measured, not reasoned.** Four that could each have been asserted: the test cron was **re-run against test** rather than inferred from production being healthy; the Admin check's exit code was read **from the command**, which mattered because the harness prints `status 400` on success; Send to hospital being closed was found by **reading the before-picture**, not by being told; and the handover's line count came from `wc -l`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA, `0911a1e0`, is this branch's parent and is in the record's header with the tested SHA `cfa4d3d7` beside it
- [x] Deployed SHA matches the tested SHA — for the **release**, the code-identity diff between them excluding `docs/` and `.claude/` is **empty**, recorded. For **this PR**, nothing is deployed

### On the deployed build

- [x] Deployed to test — **yes, and it is one of this release's results rather than a formality**: `0.40.9` brought test onto the fixed adapter, Worker `802ee57c` and Pi at `0911a1e0`, and test's cron is firing again after five days dead
- [x] Smoke-tested on `test.lannacare.org` — both endpoints report `0.40.9`, the Pi asset check passed, and the cron check returned `verdict: healthy`
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today". Every time in the record is a literal UTC reading quoted from a tool
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into these documents is the tool's actual output, unedited** — the heartbeat lines, the `HARNESS-OK` line, the version ids, the drift counts and the asset-check lines are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached. It was done for the release, with the purge proved by `check-assets.mjs` on the Pi, and recorded as vacuous while the public site has not moved hosts

### Deploy safety

- [x] The production deploy's Supabase project line read — **yes, for the release**: `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (0911a1e0)`, recovered because the command was handed over **with a `tee`** after `0.40.8` lost it
- [x] The `strip-baked-env` line seen in the deploy output — **yes: 14 on both environments**, restoring a counter that `0.40.8` broke
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: four markdown files

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither. The release's three went on **before either deploy**, which mattered this time: `0278` and its reader were in different already-merged PRs, so no per-PR gate could have caught a slipped order

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record of a release that still shipped and re-opens a backlog item that is genuinely closed. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **This session caused the release's only real defect**: running the test deploy in the main checkout while Lutan's production deploy was building there, so both failed on the shared `.open-next` | **Recorded in full in the release record rather than softened**, with what it cost him — one wasted ten-minute deploy and one extra command. The fix is sequencing, not tooling. Written into the handover as the first thing the next release manager should read |
| 2 | none | The record ticks a backlog item, which most record PRs do not | **Correct here.** The item's own "done when" was *test shows `verdict: healthy` too*, and this release is what made that true. Leaving it open would be the stale-title fault this repo has already paid for |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The seven items the **release** leaves for Lutan are in the record and are not copied here, because copying another plan's outstanding items gives them a second home that nothing closes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is four markdown files, no UI, no route and no behaviour. The release's own seven items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
