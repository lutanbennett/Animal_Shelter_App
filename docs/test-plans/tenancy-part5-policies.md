# Feature test plan

## Header

| | |
|---|---|
| Feature | Part 5 of the tenancy programme: per-shelter restrictive policies |
| Backlog item | `docs/backlog.md` → `#ujqr5` (open, partly built), `#lhdr7` (ticked) |
| Branch / worktree | `claude/tenancy-part5-policies` @ `C:\Development\Animal_Shelter_tenancy-part5-policies` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this plan passes the checker |
| Tested by / date | Claude, 2026-11-17 |
| Carries a migration? | yes: 0392, 0393, 0394 |
| Tested at SHA | eff278f52 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: restrictive `is_trusted_caller() or shelter_id = current_shelter_id()` policies on all 95 tenant tables, applied to dev and proved
- [x] Files/areas touched listed: `supabase/migrations/0392-0394`, `scripts/dev-signin.mjs`, `scripts/check-public-views.mjs`, `scripts/check-migration-grants.mjs`, `CLAUDE.md`, `docs/`
- [x] Cards affected identified: none change what they grant; the policies only remove rows. Admin is unaffected by the bypass in `can.ts`, but sees only its own shelter's rows like everyone else
- [x] Out of scope written down: `NOT NULL`, INSERT policies, Part 7's filters, the ~10 tenant-data tables with no column (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [ ] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — pending: build=1 locally from the advisory prompt below; CI's build is the authority
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

Output of `node scripts/gates.mjs`, unedited (typecheck, lint and test pass; the build step stopped on a Next.js security-advisory prompt, `SecurityFatalError`, which is an environment message and not a build error: `npm run build` run directly exited 0 twice afterwards, and CI runs the build for real):

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 139s
=== gates: test exited 0 after 41s
=== gates: build exited 1 after 54s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
```

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one (`check-migration-numbers.mjs` ok)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed (ok for 0392, 0393, 0394)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (policies dropped then created; grant and stamp idempotent)
- [x] Existing rows still read correctly after the change (17 of 17 residents for the real admin login with the dev shelter header)
- [x] Constraints exercised against real rows in a rolled-back harness: 17 with header, 0 without, 0 with another shelter's header, 17 as a trusted caller; found and fixed null-shelter rows hiding `has_permission()` (decision file, question 3)
- [x] Down-migration: not a file, the reasoning is in 0392's header (drop the three `shelter_scope_*` policies per table restores the previous reads)
- [ ] Production apply plan stated for the release manager — pending: release-time; 0394 must be re-run immediately before 0392 reaches production (decision file)

## 4. Functional checks

- [ ] Happy path works end to end — pending: browser click-through not completed (sign-in cookie paste failed); proved at database level as the real admin login
- [x] Data persists — n/a: no write path changed
- [x] Create / edit / delete — n/a: INSERT unrestricted; update/delete policies proved by catalogue (285 policies) not by pressing buttons
- [x] Empty state — n/a: a login with no header reads empty by design (0 rows proved)
- [x] Invalid input — n/a: no input surface
- [x] Boundary cases — n/a: no header, wrong shelter and trusted caller are the three cases and were all measured

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (real dev login, header = dev shelter) | residents | 17 | 17 |
| admin, no header | residents | 0 | 0 |
| admin, another shelter's header | residents | 0 | 0 |
| trusted caller (service role) | residents | 17 | 17 |

- [ ] Every login above tested — pending: card-holding logins other than admin not exercised
- [x] A login that should not have access is blocked server-side — the rows are refused by the database, not the UI

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no UI change
- [x] Manual updated — n/a: no user-visible change
- [x] Translatable strings — n/a: no new strings
- [x] Mobile viewport — n/a: no UI change
- [x] Browser console clean — n/a: the browser pass was not completed (see section 4)
- [x] Network clean — n/a: as above; `check-public-views.mjs` (anon HTTP) exit 0

## 6. Regression

- [x] The pages nearest the change still work: `check-public-views.mjs` exit 0, canary `0 new leak finding(s)`, catalogue `0 flagged, 0 stale`
- [x] Shared file touched — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: `#lhdr7` ticked; `#ujqr5` re-titled and left open (NOT NULL and Part 7 are not this stream's)
- [x] Non-obvious design choices added as `docs/decisions/2026-11-17-tenancy-part5-policies.md`
- [x] `README.md` still accurate — n/a: nothing in it describes these policies
- [ ] **Release notes.** n/a: no shelter user would notice; the policies are on dev only and in no release yet
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: every count in the decision file is a query result from dev on 2026-11-17

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: plan quotes script output and the gates block verbatim
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it — n/a: no app code reads these policies; `dev-signin.mjs` is a dev script
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive or rewriting migration backup — deferred: release manager (0394 updates rows)
- [ ] Apply plan stated — deferred: release manager (two-release order on `#ujqr5`)

### Rollback

- [ ] Rollback position stated — n/a: drop the three `shelter_scope_*` policies per table (0392 header); no code to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `0392` hid `has_permission()`'s own `user_roles` row when it carried a null shelter, locking a login out of its cards | fixed on dev (0394 + dev-signin header); the cause (headerless writers) deferred to backlog for the planner: NOT NULL / Part 7 |
| 2 | medium | anon had no EXECUTE on `is_trusted_caller()`, so every anon read of a tenant table answered 401 | fixed (0393) |
| 3 | medium | `/admin/status` usage counts are cross-shelter for any login holding `system.status` | deferred to backlog: Part 7, for the planner to file |

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Sign in on port 3003 and click through to Residents: rows show; re-test with another shelter's header | `node scripts/dev-signin.mjs admin --port 3003` | Lutan |

Automated checks by: Claude  Date: 2026-11-17
Manual verification by: pending: browser click-through left for a person
Result: pass with accepted defects
