# Feature test plan

## Header

| | |
|---|---|
| Feature | Each clinic's doctors as a list that fills itself (`vet_doctors`, `vet_appointments.doctor_id`), and which clinic a vet account belongs to (`user_roles.vet_id`). Schema half only |
| Backlog item | `docs/backlog.md` → Medical records → **Doctors belong to a vet: investigate a managed list rather than free text** (not ticked here: the roster page is the feature half) |
| Branch / worktree | `claude/vet-doctors-roster` @ `C:\Development\Animal_Shelter_vet-doctors-roster` |
| Dev server | not started. No `src/` change; see §6 for why the running app is still covered |
| PR | #176 |
| Tested by / date | Claude (automated) / 2026-09-27 |
| Carries a migration? | yes: `0102_vet_doctors_and_vet_accounts.sql` |
| Tested at SHA | branch on `main` @ `aadcd13`; the only changes are the migration, its harness, the `decisions.md` entry and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `vet_doctors` list per clinic, filled automatically from typed names, with a nullable `doctor_id` beside the free-text column, plus `user_roles.vet_id` for the vet-account→clinic link that backlog items 4 and 8 need. Both were chosen by Lutan in chat on 2026-09-27 after the investigation
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `supabase/migrations/0102_vet_doctors_and_vet_accounts.sql`; `scripts/check-vet-doctors.mjs` (dev-only rollback harness); `docs/decisions.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public. New table: admin, management, staff and vet read/write, volunteer reads, anon nothing. Existing booking and edit writes by admin, management, staff and vet now also add a doctor to the list through the trigger. `user_roles` is admin-only as before
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the list page on the clinic hub (view, rename, deactivate, merge), passing `p_doctor_name` from the booking form, suggestions drawn from the list, and choosing a vet account's clinic in `/admin/security` are the feature half. Linking an account to a particular doctor waits for backlog item 4

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (nothing new on `main`, `aadcd13`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 246s

  gates: typecheck=0 lint=0 build=0
  ```
- [x] CI green on the PR (runs the same three) — `check`, `migration-numbers` and `test-plan` all pass on #176 (run 36297613682)

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0101_public_photos_exclude_medical.sql`; `gh pr list` showed no open PRs; this is batch 1's only migration slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `101 applied, 1 pending` on `qxkmhwybjggxvsfxsxbd`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `dry-run 0102_vet_doctors_and_vet_accounts.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0102_vet_doctors_and_vet_accounts.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): the harness runs the whole file twice in one transaction, and was run again after the real apply; both passed
- [x] Existing rows still read correctly after the change (checked against real dev data): after the apply, dev's one named visit ("Dr Ploy", Mae Wang) is linked to the one `vet_doctors` row the backfill created, and harness step A asserts no named visit with a clinic is left unlinked and none disagrees with the list
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-vet-doctors.mjs`, against real dev residents (one living, one deceased), clinics and accounts. Asserted: (A) backfill links every named visit and the names agree; (B) a typed name adds one list row, and a case/whitespace variant links to the same doctor and takes its spelling; (C) setting `doctor_id` fills the name, and a doctor from another clinic is refused by the composite FK; (D) no clinic keeps free text unlinked, and blanking clears both columns; (E) moving a visit to another clinic relinks there, while editing another column leaves the doctor alone; (F) a rename reaches every linked visit, **including a deceased resident's**, the lock bypass is restored afterwards, `active` is untouched, and a rename onto another doctor's spelling is refused; (G) merge moves visits and deletes the merged row, a cross-clinic merge is refused, and a doctor with visits cannot be deleted; (H) the RPC with `p_doctor_name` links both rows, and today's named-argument call without it still works; (I) a clinic sticks only to a vet account (trigger, and the check constraint alone with the trigger off), changing the role clears it, and `current_user_vet_id()` answers for a vet and is null for staff. A second transaction runs as the `authenticated` role with real JWT claims: a staff booking adds and renames a doctor through RLS; a volunteer reads the list but cannot add or merge; `anon` can neither read the list nor call `current_user_vet_id()`. Dev has no live staff or volunteer account, so the harness revives archived ones inside the rolled-back transaction. Output, unedited (run after the apply):

  ```
  behaviour: status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK backfill: 1 doctor(s), 0 unlinked; rename reached 3 visits (deceased included: t); | typed name adds, variant spelling links to the same doctor, one list row | by id fills name, other clinic refused | no clinic stays free text, blank clears | vet change relinks, other edits keep | rename reaches visits, bypass restored, duplicate rename refused | merge moves visits, cross-clinic refused, used doctor undeletable | rpc links both rows, old call shape works | clinic only on vet accounts (trigger and constraint), role change clears, current_user_vet_id | file ran twice
  CONTEXT:  PL/pgSQL function inline_code_block line 150 at RAISE

  rls: status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK rls: staff booking adds and renames a doctor | volunteer (checked) reads, cannot add or merge | anon cannot read the list or call current_user_vet_id
  CONTEXT:  PL/pgSQL function inline_code_block line 13 at RAISE
  ```

  (`status 400` is by design: each transaction ends in a `raise`, so it cannot commit; the script exits 0 only when both say `HARNESS-OK`.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: additive, and nothing in `src/` reads the new objects yet. If it had to be undone: restore the 6-argument `schedule_bulk_appointments` from 0030, then drop the triggers and functions, `vet_appointments.doctor_id` with its constraint, `vet_doctors` and `user_roles.vet_id`. `doctor_name` keeps the list's spelling and needs nothing
- [x] Production apply plan stated for the release manager (which file, which project, when): `0102_vet_doctors_and_vet_accounts.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout (`--env production --dry-run`, then without). Safe before or after this PR's deploy, since no code depends on it, but **before** the feature half deploys

## 4. Functional checks

- [x] Happy path works end to end: harness B, C, F, G and H are the booking, edit, rename, merge and bulk-booking paths
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface yet; the list page is the feature half
- [x] Create / edit / delete all exercised (whichever the feature has): insert and update of visits, insert, rename and refused delete of doctors, and merge, all in the harness
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: another clinic's doctor, a duplicate rename, a cross-clinic merge ("Both doctors must be at the same clinic.") and deleting a doctor who has visits are all refused with specific errors
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): blank and whitespace-only names, tab inside a name, no clinic, missing `p_doctor_name`, a deceased resident's visit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `vet_doctors` all; `merge_vet_doctors` | allowed | merge run with admin claims in harness G |
| management | `vet_doctors` all | allowed | policy mirrors staff's; not driven separately |
| staff | `vet_doctors` all, via booking and rename | allowed | passed (rls transaction) |
| vet | `vet_doctors` all; `current_user_vet_id()` | allowed; returns own clinic | `current_user_vet_id()` passed (harness I) |
| volunteer | `vet_doctors` select only | read yes, add/merge refused | passed (rls transaction) |
| signed out | nothing | refused | `anon` refused on the table and the function (rls transaction) |

- [x] Every role above tested: staff, volunteer and anon driven as `authenticated`/`anon` with claims; admin through the merge; vet through `current_user_vet_id()`. Management's policy is the same text as staff's, so it was not driven separately
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): volunteer insert and merge, anon select and execute, all refused by the database

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing to document until the list page exists; the feature half updates the vet-visit topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded. The running app's two writers are covered in the harness: `/vet-visits/new` calls the RPC by name without `p_doctor_name` (H, "old call shape works") and then updates `doctor_name` (B/E), and `/vet-visits/[id]/edit` updates `doctor_name` (D/E). The readers select `doctor_name`, which A and F prove holds the list's spelling. `scripts/check-vet-doctor-name.mjs` (0074's harness) now fails its step A, "existing rows back-filled = 1": that is dev's "Dr Ploy" row, added by the vet-doctor-name feature testing after 0074 was applied. The harness was only ever valid at 0074's apply time, and this failure is not caused by 0102
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing; gates green

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the item is done when the list page exists; the feature half ticks it. The outcome is recorded on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: why the 2026-09-24 call was reversed; the list fills itself; the name key; `doctor_name` follows the list; the scoped deceased-lock bypass; the composite FK; the RPC parameter; clinic on the account rather than on a doctor
- [x] `README.md` still accurate: it does not list tables
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it — n/a: the only visible effect is that retyping an existing doctor with different case or spacing now saves the spelling already on file. The list page in the feature half is the change a user would notice, and it adds the line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: dev counts (75 visits, 1 named) from a query on 2026-09-27; every behaviour claim comes from the harness run above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already on the dev database that `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads these tables

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No. The feature half will, so production needs 0102 before that deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive; the only data rewritten is linking already-typed names, which keeps `doctor_name` except for aligning variant spellings within a clinic
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. See §3 for the drop order. Undoing it loses the list and the links, but not the names, which stay in `doctor_name`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. There is no screen yet; the list page in the feature half is where a person looks.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan and quotes the harness result rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply as Lutan's, before the feature half deploys

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
