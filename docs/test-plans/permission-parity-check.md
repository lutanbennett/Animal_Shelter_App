# Feature test plan

## Header

| | |
|---|---|
| Feature | `scripts/check-permission-parity.mjs`: §11's parity check (database, seeded cells, app predicates), plus `scripts/measure-permission-baseline.mjs`, the §10 *before* numbers. Scripts and docs only |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, foundation 2: the parity check (scripts only)**, and the roles item's status line. **Neither ticked**: layer 3 (the routes) is not built, because the route registry it needs does not exist yet |
| Branch / worktree | `claude/permission-parity-check` @ `C:\Development\Animal_Shelter_permission-parity-check` |
| Dev server | not started: this change ships no runtime code |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-03 |
| Carries a migration? | no (`0133` stays free) |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `7c3831a8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a dev-only script proves that the seeded default cells reproduce what the database and the app's predicates do today, with known tightenings listed and anything else a failure. Layers 1 and 2 of §11; layer 3 is not built (decision file)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `scripts/check-permission-parity.mjs`, `scripts/lib/permission-probes.mjs`, `scripts/measure-permission-baseline.mjs`, `scripts/fixtures/legacy-predicates.json`, `docs/decisions/2026-10-03-permission-parity-check.md`, `docs/backlog.md` (status line), this plan. Nothing under `src/`, `worker/` or `supabase/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: none. Every probe runs in a rolled-back transaction as fixture logins that are created and discarded inside it
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: layer 3 (needs the route registry); moving the probes into the catalogue file (follow-up, owned by `permissions-catalogue`); wiring into CI (needs dev credentials); closing any tightening or any of the four new findings (`perm-convert-*`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines pasted below, as printed:

  ```
  === gates: build exited 0 after 169s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration. The scripts are re-runnable by construction: each ends in a rollback and the script ran many times on this branch
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: nothing is written to dev; probes read real dev data (the first medication, type and enclosure rows) and write only inside rolled-back sub-transactions
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: this is the harness. `node scripts/check-permission-parity.mjs`, against the live dev schema and policies, exit 0. Asserted: **(layer 1)** 245 probe runs across 8 principals (the six roles, a login with no role, an archived person) = 1,960 answers: 1,916 match, 44 are known tightenings, 0 mismatches, 0 harness faults; 110 of the runs read `has_permission()` and so check the seeded cells themselves; every probe is also run as Admin and must be allowed; **(Z)** no role, an archived person, an archived role, an unknown activity and a missing cell answer no for every activity at both levels, with a positive control; **(layer 2)** nine predicates x seven roles incl. no role = 63 answers equal the default cell. Output, unedited:

  ```
  == Layer 1: the database ==
  (110 of the probes read has_permission() itself, the seeded cells; the rest exercise tables and functions)
  245 probe runs across 8 principals (1960 answers)
    MATCH             1916
    KNOWN TIGHTENING  44
    MISMATCH          0
    HARNESS FAULT     0

  Known tightenings (§3 C, expected, closed by L8 as the table converts):
    C1: management, staff — facility.enclosures edit
    N1: staff, vet — stock.medications read
    C2: management, staff — resident.record edit
    N2: staff — stock.diets read
    N3: staff, volunteer — friends.manage read
    C3: vet — reference.types edit
    C4: vet — medical.visits edit (in scope); medical.procedures edit (in scope); medical.blood_tests edit (in scope); medical.prescriptions edit (in scope); medical.immunizations edit (in scope)
    N4: vet — medical.archive edit
    C5: management, staff, vet — medical.weight edit (in scope); medical.weight edit (out of scope)
    C6: staff — contacts.directory edit
    C7: staff, vet — clinics.doctors edit
    C9: volunteer — stock.delivery read; stock.medications read; stock.diets read
    C10: vet — facility.enclosures read; clinics.list read; friends.manage read; stock.diets read
    C11: vet — recurring.do_own edit

  == Layer 2: the app's predicates ==
  63 answers (9 predicates x 7 roles incl. no role)

  RESULT: GREEN (matches and listed tightenings only)
  ```

  **The deliberate failures** (the check must be able to fail; a check nobody has seen fail is not known to check anything):

  1. `PARITY_FLIP=volunteer:stock.delivery:2` (the expectation flipped, so the database now disagrees with it). Exit 1:

     ```
       MATCH             1913
       KNOWN TIGHTENING  43
       MISMATCH          4
     MISMATCHES:
       [MISMATCH] stock.delivery edit: insert into stock_receipts (item_kind, medication_id, quantity) values ('medicat
           volunteer: the default says ALLOWED, the database REFUSES
       [STALE] stock.delivery read: select 1 from stock_receipts where id = $RECEIPT
           C9 lists volunteer as allowed beyond the default, but the database now matches the default. Remove the entry
       [MISMATCH] stock.delivery read: select 1 where has_permission('stock.delivery', 'read')
           volunteer: the default says ALLOWED, the database REFUSES
       [MISMATCH] stock.delivery edit: select 1 where has_permission('stock.delivery', 'edit')
           volunteer: the default says ALLOWED, the database REFUSES
     RESULT: RED
     ```

     It shows both rules of §11 at once: a difference that is not in the list goes red, and a listed tightening that no longer differs (C9 for volunteer, once the default allows the read) goes red as STALE.
  2. `PARITY_FLIP_DB=vet:medical.weight:0` (a **seeded cell** edited inside the transaction, `role_permissions` row deleted). Exit 1, 2 mismatches, both from `has_permission()`:

     ```
     MISMATCHES:
       [MISMATCH] medical.weight read: select 1 where has_permission('medical.weight', 'read')
           vet: the default says ALLOWED, the database REFUSES
       [MISMATCH] medical.weight edit: select 1 where has_permission('medical.weight', 'edit')
           vet: the default says ALLOWED, the database REFUSES
     RESULT: RED
     ```

     Worth reading: the *table* probes for weight did **not** move, because no policy reads the cells yet. That is why the check reads `has_permission()` as well as the tables, and why, after a conversion, the same flip will go red in both places.
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; to remove this, delete the three scripts and the fixture
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration, and nothing here runs against production (every script refuses any project but dev)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the scripts' happy path is the green run in section 3
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, and the scripts persist nothing by design
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface; insert, update and delete are each probed at the SQL level
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface; a login with no role is a principal in every probe
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; a probe naming an unknown fixture, an unknown activity, or a `PARITY_FLIP` for a missing activity stops with a sentence
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no free-text inputs; the boundaries that matter are both sides of every cell (level 1 versus 2, in scope versus out of scope), covered by the probes and the flips above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no route or policy changed | no change | allowed by every probe (a refusal is reported as a harness fault) |
| management | n/a: no route or policy changed | no change | matches the default cell, plus C1, C2, C5 as known |
| staff | n/a: no route or policy changed | no change | matches the default cell, plus C1, C2, C5, C6, C7, N1 to N3 as known |
| vet | n/a: no route or policy changed | no change | matches, plus C3, C4, C5, C7, C10, C11, N1, N4 as known |
| volunteer | n/a: no route or policy changed | no change | matches, plus C9, N3 as known |
| signed out | n/a: no route or policy changed | no change | `anon` is a probe principal for the section Z harness only; every answer no |

- [ ] Every role above tested — n/a: nothing a role passes through changed; each role's own login is exercised by the check itself
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route added

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing visible; the manual changes when a screen does
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no page can be affected; nothing under `src/` changed
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): **deliberately not ticked**, as the brief says; a status line records that layers 1 and 2 are in and layer 3 is outstanding
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-03-permission-parity-check.md`
- [x] `README.md` still accurate: it does not list the check scripts
- [ ] **Release notes.** n/a: by design nobody would notice. Scripts and documents only; no screen, route, policy or function changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The match, tightening and mismatch counts, the two deliberate failures and the baseline timings are tool output. Reasoned and worded so in the decision file: that C9/C10 are about columns (the probe reads a price column as a row-level proxy), and that staff costs about twice a volunteer in the baseline (cause not investigated)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (nothing to deploy: scripts and docs only)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band in shipped code; the boundary the check itself polices (read versus edit, in scope versus out) is asserted from both sides for every probed activity
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The green run and both failing runs are pasted from the runs' own output; blank lines and the progress counter were trimmed and the long `C4` and `C9` lines are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page can change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — nothing deployed and nothing applied; reverting the merge commit removes the scripts. It does not matter to any running system

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, a finding, not a defect of this change | **N4**: a vet can archive a weight, prescription, immunization or visit directly (`update … set archived_at`), though the screens do not offer it. `kinds.ts` already records why the screens withhold it | deferred: `perm-convert-*` (listed as known `N4`) |
| 2 | Low | **N1, N2, N3**: staff and vet read medication prices, staff read diet prices, and staff and volunteer read `shelter_friends`, all wider than the default cells | deferred: `perm-convert-*` (listed as known) |
| 3 | Process | Layer 3 of §11 (the routes) is not built: there is no route registry to read | deferred: the catalogue/`can()` stream, which owns the registry |
| 4 | Process | The probes are in `scripts/lib/permission-probes.mjs`, not the catalogue file, because that file was not on `main`; five of the probe kinds do not fit the catalogue's agreed shape (reads on Yes/No activities, `scoped`, `expect`, `known`, `byRole`) | deferred: `permissions-catalogue`, who own the field (message sent) |

## Left for manual verification

Nothing in this change has a surface a person needs to look at. One decision is Lutan's, not a check: whether N1 to N4 are accepted or become backlog items (the decision file lists them).

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty

Manual verification by: n/a: no UI surface; the scripts and documents change nothing a person looks at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
