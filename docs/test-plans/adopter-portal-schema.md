# Feature test plan — adopter-portal-schema

## Header

| | |
|---|---|
| Feature | Schema half of the adopter / foster-carer website account: Foster joins the scope (0371), isolation proof, registry record, specification |
| Backlog item | `docs/backlog.md` → #d6wxo (left open: the app half is `adopter-portal-app`) |
| Branch / worktree | `claude/adopter-portal-schema` @ `C:\Development\Animal_Shelter_adopter-portal-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | yes — `0371_portal_scope_includes_foster.sql` |
| Tested at SHA | tip of `claude/adopter-portal-schema` when CI ran (origin/main 355d0060c already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence — two functions widened from open Adopt to open Adopt-or-Foster placements, plus a roleless-login isolation harness and the registry record of the exception
- [x] Files/areas touched listed — `supabase/migrations/0371_*`, `scripts/check-portal-account.mjs`, `docs/hard-coded-security-registry.json`, `CLAUDE.md` (one sentence), `docs/decisions/2026-11-13-adopter-portal-schema.md`, this plan
- [x] Roles affected identified — none; no policy, card or role changed. A foster carer's sign-in can now send updates through the already-shipped adopter page
- [x] Out of scope written down — screens, public-site sign-in, whether foster updates reach `public_adoption_updates`: in the decision file's specification for the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already merged, up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — pending: read from the PR status before merging

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs` ok, 0371 against 0370
- [x] `--status` reviewed — 372 applied, 1 pending before apply
- [ ] `--dry-run` reviewed — n/a: a single function replacement with no dependency on another pending file; applied directly to dev
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) — `applying 0371_portal_scope_includes_foster.sql … ok`
- [x] Re-runnable — `create or replace` and idempotent grants
- [ ] Existing rows still read correctly — n/a: no table or column changed; Adopt placements answer exactly as before
- [x] Constraints exercised in a rollback harness — `scripts/check-portal-account.mjs` HARNESS-OK: open foster carer in, other contact out, archived out, out after the placement closes
- [x] Down-migration — not needed: re-create 0357's bodies
- [ ] Production apply plan — pending: release manager applies 0371 with the next release

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface; scope boundaries are in the harness

### Role access matrix

| Login | Can reach | Expected | Result |
|---|---|---|---|
| no role and no card | only its own animals, through the service-role call sites | no permission, no readable table | harness: has_permission false for every activity; 111 tables swept, 0 rows readable |
| any card-holding login | unchanged | unchanged | n/a — no policy, grant or card touched |

- [ ] Every login above tested — n/a: only the cardless login is affected, tested in the harness
- [x] A login that should not have access is blocked server-side — the harness acts through the cardless login's own JWT as `authenticated`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — the `gates.mjs` build compiles `/adopter-update`, which calls the widened functions with unchanged signatures
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` broke — already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; the app half remains
- [x] Decisions added — `2026-11-13-adopter-portal-schema.md`
- [x] `README.md` still accurate — it does not describe the adopter scope
- [ ] **Release notes.** — n/a: no screen changes; Foster scope is not usable by a person until the app half ships
- [x] Commit messages say why
- [x] Claims measured, not reasoned — no trigger on `auth.users` found by grep; isolation by the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Both a migration and code that reads it? — no code changed; the shipped callers keep their signatures
- [ ] Production `--dry-run` clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: function replacement only
- [x] Apply plan stated — 0371 on production with the next release

### Rollback

- [x] Rollback position stated — re-create 0357's function bodies; older code is unaffected either way

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | First harness run failed: `end_date` can only be set by the next placement | fixed — the harness closes the placement by inserting a ReturnToShelter |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty — no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
