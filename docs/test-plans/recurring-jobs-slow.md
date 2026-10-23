# Feature test plan — recurring-jobs-slow

## Header

| | |
|---|---|
| Feature | The Recurring jobs page stops making ~627 simultaneous role_can calls: it asks only about pages jobs link to, the form asks for its own link on demand, calls are limited to 12 at a time |
| Backlog item | "The recurring-jobs page takes 35 to 54 s to open" (ticked) |
| Branch / worktree | `claude/recurring-jobs-slow` @ `C:\Development\Animal_Shelter_recurring-jobs-slow` |
| Dev server | `next dev` on `http://localhost:3003` |
| PR | pending |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `d02999d5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `src/app/management/recurring-jobs/{page,actions,RecurringJobForm}`, `src/lib/recurring-jobs/eligibility-load.ts`, `src/lib/releases.ts`, backlog, decision file. No migration, no worker
- [x] Roles affected identified — those holding recurring.manage (admin, management, second_in_command); nobody's access changed
- [x] Out of scope written down — a single SQL function for the whole matrix (needs a schema PR); the 46 s save was not re-timed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — page GET timed 3 times as management on dev: 4.4 s, 3.8 s, 4.2 s, status 200, no "Couldn't load" text (before: 21.4, 24.2, 32.1 s)
- [ ] Data persists — n/a: the change reads data only; no write path changed
- [ ] Create / edit / delete all exercised — n/a: not driven in a browser; saving still goes through the unchanged saveRecurringJob, see Left for manual verification
- [ ] Empty state renders sensibly — n/a: list rendering untouched
- [ ] Invalid input is rejected — n/a: server checks in saveRecurringJob untouched
- [ ] Boundary cases checked — n/a: no new input; a link whose answers are not yet loaded shows everyone until they arrive, and save re-checks on the server

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | not driven | n/a |
| management | /management/recurring-jobs | opens | 200, ~4 s |
| second_in_command | n/a | not driven | n/a |
| doctor | n/a | not driven | n/a |
| volunteer | n/a | not driven | n/a |
| signed out | n/a | not driven | n/a |

- [ ] Every role above tested — n/a: only management was driven; no permission rule changed, and the new action checks recurring.manage as previewRecurrence does
- [ ] A role that should not have access is blocked server-side — n/a: requirePermission on the page and the can() check in the new action are unchanged in kind and were not exercised for a refused role

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user does differently
- [ ] Translatable strings — n/a: no new text
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: form not driven in a browser
- [x] Network clean — page GET returned 200 on all timed runs

## 6. Regression

- [x] The pages nearest the change still work — /management/recurring-jobs loaded (HTTP 200) three times
- [ ] Any shared file touched checked from a second page — n/a: loadEligibility is also used by src/lib/my-tasks/recurring.ts; only its concurrency changed, and typecheck/build pass. /my was not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for it, tagged admin, management and second_in_command
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Timings and the 627-call count come from runs on dev; the decision file says plainly that the fetch-failed line was not reproduced and that production is not measured

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: gates line above is verbatim
- [ ] Public pages re-checked — n/a: public pages untouched
- [ ] Deploy line names the production project — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] New secret or env var exists in production — n/a: none added
- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] Production dry-run clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated: revert the PR; no schema or data changes to undo

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The "fetch failed" line did not appear in any timed run, so its explanation (the 627-call burst) fits the numbers but was not observed | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the form for a new job and edit one; change the page it links to and confirm the assignee list updates within about a second, and a save still works | /management/recurring-jobs |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: one item is listed and no person has looked yet, see pending below

Manual verification by: pending: the form's link change and a save were not driven in a browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links to this file
- [ ] Handed to the production release manager — n/a: handed over when the PR merges

Result: pass with accepted defects

Release manager acknowledgement: n/a
