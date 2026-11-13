# Feature test plan — record-card-exception

## Header

| | |
|---|---|
| Feature | Record Lutan's 2026-11-13 exception for the adopter/foster-carer website account in `CLAUDE.md` |
| Backlog item | `docs/backlog.md` → #d6wxo (left open: the portal itself is not built) |
| Branch / worktree | `claude/record-card-exception` @ `C:\Development\Animal_Shelter_record-card-exception` |
| Dev server | not started — documentation only |
| PR | pending |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | pending |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — records the one scoped exception in `CLAUDE.md`
- [x] Files/areas touched listed — `CLAUDE.md`, `docs/decisions/2026-11-13-adopter-portal-card-exception.md`, this plan
- [x] Roles affected identified — none; no code, policy or check changed
- [x] Anything explicitly **out of scope** written down — the portal build, the registry record, the Admin bypass

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: docs-only, run at merge time by the branch hook
- [ ] `node scripts/gates.mjs` — n/a: docs-only, no code changed
- [ ] CI green on the PR — pending: read from the PR before merging

## 3. Schema and data — *skip if no migration*

- [ ] No migration — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a — docs only |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — docs only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: #d6wxo stays open, the portal is unbuilt; its note is the planner's to update
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-13-adopter-portal-card-exception.md`
- [x] `README.md` still accurate — it does not describe the card rule
- [ ] **Release notes.** — n/a: nobody using the app would notice a rules-file change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the quotes are from the backlog item's record of his answer; line placement checked by grep

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs only, nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs only
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: none pasted
- [ ] Public pages re-checked after a cache purge — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing else depends on it

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

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: docs only

Result: pass

Release manager acknowledgement: n/a: not yet released
