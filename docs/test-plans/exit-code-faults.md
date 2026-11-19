# Feature test plan

## Header

| | |
|---|---|
| Feature | A Node script exiting non-zero after succeeding (`process.exit` after `fetch`, libuv assertion), the rule for reading it, and the build-halt block re-measured |
| Backlog item | `docs/backlog.md` → `#uvcls` |
| Branch / worktree | `claude/exit-code-faults` @ `C:\Development\Animal_Shelter_exit-code-faults` |
| Dev server | not started — no page or route changes |
| PR | filled in once opened |
| Tested by / date | Claude · 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `45ff4c757` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the mechanism is established by a minimal repro, one script is converted to the shared `exitWith`, a reading rule is written, and the build-halt block is rewritten from measurements
- [x] Files/areas touched listed — `scripts/check-shelter-settings.mjs`, `.claude/skills/plan-day/brief-blocks.md`, `docs/backlog.md` (tick), one decision file, this plan. No route, no `worker/`, no migration
- [x] Cards affected identified — none; no grant or denial changes, admin and the signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — the 34 other scripts containing both `fetch(` and `process.exit(` are not converted (listed in the decision file for the planner), and Next is not upgraded

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` — run in this worktree after the sync, output exactly as it printed:

```
=== gates: typecheck exited 0 after 8s
=== gates: lint exited 0 after 137s
=== gates: test exited 0 after 36s
=== gates: build exited 0 after 53s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the converted script only reads
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `check-shelter-settings.mjs` ran 3 of 3 times after conversion, printed its results and exited 0 (it exited 0 on 5 of 5 runs before as well: the crash is intermittent)
- [ ] Data persists — n/a: the script and docs write nothing
- [ ] Create / edit / delete all exercised — n/a: no such feature surface
- [ ] Empty state renders sensibly — n/a: no UI
- [x] Invalid input is rejected with a readable message — `--env bogus` still exits 2
- [x] Boundary cases checked — the minimal repro matrix (fetch/exit combinations, with and without `--env-file`, three runs each) is tabled in the decision file

### Role access matrix

- [ ] Role/card access recorded — n/a: nothing here is reachable by any login; analysed by card, no card's behaviour changes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: not touched
- [ ] Manual updated — n/a: engineering record, not a shelter user task
- [ ] Translatable strings — n/a: no user-visible string
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page near this change
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared runtime file touched; `brief-blocks.md` is read by planner sessions only
- [x] Nothing merged from `main` during `sync` was broken by this branch — the post-sync gates run ended all four at 0

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `#uvcls`, since the mechanism, the stop and the reading rule are done
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-19-exit-code-after-success.md`
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: a script and a planner document; nobody using the app would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Repro runs are tabled; the retry's effectiveness is explicitly recorded as untested because no halt occurred in 4 runs

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: the production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: the production release manager
- [ ] Deployed to test — deferred: the production release manager; nothing here reaches a deployed build
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager; nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change covers both edges** — n/a: no boundary changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block is the run's own lines
- [ ] Public pages re-checked — deferred: the production release manager; no public page changes
- [ ] `deploy: production → Supabase project <ref>` read — deferred: the production release manager
- [ ] `strip-baked-env` seen — deferred: the production release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: reverting removes a doc edit and restores a bare `process.exit` in one script

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 34 scripts contain `fetch(` and `process.exit(` without `lib/exit.mjs` and could hit the libuv assertion | deferred to backlog — for the planner to file |
| 2 | low | The build-halt retry has still never been seen turning a halt into a pass (0 of 4 runs halted) | deferred to backlog — recorded as untested in the block |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | nothing | no screen to look at |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed
- [x] The manual list above is empty, so whoever filled the plan may tick this
- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: no behaviour reaches production

Automated checks by: Claude  Date: 2026-11-19
Manual verification by: n/a: no manual list — nothing served for a person to look at

Result: pass
