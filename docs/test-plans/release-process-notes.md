# Feature test plan — release-process-notes

## Header

| | |
|---|---|
| Feature | Release-notes line asks the Admin reader (#nalvl); procedure documents the UTF-16 deploy log (#utf16) |
| Backlog item | `#nalvl`, `#utf16` (both ticked) |
| Branch / worktree | `claude/release-process-notes` @ `C:\Development\Animal_Shelter_release-process-notes` |
| Dev server | not started — documents and a checker message only |
| PR | pending: not yet opened |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | `cdcb69762` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — template line and checker message ask whether an Admin would notice; procedure explains the UTF-16 log
- [x] Files/areas touched listed — `docs/test-plan-template.md`, `scripts/check-test-plan.mjs` (one message), `docs/release-procedure.md`, `docs/backlog.md` (two ticks), `docs/decisions/2026-11-20-release-notes-admin-reader.md`, this plan
- [x] Cards affected identified — none; no code path, card or permission changed. Admin and signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — `deploy.mjs` writing its own log, and a diff-level check for removed pages: both recorded in the decision file for the planner to file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already merged, up to date
- [x] `node scripts/gates.mjs` — ends `gates: typecheck=0 lint=0 test=0 build=0` (build 314s), output read from a file
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written, or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-test-plan.mjs --base origin/main` runs clean on this plan and prints the reworded message path only when a user-visible PR answers `n/a`
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no data
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: the checker still never fails on this line; the label `**Release notes.**` is unchanged and still found

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — no access code touched |
| any card | nothing changed | unchanged | n/a — no access code touched |
| signed out | nothing changed | unchanged | n/a — no access code touched |

- [ ] Every card above tested — n/a: no card, grant or policy changed
- [ ] A login without the card is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no screen changed
- [ ] Translatable strings — n/a: no app strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the checker still parses every plan in the repo; ran against this plan with `--base origin/main`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` — `#nalvl` and `#utf16`, each with its own note; searched the backlog for `test-plan-template`, `release-procedure`, `deploy.mjs`: no other open item closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-20-release-notes-admin-reader.md`
- [x] `README.md` still accurate — it does not describe the template wording
- [ ] **Release notes.** — n/a: asked under the new question. Shelter user: nothing visible changes. Admin or product administrator: no tile, page or setting appears, moves or disappears; they edit documents a release manager and stream read. Considered both readers; neither would notice, so no note and no `admin: true` line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the gap was confirmed by grep on `main` in step zero; `deploy.mjs` uses `spawnSync` with `stdio: "inherit"` at lines 122 and 222, read before judging a self-written log bigger

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on the test site — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no deploy evidence pasted
- [ ] Public pages re-checked after a cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; documents and one checker message, nothing deployed depends on them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, documents and a checker message only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: documents only

Result: pass

Release manager acknowledgement: n/a: not yet released
