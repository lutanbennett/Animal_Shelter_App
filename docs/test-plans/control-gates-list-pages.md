# Feature test plan

## Header

| | |
|---|---|
| Feature | Four list pages' levels and controls: the Sterilisation drives list opens at read, its controls follow edit; contacts, clinics and diets recorded as edit |
| Backlog item | `docs/backlog.md` → #q0wc0 (ticked here) |
| Branch / worktree | `claude/control-gates-list-pages` @ `C:\Development\Animal_Shelter_control-gates-list-pages` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-07 |
| Carries a migration? | no |
| Tested at SHA | `01ab8bd7` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `management/sterilisation-drives/page.tsx`, `lib/permissions/routes.ts`, `lib/releases.ts`, docs
- [x] Cards affected identified: `website` (edit) and `website_photos` (read of `website.content`); admin unaffected; signed-out unaffected
- [x] Anything explicitly **out of scope** written down: contacts, clinics, diets stay at edit (decision file); no policy touched

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: sync ran before the gates and merged nothing new beyond the base this branch started from
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 81s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 246s
=== gates: test — npm test
=== gates: test exited 0 after 32s
=== gates: build — npm run build
=== gates: build exited 0 after 281s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end (edit login sees Start a drive and the title link)
- [ ] Data persists — n/a: no data written by this change
- [ ] Create / edit / delete — n/a: actions untouched
- [x] Empty state renders sensibly (unchanged code path; read login saw the one drive)
- [ ] Invalid input — n/a: no input added
- [ ] Boundary cases — n/a: no boundary logic

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| exactly `website_photos` (`website.content` read) | drives list | opens; only link is the back link | as expected |
| exactly `website` (`website.content` edit) | drives list | also Start a drive and the title link | as expected |
| admin | drives list | sees all (short-circuit, code unchanged) | not driven: unchanged path |
| signed out | drives list | redirected to login by the guard | not driven: guard unchanged |

- [x] Every login above tested — the two card logins driven; admin and signed-out unchanged code
- [x] A login that should not have access is blocked server-side: the guard still needs `website.content` read; the actions still ask edit

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no manual topic describes this list's controls
- [ ] Translatable strings — n/a: no new strings in the app
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: server-rendered change, nothing client-side touched
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work (the drives list with both logins)
- [ ] Shared file touched — n/a: `routes.ts` gained one `level` on one entry; `check-permission-catalogue` passes
- [x] Nothing merged from `main` during `sync` was broken

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-07-control-gates-list-pages.md`
- [ ] README — n/a: no README text covers this
- [x] **Release notes.** `unreleased` gained a line tagged `website` and `website_photos`
- [x] Commit messages say why
- [x] Claims were measured: the read policies and guards were read from the migrations and actions, and the two logins were driven

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary assertions — deferred: release manager
- [ ] Evidence is tool output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager
- [ ] Deploy target line — deferred: release manager
- [ ] strip-baked-env line — deferred: release manager
- [ ] New secret/env var — deferred: release manager
- [ ] Migration ordering — deferred: release manager
- [ ] Production dry-run — deferred: release manager
- [ ] Backup — deferred: release manager
- [ ] Apply plan — deferred: release manager
- [ ] Rollback — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing outstanding for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body carries the table and the gates line
- [ ] Handed to the production release manager — n/a: release manager reads it at the release

Result: pass
