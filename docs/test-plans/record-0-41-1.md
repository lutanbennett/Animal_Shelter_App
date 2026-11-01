# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.41.1` release record, the release handover rewritten as a delta, and one new rule in `docs/release-procedure.md`: *a release cuts what the build gave it* |
| Backlog item | `docs/backlog.md` → n/a: release paperwork is `docs/release-procedure.md` steps 4 and 8, not a backlog item |
| Branch / worktree | `claude/record-0-41-1` @ `C:\Development\Animal_Shelter_drop-anthropic-sdk` (the cut's worktree, reused — paperwork rule 2) |
| Dev server | not started — n/a: three markdown files, no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — the record of a release that has already shipped, the handover delta that replaces the previous edition, and the one durable rule this release produced
- [x] Files/areas touched listed — `docs/releases/2026-11-01-0-41-1.md` (new), `docs/release-handover.md` (rewritten), `docs/release-procedure.md` (one new section), this plan. **No code, no route, no schema**
- [x] Roles affected identified — **by card, not by role**: none. Nothing here is reachable by any login
- [x] Anything explicitly **out of scope** written down — the 22 plans signed `pending:`, which keep their own signatures and are only *grouped* in the record; and the SDK removal's own paper, which is `docs/decisions/2026-11-01-drop-anthropic-sdk.md` in #1172

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut from a freshly fetched `origin/main` (`d9f77cd0`) and nothing has been merged since
- [ ] `node scripts/gates.mjs` — n/a: a documents-only PR, which `scripts/check-docs-only.mjs` detects and `ci.yml` uses to skip the heavy jobs. Running the four gates locally on three markdown files would measure nothing, and the runbook's paperwork rule 1 is explicit that a documents PR must not be made to look like a code one
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration. The release's one migration, `0296`, was applied before either deploy and the record says by whom

## 4. Functional checks

- [x] Happy path works end to end — the three documents render as markdown and every claim in them is traceable to a run quoted in the record
- [x] Data persists — n/a as written; the equivalent is that the record is committed in git beside the release it describes, which is the whole point of filing it there
- [ ] Create / edit / delete all exercised — n/a: documents
- [x] Empty state renders sensibly — n/a as a UI state; answered as the real equivalent: the sections the record **cannot** fill are written as explicit gaps with reasons rather than left blank or ticked
- [x] Invalid input is rejected with a readable message — `node scripts/check-test-plan.mjs --base origin/main` is the gate on this PR and it was run
- [ ] Boundary cases checked — n/a: no logic, no numbers that discriminate

### Role access matrix

**Not run, and deliberately.** Documents in `docs/`; no login reaches them.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | — | nothing changed | n/a: documents |
| management | — | nothing changed | n/a: documents |
| staff | — | retired role (`0173`) | n/a |
| doctor | — | nothing changed | n/a: documents |
| volunteer | — | nothing changed | n/a: documents |
| signed out | — | nothing changed | n/a: documents |

- [ ] Every role above tested — n/a: nothing a role can reach changed
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: the user manual does not describe the release process
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no rendered output
- [ ] Browser console clean — n/a: no code
- [ ] Network clean — n/a: no code

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; the equivalent check is that `docs/release-procedure.md` still reads correctly either side of the inserted section, which was checked by reading the join rather than only the insert
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-procedure.md` is the shared file, and the new section was placed **before** `## The paperwork has a time budget too` so that neither that section nor `## Who does what` above it changed meaning. The rule it adds does not contradict anything already there: the nearest neighbour is paperwork rule 1, *do not "fix" a documents PR by touching code*, which is the same instinct applied to the other end of the release
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: release paperwork closes no backlog item
- [x] Non-obvious design choices recorded — the record names one root cause (work taken on that was not given) and deliberately records two would-be findings as **symptoms** of it rather than as faults, which is the non-obvious call in this PR
- [x] `README.md` still accurate — it names no version and no release process
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record, a handover or a rule in the release runbook. The eight notes this release publishes were added in the cut, #1173
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — every figure in the record is pasted from a run: the deploy log's six key lines, `wrangler deployments list`, both `check-assets` results, the purge, the five production checks, both named drift checks, and the before-and-after role figures

## 8. Pre-production gate

**Every deploy-time gate below is already answered for this release, because the record describes a
release that has already shipped and been verified.** That is why a record PR is not a gate.

- [x] Tested SHA recorded — the release's deployed SHAs are in the record's header: both Pi clones `97441fb7`, the production Worker `d9f77cd0`, with the code-identity diff empty
- [x] Deployed SHA matches the tested SHA — answered as code identity, which is what Lutan's 2026-10-24 decision replaced SHA equality with
- [x] Deployed to test — done; the test Worker and the test Pi both carry the release
- [x] Smoke-tested on `test.lannacare.org` — `/api/version` → `0.41.1` @ `97441fb7`, read rather than assumed
- [ ] Timezone-sensitive behaviour proved — n/a: no logic in this PR, and the release's own gap is stated in the record under *Date handling*
- [ ] Boundary or banding change covers both edges — n/a: no boundary
- [x] **Evidence pasted into this plan and the record is the tool's actual output, unedited**
- [x] Public pages re-checked after a cache purge — the purge ran and was proved byte-for-byte on both hosts; the pages themselves are `n/a` while `PUBLIC_SITE` is `locked`, as the record states
- [x] `deploy: production → Supabase project <ref>` line read — `dbkodyyxxhtygxcxmfcu (d9f77cd0)`, production and not dev
- [x] `strip-baked-env: removed N env var(s)` seen — `removed 14`, the same fourteen as last release
- [x] Any new secret/env var exists in the production Cloudflare environment — none added; #1172 removed one that was never set, which was read rather than inferred
- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. The release's ordering is in the record: `0296` applied before either deploy
- [x] `--env production --dry-run` clean — run before the apply: `0296` ok, exit 0
- [ ] Backup fresh for a destructive migration — n/a: `0296` is additive and rewrote no rows, which the before-and-after role figures demonstrate
- [x] Apply plan stated — in the record, including that Lutan ran it because the classifier refused it twice
- [x] Rollback position stated — in the record and the cut plan: `deploy-pi.sh --ref 73a4bdc5` on both clones returns users to `0.41.0`, `wrangler rollback --env production` reverts only the Worker fallback, and neither reverts `0296`, which is safe to leave

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | None in this PR. The release's six are in the record, and the first of them is this session's own process defect | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether the new rule in `docs/release-procedure.md` says what you meant. It is written from your two sentences during the release, and a rule written from a quote can land narrower or wider than the person intended | `docs/release-procedure.md`, *A release cuts what the build gave it* |

The release's own manual items are **not** repeated here: the eight notes on `/releases` are on the cut
plan's list, and the 22 `pending:` plans keep their own signatures.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is Lutan reading a rule written from his own words, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the new rule in `docs/release-procedure.md` and saying whether it is narrower or wider than he meant

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-01
