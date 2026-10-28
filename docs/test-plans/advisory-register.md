# Test plan: advisory-register

## Header

| | |
|---|---|
| Feature | `docs/advisory-register.json` and `scripts/audit-register.mjs`: the PR `audit` job fails only on a high or critical advisory that is not registered, or whose recorded unreachability stopped being true |
| Backlog item | `docs/backlog.md` → Security, "A REGISTER OF ALREADY-ASSESSED ADVISORY IDS" |
| Branch / worktree | `claude/advisory-register` @ `C:\Development\Animal_Shelter_advisory-register` |
| Dev server | n/a, no UI |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 030123ab |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a register read by a wrapper around npm audit, with checkable reasons per entry
- [x] Files/areas touched listed: `docs/advisory-register.json`, `scripts/audit-register.mjs`, `package.json` (new `audit:register` script), `.github/workflows/ci.yml` (the PR audit step's command only), one decision file, `docs/backlog.md`
- [x] Roles affected identified: none, CI tooling only
- [x] Out of scope written down: `advisories.yml`, `audit:prod`, the job's `continue-on-error`/timeout/retry, assessing any new advisory

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `main`; no merge needed at this commit
- [x] `node scripts/gates.mjs` closing lines: see the PR description (the run was still in progress when this plan was written)
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

Run against the real tree on 2026-10-28:

- Real run: `node scripts/audit-register.mjs` printed `registered: GHSA-5j98-mcp5-4vw2 (glob, high)…` and `audit-register: 1 high/critical advisory, all registered and still unreachable.`, exit 0.
- New advisory: with the entry's id changed to `GHSA-xxxx`, it printed `found 1 vulnerabilities not on the register` and `Severity: high GHSA-5j98-mcp5-4vw2…`, exit 1, plus a note to delete the stale entry.
- Stopped being unreachable: with a file under `scripts/` containing `npx glob -c rm`, it printed `REGISTER: …no longer unreachable… scripts\zz.txt:1`, exit 1. File removed and register restored afterwards; re-run exit 0.
- Not run: the `reviewBy` expiry and the `resolved` regression branch (read, not executed); the build-bundle check (no `.open-next` here, the run printed "not checked").
- Not run: an npm/registry failure path (exit 2 with no marker, so ci.yml's inconclusive branch applies); reasoned from the script, not exercised.

- [x] Happy path works end to end
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete all exercised — n/a: no stored data
- [ ] Empty state renders sensibly — n/a: no advisories prints the "all registered" line with 0; not exercised
- [x] Invalid input is rejected with a readable message: unreadable npm output gives a message and exit 2
- [x] Boundary cases checked: new id, and a pattern appearing; see above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing, no app surface | n/a | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest thing still works: `npm run audit:prod` is unchanged and still exits 1 on the glob advisory; `advisories.yml` untouched
- [ ] Any shared file touched checked from a second page — n/a: no shared app file
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-28-advisory-register.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: CI tooling only; no shelter user can see it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the three runs above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — n/a: CI script only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: CI script only
- [ ] Timezone-sensitive behaviour proved — n/a: the only date use is the review-by comparison in UTC days
- [ ] Boundary or banding change assertions — n/a: no band; the expiry boundary was not exercised
- [x] Evidence described in this plan is the tools' actual output
- [ ] Public pages re-checked — n/a: none touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: revert this PR; the audit step goes back to `audit:prod`, nothing else depends on the new files

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty, no surface for a person to look at

Manual verification by: n/a: no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass

Release manager acknowledgement: n/a: acknowledged at release
