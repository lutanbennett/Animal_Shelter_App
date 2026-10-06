# Feature test plan

## Header

| | |
|---|---|
| Feature | `0148_perm_convert_stock_and_lists.sql`: `medication`, `diet_types`, `frequency`, `procedure_types`, `blood_test_types` and `immunization_types` stop naming roles and ask `(select has_permission(…))`; `frequency_select_perm` gains `reference.types` Read |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, foundation 3**: **not ticked** (`-settings`, `-work` and the photo split remain); its status line is extended |
| Branch / worktree | `claude/perm-convert-stock-and-lists` @ `C:\Development\Animal_Shelter_perm-convert-stock-and-lists` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` (driven in the browser pane for a staff and a management account) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-06 |
| Carries a migration? | yes: `0148_perm_convert_stock_and_lists.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, level with `origin/main` @ `b3242cc1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the 18 role-named policies on six lookup tables are replaced by one policy per command that asks `has_permission()`, with the two price tables reading through lookup cells that management and staff hold and the volunteer-floor roles do not
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0148_perm_convert_stock_and_lists.sql`; `scripts/check-perm-convert-stock-and-lists.mjs` (new); `scripts/check-policy-role-names.mjs` (six tables off `OWNERS`); `docs/roles-and-permissions.md` (§15); `docs/decisions/2026-10-06-perm-convert-stock-and-lists.md`; `docs/backlog.md`. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **management** and **staff** keep every right the screens use; management loses only a hand-built update and delete of a frequency; **admin** unchanged; **vet** unchanged (its own `vet_*` policies untouched); **volunteer** and no role unchanged (refused); **a volunteer-floor role holding the 2IC's draft cells** reads the four type lists (names, and `immunization_types.cost`) and neither price table; signed-out public has no grant
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the other conversions (`-settings`, `-work`, the photo split), the vet and admin policies, the prescription-schedule redesign, a price-free picker view (backlog), `src/`, production

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 308s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `check-migration-numbers.mjs` reports `ok — 0148_perm_convert_stock_and_lists.sql (against origin/main b3242cc1, highest 0147_perm_convert_people.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `147 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0148_perm_convert_stock_and_lists.sql … ok`, the only pending file (the first version of the file)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0148_perm_convert_stock_and_lists.sql … ok`. **The file was then changed once** (`frequency_select_perm` re-created with `reference.types` Read) and its SQL re-run against dev from the file, so dev holds the final file; the `schema_migrations` row is for the same filename and no other hand-written SQL was posted
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): every `_perm` policy and the role-named ones are dropped from `pg_policies` by name before the `create policy`s; replayed once in practice, harness green after
- [x] Existing rows still read correctly after the change (checked against real dev data): `check-permission-parity.mjs` reads dev's real rows; the browser showed 25 medication rows and 3 diet rows for management, and 26 medicines, 11 frequencies and 13 procedure types in staff's pickers
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-perm-convert-stock-and-lists.mjs`. Asserted, for six tables, read / update / insert / delete under each login's own JWT: admin, management, staff, volunteer, a vet, no role, and fourteen configured roles (no cell; `stock.medications` Read and Edit; the add cell alone; `stock.diets` Read and Edit; `resident.register` alone; `reference.types` Read and Edit; four medical Read cells alone; one on the volunteer floor holding the 2IC's cells). Plus sweeps (no policy names management or staff; `has_permission()` wrapped in `select`; neither price table asks a `medical.*` cell; 24 `_perm` policies). Output, as printed:

  ```
  484 checks held, 0 failed.
  RESULT: GREEN (each table answers as its cell says; the volunteer-floor medical role reads no price table; the vet is unchanged)
  ```

  Not shown red against the unconverted tables (the policies it asserts did not exist before the apply). Its first run did disagree with my own expectation on four cases, which is how the 2IC's read of `immunization_types.cost` was found
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: reversible by the file's own header (drop the `_perm` policies, re-create the dropped ones from `0001`, `0027`, `0031`, `0043`, `0050`, `0051` and `frequency_select_perm` from `0136`); no data changes
- [x] Production apply plan stated for the release manager (which file, which project, when): `0148_perm_convert_stock_and_lists.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. `-- consumer: none`: no ordering constraint against a deploy. Production check: a staff login opens the prescription form and the medicine and frequency pickers fill; management opens Medications and Diets

## 4. Functional checks

- [x] Happy path works end to end: management signed in on dev opened Management → Medications (25 rows) and Diets (3 rows); staff opened the prescription form (26 medicines, 11 frequencies), the procedure form (13 procedure types) and `/residents/new`; no server errors in the dev log
- [ ] Data persists — reload the page and the change is still there — n/a: no write was driven in the browser; persistence of writes is asserted by the harness (each update probe matches a row)
- [x] Create / edit / delete all exercised (whichever the feature has): insert, update and delete under each table's cell, and refused without it, on all six tables (harness)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs; a refused write is a 42501 or zero rows, which the app's existing "not allowed" paths handle
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): the boundaries are the cell from both sides: Read versus Edit, the add cell alone (insert and read back, not update), the price cells versus the prescription cells on the volunteer floor, and `reference.types` Read versus Edit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all six tables | no change | allowed every command |
| management | all six tables | no change, but no hand-built update or delete of a frequency | as listed; Medications and Diets pages loaded in the browser |
| staff | reads all six, inserts medication, frequency, procedure types | no change | as listed; pickers filled in the browser; Management → Medications refused as before |
| vet | its own `vet_*` policies | no change | as listed (untouched) |
| volunteer | none of the six | no change | refused every command (harness) |
| signed out | nothing | no change | no grant to `anon` on these tables (unchanged) |

- [x] Every role above tested: admin, management, staff, volunteer, vet by the harness under their own JWTs; staff and management also in the browser; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): staff requesting `/management/medications` directly lands on "You don't have access to this page"; the table refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a reader of the manual could see changed
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no page touched, so `check-phone-width.mjs` was not run
- [x] Browser console clean: the dev log had no server errors during the staff and management sessions; the browser console was not separately read
- [ ] Network clean — n/a: no UI change, no request inspected

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): as management `/management/medications` and `/management/diets`; as staff `/prescriptions/new`, `/procedures/new`, `/residents/new`, and `/management/medications` (refused). Database paths re-run after the last apply: `check-perm-convert-stock-and-lists` (484 held), `check-perm-convert-medical` (241 held), `check-purchasing`, `check-medication-pick`, `check-medication-list-due` (27 of 27), `check-role-write-policies`, `check-policy-role-names` (GREEN, 10 tables remain), `check-permission-catalogue` (all ok). **Parity: before 1,907 match / 26 known / 27 mismatch, after 1,907 / 26 / 27**, the same 27 mismatch lines. **Not green, and not caused by this change:** `check-permission-parity` (the 27), `check-permission-tables` (`A cells vet`), `check-2ic-role` (3), `check-volunteer-narrowing` (5 lines, all recurring jobs), `check-medical-role` and `check-perm-convert-orphans` (the draft's changes to the Head of Medical's and the vet's cells; one line names `frequency` and is the draft removing her `medical.prescriptions`), all the Director's draft loaded on dev (`#380`). `check-safety-stock` and `check-medication-label` fail on dev's data and a view's text, not on a policy
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): foundation 3 **not** ticked, as the brief says; its status line extended. Follow-ups are on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-06-perm-convert-stock-and-lists.md`
- [x] `README.md` still accurate: it does not describe the role model
- [ ] **Release notes.** n/a: nobody would notice: `src/` is untouched, what staff and management see on every page above is unchanged, and the one right removed is management's hand-built update and delete of a frequency, which no screen offers

- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The counts (484 checks; 1,907 / 26 / 27 both ways; 10 tables remaining) are the scripts' output. Reasoned and worded as reasoning: that the 2IC would read the immunization cost if the draft stands (the harness shows it for a role holding her cells)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already applied to the dev database `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Read versus Edit, cell versus no cell on the same floor, the price cells versus the prescription cells
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`, `/friends`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or table policy for `anon` changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: nothing in `src/` changed; the existing pages read the same tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no row is touched; policies only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. To undo: drop the `_perm` policies and re-create those named in the migration header. It does not restore anything a role has since been given a cell for and relies on through these policies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low, found by this work | A role holding `reference.types` Edit and not `medical.prescriptions` could not update a frequency (the row was invisible to it) | fixed in this PR: `frequency_select_perm` also answers `reference.types` Read |
| 2 | Medium | The 2IC reads `immunization_types.cost` if the Director's draft stands (she holds `medical.immunizations` Edit) | accepted and filed on the `backlog` branch: price-free picker view, or take the cell from her |
| 3 | Medium | The dev database holds the Director's draft role matrix, so several existing checks are red and the baseline cannot be GREEN | accepted: not mine to revert; before/after delta in the decision file |
| 4 | Low | N1 and N2 stay open (staff read prices through the add and register cells) | accepted: closing needs a price-free picker view, an app change; filed on the `backlog` branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as management, open Management → Medications: add, rename and delete a medicine; open Diets and change a diet | dev, `test.lannacare.org` |
| 2 | Signed in as staff, write a prescription and type a medicine that is not on the list: it saves and appears | dev |
| 3 | Signed in as staff, log a procedure with a new typed procedure type | dev |
| 4 | Signed in as a vet, record an immunization and a blood test: the type pickers fill | dev |
| 5 | Signed in as the 2IC, open Purchasing and the stocktake: medicine and diet names and counts show as before | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; items 1 to 5 wait for someone with a login

Manual verification by: pending: a person opening the pages above as management, staff, a vet and the 2IC (items 1 to 5); Claude drove only read pages as staff and management, which is not that person's check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
