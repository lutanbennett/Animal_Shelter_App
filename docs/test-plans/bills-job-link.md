# Feature test plan — bills-job-link

## Header

| | |
|---|---|
| Feature | Bills attaches a bill to a job through `maintenance_job_picker`, under its own activity `maintenance.job_picker`, without the job board |
| Backlog item | `#n9z65` (ticked) |
| Branch / worktree | `claude/bills-job-link` @ `C:\Development\Animal_Shelter_bills-job-link` |
| Dev server | `http://localhost:3001` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-11 |
| Carries a migration? | yes — `0355_maintenance_job_picker_view.sql` |
| Tested at SHA | `2a1b55c7` |

## 1. Scope and risk

- [x] One sentence: the Bills card lists jobs through a narrow view and no longer reads the whole job table
- [x] Files: migration 0355, `cards.ts`, `catalogue.ts`, `bills/page.tsx`, i18n labels, manual topic split, acceptance matrix, decision file, this plan
- [x] Roles affected: the Bills card loses `maintenance.jobs` read and gains `maintenance.job_picker`
- [x] Out of scope: the board and everything that asks `maintenance.jobs`; `maintenance_select_perm` is NOT widened

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` — `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number one above `main`'s highest (`0354`)
- [x] `--status` reviewed: 1 pending
- [x] `--dry-run` reviewed: ok (after moving the activity's sort to the free 89)
- [x] Applied to dev: `applying 0355 … ok`
- [x] Re-runnable: on conflict, create or replace view, delete where
- [x] Existing rows unaffected: additive; one card grant swapped
- [x] Constraints exercised: n/a: no new constraint
- [x] Down-migration: not needed; to undo regrant maintenance.jobs read to bills
- [x] Production apply plan: with the next release, after the earlier pending files
- [x] `check-hard-coded-security` clean, `check-card-grants`, `check-cards-count` (56), `check-ungranted-activities` (no new gap), `check-permission-catalogue` ok

## 4. Functional checks

- [x] Happy path: a login holding only the `bills` card (dev-signin --cards bills) opened Home then Bills; the page rendered
- [x] Data persists: n/a: nothing written
- [ ] Create / edit / delete: n/a: the attach press was not driven, no bill was waiting on dev; its policy is unchanged
- [x] Empty state: the Bills page renders its "nothing waiting" state
- [ ] Invalid input: n/a: no input changed
- [ ] Boundary cases: n/a: none

### Role access matrix

| Login | Can reach | Expected | Result |
|---|---|---|---|
| `bills` card only | job picker view | 5 columns of jobs | driven as that login: view returned a row |
| `bills` card only | `maintenance` table | refused | 0 rows |
| `bills` card only | job board link | none | Home menu has Bills only |
| signed out | the view | nothing | n/a: no anon grant |

- [x] Every row above tested
- [x] Blocked server-side: the table's policy still asks maintenance.jobs

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated — board topic split (read vs edit)
- [x] Translatable strings — activity label added in en and th dictionaries
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not inspected
- [ ] Network clean — n/a: server-side reads

## 6. Regression

- [x] The nearest pages work: Home and Bills loaded
- [ ] Shared file touched checked elsewhere — n/a: no shared file
- [x] Nothing merged from main was broken: sync was a no-op

## 7. Documentation

- [x] Backlog item ticked (`#n9z65`)
- [x] Decision file `2026-11-11-bills-job-link.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: 0355 is pending on production behind earlier files, so the change is inert there until they apply
- [x] Commit messages say why
- [x] Claims measured: the proof was run as the one-card login

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: nothing pasted beyond the gates line
- [ ] Public pages re-checked — n/a: public site reads none of this
- [ ] Production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [x] Migration and its reader in one PR: yes
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive
- [x] Apply plan stated
- [x] Rollback: regrant the activity; the view can stay

## Defects found

| # | Severity | What | Status |
|---|---|---|---|

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With a bill waiting, the job picker fills and Match completes | /bills as a Bills-card login |

## Sign-off

- [x] Everything verifiable without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-11

- [ ] The manual list above is empty — n/a: one item is left for a person, see the table above

Manual verification by: pending: the attach press with a waiting bill

- [x] Open defects fixed or accepted
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
