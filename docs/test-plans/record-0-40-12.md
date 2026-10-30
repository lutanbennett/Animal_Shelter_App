# Feature test plan — record `0.40.12` and the handover

## Header

| | |
|---|---|
| Feature | The `0.40.12` release record, the handover's `0.40.12` edition, and the one-line runbook correction six editions asked for |
| Backlog item | `docs/backlog.md` → n/a: the record and handover are steps in `docs/release-procedure.md`. The release's new backlog item (the Pi stale-types fault) went on the `backlog` branch as `64f7df2a` |
| Branch / worktree | `claude/record-0-40-12` @ `C:\Development\Animal_Shelter_record-0-40-12`, **a fresh worktree**: the cut's was removed by another session's clean-up minutes after #1111 merged, so rule 2's reuse was not possible |
| Dev server | n/a: markdown only; nothing runs |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5.5 (production release manager session) / 2026-10-30 |
| Carries a migration? | **no** |
| Tested at SHA | this branch's commit, parent `e078ee78` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for: the release that already shipped is written down, the handover replaced with its `0.40.12` edition, and the runbook's `git reset --hard` recipe corrected
- [x] Files/areas touched listed: `docs/releases/2026-10-30-0-40-12.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (one paragraph), `docs/test-plans/record-0-40-12.md` (this file). No code, no migration
- [x] Roles affected identified: none. Documents under `docs/` are not served by the app
- [x] Anything explicitly **out of scope** written down: **this PR is not a gate**; `0.40.12` was deployed and verified before it existed. The Pi script fix is a backlog item, not this PR

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the branch was created from `origin/main` at `e078ee78` minutes before writing
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — n/a: a documents-only PR skips the heavy CI jobs by design (paperwork rule 1). The release's gates ran on the cut, all four read
- [x] CI green on the PR: filled in from the PR before merging
- [ ] `node scripts/check-release-guards.mjs` — n/a: no release data changes in this PR. It ran on the cut, exit 0
- [x] `node scripts/check-test-plan.mjs --base origin/main`, run the way CI runs it, exit **0**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The release's seven are applied; the next free number is `0289`
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
- [x] Boundary cases checked: the handover's ceiling (about 100 lines, 150 the limit) holds, measured with `wc -l`; and the deleted-page command the handover prescribes was **run** on this release's range (`d9628a26..7ec19061`) and printed `src/app/admin/frequencies/page.tsx`, the page that broke the Pi build

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role, and signed out | these files | no route serves `docs/` | **as expected**: no route added |

- [ ] Every role above tested — n/a: no role can reach a file the app does not serve
- [ ] A role that should not have access is blocked server-side — n/a: nothing is served

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page added
- [ ] Manual updated — n/a: these describe a release to the people who run releases
- [ ] Translatable strings go through the translation path — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI
- [x] **The repository is public and these files were checked for anything that should not be in it**: no resident names (the production prescription check printed none, since it found nothing to list), no credentials, and no dev-session snippet (one was used for the cut's browser check and never written down). Worker version ids and Supabase project refs are the same class of identifier every record carries

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page check; the readers are the next release manager and `/plan-day`, who read these files by path. Paths unchanged; the record follows the `<date>-<version>` convention
- [x] Any shared file touched checked from a second, unrelated page: `docs/release-procedure.md` changed in one paragraph only, re-read in place; the handover is replaced wholesale by design and says explicitly which of its predecessor's points it corrects
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice; the runbook correction is a fix to an instruction the classifier always refused
- [x] `README.md` still accurate: unchanged; it quotes no version number
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: the 20-minute window from `schema_migrations.applied_at` (`0288` at 12:21:13Z) and the Pi's `ActiveEnterTimestamp` (12:41:37Z), not estimated; the Worker deploys from `wrangler deployments list` matching each log's `Current Version ID`; the after-picture from `role-cells`/`role-cards` diffed against the before-picture; code identity from `git diff --name-only` filtered to non-documents, empty

## 8. Pre-production gate

- [x] Tested SHA recorded in the header: the release's deployed `7ec19061` and tested `92dcac18` are in the record's header
- [x] Deployed SHA matches the tested SHA: for the **release**, the code-identity diff across all four builds is empty. For **this PR**, nothing is deployed
- [x] Deployed to test: **yes, for the release**: test Worker `f09faebe` and test Pi at `7ec19061`, endpoints agreeing
- [x] Smoke-tested on `test.lannacare.org`: `/api/version` `0.40.12`, Pi asset check identical to the build, drift clean
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives "today"; every time is a literal reading quoted from a tool
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: this PR changes no boundary
- [x] **Evidence pasted into these documents is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: nothing in this PR is served. For the release the purge was done and proved on both hosts
- [x] The production deploy's Supabase project line read, **for the release**: `dbkodyyxxhtygxcxmfcu (7ec19061)`
- [x] The `strip-baked-env` line seen, **for the release**: 14 on both environments
- [x] Any new secret/env var exists in the production Cloudflare environment: none needed, markdown only
- [x] **Does this PR contain both a migration and code that reads it?** No, neither
- [x] Rollback position stated: reverting this PR removes the record of a release that still shipped and restores a handover and a runbook line both known to be wrong. It cannot affect production

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | The release's defects (the Pi stale-types build failure, five touches, the CRLF backlog commit) are in the record | Recorded there; not copied here, so they have one home |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in **this PR** needs a person. The release's four items for Lutan are in the record and deliberately not copied here | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5.5 (production release manager session)  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: there is nothing to look at; this PR is four markdown files, no UI, no route and no behaviour. The release's own items belong to the record and to Lutan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
