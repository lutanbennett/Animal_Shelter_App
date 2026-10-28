# Feature test plan — docs-truth-and-owed-note

## Header

| | |
|---|---|
| Feature | `CLAUDE.md` gains the browser-pane entry and a dated, two-part aal1 list; `unreleased` gains the owed `roles.is_admin` note |
| Backlog item | `docs/backlog.md` lines 7, 9 and 394 (not ticked here; see section 7) |
| Branch / worktree | `claude/docs-truth-and-owed-note` @ `C:\Development\Animal_Shelter_docs-truth-and-owed-note` |
| Dev server | `next dev` on `http://localhost:3008`, signed in as `dev-signin-admin` |
| PR | pending |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `a3db0c82` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — three docs truth-fixes and one release-note line
- [x] Files/areas touched listed — `CLAUDE.md`, `src/lib/releases.ts`, `docs/decisions/2026-10-28-pane-entry-aal1-list-and-owed-note.md`, this plan
- [x] Roles affected identified — none; no logic changed
- [x] Anything explicitly **out of scope** written down — the fault log and `pending:` lines are not edited; a marking pass is only proposed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before pushing
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — run before pushing, exit codes read directly
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written, or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs and one release-note string; the four pages were clicked through in the pane and recorded in the decision file
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no UI change
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the four pages | loads except `/admin/security` | matches the new list |
| other roles | n/a | n/a | n/a — no access rule changed |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings go through the translation path — n/a: release notes are English only like every other
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work — `/releases` reads `unreleased`; the build compiles it
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only a data array entry was added
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: the three items are ticked by the planner's sweep, not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-pane-entry-aal1-list-and-owed-note.md`
- [x] `README.md` still accurate — it does not describe any of this
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a new line for the `who_does_what` card; `0275` is on production since 2026-10-27, so nothing is outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the page loads and the rAF reading were driven on 2026-10-28; the Delete-role claim is #1014's and is cited as such

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no output pasted
- [ ] Public pages re-checked after a cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing else depends on it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Delete role and Diets edits were not pressed in the shared dev database | accepted — stated in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — docs and one release-note line | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: nothing to look at

Manual verification by: n/a: docs and one release-note line, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
