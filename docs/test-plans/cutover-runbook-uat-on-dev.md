# Feature test plan — cutover-runbook-uat-on-dev

## Header

| | |
|---|---|
| Feature | Cutover runbook: production keeps its project, UAT shares the dev database |
| Backlog item | `docs/backlog.md` → `#ki6cx` (not ticked: the cutover is tomorrow) |
| Branch / worktree | `claude/cutover-runbook-uat-on-dev` @ `C:\Development\Animal_Shelter_cutover-runbook-uat-on-dev` |
| Dev server | n/a: docs only |
| PR | pending |
| Tested by / date | Claude / 2026-11-05 |
| Carries a migration? | no |
| Tested at SHA | n/a: docs only |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — runbook section E rewritten for the UAT-on-dev plan
- [x] Files/areas touched listed — `docs/domain-checklist.md`, `docs/decisions/2026-11-05-uat-shares-the-dev-database.md`, this plan
- [x] Roles affected identified — none; no code changed
- [x] Anything explicitly **out of scope** written down — the `app-env.ts` / `deploy.mjs` code change is described, not made

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before pushing
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — run before pushing
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

- [ ] Happy path works end to end — n/a: documentation only
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no UI change
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | n/a | n/a | n/a — no access rule changed |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no app code changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: docs only
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: `#ki6cx` stays open until the cutover happens
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-05-uat-shares-the-dev-database.md`
- [x] `README.md` still accurate — it does not describe this
- [ ] **Release notes.** — n/a: no shelter user would notice a runbook change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the `app-env.ts` behaviour was read from the file; whether UAT should send mail is written as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs only, nothing deploys
- [ ] Deployed SHA matches the tested SHA — n/a: docs only, nothing deploys

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs only
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no output pasted
- [ ] Public pages re-checked after a cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: docs only
- [ ] `strip-baked-env` seen in the deploy output — n/a: docs only
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; the runbook returns to the new-project plan

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The code change UAT-on-dev needs is described, not made | accepted — it belongs in the cutover commit |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — documentation only | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-05

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: nothing to look at

Manual verification by: n/a: documentation only, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: the runbook is read at the cutover

Result: pass

Release manager acknowledgement: n/a: not yet released
