# Feature test plan — perm-functions-schema

## Header

| | |
|---|---|
| Feature | The 12 functions (and 2 clinic-scope helpers, and 6 views) that decided who may do something by the role's name now ask a cell (`has_permission()`) or the clinic scope (`is_clinic_login()`) |
| Backlog item | `docs/backlog.md` → **PRIORITY (Lutan, 2026-10-10): Settings → Who does what**, batch 1 (c) (a "(c) done" line added, parent not ticked); and **A custom role that borrows the management enum…** (Security, ticked) |
| Branch / worktree | `claude/perm-functions-schema` @ `C:\Development\Animal_Shelter_perm-functions-schema` |
| Dev server | not started: no page changed. The change is in database functions, exercised under each login's own JWT by script |
| PR | #524 |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes — `0178_perm_functions.sql` |
| Tested at SHA | `a795b1d8` (after sync with `origin/main` `56ec6698`, already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the item's 11 (really 12) functions ask a cell or the clinic scope; parity was run before and after; the views that decide who may read were converted where something other than the enum can say it
- [x] Files/areas touched listed — `supabase/migrations/0178_perm_functions.sql`, `scripts/check-perm-functions.mjs` (new), `scripts/lib/permission-probes.mjs` (C11 removed), `docs/backlog.md`, `docs/decisions/2026-10-11-perm-functions-schema.md`, `src/lib/releases.ts`, this plan
- [x] Roles affected identified — Management loses Set as standard diet in the database (the page was already Admin-only); the 2IC gains the Drive filing after recording a death (agreed by Lutan in chat, 2026-10-11); a doctor loses ticking recurring jobs (never offered in the app); 2IC and Head of Maintenance may file a maintenance photo through `record_attachment` (they could already insert it directly). Everyone else unchanged, measured per login
- [x] Anything explicitly **out of scope** written down — `user_roles.role`, `current_user_role()`, `roles.legacy_role`, and the 6 functions and view clauses listed in the decision file §5 stay for `perm-drop-enum`; the app's `*_ROLES` lists and `hasAppAccess` are `perm-role-lists`; the `FIXED_FOR_NOW` file belongs to `who-does-what-view`, which had not merged, so the entries this closes are named on the backlog item and in the PR rather than edited

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `56ec6698`: already up to date, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Its closing lines:

```
=== gates: build exited 0 after 344s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — the post-commit check printed `migration numbers: ok — 0178_perm_functions.sql (against origin/main 56ec6698, highest 0177_receipt_content_server_side.sql)`; the brief names this as the batch's only migration
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 177 applied, 1 pending (`0178`), no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run flagged the six re-created views for unstated grants (and `doctor_contacts` for the write revoke); grants restated as they stand on dev (`select` to `authenticated`, `service_role`), second run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0178_perm_functions.sql … ok`, from this branch
- [x] File is re-runnable — `create or replace` throughout, grants and revokes idempotent; `check-perm-functions.mjs` replays the whole file inside its transaction, and after the apply the replay is a no-op (`--applied`: no answer changed)
- [x] Existing rows still read correctly after the change — the six views were rewritten from their live `pg_get_viewdef` text with only the clinic test changed; row counts for all six are among the probes, unchanged for every login
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — `scripts/check-perm-functions.mjs`: 27 probes (each converted function, some with two argument sets; each converted view) called as every live login on dev (45) under its own JWT, the file replayed, the probes called again, all in one transaction ended by `raise exception`. Asserted: every changed answer is one of the agreed list and every agreed change happened; a "who gets past each gate" table proves the probes reach past the gates (e.g. `record_stocktake: admin head_of_medical management second_in_command`). Output before the apply:

```
1215 calls per side, 27 probes; replayed 0178
  agreed     doctor record_recurring_job: Only the people this job is assigned to, or management, can record it. -> Not authorized to record a recurring job.  (6 logins)
  agreed     head_of_maintenance record_attachment maintenance: Not authorized to add attachments. -> ok  (2 logins)
  agreed     management set_standard_diet: ok -> Not authorized to change the standard diet.  (15 logins)
  agreed     second_in_command record_attachment maintenance: Not authorized to add attachments. -> ok  (3 logins)
  agreed     second_in_command record_deceased_archive: Not authorized to archive a deceased resident. -> ok  (3 logins)
RESULT: GREEN
```

  After the apply (`--applied`): `no answer changed`, `functions still reading the enum: 6 (private.has_app_access, public.current_user_role, public.has_shelter_floor, public.sees_all_contacts, public.sees_all_residents, public.user_roles_sync_role_id)`, `RESULT: GREEN`. Shown red: a mutant asking `stock.purchasing` in `record_stocktake` gave `UNEXPECTED head_of_medical record_stocktake: ok -> Not authorized to record a stocktake.` and `RESULT: RED (1)`. (Login counts rose between runs because another stream was adding test logins on dev.)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: every object is `create or replace` of an existing function or view with the same signature and columns; reverting is re-applying the previous definitions, which are in `0112`, `0118`, `0140`, `0167`, `0172`, `0173` and `0174`
- [x] Production apply plan stated for the release manager — `0178_perm_functions.sql` on `dbkodyyxxhtygxcxmfcu` with the next release, `--status --env production` then `--dry-run` first. No code in this PR depends on it, so before or after the deploy are both safe; it changes who may do what on its own (decision file §6)

Parity (`scripts/check-permission-parity.mjs`), before and after:

| | match | known | mismatch | harness fault |
|---|---|---|---|---|
| before `0178` | 1,777 | 22 | 21 | 0 |
| after, C11 reported STALE and removed | 1,778 | 21 | 21 | 0 |

The 21 mismatches are the same lines before and after (the doctor's, a recorded decision in `2026-10-09-perm-convert-vet.md` §1). `check-policy-role-names.mjs --final`: green.

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no page changed; each function's allowed path is exercised per login in §3 (the "who gets past each gate" table)
- [ ] Data persists — n/a: no page changed, and the functions' writes are unchanged below their gates
- [ ] Create / edit / delete all exercised — n/a: no page changed; every converted function is called in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface; a refused caller gets the same message text as before, per function
- [ ] Boundary cases checked — n/a: no UI surface; the permission boundary is each role's cell, probed for every login

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | every converted function | all allowed, as before | as expected (§3 table) |
| management | all but Set as standard diet | loses Set as standard diet (Admin-only page) | as expected |
| staff | n/a: retired by `0173`, no live login | — | — |
| doctor | microchip, clinic files, own-clinic doctors, the clinic views | unchanged except ticking a recurring job (refused) | as expected |
| volunteer | ticking own recurring job | unchanged | as expected |
| signed out | n/a: no grant on any converted view; the functions are called by signed-in pages | — | — |

Configured roles probed too: 2IC (gains the death filing and maintenance photo filing, as agreed), Head of Medical (unchanged), Head of Maintenance (gains maintenance photo filing, which the table policy already allowed).

- [x] Every role above tested — every live login on dev, 45, by script
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — these are the server-side gates; each refusal in §3 is the database refusing a direct call

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no screen changed; the manual already describes the 2IC recording a death, which now finishes as described
- [ ] Translatable strings go through the translation path — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — checked at the database, which is where the change is: every function the stocktake, medications, diets, recurring jobs, photos, blood-test and procedure files, microchip, deceased and clinic-doctors pages call answers each login as before except the four agreed changes (§3)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched (`releases.ts` gained a data line, covered by the build)
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged nothing (already up to date); gates green after

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — Security *A custom role that borrows the management enum…* ticked with what closed it; PRIORITY item gained a "(c) done" line naming the `FIXED_FOR_NOW` entries closed; `perm-drop-enum` gained the measured leftover list
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-perm-functions-schema.md`
- [x] `README.md` still accurate — it does not describe these functions
- [x] **Release notes.** `unreleased` gained one line, the change a user sees: a 2IC's death filing now works. Management's lost diet power and the doctor's recurring-job gate were never reachable from a page, so nobody would notice them
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every changed answer is from the script's output; the one production claim is marked not measured in the decision file §6

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no band; the permission boundary is probed for every login on both sides of every gate
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads these functions or views

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No: no app code changed. The functions keep their signatures, and the app already asks the same cells. `0178` can be applied before or after the deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: it replaces function and view bodies with the same signatures and columns; no data is rewritten
- [x] Apply plan stated — `0178_perm_functions.sql`, production `dbkodyyxxhtygxcxmfcu`, with the next release, either side of the deploy. **It changes who may do what on its own** (Management: standard diet; 2IC: death filing; doctor: recurring jobs), so the release note goes out with it

### Rollback

- [x] Rollback position stated, including what it does not cover — a code rollback does not touch `0178`. To undo it, re-apply the previous function and view bodies as a new migration (the decision file lists where each came from); nothing in the data needs reverting

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium (silent) | A 2IC recording a death had the Drive filing refused, leaving the archive half-done and Retry failing | fixed by `0178` (Lutan agreed the gain, 2026-10-11) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a 2IC, record a death on a test resident (or press Retry on one whose filing is stuck) and see the resident's folder land in Deceased on Drive with the summary PDF | `test.lannacare.org`, after `0178` is applied to dev (it is) and the build is deployed to test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; one item waits for Lutan

Manual verification by: pending: Lutan to record or retry a death as a 2IC on test.lannacare.org

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — the defect is fixed in this PR but the fix is confirmed on screen only by the manual check
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending
