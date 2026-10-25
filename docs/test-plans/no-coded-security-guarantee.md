# Feature test plan — no-coded-security-guarantee

## Header

| | |
|---|---|
| Feature | An exhaustive inventory of every way access is decided, and a hard-coded-security check that asserts zero instead of ratcheting |
| Backlog item | `docs/backlog.md` → "RERUN EVERY CARD TEST, ALL 28 CARDS" gate 1, and "THE LAST ROLE-BASED GRANT IN THE APP" (annotated, not ticked) |
| Branch / worktree | `claude/no-coded-security-guarantee` @ `C:\Development\Animal_Shelter_no-coded-security-guarantee` |
| Dev server | n/a: no UI surface; `http://localhost:3008` unused |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | 481b1744 |

## 1. Scope and risk

- [x] One sentence: replaces the count-based ratchet with a check that asserts zero coded security outside the Admin bypass, and records the inventory behind it; changes no access
- [x] Touched: scripts/check-hard-coded-security.mjs, docs/hard-coded-security-registry.json, docs/decisions/2026-10-25-no-coded-security-inventory.md, CLAUDE.md (one clause), .github/workflows/ci.yml (a comment), backlog (three new items on the backlog branch)
- [ ] Roles affected — n/a: nothing a role can see or do changed; the check reads source and migration files
- [x] Out of scope: removing the two rules found (each its own backlog item), any policy, function, card or column, `role_extras`, the card review files, `docs/card-access-faults.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip, no migration

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration (it was run read-only to establish state: dev 262/262, production 262/262)
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration; nothing was applied to dev
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no data touched
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-hard-coded-security.mjs` exits 0 on the tree and prints NOT CLEAN with the two named rules first
- [x] Data persists — the result is the same on a second run; the registry is plain JSON
- [x] The check was exercised by injecting violations, each caught and each removed afterwards: a new `perms.roles.includes("volunteer")` and a new `process.env` read (both failed); a migration `0262` with a policy using `true`, a definer function reading `r.key`, a grant to anon, a write to `opens_app` (all failed); a migration redefining `sees_all_residents()` (failed). With `stillDecidesAccess` emptied the two rules surfaced as unrecorded failures, so the clean line cannot print while they exist; in a scratch tree holding only `can.ts` and a registry with no open records the check exit 0 and printed `no coded security outside the Admin bypass`
- [ ] Empty state — n/a: no UI
- [x] Invalid input: a record that matches nothing fails the check (tested with `APP_HOST`, which nothing read)
- [ ] Boundary cases — n/a: no UI; comment stripping and string handling are the old check's, unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all | nothing changed | n/a | n/a |

- [ ] Every role above tested — n/a: no access rule changed; the inventory's reads were done read-only on dev and the production checks `cards-union`, `role-cards-coverage` and `check-no-role-column-security` were run
- [ ] Unauthorised access blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual — n/a: no user-facing wording
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The CI job `hard-coded-security` runs `node scripts/check-hard-coded-security.mjs` unchanged and still fails the run on a non-zero exit
- [x] `scripts/check-no-role-column-security.mjs` (the database half) re-run on dev and production: ok
- [x] Nothing merged from main during sync was broken by this branch (gates)

## 7. Documentation

- [x] Backlog: three items filed on the backlog branch (never-assignable by role name, reads that need only any card, inert leftovers); the Who-does-what item annotated that the check now names it; nothing ticked, because none of the gates for the card rerun is closed
- [x] Decision file `docs/decisions/2026-10-25-no-coded-security-inventory.md`
- [x] CLAUDE.md "Hard-coded security is forbidden": the ratchet paragraph now says the check asserts zero; every other clause, the Admin scope and "no card for the activity? create one" kept intact
- [ ] README — n/a: nothing in README names the check
- [ ] **Release notes.** n/a: a check and an inventory, nothing a shelter user would notice
- [x] Commit messages say why
- [x] Claims were measured: live dev reads of policies, functions, views, grants, role columns; production through the three read-only checks; each "NOT ESTABLISHED" item is named in the decision file with what would establish it

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: no deploy; docs, a CI script and a registry
- [ ] Deployed SHA matches — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on test.lannacare.org — n/a: no app behaviour
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary/banding — n/a: no threshold
- [ ] Evidence is the tool's actual output — n/a: gates output above is verbatim
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] deploy line read — n/a: nothing deploys
- [ ] strip-baked-env seen — n/a: nothing deploys
- [ ] New secret/env var — n/a: none
- [ ] Migration and reader code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no data change
- [ ] Apply plan stated — n/a: nothing to apply
- [ ] Rollback — n/a: revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | Settings → Who does what opens for the role named `management`, not for a card | deferred to backlog: the existing "last role-based grant" item; named in the check as NOT CLEAN |
| 2 | medium | A role named `doctor` or `public_viewer` is never offered a recurring job, whatever cards it holds | deferred to backlog: `never-assignable-by-card` |
| 3 | medium | Reads that need only any card, not the card under test (facility maps, `app_users`, the resident-state views) | deferred to backlog: "reads that need only any card" |
| 4 | low | Seven constant-answer functions, five role columns and an unused constant remain | deferred to backlog: "remove the inert leftovers" |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the top of the decision file and say whether the answer matches how Lutan understands the system (in particular B3, which is a judgement call he owns) | docs/decisions/2026-10-25-no-coded-security-inventory.md |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is not empty — n/a: only the person who looked may tick this, and nobody has yet

Manual verification by: pending: Lutan reading the answer and the B3 judgement call

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; the release manager reads it from the branch

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
