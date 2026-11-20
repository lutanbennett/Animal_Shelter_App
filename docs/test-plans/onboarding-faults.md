# Feature test plan

## Header

| | |
|---|---|
| Feature | onboarding-faults: Who does what opens on a shelter with no role; the three product-admin tables are classified for the shelter export |
| Backlog item | `docs/backlog.md` → #onbrb (faults 1 and 2; fault 3 stays open, item not ticked) |
| Branch / worktree | `claude/onboarding-faults` @ `C:\Development\Animal_Shelter_onboarding-faults` |
| Dev server | `DEV_SHELTER_ID=<rehearsal shelter id> npm run dev -- --port 3006` → `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 20950f65e |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/admin/who-does-what` no longer sends an empty string as a uuid when a shelter has no role to show, and the three platform tables are classified `none` so `shelter-export.mjs` stops refusing.
- [x] Files/areas touched listed: `src/app/admin/who-does-what/page.tsx`, `docs/tenancy-shared-tables-registry.json`, `docs/decisions/2026-11-20-onboarding-faults.md`, `docs/backlog.md`
- [x] Cards affected identified: none. No access rule was touched; the page's guard (`roles.view`) is unchanged. Admin and signed-out public unaffected.
- [x] Out of scope written down: rehearsal fault 3 (runbook shots), faults 4, 5, 6, any change to `loadRoles()`, any change to the registry check itself.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` — all four exit 0:

```
=== gates: typecheck exited 0 after 63s
=== gates: lint exited 0 after 394s
=== gates: test exited 0 after 97s
=== gates: build exited 0 after 260s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration, nothing to undo
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in as the rehearsal shelter's Admin (aal2), clicked Settings then Who does what; the page opened and showed "Create a role". Before the fix the same page threw `invalid input syntax for type uuid: ""` (recorded by the rehearsal). Registry: `check-tenancy-shared-tables.mjs` now says "every unscoped table is recorded"; `check-shelter-export.mjs` passes; `shelter-export.mjs --shelter rehearsal-2026-11-20 --out <temp>` got past the registry and stopped at "no age recipient given".
- [ ] Data persists — n/a: nothing is written by either change
- [ ] Create / edit / delete — n/a: the Create a role press was not exercised; the change only stops the page crashing on load
- [x] Empty state renders sensibly: the page with no roles is the empty state, and it renders
- [ ] Invalid input rejected — n/a: no input added
- [ ] Boundary cases — n/a: the one boundary, no role, is the empty state above

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (rehearsal shelter) | /admin/who-does-what | opens, shows Create a role | as expected |

- [ ] Every login above tested — n/a: only Admin was driven; the guard code is unchanged, so no other login's access changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule was added or changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: no wording or behaviour a person reads changed
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no layout change
- [x] Browser console clean — no errors read on the page
- [x] Network clean — the dev server logged no error for the page

## 6. Regression

- [x] The pages nearest the change still work: Settings landing page loaded and led to Who does what
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken: gates above ran after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: #onbrb stays open for fault 3; a note and title were updated instead, as the brief requires
- [x] Non-obvious design choices added as `docs/decisions/2026-11-20-onboarding-faults.md`
- [ ] `README.md` still accurate — n/a: no behaviour README describes changed
- [ ] **Release notes.** — n/a: only a shelter with no role yet could hit the crash, and no live shelter is in that state
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the crash and the fix were driven on the rehearsal shelter, and the registry checks were run before and after

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: gates output above is pasted from the run
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: code and registry JSON only; revert the commit, nothing in the database changed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | None found. | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR
- [ ] Handed to the production release manager — n/a: handled at release time

Result: pass

Release manager acknowledgement: n/a: not yet
