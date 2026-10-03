# Feature test plan

## Header

| | |
|---|---|
| Feature | Staff and management can log a blood test — `blood_tests` insert/update policies (F-01), plus a role-write check script |
| Backlog item | `docs/backlog.md` → Role walkthrough → **F-01 · blocks a role · Staff cannot log a blood test** (ticked on this branch; the parent review item stays open) |
| Branch / worktree | `claude/schema-blood-test-policies` @ `C:\Development\Animal_Shelter_schema-blood-test-policies` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending — opened after this commit |
| Tested by / date | Claude (automated) / 2026-10-03 |
| Carries a migration? | yes — `0131_blood_test_write_policies.sql` |
| Tested at SHA | `2f341a5e` plus the commit that adds this plan; branch merged with `origin/main` (0.15.1) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — staff and management get insert and update on `blood_tests` (as `0031` did for `procedures`), and a script now fails when a role is offered a write that no policy allows
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `supabase/migrations/0131_blood_test_write_policies.sql`; `scripts/check-role-write-policies.mjs`; `src/lib/releases.ts` (one `unreleased` line); `docs/backlog.md`, `docs/pi-failover.md`, `docs/decisions/2026-10-03-blood-test-write-policies.md`; this plan. No route, component or `worker/` change
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — staff and management gain insert and update on blood tests; admin and vet unchanged (checked, below); volunteer and signed-out unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — no UI change (the form, "+" and visit link already existed); F-03's date validation on the same form belongs to `dry-run-bugs`; no delete for anyone new; no archive path (`blood_tests` is not in 0124's set); no vet change (0110 stands)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — one conflict, in `src/lib/releases.ts`: `main` had cut 0.15.1 and emptied `unreleased`, this branch had added a line to it. Resolved to `unreleased` holding only this PR's line (the medication-label line is now in 0.15.1); no other file conflicted
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:

  ```
  === gates: build exited 0 after 183s

  gates: typecheck=0 lint=0 build=0
  ```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `main` tops out at `0130_assistant_action_refused.sql`; the brief says this is the only migration in flight, and the post-commit `check-migration-numbers` agreed against `origin/main`. It took the number `docs/pi-failover.md` was holding; that paper is corrected here
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — `This checkout: 130 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`; no drift
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0131_blood_test_write_policies.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0131_blood_test_write_policies.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — four `drop policy if exists` + `create policy`; the whole file was run twice in one `begin … rollback` against dev after the real apply and left exactly the four policies
- [x] Existing rows still read correctly after the change (checked against real dev data) — the harness reads a pre-existing row back as staff, management and volunteer; the Blood Tests tab of a real dev resident rendered after the migration
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-role-write-policies.mjs`, part 3, each role's own JWT through RLS. **Before the migration it failed** (`HARNESS-FAIL: staff insert gave -1`, plus two list failures); **after**, output unedited:

  ```
  1  offered writes: 14 checked
  2  management mirrors staff: 111 staff grants over 47 tables
     read-only for staff (advisory): blood_test_types, diet_types, immunization_types, item_unit_conversions, recurring_job_assignees, recurring_job_occurrence_assignees, recurring_job_occurrences, recurring_jobs, shelter_friends, stock_counts, translations, vets
  3  blood_tests: staff insert+update+file, no delete | management insert+update+file, no delete | volunteer read only

  all role write policies hold
  ```

  Asserted: staff and management insert (1 row), update (1 row), `record_attachment` on a blood test (1 row), delete (0 rows), read (≥1); a volunteer's insert is refused, its update touches 0 rows, its delete 0 rows, its read works. Everything rolled back.
- [x] Down-migration written, or the reason one is not needed is stated — not needed: four additive policies, nothing depends on them; undoing is four `drop policy`
- [x] Production apply plan stated for the release manager (which file, which project, when) — `0131_blood_test_write_policies.sql` to production `dbkodyyxxhtygxcxmfcu`, from the main checkout, `--env production --dry-run` first. It adds access only and no code needs it to boot, so order against the deploy does not matter; until it is applied, production staff still get the refusal

## 4. Functional checks

- [x] Happy path works end to end — signed in as a disposable **staff** account on dev, opened Log blood test for a real resident and saved: redirected to the Blood Tests tab, the row listed (CBC, 2 Oct 2026) and present in `blood_tests` (checked by query, twice: two saves, two rows)
- [x] Data persists — reload the page and the change is still there — the tab was reloaded by the redirect; both rows came back, and a direct query confirmed them
- [x] Create / edit / delete all exercised (whichever the feature has) — create through the real form; update and delete through the harness (update allowed, delete refused). The app has no edit or delete screen for a blood test
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI change; the empty state is existing code this PR does not touch
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed; date validation is F-03, owned by `dry-run-bugs`
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no field or validation changed; the notes box was left empty and the visit link unset on both saves, so the optional-field path was the one exercised

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything (`admin_all_blood_tests`) | unchanged | no policy of admin's touched; check part 1 confirms admin still named for insert/update |
| management | Log blood test | now saves | harness: insert 1, update 1, file 1, delete 0, read ok. **Not driven through the browser** — see Left for manual verification |
| staff | Log blood test | now saves (was refused) | harness as above, **and** driven through the real form on dev: saved without a file |
| vet | Log blood test on own clinic's visits only | unchanged | no vet policy touched; `0110`'s scoping stands and is covered by `scripts/check-vet-own-clinic-writes.mjs` (not re-run here — no vet policy or function changed) |
| volunteer | read only | unchanged | harness: insert refused, update 0, delete 0, read ok |
| signed out | nothing | unchanged | no grant or policy for `anon` touched |

- [x] Every role above tested — admin and vet by the check's part 1 (policy present, nothing narrowed), management, staff and volunteer by the harness; staff additionally in the browser
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — volunteer's insert refused by RLS in the harness, which is the server-side gate; no URL or route changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual's "Logging a blood test" already says admin, management, staff and vet do this; the fix makes the app match the manual, so there is no text to change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors only) after the staff session: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — dev server log for the session: every page and both `createBloodTest` POSTs were 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Blood Tests tab and Log blood test form for a resident, as staff, after the migration
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: the only shared source file touched is `src/lib/releases.ts`, a data-only `unreleased` line; the build, which prerenders `/releases`, passed
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates all 0 on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — F-01 ticked with its Done note; the parent review item left open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-03-blood-test-write-policies.md`: who was granted, who deliberately was not (vet, delete, archive, volunteer), and what the check does and does not cover
- [x] `README.md` still accurate — it does not describe blood-test permissions
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it, written for staff, managers and admins: staff and managers can now record a blood test, where before the save was refused
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "no management policy" claim was checked against `pg_policies` on dev (it was true: `management_read_blood_tests` only). One sentence in the decision that guessed at why procedures had management twins was replaced with the measured reason (0039 copies the staff policies that exist when it runs; 0031 came before it, blood tests had none to copy). The parity and offered-writes checks were run, and run failing, before being trusted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date. The test saves used 2 Oct on purpose so F-03 could not interfere
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the permission boundary is covered on both sides (granted roles can, volunteer cannot, delete refused to all new roles)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates line and the check output above are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view or page reads the changed policies

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: the code that writes blood tests is already on `main` and live; the migration only lets it succeed, so no ordering constraint
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive policies; no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — see §3

### Rollback

- [x] Rollback position stated, **including what it does not cover** — no Worker change, so `wrangler rollback` is irrelevant. The migration is four policies; to undo, `drop policy` each of `staff_insert_blood_tests`, `staff_update_blood_tests`, `management_insert_blood_tests`, `management_update_blood_tests`. Blood tests staff or management saved in the meantime are kept (they are rows, not schema)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The browser pane could not attach a file to the form (a synthetic file set on the input did not register with the form's uploader), so the **with a file** half was proved at the database gate only | accepted — the upload route and `record_attachment` are unchanged, and `record_attachment` was proved for staff and management in the harness; a person should do it once (below) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As **staff**, log a blood test **with a PDF or photo attached**: it should save, and the file should list under that test with a file-type icon | `/blood-tests/new?residentId=…` on test or dev; a real file chooser, which the browser pane could not drive |
| 2 | As **management**, log a blood test (no file is enough) | same |
| 3 | The Blood Tests tab shows what was saved, and a **volunteer** still sees the tab but gets no working Log blood test | `/residents/<id>/blood-tests` |

Disposable dev accounts, for whoever does this: `dryrun-bloodtest-staff-20261003@example.test` and `dryrun-bloodtest-management-20261003@example.test`, passwords in this worktree's gitignored `.env.local` (`DRYRUN_BLOODTEST_*`). Two test blood tests were left on the dev resident "Dryrun Zeta EN" (dev data is disposable).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-blood-test-policies session)  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; a person has not yet looked

Manual verification by: pending: the three items above, chiefly attaching a real file as staff and saving as management through the browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
