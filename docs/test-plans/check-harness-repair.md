# Feature test plan

## Header

| | |
|---|---|
| Feature | check-harness-repair: get the dev check harnesses that 0172 / 0173 broke running again |
| Backlog item | `docs/backlog.md` → *Eight dev check harnesses no longer start since the Staff retirement and the doctor rename* |
| Branch / worktree | `claude/check-harness-repair` @ `C:\Development\Animal_Shelter_check-harness-repair` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (used only by `check-phone-width.mjs`) |
| PR | [#509](https://github.com/lutanbennett/Animal_Shelter_App/pull/509) |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `50cd4807` (after syncing origin/main, which brought 0175) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: every check harness that stopped at setup because it made or looked up a live Staff login (0173) or used a name 0172 renamed now runs again and asserts, and each repaired one was shown to fail on a deliberate break
- [x] Files/areas touched listed: 51 files under `scripts/` (50 `check-*.mjs` plus `check-phone-width.mjs`), `docs/backlog.md` (the tick), `docs/decisions/2026-10-10-recurring-eligibility-fixture-was-stale.md`, this plan. No `src/`, no `worker/`, no migration
- [ ] Roles affected identified — n/a: developer tooling only; no role sees anything different. The harnesses now probe Management, the 2IC or a harness-made custom role where they used to probe Staff
- [x] Anything explicitly **out of scope** written down: eight harnesses run again but stay red for a third reason, and five more were never Staff-related; all are listed on the backlog branch (*Thirteen dev check harnesses still red after check-harness-repair*) rather than fixed here. App findings (the management-enum gate in five functions; `staff` still in `APP_ACCESS_ROLES`) are on the backlog, not fixed. `check-permission-parity` and `probe-role-surface` belong to `roles-parity-reconcile` and were not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (map-rooms-schema, release 0.24.0); `check-map-rooms` re-run after it: 25 held, green
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 156s

gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR: all seven checks passed on #509 (seen 2026-10-10 before merge)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; every harness runs in a transaction that is always rolled back
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration. (The harnesses themselves are exactly such `begin … rollback` blocks; running them is section 4)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The "feature" is the harnesses, so the functional check is: each repaired harness is green on dev, and goes red on a deliberate break (a throwaway mutated copy, run and deleted).

- [x] Happy path works end to end: 43 repaired harnesses end green on dev (`HARNESS-OK` / `RESULT: GREEN` / "Every case held" / exit 0), each run after its last edit
- [ ] Data persists — n/a: every DB harness ends in a deliberate `raise exception` or `rollback`, so by design nothing persists; re-running gives the same answer (several were run three or more times)
- [x] Create / edit / delete all exercised: each harness's own insert / update / delete probes under each login's JWT ran
- [x] Empty state renders sensibly: `check-volunteer-narrowing` reports tables with no rows as "no rows to see" rather than counting them as a control (`picker_immunization_types`, `immunization_duplicate_check`)
- [x] Invalid input is rejected with a readable message: every harness reports a named assertion when it fails (see the breaks below), not a crash. Before this branch, 42 of them crashed at setup with "The Staff role is retired"
- [x] Boundary cases checked: each repaired harness was made to go red on purpose. Breaks used, per harness: a login given the wrong role (Management -> volunteer or admin, volunteer -> management, doctor -> volunteer); a cell a role must not hold (a volunteer `contacts.browse`, a staff `website.content`, the clerk given `clinics.doctors`, a no-publish role given publish); a fixture moved (tomorrow's visit into the past); an index dropped; a removed right restored (`VOLUNTEER_RESTORE` x3); the pre-0174 doctor read policy restored; a replayed mutant making `is_clinic_login()` false. Every one gave a FAIL line and a non-zero exit

### Role access matrix

- [ ] Every role above tested — n/a: no UI or server surface changed; the harnesses probe roles on dev, and those probes are the checks in this section
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed (scripts only)

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: scripts only | unchanged | n/a |
| management | n/a: scripts only | unchanged | n/a |
| staff | n/a: retired by 0173 | no live login can exist | the harnesses no longer try to make one |
| doctor | n/a: scripts only | unchanged | n/a |
| volunteer | n/a: scripts only | unchanged | n/a |
| signed out | n/a: scripts only | unchanged | n/a |

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings go through the translation path — n/a: no strings
- [x] Mobile viewport (375px): `check-phone-width.mjs` is itself one of the repaired scripts. A plain run with no flags on dev: "334 page view(s) measured (admin, management, second_in_command, doctor, volunteer, head_of_medical, head_of_maintenance; en + th) … No page scrolls sideways. … Every component action is at least 44 px." Red when the tap rule is raised to 200 px. (A first run lost its throwaway logins mid-run to something outside it, most likely another session's `--clean`; the rerun was clean.)
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the harnesses nearest the change are the ones not edited; a sweep of every DB harness after the repairs (`node` over all 70+ `check-*.mjs` that query dev) found none still failing on Staff or a 0172 name, and the only non-green ones are the 13 listed on the backlog
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched; `docs/backlog.md` only gained the tick
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after the merge, and the one harness main touched the area of (`check-map-rooms`, 0175) re-run green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with how many were repaired (51, not eight); follow-ups went on the `backlog` branch (two new items, one note)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-10-recurring-eligibility-fixture-was-stale.md` (the eligibility call: all three reds were a stale fixture, not a regression, with the migration or commit behind each)
- [x] `README.md` still accurate (it does not list harnesses)
- [ ] **Release notes.** n/a: developer harnesses under `scripts/`; no shelter user sees or notices any of it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every "made true by migration N" was read in that migration (0153, 0155, 0162, 0163, 0166, 0168, 0169, 0172, 0174) or traced with `git log -S` (c0dc9826, 1aea1798); every "green" and every "goes red" is a run in this session. The brief's guess that 0170/0171 moved `/contacts` was checked and found wrong (it was 0155)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: scripts only; nothing in this PR is deployed
- [ ] Deployed SHA matches the tested SHA — n/a: scripts only; nothing in this PR is deployed

### On the deployed build

- [ ] Deployed to test — n/a: scripts only; the Worker bundle does not contain `scripts/`
- [ ] Smoke-tested on `test.lannacare.org` — n/a: scripts only
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic changed
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed in the app; the one count changed (`check-role-can` 580 -> 600) follows 0168/0169's two new activities and was shown to fail at the old value
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the per-harness results are summarised; the full outputs are regenerated by running each script
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: scripts only; reverting the merge commit restores the old harnesses, nothing deployed or applied

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | `check-community-dogs-schema` printed `N FAILED` and exited 0, so it could never go red | fixed (sets `process.exitCode`), shown red on a break |
| 2 | Low | Five app functions admit the management enum regardless of cells, so a custom role borrowing management passes them | deferred to backlog (Security) |
| 3 | Low | `APP_ACCESS_ROLES` still lists `staff` | deferred to backlog (note on the role-lists item) |
| 4 | — | 13 harnesses red for reasons that need a decision | deferred to backlog |

## Left for manual verification

None: developer tooling only. Nothing here has a screen a person needs to look at.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-10

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, developer tooling only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR (#509 description, collapsed)
- [ ] Handed to the production release manager — n/a: nothing in this PR is deployed

Result: pass with accepted defects

Release manager acknowledgement: n/a: scripts only, nothing deployed
