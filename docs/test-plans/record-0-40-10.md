# Feature test plan — record `0.40.10`, the handover, and a new runbook trap

## Header

| | |
|---|---|
| Feature | The `0.40.10` release record, the handover's `0.40.10` edition, and a new trap in `docs/release-procedure.md` covering the one fault that has now cost time in two consecutive releases |
| Backlog item | `docs/backlog.md` → n/a: the record and handover are steps in `docs/release-procedure.md`. The one item this release filed — the advisory register — went on the `backlog` branch, where new items belong |
| Branch / worktree | `claude/record-0-40-10` @ `C:\Development\Animal_Shelter_record-0-40-10` — **a fresh worktree.** Paperwork rule 2 prefers reusing the cut's, but **another session ran `/clean-streams` mid-release and removed every leftover including the cut's**, so there was none to reuse |
| Dev server | n/a: markdown only; nothing runs |
| PR | #1046 |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-28 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `092f0109` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the release that already shipped is written down, the handover is replaced, and a trap is added to the runbook for the one-command rule
- [x] Files/areas touched listed — `docs/releases/2026-10-28-0-40-10.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (one trap added), `docs/test-plans/record-0-40-10.md` (this file). No code, no migration
- [x] Roles affected identified — none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down — **this PR is not a gate**; `0.40.10` was deployed and verified before it existed. **The runbook edit is additive**: it adds a trap above an existing one and changes no step, no command and no gate

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `092f0109` minutes before writing; `git status -sb` read no ahead/behind
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: **a documents-only PR skips the heavy CI jobs by design** (paperwork rule 1), and four markdown files cannot change a typecheck, lint, test or build. The release's own gates ran on the cut
- [x] CI green on the PR (runs the same checks) — filled in from the PR; the docs-only gate leaves `changes` and `test-plan`
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, 16/16
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's one, `0279`, is applied; the next free number is `0280`
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
- [x] Boundary cases checked — the handover's ceiling (about 100 lines, 150 the limit) holds: **122 lines**, measured with `wc -l`

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
- [x] **The repository is public and these files were checked for anything that should not be in it** — no personal data, no credentials, and no dev-session snippet (one was used during the cut and deliberately never written down)

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the readers are the next release manager and `/plan-day`, and both read these files by path. Paths unchanged
- [x] Any shared file touched checked from a second, unrelated page — **`docs/release-procedure.md` is the one that matters here**, because unlike the handover it is a durable rule file other sessions follow. The edit was placed **immediately above the existing "Two builds in one worktree collide" trap**, which it extends rather than contradicts, and the existing trap's text is left intact. No step, command or gate elsewhere in the file was touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. The advisory-register item this release **filed** went on the `backlog` branch, which is where new items belong
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a as a new file: the release's one decision, the `glob` advisory, was recorded in `0.40.9`'s cut and still applies unchanged. **The runbook trap is a rule, not a decision**, and belongs in the runbook
- [x] `README.md` still accurate — unchanged and re-read; it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record, a handover or a runbook trap
- [x] Commit messages say why, not just what — the commit leads with the two-releases-in-a-row fault and what it cost, not with what went right
- [x] **Claims in these documents were measured, not reasoned.** Four that could each have been asserted: the double-digit ordering was read off the **rendered page** as well as asserted; the test Worker's unexpected SHA was resolved by a code-identity diff rather than by rebuilding; `doctor-cells` was **read fresh** and had indeed moved from 12 to 4; and the advisory register's history was found by grepping the decision files rather than trusting either party's memory of having agreed it

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deployed SHA, `5ebb4a98`, is in the record's header with the tested SHA `2f4c9e18` beside it
- [x] Deployed SHA matches the tested SHA — for the **release**, the code-identity diff is empty, recorded. For **this PR**, nothing is deployed
- [x] Deployed to test — **yes, for the release**: test Worker `2ab4e083` and test Pi at `5ebb4a98`, both endpoints agreeing and the cron healthy
- [x] Smoke-tested on `test.lannacare.org` — both endpoints `0.40.10`, Pi asset check passed, cron `verdict: healthy`
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; every time in the record is a literal reading quoted from a tool
- [x] **For a boundary or banding change, the assertions cover both edges** — **the release had a real one**: `0.40.10` is the first double-digit patch, covered in the data (`compareVersions`) **and** on the rendered page
- [x] **Evidence pasted into these documents is the tool's actual output, unedited** — version ids, drift counts, asset-check lines and the cron verdicts are copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served or cached. It was done for the release and recorded as vacuous
- [x] The production deploy's Supabase project line read — **yes, for the release**: `dbkodyyxxhtygxcxmfcu (5ebb4a98)`
- [x] The `strip-baked-env` line seen in the deploy output — **yes: 14 on both environments**
- [x] Any new secret/env var exists in the production Cloudflare environment — none needed: four markdown files
- [x] **Does this PR contain both a migration and code that reads it?** No, and it contains neither. The release's `0279` went on **before** either deploy — enforced rather than remembered, since `deploy.mjs` refused until it had
- [x] Rollback position stated, **including what it does not cover** — reverting this PR removes a record of a release that still shipped and removes a trap written from two real failures. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **This session caused an avoidable cost in two consecutive releases** — a build collision on `0.40.9`, two commands in one message on `0.40.10` | **Recorded in the release record against this session, and the rule written into `docs/release-procedure.md` as a trap with both worked examples.** Lutan named the pattern himself. The common cause in both was trying to save ten minutes by overlapping steps |
| 2 | none | The runbook is edited by a record PR, which is unusual | **Deliberate and stated.** The runbook's own preamble says each trap exists because it cost real time; two in a row qualifies, and the edit is additive — it adds a trap above a related one and changes no step, command or gate |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The four items the **release** leaves for Lutan are in the record and are not copied here, because copying another plan's outstanding items gives them a second home that nothing closes | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at — this PR is four markdown files, no UI, no route and no behaviour. The release's own four items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
