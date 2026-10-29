# Feature test plan — record `0.40.11` and the handover

## Header

| | |
|---|---|
| Feature | The `0.40.11` release record and the handover's `0.40.11` edition |
| Backlog item | `docs/backlog.md` → n/a: the record and handover are steps in `docs/release-procedure.md`. This release filed no new backlog item |
| Branch / worktree | `claude/record-0-40-11` @ `C:\Development\Animal_Shelter_cut-release-0-40-11` — **the cut's own worktree, reused**, which is what paperwork rule 2 asks for. The branch was made with `git checkout -b … origin/main`, since `git reset --hard` is refused by the classifier |
| Dev server | n/a: markdown only; nothing runs |
| PR | #1086 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-29 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `d9628a26` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release that already shipped is written down, and the handover is replaced with its `0.40.11` edition
- [x] Files/areas touched listed — `docs/releases/2026-10-29-0-40-11.md` (new), `docs/release-handover.md` (replaced), `docs/test-plans/record-0-40-11.md` (this file). No code, no migration, **and no runbook edit this time**
- [x] Roles affected identified — none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate**; `0.40.11` was deployed and verified before it existed. The seven unassigned cards are Lutan's to give out and are recorded, not acted on

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `d9628a26` minutes before writing; `git status -sb` read no ahead/behind, and `origin/main` did not move during the release at all
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: **a documents-only PR skips the heavy CI jobs by design** (paperwork rule 1), and three markdown files cannot change a typecheck, lint, test or build. The release's own gates ran on the cut, all four read
- [x] CI green on the PR (runs the same checks) — filled in from the PR; the docs-only gate leaves `changes` and `test-plan`
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, exit 0
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's two, `0280` and `0281`, are applied; the next free number is `0282`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no path; these are documents
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — the handover's ceiling (about 100 lines, 150 the limit) holds: **123 lines**, measured with `wc -l`

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
- [x] **The repository is public and these files were checked for anything that should not be in it** — no personal data, no credentials, and **no dev-session snippet** (one was used during the cut's browser check and deliberately never written down). The Worker version ids and Supabase project refs recorded here are the same class of identifier every previous record carries

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the readers are the next release manager and `/plan-day`, and both read these files by path. Paths unchanged, and the record's name follows the existing `<date>-<version>` convention
- [x] Any shared file touched checked from a second, unrelated page — **`docs/release-handover.md` is the one shared file**, and it is replaced wholesale by design, which is what a delta is. **It contradicts its predecessor on one point and says so explicitly rather than silently**: the last edition's opening claim that `audit` will be red on every cut. `docs/release-procedure.md` was **not** touched this release
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; `main` did not move during the release

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. The advisory-register item was ticked by #1055 inside the release itself, which is where it belonged
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new file: this release made no new design choice at release time. The decisions it relied on (`glob` advisory, the release-note guard, the advisory register) already exist and applied unchanged
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover
- [x] Commit messages say why, not just what — the commit leads with the handover's superseded headline and with the fact that the one-command rule held at no cost
- [x] **Claims in these documents were measured, not reasoned.** Four that could each have been asserted instead: the `audit` green was traced to `ci.yml` and `audit-register.mjs` rather than assumed to be `continue-on-error` suppression; the claim that `0280`'s narrowing cost nobody a cell was settled by **reading production's `role-cards` before the apply** and confirmed by the after-picture; the Worker deploy was confirmed from `wrangler deployments list` matching the log's `Current Version ID`, not from "it finished"; and `doctor-cells` was **read fresh**, then its four missing cells were checked against `0281`'s grants rather than guessed at

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA, `d9628a26`, is in the record's header with the tested SHA `300d8753` beside it
- [x] Deployed SHA matches the tested SHA — for the **release**, all four builds reported `d9628a26`, so the code-identity diff is trivially empty. For **this PR**, nothing is deployed
- [x] Deployed to test — **yes, for the release**: test Worker `17f6d282` and test Pi at `d9628a26`, both endpoints agreeing and the cron healthy
- [x] Smoke-tested on `test.lannacare.org` — both endpoints `0.40.11`, Pi asset check passed, cron `verdict: healthy`
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; every time in the record is a literal reading quoted from a tool
- [x] **For a boundary or banding change, the assertions cover both edges** — **the release had one**: `0.40.11` string-sorts below `0.40.9`, covered in the data (`compareVersions`) **and** on the rendered page
- [x] **Evidence pasted into these documents is the tool's actual output, unedited** — version ids, drift verdicts, asset-check lines, the `strip-baked-env` count and the cron verdicts are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached. For the release the purge was done and **proved byte-for-byte on both hosts**, though the signed-out public page itself stays unreachable while `PUBLIC_SITE` is `locked`
- [x] The production deploy's Supabase project line read — **yes, for the release**: `dbkodyyxxhtygxcxmfcu (d9628a26)`
- [x] The `strip-baked-env` line seen in the deploy output — **yes: 14 on both environments**
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: three markdown files
- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither. The release's `0280` and `0281` went on **before** either deploy — enforced rather than remembered, since `deploy.mjs` refuses until they have
- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record of a release that still shipped and a handover the next release manager would then read in its superseded form, including the `audit` claim this edition corrects. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **The release cost Lutan three touches against a target of two** — the migration apply and the production Worker deploy | **Recorded in the release record as an avoidable cost, as the runbook requires.** The cause was the classifier refusing `apply-migrations --env production` twice, which is external and was handled exactly as the runbook says: try once, retry once, hand over. **It is now the only recurring cause of a third touch** |
| 2 | none | **The handover this PR replaces opened with a claim that is now false** | **Corrected explicitly rather than quietly.** The new edition names the superseded claim and says what changed, because a handover that reads as though nothing moved is the failure mode `docs/release-procedure.md` warns about |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The seven items the **release** leaves for Lutan are in the record and are deliberately not copied here, because copying another plan's outstanding items gives them a second home that nothing closes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is three markdown files, no UI, no route and no behaviour. The release's own seven items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
