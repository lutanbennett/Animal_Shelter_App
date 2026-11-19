# Feature test plan — shelter-admin-role-app

## Header

| | |
|---|---|
| Feature | Screen half of `#shadm`: on Settings → Product admin, give a shelter its Admin role and link an existing login to it, at `aal2` |
| Backlog item | `docs/backlog.md` → **#shadm** (ticked by this PR) |
| Branch / worktree | `claude/shelter-admin-role-app` @ `C:\Development\Animal_Shelter_shelter-admin-role-app` |
| Dev server | `http://localhost:3005` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no (0415 merged earlier as #1713) |
| Tested at SHA | `a377558fb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the screen calls the two 0415 functions; it does not create logins or invite
- [x] Files/areas touched listed — `src/app/admin/product-admin/actions.ts` and `ProductAdminPanel.tsx`, both dictionaries, `src/lib/releases.ts`, `docs/backlog.md`, one decision file
- [x] Cards affected identified — none: PADMIN plus `aal2`, outside the card system; the Admin role is given no cards; Admin bypass untouched
- [x] Anything explicitly **out of scope** written down — creating or inviting a login, per-shelter state readout, runbook edits

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in; one conflict in `src/lib/releases.ts` resolved (0.47.3 shipped the earlier note)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — pasted unedited:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 69s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 136s
=== gates: test — npm test
=== gates: test exited 0 after 29s
=== gates: build — npm run build
=== gates: build exited 0 after 201s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: 0415 was applied to dev by #1713
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: 0415's own harness proved the functions in #1713
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: 0415 reaches production with the next release

## 4. Functional checks

- [ ] Happy path works end to end — pending: aal2 required, no authenticator on a dev sign-in
- [ ] Data persists — pending: aal2 required, no authenticator on a dev sign-in
- [ ] Create / edit / delete all exercised — pending: aal2 required, no authenticator on a dev sign-in
- [x] Empty state renders sensibly — a shelter with no Admin role simply shows the two controls; the state is not shown, by design, and the note says so; read in code
- [x] Invalid input is rejected with a readable message, not a crash — 42501, 22023, 23505 each map to a sentence, badly shaped ids are refused first, anything else goes through `databaseFailure`; read in code, not pressed
- [ ] Boundary cases checked — pending: aal2 required, no authenticator on a dev sign-in

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| on the PADMIN list, aal1 | `/admin/product-admin` | no new controls, step-up sentence shown | pending: not driven in a browser this session; controls drawn only when `canWrite`, read in code |
| on the PADMIN list, aal2 | same | controls drawn and accepted | pending: aal2 required, no authenticator on a dev sign-in |
| any card, not on the list | same | not-found | unchanged; page gate untouched |
| signed out | same | sent to `/login` | unchanged |

- [ ] Every login above tested — pending: aal2 required, no authenticator on a dev sign-in; aal1 view not driven
- [x] A login that should not have access is blocked server-side — each action re-checks `isProductAdmin()` and `hasTwoStep()`, and the functions raise for anyone else (0415)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: a page only product administrators can open
- [ ] Translatable strings go through the translation path — pending: Thai written without a reviewer; both dictionaries carry every key
- [ ] Mobile viewport (375px) — pending: not driven; shared input and button sizes
- [ ] Browser console clean — pending: page not driven this session
- [ ] Network clean — pending: page not driven this session

## 6. Regression

- [ ] The pages nearest the change still work — pending: not driven; typecheck, lint, tests and build cover it
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only the dictionaries are shared, and the build compiles every page
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #shadm, with what shipped and what did not
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-19-shelter-admin-role-app.md`
- [x] `README.md` still accurate — nothing there describes this area
- [x] **Release notes.** `unreleased` has an admin-only line saying only what is true now (login must already exist; no state readout)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — what was driven and what was not are separated here

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added; no service-role site added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration here; 0415 is already on main
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: 0415 ships with the next release; apply it before the deploy

### Rollback

- [ ] Rollback position stated — n/a: code-only; the 0415 functions are additive

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| What | Why |
|---|---|
| Give a shelter an Admin role and link a login on `/admin/product-admin` | needs aal2 (authenticator) |
| The aal1 view shows no controls and the step-up sentence | not driven in a browser |

Automated checks by: Claude  Date: 2026-11-19
Manual verification by: pending: aal2 required, no authenticator on a dev sign-in

Result: pass with accepted defects
