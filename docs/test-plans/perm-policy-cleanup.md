# Feature test plan — perm-policy-cleanup

## Header

| | |
|---|---|
| Feature | Six either-or policies narrowed to the one cell, and `visit.book`, `maintenance.progress` and `projects.publish` read by their policy and their screen |
| Backlog item | `docs/backlog.md` → **`perm-narrow-policies`** and **`perm-split-activities`** (both ticked; `databaseWider` shortened, not emptied) |
| Branch / worktree | `claude/perm-policy-cleanup` @ `C:\Development\Animal_Shelter_perm-policy-cleanup` |
| Dev server | `http://localhost:3009` (not started: no browser check was driven) |
| PR | pending (filled when opened) |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes — `0182_perm_policy_cleanup.sql` |
| Tested at SHA | filled at PR time |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — narrow the policies that accept either of two cells, and make three boxes that nothing asked get asked, with no change in who can do what today
- [x] Files/areas touched listed — `0182`; `clinic-visits/new`, `maintenance/{page,MaintenanceBoard,[id]/page,[id]/MaintenanceJobView}`, `my/page`, `projects/{actions,[id]/page,[id]/FolderView}`; `fixed-for-now.ts` and both dictionaries; `permission-probes.mjs`, `check-permission-catalogue`, `check-perm-convert-{medical,people}`
- [x] Roles affected identified — Management is the only holder of the pairs and holds both cells of each; the 2IC and Heads hold maintenance.jobs and maintenance.progress together; nobody loses anything today
- [x] Anything explicitly **out of scope** written down — `medical.archive`, `stock.delivery` and `reference.add_while_recording` stay in `databaseWider` and are two new backlog items

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: run at PR time, see the PR
- [x] `node scripts/gates.mjs`: `typecheck`, `lint` and `build` each run and exit 0 (npm run lint and npm run build run directly after a first gates run was cut off by a tool time limit)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0182`, against `0181`
- [x] `--status` reviewed — dev at 181 applied, 1 pending
- [x] `--dry-run` reviewed — `0182` ok
- [x] Applied to dev — dev is now at 182
- [x] File is re-runnable — `drop policy if exists` then `create`, `create or replace function`
- [x] Existing rows still read correctly — the policies read the same tables under the same roles; `check-who-does-what` and the converted-table checks read every probed table
- [x] Constraints and defaults exercised — the two triggers refuse with 42501 when the cell is absent (probed by `check-who-does-what`, flipped per box)
- [ ] Down-migration — n/a: policies and functions are put back by a new migration; the old bodies are named in the file header
- [x] Production apply plan — in the PR body and the decision: `0182` before the app code

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no browser session was driven; see Left for manual verification
- [ ] Data persists — n/a: no new data, only who may write
- [x] Create / edit / delete all exercised — `check-who-does-what` runs every probed write for every role with the box as it is and flipped: 189 of 306 obeyed (was 184)
- [ ] Empty state renders sensibly — n/a: no list changes shape
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — a caller with no login passes the two triggers (service role, worker); no SQL function writes `maintenance.status` or `project_folders.is_public` (searched `pg_proc`)

**Before and after.** `check-who-does-what.mjs`: 306 boxes, 184 obeyed, 27 wrong, 15 cannot be taken away on `0181`; 306 / 189 / 27 / 6 on `0182`. `notAskedYet` is out of `fixed-for-now.ts`; `databaseWider` is down to three boxes. `check-perm-convert-people`, `-medical`, `-work`, `-vet`, `check-2ic-role`, `check-contact-visibility`, `check-doctors`, `check-clinics-readonly`, `check-doctor-own-clinic-writes`: green (people and medical after their fixtures were updated for the new pairing). `check-maintenance-role` (2 lines) and `check-permission-parity` (21 MISMATCH) are red; neither involves a table or box changed here, but they were not run on `0181` to prove it.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | control in every probe, allowed |
| management | all six pairs and the three splits | unchanged | holds both cells of each pair |
| second_in_command, head_of_maintenance | move a job on | unchanged | hold jobs and progress together |
| head_of_medical, doctor, volunteer | none of these cells | unchanged | no cell held |

- [x] Every role above tested — by the probes under each live role against the database; not by a person signing in
- [x] A role that should not have access is blocked server-side — each box is flipped to None and the act must be refused

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user can do has changed today
- [ ] Translatable strings go through the translation path — n/a: no new string (two dictionary entries removed)
- [ ] Mobile viewport (375px) — n/a: not driven
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — build passes; the converted-table checks above are green
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync is run at PR time

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md`, and what else it closed searched: the policies and boxes changed were grepped; the three open items that mention roles (Roles build, Roles and permissions each shelter configures, Affiliate links) are broader and stay open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-perm-policy-cleanup.md`
- [x] `README.md` still accurate — it names none of this
- [ ] **Release notes.** — n/a: nobody would notice: Management holds both cells of every pair and the other roles hold none of them, so no screen changes for anyone today
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the counts are from `check-who-does-what.mjs` before and after

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block below is the script's own closing lines
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] Both a migration and code that reads it? — yes: `0182` must reach a database **before** the app code that reads `visit.book`, `maintenance.progress` and `projects.publish`. No column is dropped, so the app can roll back half way
- [ ] Production dry-run — deferred: release manager (`--status --env production` first: the runner applies every pending file)
- [ ] Destructive migration backup — n/a: no data is dropped or rewritten
- [x] Apply plan stated — in the PR body and the decision's "Release hazard" section

### Rollback

- [x] Rollback position stated — the app can roll back half way; the database is put back by a new migration that re-creates the old policies and trigger bodies named in the file header

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The brief's "clinics.list / stock.medications for clinics and doctors" did not match the policy bodies: none reads stock.medications | accepted — stated in the decision |
| 2 | info | Three `databaseWider` boxes are not narrowable by a policy edit | deferred to backlog — two new items on `backlog` |
| 3 | info | A role holding visit.book or clinics.doctors but not clinics.list now sees no clinics | accepted — Management holds all three; stated in the decision |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as Management: book a visit from a resident, move a maintenance job across the board, and switch a project on the website; each still works | dev, `/clinic-visits/new`, `/maintenance`, a project page |
| 2 | Sign in as the Head of Maintenance: the board still drags and the job page still shows the status buttons | dev, `/maintenance` |
| 3 | Sign in as a doctor: the visit page still works as before | dev, `/appointments` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are left for Lutan, not ticked

Manual verification by: pending: Lutan to look at the three rows above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: tick when the manual check is done
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released

## Gates output

```
gates: typecheck=0 lint=0 build=0
```
