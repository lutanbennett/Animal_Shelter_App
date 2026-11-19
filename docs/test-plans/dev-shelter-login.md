# Feature test plan: dev-shelter-login

## Header

| | |
|---|---|
| Feature | `dev-signin --shelter`: a dev login holding a role on a second shelter, and its first use on the stocktaking switches |
| Backlog item | `docs/backlog.md` → `#dvshl`, `#stcnt` |
| Branch / worktree | `claude/dev-shelter-login` @ `C:\Development\Animal_Shelter_dev-shelter-login` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | yes: 0422 |
| Tested at SHA | 46f38e3bd |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `--shelter` flag on the dev sign-in script so a login can hold a role on a second shelter, plus 0422 fixing the last-Admin guard that broke once two shelters had an Admin
- [x] Files/areas touched listed: `scripts/dev-signin.mjs`, `supabase/migrations/0422_keep_an_admin_per_shelter.sql`, `CLAUDE.md`, `docs/decisions/2026-11-19-dev-shelter-login.md`, `docs/backlog.md`
- [x] Cards affected identified: none change. 0422 keeps the guard's intent (never drop a shelter's last live Admin link); admin and the public are unaffected
- [x] Out of scope written down: no app code changed (`stocktaking/actions.ts` untouched); the `errors.noRow` refusal was not seen because `test-shelter-2` has a `site_content` row

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all four `0`:

```
=== gates: typecheck exited 0 after 133s
=== gates: lint exited 0 after 198s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 199s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0421), checked by `check-migration-numbers.mjs`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying (423 applied, 1 pending)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (`0422 … ok`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace function`)
- [x] Existing rows still read correctly after the change: `user_roles` reads and the stocktaking page unchanged
- [x] Constraints and defaults exercised against real rows: with two shelters holding an Admin, a `user_roles` delete of a card-role login row now succeeds (it failed before with "more than one row returned"), and deleting a sole Admin link row by row is still refused with "no active admin"
- [ ] Down-migration — n/a: replaces a broken function body with a working one; restoring the old body would restore the fault
- [ ] Production apply plan — pending: the release manager applies 0422 to production with the release (`--status --env production` first); production has one shelter, so the old guard still works there and the order is not critical

## 4. Functional checks

- [x] Happy path works end to end: `admin --shelter test-shelter-2 --aal2` signed in at aal2 as an Admin on that shelter; `/admin/stocktaking` loaded; Food switched off and the page showed Off; switched back on
- [x] Data persists — the re-rendered page after the action showed the new state
- [ ] Create / edit / delete — n/a: sign-in and removal were each exercised, see the line above; there is no other create/edit surface
- [x] Empty state: a bare shelter with no Admin role gets a throwaway one
- [x] Invalid input rejected readably: unknown or missing `--shelter` value throws a one-line message
- [x] Boundary cases: re-running sign-in on an existing throwaway Admin keeps its link (no delete); `--remove` of a sole Admin works in one transaction; default (no `--shelter`) `--cards` sign-in and removal still work

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin on `test-shelter-2` | `/admin/stocktaking` | loads, switches save | pass |
| exactly `view_residents` on `test-shelter-2` | n/a | login created and removed | pass |
| signed out | n/a | no app surface changed | n/a |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no user-facing text
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [x] Browser console clean on the pages driven
- [ ] Network clean — n/a: not separately inspected

## 6. Regression

- [x] Pages nearest the change still work: `/admin/stocktaking` on shelter 2
- [ ] Shared file touched — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog items `#dvshl` and `#stcnt` ticked in `docs/backlog.md` on this branch
- [x] Decision file added: `docs/decisions/2026-11-19-dev-shelter-login.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a development tool and a guard fix no shelter user reaches
- [x] Commit messages say why, not just what
- [x] Claims were measured: the 21000 error was reproduced against three header settings and the trigger source read from the live database

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: no table of results
- [ ] Public pages — n/a: no public change

### Deploy safety

- [ ] `deploy: production` line — deferred: release manager
- [ ] `strip-baked-env` line — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [ ] Both a migration and code that reads it — n/a: only a script that reads nothing new
- [ ] `--env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: replaces a function body only
- [ ] Apply plan — deferred: release manager applies 0422, before or after the deploy

### Rollback

- [ ] Rollback position — n/a: function body only; leaving 0422 applied is safe

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high (dev) | `user_roles_keep_an_admin` found Admin by name; every `user_roles` delete failed once two shelters had an Admin | fixed: 0422 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

- [x] The manual list above is empty: n/a, nothing for a person to look at

Manual verification by: n/a: a development tool, driven end to end in the browser pane

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: with the release

Result: pass

Release manager acknowledgement: pending: at release
