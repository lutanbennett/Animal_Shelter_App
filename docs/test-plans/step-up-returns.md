# Feature test plan

## Header

| | |
|---|---|
| Feature | step-up-returns |
| Backlog item | `docs/backlog.md` → #stpbk (and #cjred screen half) |
| Branch / worktree | `claude/step-up-returns` @ `C:\Development\Animal_Shelter_step-up-returns` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 35cd13672 |

## 1. Scope and risk

- [x] The second step returns to where the journey started, and the console front door tells a non-admin where to go; matches #stpbk and #cjred's screen half
- [x] Touched: `src/lib/auth/two-step.ts`, `src/app/admin/security/verify/*`, `src/app/platform/page.tsx`, `src/app/admin/who-does-what/{page,features/page}.tsx`, `src/app/admin/stocktaking/page.tsx`, i18n en/th
- [x] Cards affected: none change; no gate moved. Admin and product administrator reach the same pages as before; signed-out unchanged
- [x] Out of scope: #cjred's production Supabase Redirect URL read-back (the planner's); `/my` banner left bare on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — pending is not needed: branch cut from current `main` this morning, nothing newer merged
- [x] `node scripts/gates.mjs`:

```
=== gates: typecheck exited 0 after 150s
=== gates: lint exited 0 after 547s
=== gates: test exited 0 after 95s
=== gates: build exited 0 after 356s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] Status reviewed — n/a: no migration
- [ ] Dry-run — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path end to end — pending: the Settings→verify→Settings press needs an aal2 dev session driven in the browser pane, and the platform-host half cannot run on dev (no PLATFORM_HOST); neither was pressed
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete — n/a: no data is written
- [ ] Empty state — n/a: no list is drawn
- [ ] Invalid input — n/a: a bad `next` is dropped by `safeNextPath()` and the old fallback applies (existing unit coverage of that function)
- [ ] Boundary cases — n/a: no new boundaries beyond `safeNextPath()`, unchanged

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | verify, security | unchanged | not pressed |
| signed out | verify | login | unchanged code path |

- [ ] Every login above tested — pending: not pressed in a browser, see section 4
- [ ] A login that should not have access is blocked server-side — n/a: the gates did not move; `check-hard-coded-security.mjs` printed `no coded security outside the Admin bypass`

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing behaviour a manual topic describes
- [x] Translatable strings go through the dictionaries (en and th added)
- [ ] Mobile viewport — n/a: one sentence and a link, no layout
- [ ] Browser console clean — pending: page not loaded in a browser
- [ ] Network clean — pending: page not loaded in a browser

## 6. Regression

- [x] Nearest pages checked by typecheck and build: Who does what, features, stocktaking, platform all compile
- [ ] Shared file touched from a second page — pending: two-step.ts is shared; no browser load done
- [ ] Nothing merged from main broke — n/a: nothing merged in this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: see the PR; #stpbk ticked on this branch only once the Settings journey has been pressed
- [x] Decision file `docs/decisions/2026-11-20-step-up-returns.md`
- [x] README still accurate
- [ ] Release notes — n/a: only a product administrator reaches the console, and today that is one person; Settings-side behaviour is unchanged
- [x] Commit messages say why

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test on test host, including the platform-host journey — deferred: release manager
- [ ] Timezone — n/a: no date logic
- [ ] Band edges — n/a: no banding
- [ ] Evidence unedited — n/a: the gates block above is pasted as printed
- [ ] Public pages — n/a: no public page touched
- [ ] Deploy ref line — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none found | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Step up from /platform lands on /platform; from Settings lands on /admin/security | cooperjaidee.org and the app host |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] Manual list is checked by a person — pending: item 1 above

Manual verification by: pending: Lutan to press the two journeys after deploy

### Result

- [ ] Open defects fixed or accepted — n/a: none open
- [ ] Checklist pasted into the PR — pending: written when the PR is opened
- [ ] Handed to the release manager — n/a: goes through the normal release

Result: pass
