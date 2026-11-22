# Feature test plan — shelter-drive-staged-schema

## Header

| | |
|---|---|
| Feature | Schema half of #rqv5c: `shelter_drive_credentials.staged`, so a consent can be stored without becoming the shelter's live account |
| Backlog item | `docs/backlog.md` #rqv5c (left open; the copy mode, connect change and UAT rehearsal follow) |
| Branch / worktree | `claude/shelter-drive-move` @ `C:\Development\Animal_Shelter_shelter-drive-move` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-11-22 |
| Carries a migration? | yes — `0435_shelter_drive_staged.sql` |
| Tested at SHA | `d34e45c5f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one boolean column, default false, on the service-role-only credentials table, plus the ordering decision file
- [x] Files/areas touched listed — `supabase/migrations/0435_shelter_drive_staged.sql`, `docs/decisions/2026-11-22-shelter-drive-move.md`, `scripts/worktree.mjs` (ENV_KEEP gains the two connect names), this plan
- [x] Roles affected identified — none: the table has no grant for any login and no code reads the column yet
- [x] Anything explicitly **out of scope** written down — the reader, the connect flow and the move script are the next PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the gates
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, read from the output file
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs` ok, 0435 against highest 0434
- [x] `--status` reviewed before applying — 0 pending other than 0435
- [x] `--dry-run` reviewed — `dry-run 0435 … ok`
- [x] Applied to **dev** and recorded — `applying 0435_shelter_drive_staged.sql … ok`
- [x] File is re-runnable — `add column if not exists`
- [x] Existing rows still read correctly — additive column with default false; nothing selects it yet
- [x] Constraints and defaults exercised — n/a for a harness beyond the default: a not-null boolean default false cannot reject any existing write
- [x] Down-migration stated — `alter table shelter_drive_credentials drop column staged` (in the file header)
- [x] Production apply plan stated — with the next release; harmless to old code. Production has no credentials rows today

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads the column yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no UI surface
- [ ] Every role tested — n/a: no policy and no grant changed; the table stays service-role only
- [ ] A role that should not have access is blocked server-side — n/a: unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — nothing reads the column; the build gate covers the rest
- [ ] Shared file touched checked from a second page — n/a: only `scripts/worktree.mjs` (a dev script) changed
- [x] Nothing merged from `main` was broken by this branch — gates ran after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: #rqv5c stays open until the copy mode and rehearsal land
- [x] Non-obvious design choices in `docs/decisions/` — `2026-11-22-shelter-drive-move.md`
- [x] `README.md` still accurate
- [ ] Release notes — n/a: nothing a shelter user would notice; no screen or behaviour changes
- [x] Commit messages say why
- [x] Claims were measured — migration applied to dev with the runner's own output

## 8. Pre-production gate

- [ ] Tested SHA recorded and tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none
- [x] Does this PR contain both a migration and code that reads it? — no; `-- consumer:` names the next PR's files
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Backup before destructive migration — n/a: additive only
- [x] Apply plan stated — with the next release
- [x] Rollback position stated — old code ignores the column

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads the column yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
