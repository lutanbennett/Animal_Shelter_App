# Feature test plan

## Header

| | |
|---|---|
| Feature | `permissions-sweep-medical`: the medical area's guards (archive, the clinic scope, /appointments) moved onto `can()`; the medical manual topics and acceptance rows name an activity |
| Backlog item | `docs/backlog.md` → Auth → **The roles the shelter actually has**, F2, the medical area. Not ticked: a status line names this PR and what is left |
| Branch / worktree | `claude/permissions-sweep-medical` @ `C:\Development\Animal_Shelter_permissions-sweep-medical` |
| Dev server | not started: no signed-in role was available to drive pages (see Left for manual verification) |
| PR | recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | b21dbe42 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: `canArchiveMedical`, `loadVetScope`'s role test and `/appointments`' role test replaced by `can()` / the clinical scope, truth tables captured first; the medical manual topics and matrix rows name an activity
- [x] Files/areas touched listed: `src/lib/medical-archive/kinds.ts`, `src/app/residents/[id]/{archive-actions.ts,[section]/page.tsx}`, `src/components/ArchiveRecordControl.tsx` (comment), `src/lib/vets/scope.ts`, `src/app/appointments/page.tsx`, `src/lib/manual/en.ts` (eight `activity` lines), `scripts/{check-permission-parity.mjs,fixtures/legacy-predicates.json,lib/acceptance-matrix-entries.mjs}`, a decision file and a backlog status line. No `supabase/`, no `worker/`
- [x] Roles affected identified: admin, management, staff (archive, as before) and vet (clinic scope and /appointments, as before). Intended change for any of them: none
- [x] Anything explicitly **out of scope** written down: no policy or migration (0134 is perm-convert-medical's); the blood-test and procedure file routes stay on `assertPhotoWriteAccess`; `/appointments` is not registered and its manual topic is untagged (decision file); contacts, `/vets`, `/management` and `/admin` are `-rest`'s

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date"
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: build exited 0 after 259s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (0134 stays free)
- [ ] `--status` reviewed — n/a: no migration in this PR (0134 stays free)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR (0134 stays free)
- [ ] Applied to **dev** — n/a: no migration in this PR (0134 stays free)
- [ ] File is re-runnable — n/a: no migration in this PR (0134 stays free)
- [ ] Existing rows still read correctly — n/a: no migration in this PR (0134 stays free)
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration; the app's answers are compared with the seeded cells by `scripts/check-permission-parity.mjs` (section 4)
- [ ] Down-migration written — n/a: no migration in this PR (0134 stays free)
- [ ] Production apply plan stated — n/a: no migration in this PR (0134 stays free)

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-permission-parity.mjs` ends `RESULT: GREEN` before the first edit and after the last. Layer 2 compares `canArchiveMedical`'s table (already in `scripts/fixtures/legacy-predicates.json`) and two new fixture rows, `loadVetScope_isVet` and `appointmentsPage`, with the seeded cells (the last two with `scope_clinical = 'own_clinic'` in `0132`)
- [ ] Data persists — n/a: nothing is written by this change; every write is untouched below its guard
- [ ] Create / edit / delete — n/a: nothing is written by this change
- [ ] Empty state renders sensibly — n/a: no new UI surface: behaviour is unchanged by design, and the permission wiring is covered in the role matrix below
- [x] Invalid input is rejected with a readable message, not a crash: every refusal keeps its existing `notAuthorized` wording; `can()` fails closed for no permissions (catalogue check, group C)
- [x] Boundary cases checked: Vet and Volunteer are the roles that must not be offered Archive (parity row `canArchiveMedical`); `/appointments` must stay vet-only although Staff, Management and Volunteer hold `medical.visits` (the scope test and its fixture row); the `appointments-vet` topic is left untagged because its `roles` cannot equal the activity's holders (decision file)

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Archive/Remove on weight, prescription, visit, immunization; not /appointments | all offered; /appointments refused | asserted by script (parity layer 2); pages not driven |
| management | same | same as admin | asserted by script; pages not driven |
| staff | same | same as admin | asserted by script; pages not driven |
| vet | /appointments; vet-visit forms locked to own clinic | no Remove button; /appointments opens | asserted by script (`appointmentsPage`, `loadVetScope_isVet`); pages not driven |
| volunteer | medical pages on a resident, read | no Remove button; /appointments refused | asserted by script; pages not driven |
| signed out | `/appointments` | redirect to `/login` | unchanged: `requirePermission` redirects as `requireRole` did |

- [ ] Every role above tested — n/a: each role's answer is asserted by the parity check from the seeded cells; no role login was available to drive the pages, so the browser pass is under Left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the guards are the same `can()` test in the same places and the actions return the same wording; driving a refusal needs a role login, listed under manual verification

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no menu entry added or changed
- [x] Manual updated: eight medical topics gained an `activity` beside their `roles` tag, and `node scripts/acceptance-matrix.mjs --check` fails if the two disagree; it passes ("68 manual topics → 96 activities"). No manual wording changed
- [ ] Translatable strings — n/a: no new people-facing string; refusals reuse the existing dictionary entries
- [ ] Mobile viewport (375px) — n/a: no new UI surface: behaviour is unchanged by design, and the permission wiring is covered in the role matrix below
- [ ] Browser console clean — n/a: no page was loaded; nothing renders differently
- [ ] Network clean — n/a: no page was loaded; no request added beyond the existing one `my_permissions()` call per request, which is memoised

## 6. Regression

- [x] The pages nearest the change still compile and typecheck: a resident's medical sections (`[section]`), the archive actions, `/appointments`, `/residents` and the vet-visit forms (which call `loadVetScope`) (typecheck and build, section 2)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `loadVetScope` is shared with `/residents` and the vet-visit forms; all typecheck and build, and the parity result is unchanged; no signed-in page was driven
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: the roles item is deliberately not ticked (brief): a status line names this PR and what the other two sweeps still have
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-04-permissions-sweep-medical.md` (two departures from #336's pattern)
- [x] `README.md` still accurate: it names no list this PR removed
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: behaviour is unchanged by design: the same roles reach the same pages and the same refusal wording appears
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions` were measured, not reasoned:** the identical-behaviour claim is the parity check's result; the "manual `roles` equals the seeded holders" claim is the acceptance-matrix check's result, not argued

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic touched
- [ ] Boundary or banding change — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited:** the gates lines are copied from `scripts/gates.mjs`
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration in this PR (0134 stays free)
- [ ] Production dry-run — n/a: no migration in this PR (0134 stays free)
- [ ] Destructive migration backup — n/a: no migration in this PR (0134 stays free)
- [ ] Apply plan stated — n/a: no migration in this PR (0134 stays free)

### Rollback

- [ ] Rollback position stated: revert this PR; nothing in it changes the schema or a policy, so there is nothing a rollback does not cover — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in as **vet**: `/appointments` opens and lists the clinic's visits; a resident's medical pages show no Remove button; Book vet visit offers only own clinic | `/appointments`, a resident's medical sections |
| 2 | Sign in as **staff**: `/appointments` shows the no-access page; Remove / Show removed / Restore work on a weight reading | `/appointments`, a resident's Weight |
| 3 | Sign in as **volunteer**: `/appointments` refused; no Remove button | same |
| 4 | Sign in as **management** or **admin**: Remove and Restore work on all four kinds | a resident's Weight, Prescriptions, Vet appointments, Immunizations |
| 5 | The Manual opens on the reader's own topics for each role; the medical topics show for admin, management, staff and vet only | `/manual` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the role pass is for whoever signs in as each role to tick

Manual verification by: pending: the role pass in the table above, by a person

### Result

- [x] Open defects are either fixed or explicitly accepted above: none found
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened; the file is the record
- [ ] Handed to the production release manager — n/a: handed over at release time, not at PR time

Result: pass

Release manager acknowledgement: n/a: not at PR time
