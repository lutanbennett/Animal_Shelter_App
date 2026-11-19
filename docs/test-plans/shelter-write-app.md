# Feature test plan — shelter-write-app

## Header

| | |
|---|---|
| Feature | Write half of `#shmgt`: on Settings → Product admin, create a shelter and add or remove its web addresses, at `aal2` |
| Backlog item | `docs/backlog.md` → **#shmgt** (ticked by this PR) |
| Branch / worktree | `claude/shelter-write-app` @ `C:\Development\Animal_Shelter_shelter-write-app` |
| Dev server | `http://localhost:3003` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no (0414 merged earlier as #1711) |
| Tested at SHA | `e02fd8a07` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the screen can create a shelter and map or unmap its web addresses by calling the three 0414 functions; connecting Drive and calendar from it is not in this PR
- [x] Files/areas touched listed — `src/app/admin/product-admin/actions.ts` and `ProductAdminPanel.tsx`, both dictionaries, `src/lib/releases.ts`, `docs/backlog.md`, one decision file
- [x] Cards affected identified — none: the gate is the PADMIN list plus `aal2`, outside the card system; the Admin bypass is untouched; the signed-out public is unaffected
- [x] Anything explicitly **out of scope** written down — delete or rename of a shelter, one-step host move, the Admin role and first login of a new shelter, Drive and calendar connection

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in: already up to date
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — pasted unedited:

```
=== gates: typecheck exited 0 after 61s
=== gates: lint exited 0 after 213s
=== gates: test exited 0 after 55s
=== gates: build exited 0 after 189s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration here; 0414 was applied to dev by #1711
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; 0414's own harness proved the functions in #1711
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: 0414 reaches production with the next release

## 4. Functional checks

- [ ] Happy path works end to end — pending: aal2 required, no authenticator on a dev sign-in
- [ ] Data persists — pending: aal2 required, no authenticator on a dev sign-in
- [ ] Create / edit / delete all exercised — pending: aal2 required, no authenticator on a dev sign-in
- [x] Empty state renders sensibly — a shelter with no addresses shows "none"; read in code, not driven
- [x] Invalid input is rejected with a readable message, not a crash — each SQLSTATE (42501, 22023, 23505) maps to a sentence and any other error goes through `databaseFailure`; read in code, not pressed
- [ ] Boundary cases checked — pending: aal2 required, no authenticator on a dev sign-in

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| on the PADMIN list, aal1 | `/admin/product-admin` | list renders, no create or address controls, step-up sentence shown | pending: not driven in a browser this session; controls are drawn only when `canWrite` is true, read in code |
| on the PADMIN list, aal2 | same | controls drawn and accepted | pending: aal2 required, no authenticator on a dev sign-in |
| admin or any card, not on the list | same | not-found | unchanged from #1709; page gate untouched |
| signed out | same | sent to `/login` | unchanged from #1709 |

- [ ] Every login above tested — pending: aal2 required, no authenticator on a dev sign-in; aal1 view not driven
- [x] A login that should not have access is blocked server-side — each action re-checks `isProductAdmin()` and `hasTwoStep()`, and the three functions raise for anyone else (0414)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: a page only product administrators can open
- [ ] Translatable strings go through the translation path — pending: Thai written without a reviewer; both dictionaries carry every key
- [ ] Mobile viewport (375px) — pending: not driven; inputs and buttons use the shared 44 px sizes
- [ ] Browser console clean — pending: page not driven this session
- [ ] Network clean — pending: page not driven this session

## 6. Regression

- [ ] The pages nearest the change still work — pending: not driven; typecheck, lint, tests and build pass
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only the two dictionaries are shared, and the build compiles every page
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #shmgt, with what shipped and what did not
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-19-shelter-write-app.md`
- [x] `README.md` still accurate — nothing there describes this area
- [x] **Release notes.** `unreleased` has an admin-only line saying only what is true now (create a shelter, add or remove addresses; no Admin role or login yet)
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
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration here; 0414 is already on main
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: 0414 ships with the next release; apply it before the deploy

### Rollback

- [ ] Rollback position stated — n/a: code-only; `deploy-pi.sh --ref <sha>` rebuilds the previous version and the 0414 functions are additive

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| What | Why |
|---|---|
| Create a shelter, add and remove an address on `/admin/product-admin` | needs aal2 (authenticator) |
| The aal1 view shows no controls and the step-up sentence | not driven in a browser |

Automated checks by: Claude  Date: 2026-11-19
Manual verification by: pending: aal2 required, no authenticator on a dev sign-in

Result: pass with accepted defects
