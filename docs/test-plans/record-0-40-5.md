# Feature test plan — `0.40.5` release record and handover

## Header

| | |
|---|---|
| Feature | The `0.40.5` release record (`docs/releases/2026-10-26-0-40-5.md`) and the handover rewritten as a delta |
| Backlog item | `docs/backlog.md` → n/a: the record is step 8 of `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/record-0-40-5` @ `C:\Development\Animal_Shelter_cut-release-0-40-5` — **the cut's own worktree, reused under paperwork rule 2**, so this PR paid no `npm ci` |
| Dev server | n/a: documents only, nothing to render |
| PR | #963 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-26 |
| Carries a migration? | **no** |
| Tested at SHA | branched from `aa984fa1`, the release SHA |

## 1. Scope and risk

- [x] Change is described in one sentence — two markdown files: the `0.40.5` record, and the handover rewritten as a delta for the next release manager
- [x] Files/areas touched listed — `docs/releases/2026-10-26-0-40-5.md` (new), `docs/release-handover.md` (rewritten), and this plan. **No code, no route, no `worker/`, no migration**
- [x] Roles affected identified — none. No application code reads either file and no page renders them
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate.** By the time it exists the release is deployed and verified; it describes a release that already shipped. The five manual checks it hands to Lutan live in `cut-release-0-40-5.md` and are not re-homed here

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `aa984fa1` after the cut merged, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs` decides, `ci.yml` gates on it; paperwork rule 1). Running a four-minute build over two markdown files is the cost that rule exists to remove. `check-docs-only.mjs` was run and agrees this PR is documents-only
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-test-plan.mjs --base origin/main` — exit 0, read unpiped

## 3. Schema and data — *skip if no migration*

- [ ] Every line — n/a: this PR carries no migration and writes no row. The release's own migration, `0265`, is signed in #960's plan and its production apply is recorded in the record this PR adds

## 4. Functional checks

- [ ] Happy path / persistence / create-edit-delete / empty state / invalid input / boundaries — n/a: two markdown files with no surface, no input and no behaviour. **The equivalent check is that every number in them was read from a command rather than recalled**, which is section 7

### Role access matrix

- [ ] Every role tested — n/a: no page, no route, no server action, no access rule. `docs/` is readable by anyone with the repository, which is public
- [ ] A role that should not have access is blocked server-side — n/a: as above

## 5. Cross-cutting

- [ ] Nav entry / manual / translations / mobile / console / network — n/a: documents only, nothing rendered by the app and nothing translated. The repository is public, and **both files were checked for anything naming a real person beyond Lutan, who is the decision-maker of record** — there is nothing of that kind in either

## 6. Regression

- [x] The pages nearest the change still work — n/a in the usual sense; the nearest thing to a reader is the next release manager, and the handover was checked against its **own** ceiling: 127 lines against an aim of ~100 and a limit of 150 (paperwork rule 4)
- [x] Any shared file touched checked from a second place — `docs/release-handover.md` is the one file a future session reads cold. It was re-read end to end after writing, and **every carried item was re-measured rather than copied**, which is this edition's whole point
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release record closes no backlog item. **One was explicitly NOT filed** — see the record's defect 4 — because the thing it would have described does not exist
- [x] Non-obvious design choices recorded — the two corrections that will change what a future session does are stated in the handover rather than in a decision file, because both are about how the handover itself is read: the phantom diets red, and the home-icon count not being a card check
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record. `unreleased` is empty and correctly so; this PR is written for the next release manager, not for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned.** Every number in it came from a command whose output is quoted: the before/after role tables from `check-production.mjs`, both drift lines from `--drift`, both Worker versions from `wrangler deployments list` matched against each log's `Current Version ID`, the `strip-baked-env` and Server Actions lines from the deploy logs after `tr -d '\000'`, and the icon count from the script. **The one place a prediction failed — 53 icons against 52 — is recorded as a failed prediction and chased to its cause in the code**, rather than quietly dropped

## 8. Pre-production gate

- [x] Tested SHA recorded — branched from `aa984fa1`, the deployed SHA
- [ ] Deployed SHA matches the tested SHA — n/a: this PR ships no code and will not be deployed. It merges after the release
- [ ] Deployed to test / smoke-tested / timezone / banding / public pages — n/a: documents only, nothing deployed, no logic, no threshold, no page
- [x] **Evidence pasted into the record is the tool's actual output, unedited** — the role tables and the quoted deploy lines are as printed
- [ ] Deploy safety (project ref, `strip-baked-env`, new secrets) — n/a: this PR adds no secret and no env var. **Those lines were read during the release and are recorded in the record this PR adds**, which is where they belong
- [ ] Migration ordering — n/a: no migration in this PR
- [x] Rollback position stated — reverting one commit. Nothing is deployed from it, so there is nothing to roll back beyond the files themselves

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | None in this PR. The release's own five defects are in `docs/releases/2026-10-26-0-40-5.md`, where defect 4 — a handover item carried for four editions that had been fixed before the first of them was written — is the one worth a future session's attention | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | None. **Deliberately empty, and not a shortcut:** the release's five manual checks belong to `docs/test-plans/cut-release-0-40-5.md` and its signature. Copying them here would give them a second home that nothing closes — the fault `docs/release-procedure.md` records from 2026-09-27 | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is two markdown files that no application code reads and no page renders

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (this session is the production release manager)  Date: 2026-10-26
