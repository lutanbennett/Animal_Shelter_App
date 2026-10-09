# Feature test plan — vet-to-doctor-rename-schema

## Header

| | |
|---|---|
| Feature | Schema half of "Clinics and doctors: remove the word Vet": rename the vet tables, columns, role and functions to clinics and doctors, and widen what a doctor login reads |
| Backlog item | `docs/backlog.md` → **Clinics and doctors: remove the word "Vet" from the system** (ticked by the app PR that follows) |
| Branch / worktree | `claude/vet-to-doctor-rename-schema` @ `C:\Development\Animal_Shelter_vet-to-doctor-rename-schema` |
| Dev server | not started — this PR changes no app code; the app rename is the next PR, `claude/vet-to-doctor-rename` |
| PR | opened from this commit |
| Tested by / date | Claude / 2026-10-09 |
| Carries a migration? | yes — `0172_clinics_and_doctors.sql` |
| Tested at SHA | `146b7925` (origin/main) plus this branch's files |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the rename the item specifies (`vets`→`clinics`, `vet_doctors`→`doctors`, `vet_doctor_clinics`→`doctor_clinics`, `vet_appointments`→`clinic_visits`, `vet_id`→`clinic_id`, `vet_doctors.vet_id` dropped, role `vet`→`doctor`, functions and views renamed, compatibility views for one release), plus Lutan's 2026-10-09 answer to the item's open question: a doctor login reads option (c), the union, and writes stay clinic-scoped
- [x] Files/areas touched listed — `supabase/migrations/0172_clinics_and_doctors.sql`; `scripts/check-doctor-resident-scope.mjs` (replaces `check-vet-resident-scope.mjs`); `docs/decisions/2026-10-09-clinics-and-doctors.md`; this plan
- [x] Roles affected identified — doctor (was vet): reads widen to its own patients at clinics it has left; writes unchanged. Admin, management, staff, volunteer, public viewer: no access change, asserted. Everyone: `has_app_access()` rewritten, asserted true for every app role
- [x] Anything explicitly **out of scope** written down — every screen, dictionary, manual line and the releases line are the next PR; a cross-clinic Doctors list for staff (Lutan: not now)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — this branch was created from `origin/main` `146b7925` by `worktree.mjs new`; nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the redirected output file:

```
=== gates: build exited 0 after 163s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0172` against highest `0171`; the brief gives this stream `0172`, and the hook's `check-migration-numbers` said ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 171 applied, `0172` the only pending, no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run **stopped on the fold guard** (two dev clinics with two different names, both disposable test rows); their `clinic_name` was cleared by hand, then the dry run surfaced a trigger ordering fault (the `doctors.vet_id` back-fill fired a trigger whose body was not yet rewritten), fixed by moving that step after the function rewrites; then `ok`. `check-migration-grants` ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — on Lutan's go in chat, 2026-10-09: `applying 0172_clinics_and_doctors.sql … ok`
- [x] File is re-runnable — `check-doctor-resident-scope.mjs` ran the whole file **twice** in one transaction before asserting (while pending), and passed
- [x] Existing rows still read correctly after the change — the harness reads 99 live residents as admin, management, staff and the service role, and the four compatibility views return live rows; the five rebuilt views come from their own live `pg_get_viewdef` with only the function name changed
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `check-doctor-resident-scope.mjs`, run pending (replayed twice) and again live after the apply. Asserted: **N** no function body (public, private) or view names a renamed object or the `'vet'` role, and no table, column, index, constraint, trigger, policy, policy expression, enum value or role key says vet except the four compatibility views; **A** a doctor login reads exactly 5 harness residents (no doctor recorded, a colleague's patient, cancelled-only, two clinics, its own patient at a clinic it has left) through the table and both views; **B** none of the other two by id; **C** 0 of another clinic's rows from 11 tables and views, both visits of the two-clinic resident, the left-clinic patient's visit, prescription and weight; **D** for the left-clinic patient and the other clinic's: weight insert, visit booking, visit and weight update, attachment and microchip all refused; for its own clinic's: weight, booking and attachment allowed; **E** a doctor login with no doctor record reads nothing; **F** admin, management, staff and the service role read all 99, a volunteer none; **G** none of the other clinic's translations; **H** `has_app_access()` true for doctor, admin, management, staff and volunteer; **I** a doctor name typed on a visit lists a doctor at that clinic and links the visit (the trigger lost the `vet_id` insert trigger it relied on); **J** `schedule_bulk_appointments(p_clinic_id …)` books 2, `vets` reads and refuses an insert, `vet_appointments` keeps the table's row filter. Result: `HARNESS-OK … asserted live on dev`
- [x] Down-migration written, or the reason one is not needed is stated — not written. The rename is reversible by the same statements backwards, but nothing would run old code against it: the app PR merges straight after, and the compatibility views cover outside readers for one release. If the app PR were abandoned, a down-migration is needed before anything else ships (CLAUDE.md)
- [x] Production apply plan stated for the release manager — `0172` on `dbkodyyxxhtygxcxmfcu` **immediately before** the deploy of the release that carries the app PR, never with a release that lacks it. Its `--dry-run` there first: it stops if a production clinic has two different names, and that row is Lutan's call

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no app code in this PR; the database paths are asserted in §3, the screens in the next PR's plan
- [ ] Data persists — n/a: no UI surface in this PR; writes and read-backs are in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, update and refusals in §3 (D, I, J)
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the fold guard's message names each clinic and says what to do
- [ ] Boundary cases checked — n/a: no UI surface; the scope boundaries (left clinic, no doctor, colleague, no doctor record) are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every resident and clinical row | unchanged | all 99 residents read (F); bulk booking works (J) |
| management | every resident and clinical row | unchanged | all 99 read (F) |
| staff | every resident and clinical row | unchanged | all 99 read (F) |
| doctor (was vet) | its clinics' residents plus its own patients anywhere; writes at its current clinics | widened reads, writes unchanged | A–E above |
| volunteer | no residents (0134) | unchanged | 0 read (F) |
| signed out | nothing | nothing | n/a — no grant to anon added; new functions revoked from anon, `check-migration-grants` ok |

- [x] Every role above tested — by the harness, each under its own JWT
- [x] A role that should not have access is blocked server-side — D and E: the refusals are RLS, under the doctor login's JWT

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface in this PR
- [ ] Manual updated — n/a: the next PR's
- [ ] Translatable strings go through the translation path — n/a: none; `translatable_labels`' clinic name row moved from `vets` to `clinics` with the table
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — n/a for pages: `main`'s code reads the old names, so **on dev, until the app PR merges, the vet pages can read through the read-only compatibility views but not save**. Lutan accepted that window in chat before the apply. The database paths are covered by §3
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — created from `146b7925`; gates ran on it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: ticked by the app PR, which finishes the item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-clinics-and-doctors.md`: the model, the fold guard, `has_app_access()`, the audit and cascade keys, and why the doctor login's scope is the union with writes left where they were
- [x] `README.md` still accurate — it names no vet table or role
- [ ] **Release notes.** — n/a: nobody sees a difference until the app PR, which carries the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the object lists came from `pg_class`, `pg_proc`, `pg_policies`, `pg_depend` and `pg_get_viewdef` on dev; the `has_app_access()` failure from its live body; every behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff; the scope cases are in §3
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no, by design: the app PR that reads it follows straight after, and must ship in the **same release**. `0172` goes on production immediately before that deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. It stops on any production clinic with two different names; that row goes to Lutan
- [ ] For a **destructive or rewriting** migration only: a production backup exists — deferred: release manager. It drops `vets.clinic_name` and `vet_doctors.vet_id`, so this gate applies
- [x] Apply plan stated — `0172` on production immediately before deploying the release carrying the app PR

### Rollback

- [x] Rollback position stated — a code rollback (Pi `--ref`) does **not** revert `0172`, and older code reads the old names: only through the read-only compatibility views, so it could show clinics and visits but not save them. Rolling back past this release therefore needs a down-migration (the renames reversed, `clinic_name` and `vet_id` re-added empty). Not written; say so before relying on a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `private.has_app_access()` named `'vet'` in its body; after the enum rename it would raise for every signed-in caller | fixed in `0172`; asserted by H |
| 2 | medium | The five read views carried the clinic test; left alone a doctor would see a resident whose state, placement and vaccinations came back empty | fixed in `0172`; asserted by A |
| 3 | low | The `doctors.vet_id` back-fill fired a trigger before its body was rewritten (dry run) | fixed: moved after section 5 |
| 4 | info | Two dev test clinics had two different names | cleared by hand on dev (disposable rows); the guard stays for production |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface in this PR; the screens are the app PR's | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface in this PR

Manual verification by: n/a: no UI surface in this PR; the app PR carries the screens

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
