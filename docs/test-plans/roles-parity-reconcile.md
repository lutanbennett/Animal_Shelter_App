# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The parity check read against §11: it runs again after `0173`, its header says what checks each layer, and layer 3's gap is recorded |
| Backlog item | `docs/backlog.md` → Next up: Roles build, foundation 2: the parity check (scripts only) |
| Branch / worktree | `claude/roles-parity-reconcile` @ `C:\Development\Animal_Shelter_roles-parity-reconcile` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` (not used: scripts and docs only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (roles-parity-reconcile session), 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `a0dbc1d6` (after syncing `main`; dev at `0173`, 173 applied, 0 pending) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item asked someone to read the script against §11, fix the stale header and record whether layer 3 is covered or split. Done, and the reading found the script had been crashing since `0173`, which is fixed too
- [x] Files/areas touched listed: `scripts/check-permission-parity.mjs`, `scripts/lib/permission-probes.mjs`, `docs/decisions/2026-10-09-parity-check-layers-reconciled.md`, `docs/backlog.md` (the tick), this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: a developer check script; no app role sees any of it. The roles it *probes* changed (Staff dropped as a live principal), recorded in §4
- [x] Out of scope written down: covering layer 3 for the 26 unregistered pages and the resident pages (new backlog item on the `backlog` branch); `check-recurring-job-eligibility.mjs` being red (already the sibling's "Eight dev check harnesses" item, note added there); wiring the check into CI (needs dev credentials, unchanged); the 21 doctor lines (a recorded decision, not touched)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`a0dbc1d6`), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 169s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: all seven checks passed on #503 at `0201cd48`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration (read anyway: dev 173 applied, 0 pending, in step with `origin/main`)
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the check runs in rolled-back transactions and leaves nothing
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Every run against dev, from this worktree.

- [x] Happy path works end to end. **Before** (on `main` as merged): the script crashed at setup, nothing probed:

```
Error: harness did not return a result (status 400): Failed to run sql query: ERROR:  23514: The Staff role is retired: choose another role for this login.
```

  **After** (`a0dbc1d6`), summary lines as printed:

```
260 probe runs across 7 principals (1820 answers)
  MATCH             1777
  KNOWN TIGHTENING  22
  MISMATCH          21
  HARNESS FAULT     0
Section Z: no role, an archived person, an archived role, an unknown activity and a missing cell all answer NO for every activity and level; a seeded cell answers yes (control)
210 answers (35 predicates x 6 roles incl. no role; staff retired by 0173)
RESULT: RED
```

  All 21 MISMATCH lines are `doctor: the default says ALLOWED, the database REFUSES` on `has_permission()` (counted: 21 of 21), the recorded doctor decision the header now names. Layer 2 printed no MISMATCH.
- [ ] Data persists — n/a: nothing is meant to persist; the opposite was checked: every run is rolled back, and the next run's harness created the same fixtures without a conflict
- [x] Create / edit / delete all exercised: the probes exercise insert, update and delete on every probed table; the immunization insert probe, a HARNESS FAULT for Management and then Doctor in the intermediate runs, now runs (0 faults)
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — the check's own deliberate failures, each exit 1:
  - `PARITY_FLIP=volunteer:stock.delivery:2` (an expectation flipped): MISMATCH 21 → 25, the new lines `volunteer: the default says ALLOWED, the database REFUSES`, `RESULT: RED`
  - `PARITY_FLIP_DB=doctor:clinics.list:2` (a seeded cell flipped inside the transaction): MISMATCH 21 → 24, the three new lines all `clinics.list` for the doctor, `RESULT: RED`
  - `PARITY_FLIP=doctor:clinics.list:1` (makes a listed tightening true): `[STALE] clinics.list read … C10 lists doctor as allowed beyond the default, but the database now matches the default. Remove the entry`, `RESULT: RED`. Both directions of §11's rule hold
- [x] Boundary cases: the archived person still holds Staff (archived), which the `0173` trigger allows, and section Z still answers NO for it on every activity and level; the positive control moved to Management and still answers yes

Neighbouring checks, run for the reconciliation (not changed here):

- [x] `node scripts/check-permission-catalogue.mjs` → `all ok`, exit 0 (layer 3 for the 37 registered pages, section E)
- [x] `node scripts/check-recurring-job-eligibility.mjs` → exit 1, three FAILs (E9 `/contacts`, the `/management` and `/admin` fixture rows). Recorded in the decision file and on the existing backlog item that owns it; not this stream's script

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | developer script, no app surface | n/a |
| management | n/a | developer script, no app surface | n/a |
| staff | n/a | retired by `0173`; no longer a principal of the check | n/a |
| doctor | n/a | developer script, no app surface | n/a |
| volunteer | n/a | developer script, no app surface | n/a |
| signed out | n/a | developer script, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: developer tooling, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `check-permission-catalogue.mjs` (all ok), `npm run lint` inside gates (runs the catalogue check, the home-screens check and the acceptance matrix), `check-backlog-sections.mjs` (ok)
- [ ] Shared file checked from a second page — n/a: `scripts/lib/permission-probes.mjs` is read only by the parity check (one line changed, the immunization probe), exercised above
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates and the parity run are both at the merged SHA

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with a note that layer 3 is split for registered pages and the gap is now its own item; that item and a note on the harnesses item went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-09-parity-check-layers-reconciled.md`
- [ ] `README.md` still accurate — n/a: README does not describe the parity check
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a developer check script and its comments; nothing a shelter user opens, sees or does changes
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned: the crash, the counts, the 21/21 doctor lines, the flips, the 37/26/45 page split (counted over every `page.tsx` against the registry's paths and a `requirePermission(` grep) and the eligibility FAILs are all from runs in this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/` and docs are not part of the Worker bundle; nothing deploys
- [ ] Deployed SHA matches — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deploys
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no boundary or banding change
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the run output in §2 and §4 is pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: nothing deploys
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Only the developer check is affected; reverting brings back the `0173` crash, so the check would again assert nothing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | The parity check crashed at setup since `0173` (live Staff login refused), so every conversion since had no parity proof | fixed |
| 2 | medium | The immunization insert probe looked its type up under the role's login and faulted for Management and Doctor, testing nothing | fixed |
| 3 | medium | Layer 3: 26 guarded pages outside the route registry, and the resident pages, are checked by nothing | deferred to backlog: "Parity layer 3: the pages outside the route registry" |
| 4 | medium | `check-recurring-job-eligibility.mjs` red (three FAILs), not in lint | deferred to backlog: the existing "Eight dev check harnesses…" item, note added |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: every behaviour is a script with an exit code, run above.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (roles-parity-reconcile session)  Date: 2026-10-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; every behaviour is a script with an exit code, all run above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing deploys; developer tooling only

Result: pass with accepted defects

Release manager acknowledgement: n/a (tooling only)  Date: —
