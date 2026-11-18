# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record for `0.47.2` — `docs/releases/2026-11-18-0-47-2.md` |
| Backlog item | n/a: a release record closes no backlog item |
| Branch / worktree | `claude/record-0-47-2` @ `C:\Development\Animal_Shelter_record-0-47-2` |
| Dev server | n/a: no code in this PR |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | the record commit on this branch; the release it describes is `854891267` |

## 1. Scope and risk

- [x] Change is described in one sentence — one new file, `docs/releases/2026-11-18-0-47-2.md`, recording a release that is **already deployed and verified on all three hosts**, plus this plan
- [x] Files/areas touched — those two documents. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: a document in `docs/` is not served, imported or rendered by the app. No card gates it and nobody signed in or out can reach it
- [x] Out of scope, written down so the next reader is not surprised — **the release itself is finished.** This PR adds no behaviour and reverses none. Two things it deliberately does **not** do: edit `docs/test-plans/deploy-cf-token.md`, whose `pending:` line this release satisfied (an applied plan is a historical record, and editing one inside a release is the scope creep the runbook forbids — it is closed in the record's prose instead), and edit `docs/test-plans/tenancy-anon-view-leaks.md`, whose release-note reason is now out of date for the same reason

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was branched from `origin/main` minutes earlier, after the cut merged
- [ ] `node scripts/gates.mjs` — n/a: **this PR changes no code.** `typecheck`, `lint`, `test` and `build` all read `src/`, `worker/` and `scripts/`, none of which is touched. CI's `changes` job classifies the PR docs-only and skips the heavy jobs for the same reason
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [ ] CI green on the PR — n/a: not yet at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [ ] Audit — n/a: this PR changes neither `package.json` nor `package-lock.json`, so CI's `audit` job shows `skipped`, which is not a pass and is not meant to be. **The release's own audit was run on the SHA that shipped** and is recorded in the record: `audit:register` exit 0, one registered high advisory

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. The release's eighteen migrations were applied and verified before this PR existed, and their readings are in the record

## 4. Functional checks

- [x] Happy path works end to end — the record's claims were taken from tool output as it printed, not written from memory. The ones a reader is most likely to rely on were each re-read while writing it: the three hosts' `/api/version` and `/api/releases/current`, production's Worker version id from `wrangler deployments list --env production`, the three `check-assets` byte counts, the icon sync's counts, and `--status`/`--drift` on both guarded databases
- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: a document stores nothing and has no controls

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no server action in this PR

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: nothing in this PR is rendered anywhere

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the nearest *consumer* is `check-test-plan.mjs`, which rejects a release record filed under `docs/test-plans/` so that one cannot satisfy a feature PR's gate. This record is correctly under `docs/releases/` and that checker passes
- [ ] Shared file touched, checked from a second unrelated page — n/a: no shared file. The record is a new file nothing imports
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the record itself. **`#shtci` is unblocked by this release** (it was held because production was eleven tenancy migrations behind, and production now holds all 408); it is named in the record for the planner rather than ticked here, since closing it needs `gh workflow run tenancy-shared-tables.yml` to confirm green
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the record *is* the write-up. Its one judgement — publishing a note rather than deploying under `0.47.1` — was Lutan's and is recorded in the record and in the cut's plan
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record. The file is not served, imported or rendered, and no behaviour changes. **This release's one note shipped in the cut PR (#1679) and mailed nobody**, which is the whole subject of the record
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — see §4. Where something could not be measured it says so in the record rather than being left to read as done: the signed-in pass and the public tour are `n/a` because `PUBLIC_SITE` is locked, and the thirteen outstanding person-checks are listed by name

## 8. Pre-production gate

- [x] **The release is already live and verified on all three hosts** — `lannacareforanimals.org`, `test.lannacare.org` and `uat.lannacare.org` all answer `0.47.2` @ `854891267` on the Pi endpoint and `0.47.2` on the Worker endpoint, all three `x-lanna-served-by: pi`. This PR is the write-up of that, not a step towards it
- [ ] Deployed SHA matches the tested SHA / deploy safety / migration ordering / rollback — n/a: **this PR is never deployed.** It is a document, and no Pi build or Worker deploy follows it. The release's own answers to all four are in the record
- [x] Evidence pasted in the record is the tool's actual output, unedited

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | — | **No defect in this PR.** The release's own two accepted defects, and the three mistakes of the release manager's, are recorded in `docs/releases/2026-11-18-0-47-2.md` under *What broke* rather than duplicated here, so they have one home and not two | recorded in the release record |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** The thirteen person-checks this release leaves open are listed in the record under *What is not tested*, which is the "note any gaps" Lutan asked for; they belong to their own plans and their own signatures, and are deliberately not copied here as a second home nothing closes | `docs/releases/2026-11-18-0-47-2.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: this PR adds two documents and there is nothing for a person to look at in it

Manual verification by: n/a: a release record has no rendered surface; the release it describes was verified on all three hosts before this PR existed, and its outstanding person-checks are listed in the record against their own plans

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass
