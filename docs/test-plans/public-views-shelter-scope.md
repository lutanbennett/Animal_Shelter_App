# Feature test plan — public-views-shelter-scope

## Header

| | |
|---|---|
| Feature | #pvws4: every `public_*` view measured for the cross-shelter leak, and `check-public-views.mjs` now fails on it |
| Backlog item | `docs/backlog.md` → #pvws4 (ticked) |
| Branch / worktree | `claude/public-views-shelter-scope` @ `C:\Development\Animal_Shelter_public-views-shelter-scope` |
| Dev server | not started — no UI surface changed |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-21 |
| Carries a migration? | no — none of the 23 views was leaking, so the expected `0433` was not written |
| Tested at SHA | `d832f72f4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the 23 views are listed and measured, and the check goes red on a headerless read
- [x] Files/areas touched listed — `scripts/check-public-views.mjs`, decision file, backlog tick, this plan
- [x] Roles affected identified — none; no access rule changed
- [x] Anything explicitly **out of scope** written down — no view, migration or `src/` file changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the gates: already up to date
- [x] `node scripts/gates.mjs` ends with the four exit codes below, read from the output file:

```
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
- [ ] Constraints and defaults exercised in a harness — n/a: no migration; the measurement is in the decision file
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-public-views.mjs` against dev exits 0; all 23 views read nothing with no header
- [x] Data persists — n/a-equivalent: read-only check; no data written
- [ ] Create / edit / delete all exercised — n/a: read-only check
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI input
- [x] Boundary cases checked — a deliberately leaky `postgres`-owned fixture view made the check exit 1 with `anon with NO x-shelter-id reads nothing — 40 row(s)`; fixture dropped

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| anon, no `x-shelter-id` | every `public_*` view | nothing | pass — 23 of 23 |

- [ ] Every role above tested — n/a: anon only
- [ ] A role that should not have access is blocked server-side — n/a: unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing in `src/` changed
- [ ] Any shared file touched checked from a second page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — #pvws4
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-21-public-views-shelter-scope.md`
- [x] `README.md` still accurate — unaffected
- [ ] **Release notes.** — n/a: a check script changed; nobody would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — live view definitions, owners, policies and row counts read from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is the tool's actual output** — n/a: no deploy evidence
- [ ] Public pages re-checked after a cache purge — n/a: no public view changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--dry-run` on production — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; only a check script changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `check-public-views.mjs` sent the shelter header on every call, so a view answering every shelter's rows without one could not go red | fixed |
| 2 | low | no structural (owner) check of `public_*` views; the new check is vacuous for 13 views empty on dev | deferred to backlog (planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
