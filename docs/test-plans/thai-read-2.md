# Feature test plan: thai-read-2

## Header

| | |
|---|---|
| Feature | Thai read round 2: 25 new strings read by a bilingual reader, all passed; progress file updated |
| Backlog item | `#y1dqu` is a weekly routine and stays open |
| Branch / worktree | `claude/thai-read-2` @ `C:\Development\Animal_Shelter_thai-read-2` |
| Dev server | n/a: no UI or code behaviour changed |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | pending: recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence: the 25 new Thai strings were read with a bilingual reader, none changed, and the progress file records it
- [x] Files touched: `docs/thai-read-progress.md` and this plan; no code
- [x] Cards affected identified: none, documentation only
- [x] Out of scope: the 101 changed-Thai strings (the บัตรสิทธิ์ rewording already ruled on)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: docs-only, branch is on current `main`
- [x] `node scripts/gates.mjs` — n/a: docs-only change, no code touched

- [ ] CI green on the PR — pending: PR not yet open

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema or data change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no behaviour change, only Thai wording in a dictionary
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no such feature
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: no UI change
- [ ] Boundary cases checked — n/a: no logic change

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no access change | n/a: wording only |
| signed out | n/a | no access change | n/a: wording only |

- [ ] Every login above tested — n/a: no access change
- [ ] A login that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual is English-only and untouched
- [ ] Thai dictionary check — n/a: no dictionary change
- [ ] Mobile viewport (375px) — n/a: Thai strings only; a longer or shorter word is the only layout effect and บัตรสิทธิ์ is about 2 characters longer than การ์ด
- [ ] Browser console clean — n/a: not driven; no code changed
- [ ] Network clean — n/a: not driven; no code changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven in a browser; typecheck and build pass with the edited dictionary
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `th.ts` is only edited inside string values
- [ ] Nothing merged from main broken — n/a: docs only

## 7. Documentation

- [ ] Backlog items ticked — n/a: `#y1dqu` is a standing routine and stays open
- [ ] Decision filed — n/a: the progress file is the record
- [ ] `README.md` still accurate — n/a: no README text concerns this
- [ ] **Release notes.** n/a: supplier/size/shop-name Thai wording corrections to unread translations; not a visible improvement a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: counts come from the list script output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no boundary change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no destructive migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the commit and redeploy; nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: the read was the manual check, done in chat | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-14

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: the read itself was the manual check, done by Lutan and his wife in chat

Manual verification by: pending: a bilingual reader read the strings in chat; Lutan has not signed this line, and Claude does not sign for him

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
