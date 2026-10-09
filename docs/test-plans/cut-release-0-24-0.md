# Feature test plan — cut-release-0-24-0

## Header

| | |
|---|---|
| Feature | Cut release `0.24.0`, **major**: move the eight `unreleased` notes into a new register entry, order them for the admin mail, and bump `package.json` to match |
| Backlog item | none — the release-cut step in `docs/release-procedure.md` §4 |
| Branch / worktree | `claude/cut-release-0-24-0` @ `C:\Development\Animal_Shelter_cut-release-0-24-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-10 |
| Carries a migration? | no — but **three** migrations ship in this release and all three are still pending on production. See §3 |
| Tested at SHA | `f1f9b3a6` (`origin/main` at the cut, read from the remote after a fetch; `git merge-base HEAD origin/main` returns the same) plus this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.24.0` entry holding the eight notes written by the release's thirteen PRs (#492–#504), and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **four notes are untagged** (the Clinics rename, tap-an-enclosure, Select all, the quieter facility map) so every signed-in role sees them; **four carry the tags their own PRs wrote**: the Doctor login (`admin`, `doctor`) and three Management ones (`admin`, `management`). `major: true`, so **every admin is mailed**, which §2 asserts rather than assumes
- [x] Anything explicitly **out of scope** written down — (a) the Worker production deploy, Lutan's one job; (b) the release record, its own PR after the deploy; (c) the ten unsigned feature plans, which keep their own `pending:` signatures and are not copied here; (d) the one-row production data correction `0172`'s fold guard demands, which is a release step recorded in §3 and §8, not a change in this diff

**Decided in chat by Lutan, 2026-10-10: `0.24.0`, major.** Asked before cutting
with the argument for each side put to him, as §4 of the runbook requires, and in
one round together with the silent-failure question, the unsigned plans and the
clinic-name decision `0172` refuses to make for itself.

The case for major, which he took: **a role is renamed, a role is removed, and a
menu entry and its pages move.** The Vet login is now the Doctor login, Staff
stops being a role anyone can hold, and Vets is now Clinics — so someone who
knows where the daily work lives will go looking under the old name. The case
against, which he heard: nothing a user does is taken away and every old link
still opens. Same shape as `0.21.0`, `0.22.0` and `0.23.0`, four releases running.

**Risk in this PR is confined to losing or altering a note**, which no gate reads,
hence the mechanical comparison in §2 rather than reading the entry over. The
release's real risk is not in this diff at all: it is `0172`, and it is in
**Defects**.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: nothing to merge. `git fetch origin` then `git merge-base HEAD origin/main` returned `f1f9b3a6`, equal to `origin/main`. Read from the remote, not from a local ref cached earlier
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

```
=== gates: build exited 0 after 279s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — not yet run: the PR is opened by this commit. The run is read and this line completed, with the job names and the SHA, in a follow-up commit before the merge. Not ticked in advance
- [x] `node scripts/check-release-guards.mjs` — exit 0, all fifteen cases, including "a cut release with nothing unreleased passes" and "unreleased notes are a problem"

**The cut was verified mechanically, not read over**, as the runbook requires.
Twenty assertions from one script that exits non-zero on any failure, comparing
the new entry against `origin/main:src/lib/releases.ts` note by note. Its actual
output, unedited:

```
ok   origin/main had 8 unreleased notes
ok   unreleased is now empty
ok   one entry added
ok   newest entry is 0.24.0
ok   previous newest is still 0.23.0
ok   all 36 previous entries byte-identical
ok   8 notes in the new entry
ok   every moved note is a source line, unaltered
ok   every source note used exactly once
ok   indent is 4 + source indent
     got order [0,4,7,2,1,3,5,6], intended [0,4,7,2,1,3,5,6]
ok   order is the intended permutation
ok   role tags changed: 0
ok   text lost 0, invented 0 (2706 chars both sides)
ok   major: true
ok   date 2026-10-10
ok   package.json version is 0.24.0
ok   file order is newest-first by version
ok   no [object Object] or undefined in the entry
ok   no stray conflict markers

All checks passed.
```

and the two the register's own code answers, run against the edited file:

```
majorReleasesSince("0.23.0") -> ["0.24.0"]
latest: 0.24.0 2026-10-10 major: true notes: 8
unreleased length: 0
bad notes: 0
```

Lines were **moved, never retyped** — the script lifts each note's own source
line and re-indents it by four spaces, so the text cannot drift; "text lost 0,
invented 0" is a character count of both sides, not a reading.

**The order was changed at the cut**, as the last three were. The notes left
`unreleased` in whatever order their PRs happened to add them, which put the
facility-map tidy-up and the Doctor login above the two things everyone gets.
A major release is mailed, so the entry is also what every admin reads first.
The permutation is `[0,4,7,2,1,3,5,6]`: the four untagged notes first, headline
first — the Clinics rename, tap an enclosure, Select all, the quieter map — then
the four role-tagged ones.

**No note was given or lost a role tag**, asserted as "role tags changed: 0". A
tag invented at the cut is a change to a note its own PR did not write, and a
wrong tag hides a line from the people it is for.

## 3. Schema and data

This PR carries no migration, so every line below is `n/a`. The section is kept
rather than skipped because **three migrations ship in this release** and one of
them needs a decision and a data correction before it will apply at all.

- [ ] Migration number is one above the highest on `main` — n/a: this PR adds no migration. The three in the release are `0172`, `0173` and `0174`, each numbered by its own PR, and `0174` is the highest on `main`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing in this PR to apply. Reviewed for the release: production `171 applied, 3 pending`; dev `174 applied, 0 pending`, no drift either way
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: as the line above. Reviewed for the release, and it **stopped at `0172`** — see the fold guard below
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration here. Dev already holds all three, applied by their own branches under the schema-first rule, which is why the fold guard never fired there
- [ ] File is re-runnable — n/a: no file in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR changes no data and no schema; it edits two source files
- [ ] Constraints and defaults exercised against real rows — n/a: no constraints or defaults in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The revert for this PR is a git revert of two files. The release's own rollback position is in §8, and it is not symmetrical
- [x] Production apply plan stated for the release manager — **stated here**: `0172`, `0173`, `0174` in one run of `node scripts/apply-migrations.mjs --env production` from the main checkout, **after** this cut is merged and pulled and **before** either deploy, per `0.20.0`'s correction (merge, pull, apply, deploy), and **immediately before** the Pi production build is started, per the mitigation in **Defects**

### `0172`'s fold guard stopped the production dry-run, correctly

`0172` folds `vets.name` and `vets.clinic_name` into one clinic name and
**refuses to choose** when a row has both filled in and they differ. On
production one row does:

```
dry-run 0172_clinics_and_doctors.sql … FAILED
ERROR:  23514: clinics with two different names, agree which to keep before applying:
  e1c1e016-ba43-446a-85b2-cbabc309bd1d: name 'Dr somchai', clinic_name 'Novel'
HINT:  Set name to the one to keep and clinic_name to null on each, then apply again.
```

This is the guard doing its job, not a broken file: dev's rows agreed, so the
file applied there cleanly and nothing in CI could have found this. **Lutan
decided in chat on 2026-10-10: keep `Novel`** — under the new model a clinic is
the place and a doctor is a person, so `Novel` is the clinic and `Dr somchai` is
a doctor who works there. The release steps that follow from it:

1. set that row's `name` to `Novel` and its `clinic_name` to null, on production only;
2. re-run the dry-run on all three files — `0173` and `0174` have **not** been
   dry-run yet, because `0172` stopped the run before they were reached;
3. apply, then start the Pi build in the same breath.

`Dr somchai` is then added as a doctor at Novel so the name is not lost. That is
a data entry, not schema, and it is recorded in the release record.

## 4. Functional checks

- [x] Happy path works end to end — the register is data read by `/releases` and by `worker/release-mail.mjs`; `majorReleasesSince("0.23.0")` returning exactly `["0.24.0"]` is the happy path for the mail, and it is asserted in §2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved by a user. The data is source, and git is its persistence
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete screen exists for the register
- [x] Empty state renders sensibly (no rows yet) — `unreleased` is now empty, which is its correct state after a cut; `/releases` renders from `releases`, which gained an entry rather than losing one
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input. The guard that stands in for this is `check-release-guards.mjs`, which refuses a deploy with notes still in `unreleased` or a `package.json` that disagrees, and it passed
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the file still sorts descending under `compareVersions` against a neighbour dated one day earlier; `latestRelease` resolves to `0.24.0`; the four tagged notes keep their `roles` arrays and the four plain strings have none, which is the shape `noteRoles` expects

### Role access matrix

The role list in this matrix is the one this release leaves behind: Staff is
retired by `0172`/`0173`, and `vet` is renamed `doctor`.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all eight, and is mailed on deploy | pass — tagged notes name `admin`; `majorReleasesSince` asserts the mail |
| management | `/releases` | sees the four untagged and the three Management ones; not the Doctor-login note | pass — tags unchanged from the PRs that wrote them |
| second_in_command | `/releases` | sees the four untagged | pass — untagged notes carry no `roles` |
| head_of_maintenance | `/releases` | sees the four untagged | pass — as above |
| head_of_medical | `/releases` | sees the four untagged | pass — as above |
| doctor | `/releases` | sees the four untagged and the Doctor-login note | pass — that note's `roles` are `admin`, `doctor` |
| volunteer | `/releases` | sees the four untagged | pass — as above |
| signed out | `/releases` | unchanged by this PR | pass — no route or gate touched |

- [x] Every role above tested — tested as the data question it is: four notes are plain strings so `noteRoles` returns undefined for them, and the other four keep byte-identical `roles` arrays, asserted as "role tags changed: 0"
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route and changes no permission. `/releases` keeps the gate it had

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched by this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: `src/lib/manual/` not touched. The release notes are not a manual topic
- [ ] Translatable strings go through the translation path — n/a: release notes are English-only in the register, as every previous entry is
- [ ] Mobile viewport (375px) — n/a: no layout changed. `/releases` already renders longer entries than this one
- [ ] Browser console clean — n/a: no browser check was run; this is a data-only PR, and the build is the check that the file parses
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — `/releases` and `/api/releases/current` both read this file and both are compiled by the build, which passed. The register's 36 previous entries are asserted byte-identical, so nothing older can have changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file was touched. `releases.ts` is read by `/releases`, `/api/releases/current` and `worker/release-mail.mjs`, all three in the build
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in; the branch and `origin/main` were the same commit at the cut

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release cut is not a backlog item. The release's own features ticked theirs in their own PRs
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious in this diff. The note order, the untagged decision and the major call follow rules already written down in `docs/release-procedure.md` §4 and the last three records; the `0172` window and the clinic-name decision are release decisions and go in `docs/releases/2026-10-10.md`
- [x] `README.md` still accurate — unchanged by this PR, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this PR *is* the release notes. It moves the eight lines the release's own PRs wrote out of `unreleased` into the `0.24.0` entry and adds none of its own, so `unreleased` is correctly empty afterwards
- [x] Commit messages say why, not just what — the cut commit records the major call and whose it was, why the order was changed, and the assertion counts
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim in the cut commit is a line of the verification script's output, pasted in §2. The permutation, the character counts and the byte-identical comparison are measurements

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `f1f9b3a6` was `origin/main` at the cut, read after a fetch; `git status -sb` is re-read against the remote immediately before the deploy is handed over, per `0.21.0`'s lesson
- [ ] Deployed SHA matches the tested SHA — deferred: Claude, at the deploy. `deploy.mjs` prints the target project and the short SHA, and both Pi builds are pinned with `--ref`; it goes in the release record

### On the deployed build

- [ ] Deployed to test — deferred: Claude, after the merge. Test gets the same commit as production
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Claude, via `docs/release-smoke-test.md`
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — **this release contains a timezone change and this PR is not it.** `0.24.0`'s dashboard notes move month boundaries to Thai time; that is PR #500's own plan and its own `pending:` signature. In *this* diff nothing derives a time: the entry's date is the literal string `2026-10-10`, displayed rather than computed
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR. The one ordering question, where the new entry sorts, is asserted across the whole file in §2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Every block in §2 and §3 is pasted from the scripts' own output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: Claude, as part of the release verification; the edge-cache check is done in a real browser, not with curl

### Deploy safety

- [ ] `deploy: production → Supabase project` line read and the ref matches production — deferred: Lutan runs the production deploy with `| tee`, Claude reads the log
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: Claude, from the same log
- [ ] Any new secret or env var exists in the production Cloudflare environment — n/a: this PR adds none, and neither does the release

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, it contains neither. **But the release does, and this is the release's one real risk.** `0172` renames four tables, eight columns, a view, a role value and every function body that named them, while the code that reads the new names ships in the same release. The apply must come **before** the deploys — both deploy paths refuse a commit whose database lacks a migration on `main` — and the window between the apply and the Pi serving the new build is a known, measured, accepted defect. See **Defects** 1
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Claude, immediately before the apply, on all three files, **after** the one-row correction in §3. It has been run once and stopped at `0172`'s fold guard, so `0173` and `0174` are not yet dry-run. If the re-run fails on a later file for something an earlier pending file would have provided, that is the per-file `begin … rollback` trap and the correct action is still to apply — read both files before concluding otherwise
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **this applies here.** `0172` is the first rewriting migration in several releases: it renames tables and columns in place and drops `clinics.clinic_name` and `doctors.vet_id`. The fold is `update … set name = clinic_name` only where `name` is empty, so no row's text is discarded except the one Lutan decided on. The nightly backup is the position of record
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in §3: all three in one run, main checkout, after the merge and pull, before either deploy, with the Pi build started in the same breath

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so a code rollback is `./scripts/pi/deploy-pi.sh --ref 7928bd7a`, a rebuild of `0.23.0`. `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and for this release a code-only rollback is worse than useless**: once `0172` is applied, `0.23.0`'s code names columns that no longer exist, so rolling the code back without reversing `0172` would leave production broken in exactly the way the window describes, permanently rather than for three minutes. `0172` carries **no undo recipe** (`0174` does; `0173`'s is to un-archive the role). So the rollback for this release is **forward**: fix and re-deploy. If `0172` itself must come out, that is a hand-written reverse migration and a decision for Lutan, not a deploy-time action

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **Everything to do with vet visits is broken between the production apply of `0172` and the Pi finishing its build** — about three minutes. Live `0.23.0` code names `vet_appointments`, `vets`, `vet_doctors`, `vet_doctor_clinics`, the `vet_appointment_id` column on `prescriptions`, `procedures`, `blood_tests` and `weight`, and `site_content.vet_visit_estimate`. `0172` gives the four tables read-only compatibility views, so simple reads survive, but **every write fails**, every embed through those views fails, and the renamed **columns** have no shim at all. Affected: the visits on a resident, the Vets pages, booking and editing a visit, prescriptions and weights tied to a visit, and the Management dashboard's clinic cards. **Two fail quietly rather than with an error**: `loadVetVisitEstimate` ignores the error and returns null, so the donate page simply stops showing the estimated cost of a vet visit; and the one-weight-per-visit guard reads an empty set, so a visit that already has a reading would offer to take another | **accepted, on Lutan's explicit call of 2026-10-10**, put to him before the cut as its own question with three options — go ahead and keep it short, wait for a quiet hour, or hold on test — and not folded into the count of unsigned plans. He chose to go ahead. Mitigation agreed: apply the three migrations and start the Pi production build in the same breath, so the window is as short as the build allows, and it was early morning Thai time, before the shelter day. The window is measured and the real number goes in the release record, not an estimate |
| 2 | **medium** | **`0172` would not apply to production at all**: its fold guard found one clinic row whose two names differ — `name 'Dr somchai'`, `clinic_name 'Novel'` — and refused, by design, to choose. Dev's rows agreed, so nothing before the production dry-run could have found it | **resolved by decision, 2026-10-10: keep `Novel`.** Put to Lutan with the model's own reasoning (a clinic is a place, a doctor is a person). The row is corrected on production before the apply and `Dr somchai` is then added as a doctor at Novel, both recorded in the release record. The guard is working as intended and is not a defect in the file |
| 3 | low | Ten of the release's thirteen feature plans are `pending:` | **accepted and recorded**, on Lutan's call, after the silent-failure question was asked and answered separately. Each keeps its own `pending:` signature; none is copied here |
| 4 | low | **Eight dev check harnesses no longer start** since the Staff retirement and the doctor rename, so the protections they guard are unwatched rather than failing (`check-doctor-own-clinic-writes`, `check-doctor-resident-scope`, `check-doctor-multi-clinic`, `check-app-access-gate`, `check-perm-convert-photos`, `check-volunteer-narrowing`, `check-perm-convert-vet`, `check-recurring-job-eligibility`) | **already on the backlog** as its own item, found by `close-the-remaining-over-grants` on 2026-10-09. None of the eight runs in CI, so no gate in this release reported green because of it. Named here because the release is what retires Staff, and the record should say which watchers went quiet with it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the mail's first note is the Clinics rename — read in the delivered message, not inferred from the register | The admin mail for `0.24.0`, inbox |
| 2 | That the eight notes read as a shelter user would want them, in this order | `/releases` on production, signed in |
| 3 | That the clinic now reads `Novel` and `Dr somchai` is one of its doctors | Management → Clinics on production, after the deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked; the signature below names what is outstanding

Manual verification by: pending: the three items under Left for manual verification — the mail's first note read in the delivered message, the eight notes on `/releases`, and the corrected clinic with its doctor

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; defects 1 and 2 were put to Lutan before the cut and decided by him

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session)  Date: 2026-10-10
