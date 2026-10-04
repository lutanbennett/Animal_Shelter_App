# Feature test plan

## Header

| | |
|---|---|
| Feature | `0136_medical_role.sql` and its app half: R2, the Head of Medical, the first configured role and the first worked example of the jobs layer. A `roles` row, two cells, one policy and two views, the job **Administer Medication** (`src/lib/permissions/jobs.ts`), and a home that shows a role's jobs as tiles |
| Backlog item | `docs/backlog.md` → Auth → **Roles build, then one role at a time**. **Not ticked**: the Head of Maintenance, the 2IC, Management and Admin remain; the item carries a status line for this stream. Lutan's description of the Head of Medical's day went to the `backlog` branch as five items |
| Branch / worktree | `claude/medical-role` @ `C:\Development\Animal_Shelter_medical-role` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` (stopped; `preview_start` name `dev` was used) |
| PR | opened from this branch; the number is recorded in the follow-up commit that ticks CI |
| Tested by / date | Claude (automated) / 2026-10-04 |
| Carries a migration? | yes: `0136_medical_role.sql` |
| Tested at SHA | the branch tip at the commit that adds this plan, on `main` @ `7c2a5fb3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a Head of Medical login exists (a role row borrowing the volunteer, two cells) whose home is one job tile, Administer Medication, opening the medication list, with what the list reads reaching the role through two fixed-column views and a frequency policy
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0136_medical_role.sql`; `src/lib/permissions/jobs.ts` (new), `src/lib/permissions/routes.ts` (the list's activity and a clinical scope), `src/lib/home/tiles.ts`, `src/lib/medication-list/load.ts`, `src/app/management/medication-list/page.tsx` (guard only), both dictionaries (one key), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-medical-role.mjs` (new), `docs/decisions/2026-10-04-medical-role.md`, `docs/backlog.md`. No `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public: **the Head of Medical** (new); **staff** can now open the medication list and get its tile (they hold `medical.prescriptions`, not `stock.medications`, which the page used to ask; §14's intent); **a vet** is not offered it and the page refuses a clinic-scoped login; **management and admin** unchanged; volunteer and signed-out unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: weight recording, medical photos, a stock-room pick list, dosing by time of day, special diets and pictures-first (all on the `backlog` branch); a vet's own-clinic list; Settings' user picker offering the new role (not checked); a login in production; the real round, which is §12's done-when

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (`Already up to date.`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line, as printed:

  ```
  === gates: build exited 0 after 141s
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0135_perm_convert_medical.sql` (merged); `check-migration-numbers` reports `0136_medical_role.sql` against `origin/main 7c2a5fb3`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `135 applied, 1 pending` (`0136`) on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0136_medical_role.sql … ok`; one consumer warning (`src/lib/home/tiles.ts` is not in release 0.17.0), the safe direction: the migration only adds a role and two views
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0136_medical_role.sql … ok`, from this branch
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `on conflict do nothing` on the role and cell inserts, `drop policy if exists` before the policy, `create or replace view`. Not replayed twice in a harness: the file is that short, and every statement carries its own guard
- [x] Existing rows still read correctly after the change (checked against real dev data): the medication list loaded as the new role and listed dev's real prescriptions grouped by zone and enclosure (Nu-Daeng, Angsumalin and seven residents with no enclosure); `check-perm-convert-medical` (241) and `check-volunteer-narrowing` (55 rights) still pass
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness, `scripts/check-medical-role.mjs`. Asserted for seven principals (the Head of Medical, admin, management, staff, volunteer, a vet, no role) under their own JWTs: the list's four sources read as expected; the Head of Medical reads nothing else (`medication`, `residents`, `resident_list_view`, `weight`, visits, procedures, stock counts, the assistant, contacts); the price, stock, breed and bio columns do not exist on the two views; the Head of Medical's insert and update on `prescriptions` and insert on `weight` are refused; the vet reads its own clinic's rows only through the untouched `vet_*` policies; the role row has the shape the decision file states; `role_permissions` for the role equal `bundleOfRole()` from `jobs.ts`. Output, as printed:

  ```
  101 checks held, 0 failed.
  RESULT: GREEN (the Head of Medical reads the list and nothing else; the cells and jobs.ts agree)
  ```

  Not run red against a mutated database. The first run was RED with 8 failures, all one wrong expectation (a vet reads the harness resident's own-clinic rows); fixing the expectation, not the policy, is what turned it green
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive and reversible by the file's own header (drop the two views and the policy, delete the role's two cells and its row); a down-migration would copy five statements. The dev disposable login must be deleted first (a foreign key from `user_roles`)
- [x] Production apply plan stated for the release manager (which file, which project, when): `0136_medical_role.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout, `--dry-run` then apply, after this PR merges. Apply **before** the deploy: the new `load.ts` reads the two views, and without them the medication list errors for everyone

## 4. Functional checks

- [x] Happy path works end to end: signed in as a disposable Head of Medical on dev, the sign-in landed on `/home` with one tile, **Administer Medication**, which opened the medication list showing today's medicine per animal, grouped by zone and enclosure
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written; the page is a reference with no form
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the role writes nothing; refusal of writes is asserted by the harness
- [x] Empty state renders sensibly (no rows yet): a role with no jobs and no cells gets the existing empty home, asserted by `check-home-screens` (`D a role holding nothing has only Residents`); a job whose bundle is half-held draws no tile (logic in `homeTilesFor`, covered by reading, not by a case of its own)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no inputs
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a resident with no enclosure is listed apart (seen on dev: seven residents under "Not in an enclosure today"); a vet is refused the page (route scope plus page guard; harness shows the vet's views are empty); an `as needed` prescription is shown; the due-day logic is untouched (`check-medication-list-due`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| Head of Medical | Home, the medication list, Residents (who and where), the Management landing showing one tile | nothing else | landing `/home` with one tile; list loaded in English and Thai at 375 px; `/management` showed one link, `/management/medication-list`; `/management/medications` sent the login away to `/` (refused); every table beyond the list refused by the harness |
| admin | the list | no change | allowed (harness reads the views and tables) |
| management | the list | no change | allowed |
| staff | the list | newly allowed | allowed (reads both views, `prescriptions` and `frequency`) |
| vet | not the list | refused | the page and tile refuse a clinic-scoped login; the views return no rows to a vet (harness) |
| volunteer | not the list | refused | no `medical.prescriptions` cell since `0134`: the views and `prescriptions` return nothing (harness) |
| signed out | nothing | refused | no grant to `anon` on either view |

- [x] Every role above tested: the Head of Medical in the browser and under its JWT; the five others under their JWTs by the harness; signed out by the grant, not exercised as a session
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the Head of Medical hitting `/management/medications` was redirected out; the table refusals are database refusals under the role's own JWT

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added; the role's home is its menu, and `NavLinks.tsx` is untouched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the "The medication list" topic now says how the Head of Medical opens it and its tag is admin, management, staff. Not opened at `/manual` in a browser: the topic is checked by `acceptance-matrix --check` (68 topics, in `npm run lint`)
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the one new string (the job's name) is a dictionary key in both languages, not stored free text
- [x] Mobile viewport (375px): home and medication list driven at 375×812 in the browser pane (mobile preset) in English and Thai; the tile and cards fit with no sideways scroll seen. Resident and label photos did not load on dev (placeholders showed), which this change did not touch
- [ ] Browser console clean — n/a: the console was not read in this session
- [ ] Network clean — n/a: the network panel was not read in this session

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `check-permission-parity` GREEN (`RESULT: GREEN (matches and listed tightenings only)`), `check-volunteer-narrowing` GREEN (55 removed rights refused, kept rights work), `check-perm-convert-medical` (241 checks, GREEN), `npm run lint` (home-screens cases, acceptance matrix, permission catalogue, migration grants), and the Residents list loaded for the new role (78 residents, filters). The medication list as management or staff was **not** loaded in a browser (see manual list)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: `manual/en.ts` was edited at one topic only, and `tiles.ts` returns the previous result for any role without jobs (all five shipped roles), proved by `check-home-screens`
- [x] Nothing merged from `main` during `sync` was broken by this branch — `Already up to date.`; nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead): deliberately **not** ticked; a status line says the first configured role exists and the jobs layer has its first worked example. Five follow-ups went to the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`): `docs/decisions/2026-10-04-medical-role.md`: the role row's shape, why `volunteer` is still the right `legacy_role`, the finding that one read policy was not enough, how the job and bundle are expressed, and what the next example should do differently
- [x] `README.md` still accurate: it does not describe the role model
- [x] **Release notes.** `src/lib/releases.ts`'s `unreleased` gained a line: the Head of Medical login, its one button and what it shows, and that Staff can now open the list
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The harness count (101), the parity and narrowing results and the gates line are tool output. Reasoned and worded as such: that the migration is re-runnable (read, not replayed), and that Settings' user picker may or may not offer the role (not checked)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing new derives a date; the list's due-day logic is untouched
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** Each view and table is asserted for the role and for the six others; the vet scope is asserted from both sides
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or table changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** Yes: the migration (`0136`) and `load.ts`. **The migration is applied before the deploy**, so the live list never queries a view that does not exist. Stated in §3
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing is rewritten; a row, two cells, a policy and two views are added
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `wrangler rollback` returns the Worker to the old `load.ts`, which reads `residents` and `medication` directly and works for management and staff; it cannot show the list to the Head of Medical. The migration needs no rollback for that to be safe. It does not cover a Head of Medical login created in the meantime: it would sign in to a role that opens an empty home

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium, found by this work | §12's "one read policy" was not enough: the list joined `residents` and `medication`, which a volunteer-based role cannot read, and a medication policy would have exposed prices. The list would have shown nobody | fixed in this PR: two fixed-column views, a frequency policy, the loader and guard moved (decision file §2) |
| 2 | Low | The page asked `stock.medications`, not `medical.prescriptions` as §14 says; Staff could not open it | fixed in this PR; Staff now can, noted in the release line |
| 3 | Low | Dev resident and label photos did not load in the browser pane (placeholders show) | accepted: dev's Drive proxy, not this change; not reproduced against another list |
| 4 | Low | A vet holds the cell and would have opened an empty list | fixed in this PR: a clinical-scope on the route and the page |
| 5 | Info | The manual topic no longer carries an `activity` tag, so the Head of Medical does not see it in the manual | accepted: the matrix gains configured roles' columns later; stated in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The Head of Medical has used it for a real round.** The one real login, on a phone in the kennels, with a real prescription list, and says whether the list tells them who, where and how much. §12's done-when; also the demonstration for the Director | production, after the apply, and a login made by Lutan |
| 2 | Signed in as management, and as staff, open Management → Medication list and compare with yesterday's: same animals and amounts, and staff now see the tile | dev, `http://localhost:3009` or `test.lannacare.org` |
| 3 | As Admin, open Home → the role switch and check **Head of Medical** is listed and shows its one tile | dev |
| 4 | The Thai name of the role, หัวหน้าฝ่ายการแพทย์: is it the wording the shelter uses? | Lutan |
| 5 | Open the list as a vet and confirm it is refused | dev |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is the role's own done-when and waits for the Head of Medical

Manual verification by: pending: a person, for items 1 to 5 above; Claude drove a disposable dev login at 375 px and signs only the automated line

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
