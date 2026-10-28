# Feature test plan

Filled from `docs/test-plan-template.md`.

## Header

| | |
|---|---|
| Feature | The last two role-keyed checks restated per card, and the dev sign-in line in CLAUDE.md corrected |
| Backlog item | `docs/backlog.md` → Security: WHAT IS LEFT IS TWO CHECKS |
| Branch / worktree | `claude/instruments-last-two-and-docs` @ `C:\Development\Animal_Shelter_instruments-last-two-and-docs` |
| Dev server | not started: no page changed |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `02db8906` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: `card-grants-applied` and `card-cells-backed` replace `role-cards-coverage` and `cards-union` as the fault checks (old ones kept, labelled transient), and CLAUDE.md documents `dev-signin.mjs --cards` without a role
- [x] Files touched: `scripts/lib/readonly-checks.mjs`, `CLAUDE.md`, `docs/backlog.md`, `docs/decisions/2026-10-28-last-two-instruments-and-dev-signin-line.md`. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: read-only developer scripts and documentation; no app role sees any of it
- [x] Out of scope: `doctor-cells` (left alone on purpose), `role-cards`, `role-cells`, `check-menu-coverage`, `dev-signin.mjs`, the scope-column hold

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` closing line, as printed: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-production.mjs card-grants-applied --env test` and `card-cells-backed --env test` both ran and printed "Every held card is fully applied wherever it is held." and "Every permission cell is backed by a card, and every card-backed cell is present." The old `role-cards-coverage` and `cards-union` agree on the same database
- [ ] Data persists — n/a: read-only checks write nothing
- [ ] Create / edit / delete — n/a: read-only checks
- [ ] Empty state — n/a: an empty result is the passing output, shown above
- [x] Invalid input: first run of both new checks failed with a SQL syntax error (quotes lost in my shell) and then `column archived_at does not exist`; both fixed, and the checks report "could not run" rather than passing silently
- [ ] Boundary cases — n/a: **not established** that either check goes red on a real fault; no fault was seeded into the shared dev database. Their SQL is the old queries regrouped

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | scripts and docs, no app surface | n/a |
| management | n/a | scripts and docs, no app surface | n/a |
| staff | n/a | scripts and docs, no app surface | n/a |
| doctor | n/a | scripts and docs, no app surface | n/a |
| volunteer | n/a | scripts and docs, no app surface | n/a |
| signed out | n/a | scripts and docs, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling; CLAUDE.md is its manual and was updated
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest things still work: `check-production.mjs` lists all checks and exits 0 on the new file; the four older role-keyed checks still run on dev
- [x] Shared file touched (`CLAUDE.md`): the two edited passages re-read; the documented command matches the refusal text in `scripts/dev-signin.mjs`
- [x] Nothing merged from main during sync was broken: gates run on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file added: `docs/decisions/2026-10-28-last-two-instruments-and-dev-signin-line.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [ ] **Release notes.** n/a: scripts and developer documentation only; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned (what was not run is stated as not established)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — deferred: release manager
- [ ] Boundary or banding assertions — deferred: release manager
- [ ] Evidence pasted is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback: revert the PR. Scripts and documentation only; nothing deploys and no migration to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Both new checks not run on production: no production credentials in a worktree | accepted: run `node scripts/check-production.mjs card-grants-applied` and `card-cells-backed` from the main checkout |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI or visual surface; scripts and documentation only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass

Release manager acknowledgement: n/a
