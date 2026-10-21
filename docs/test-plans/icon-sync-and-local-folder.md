# Test plan: icon-sync-and-local-folder

## Header

| | |
|---|---|
| Feature | Icon sync uploads only changed files; `.local/` gitignored, scratch rule completed |
| Backlog item | `docs/backlog.md` → release-time home-icon sync (198); tidy loose files (677, partly) |
| Branch / worktree | `claude/icon-sync-and-local-folder` @ `C:\Development\Animal_Shelter_icon-sync-and-local-folder` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | acf2702d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the sync skips files whose md5 matches Drive, retries rate limits with backoff and resumes by re-running; `.local/` is ignored and named in CLAUDE.md
- [x] Files/areas touched: `scripts/sync-home-icons.mjs`, `.gitignore`, `CLAUDE.md`, `docs/`
- [ ] Roles affected identified — n/a: release tooling and a repo rule, no role sees anything
- [x] Out of scope: trimming the 8 files per card (Lutan said keep all eight), the four loose files in `C:\Development` (his)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`.

    gates: typecheck=0 lint=0 test=0 build=0

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: run against dev's Drive, second run with nothing changed reported 344 unchanged, 0 updated, 0 created
- [ ] Data persists — n/a: nothing is stored by the app
- [x] Create / edit / delete: one card altered gave 343 unchanged, 1 updated; restoring it gave 1 updated; create path is the pre-existing code for a missing name; nothing is deleted
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no UI; auth and rate-limit errors now print which fault they are
- [ ] Boundary cases — n/a: the rate-limit retry path was not provoked live (Drive did not limit), only syntax-checked and read

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a: no UI surface | n/a | n/a |

- [ ] Every role above tested — n/a: no UI surface
- [ ] A role blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no shelter-user feature
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: nothing the app serves changed
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (198 ticked, 677 retitled)
- [x] Design choices in `docs/decisions/2026-10-22-icon-sync-uploads-only-changes.md`
- [x] `README.md` still accurate (does not describe the sync)
- [ ] **Release notes.** n/a: release tooling and a repo rule — the Drive folder users were promised is unchanged, it just syncs without failing
- [x] Commit messages say why, not just what
- [x] Claims were measured: the 0 and 1 upload counts came from real runs on dev's Drive

## 8. Pre-production gate

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — n/a: a release-time script, not part of the deployed app
- [ ] Smoke-tested on test — n/a: not part of the deployed app
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary/banding — n/a: no thresholds
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page changed
- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration with code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: script and docs only; reverting the commit restores the old script

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Rate-limit retry path not exercised live | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing for a person to look at

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not a release step yet

Result: pass with accepted defects

Release manager acknowledgement: pending
