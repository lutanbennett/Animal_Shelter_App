# Feature test plan — release record `0.40.6`

## Header

| | |
|---|---|
| Feature | The `0.40.6` release record and the rewritten release handover |
| Backlog item | `docs/backlog.md` → n/a: the record is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/record-0-40-6` @ `C:\Development\Animal_Shelter_harness-sweep-batch-4` — **the cut's own worktree, reused**, as paperwork rule 2 requires. No second `npm ci` was paid |
| Dev server | n/a: two markdown files; no page renders them |
| PR | #976 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-27 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's tip, parent `641f340c` |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-10-27-0-40-6.md` and replaces `docs/release-handover.md` with its `0.40.6` edition
- [x] Files/areas touched listed — two markdown files plus this plan. No code, no route, no migration, no `worker/`
- [x] Roles affected identified — **none.** No application code reads either file and no page renders them
- [x] Anything explicitly **out of scope** written down — the six manual rows belong to the record and to Lutan's signature; they are **not** copied here as this plan's own manual items, which would give them a second home that nothing closes

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created directly from `origin/main` at `641f340c`, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs`, paperwork rule 1). Running the four gates locally on two markdown files would prove nothing and cost four minutes of a budget this rule exists to protect
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; CI is read before the merge and quoted in the release record
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**
- [x] **The handover is within its ceiling** — paperwork rule 4 aims at about 100 lines and treats 150 as the limit; `wc -l` reads **122**. Measured, not estimated

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The next free number after this release is `0270`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. The release's own is in the record
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration and no row is written; these are markdown files
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed — n/a: no migration. Reverting is reverting one commit
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: there is no path. Nothing imports, renders or serves either file
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — the one boundary a handover has is its length ceiling, asserted in section 2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | neither file | no role can reach them: they are repository documents, not pages | **as expected** — no route, component or loader references either path |

- [ ] Every role above tested — n/a: there is nothing to sign in to. Neither file is served
- [ ] A role that should not have access is blocked server-side — n/a: the PR adds no route and no server action

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: adds no page
- [ ] Manual updated — n/a: adds no feature for the manual to describe
- [ ] Translatable strings — n/a: repository documents, never shown to a shelter user
- [ ] Mobile viewport — n/a: nothing renders
- [ ] Browser console clean — n/a: nothing renders
- [ ] Network clean — n/a: nothing is fetched

## 6. Regression

- [x] The pages nearest the change still work — **none is near it.** Confirmed rather than assumed: neither file is referenced by any route, component or loader
- [x] Any shared file touched checked from a second page — n/a: neither file is shared with code. `docs/release-handover.md` is read by the next release manager, which is a person, not a module
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked **on this branch** — n/a: the record closes no backlog item. **The one follow-up this release produced — the `audit` job's wording — was filed on the `backlog` branch**, where follow-ups belong, not in this PR
- [ ] Non-obvious design choices added to `docs/decisions/` — n/a: the record makes no design choice; it records measurements and the decisions Lutan already took
- [x] `README.md` still accurate — unchanged, and re-read for the version: it quotes none
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a release record or a handover. Neither is rendered anywhere a user can reach, and `unreleased` is correctly empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — every number in it comes from a command whose output was read: the before/after `role-cells` diff, both `wrangler deployments list` confirmations against the logs' `Current Version ID`, `No drift` on both databases, the OpenNext copy count on both logs, and the `/adopt` 307s. **The one claim deliberately NOT made** is that anything behind sign-in works, which is stated under "What this record cannot say"

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — this branch's tip, parent `641f340c`
- [ ] Deployed SHA matches the tested SHA — n/a: **this PR is not deployed.** The release it records shipped from `641f340c`, which is already live on all four builds

### On the deployed build

- [ ] Deployed to test — n/a: documents do not deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents do not deploy. The release's own smoke test **is** the file this PR adds
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives "today". The dates are literals
- [ ] **Boundary or banding change** — n/a: no threshold, band or cutoff
- [x] **Evidence pasted into the record is the tool's actual output, unedited** — the version ids, fingerprints, counts and `No drift` lines are quoted as printed
- [ ] Public pages re-checked after a cache purge — n/a: this PR changes no public page. The release's purge was done and proved, and is recorded

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: not applicable to a documents PR; **done for the release** and recorded (`dbkodyyxxhtygxcxmfcu`)
- [ ] `strip-baked-env` seen in the deploy output — n/a: not applicable to a documents PR; **done for the release** and recorded (14 names, ninth consecutive release)
- [x] Any new secret/env var exists in production — none needed: two markdown files add no secret and no env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's four migrations went on before either deploy and are recorded with their before/after permission diff

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record and restores the previous handover. **It does not and cannot affect the running release**, which is already live from `641f340c`. There is no user-facing rollback here because there is no user-facing change

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | The release's own five defects are itemised in the record, not duplicated here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. The six items this release leaves for a person belong to the **record** and to Lutan's signature there; copying them here would give them a second home that nothing closes | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and deliberately so

Manual verification by: n/a: there is nothing to look at — this PR is two markdown files that no application code reads and no page renders

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
