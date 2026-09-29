# Feature test plan

## Header

| | |
|---|---|
| Feature | A vet writes only their own clinic's records: another clinic's visits, prescriptions, procedures, blood tests and their files are read-only, and a visit can only be booked at the vet's own clinic |
| Backlog item | `docs/backlog.md` → "A vet can still write another clinic's records, and record a visit against any clinic, through the database" |
| Branch / worktree | `claude/vet-cross-clinic-writes` @ `C:\Development\Animal_Shelter_vet-cross-clinic-writes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-29 |
| Carries a migration? | yes — `0110_vet_own_clinic_writes.sql` |
| Tested at SHA | `7574ded` (the code; this plan follows it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — RLS now refuses a vet's writes to another clinic's rows (visits, and prescriptions, procedures and blood tests through their visit) and a visit booked at any clinic but the vet's own, with the edit page saying "read-only" rather than showing a form that can only fail
- [x] Files/areas touched listed — `supabase/migrations/0110_vet_own_clinic_writes.sql`; `scripts/check-vet-own-clinic-writes.mjs`; `src/app/vet-visits/[id]/edit/page.tsx`; `src/lib/i18n/dictionaries/{en,th}.ts`; `src/lib/releases.ts`; `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified — vet (writes narrowed); admin / management / staff unchanged (asserted in the harness); volunteer and signed out have no write on these tables and are untouched
- [x] Anything explicitly **out of scope** written down — weight, immunization records and diets carry no clinic and are unchanged; a vet can still edit a record with *no* visit (it belongs to no clinic; decisions.md, 2026-09-29); the vet-only harness fixtures are dev-only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main`; the only conflict was `unreleased` in `src/lib/releases.ts` (main had released and emptied it); resolved by keeping this PR's line alone
- [x] `node scripts/gates.mjs` on the merged tree, printed:

```
=== gates: build exited 0 after 319s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` (0109), and no other in-flight branch carries one — `check-migration-numbers` printed `ok — 0110_vet_own_clinic_writes.sql (highest 0109_…)`; the brief named this stream as batch 6's only slot
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 109 applied, 0 pending, matching origin/main
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: the rollback harness runs the file twice inside one transaction against dev's real schema, which is a stronger check than a dry-run for this file
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0110_vet_own_clinic_writes.sql … ok`
- [x] File is re-runnable — `drop policy if exists` / `create or replace` throughout; the harness runs it twice in one transaction, and a third time after the real apply (`applied on dev`)
- [x] Existing rows still read correctly after the change — reads are exactly as 0108 left them; the harness asserts a vet still reads both clinics' visits and blood tests and the other clinic's blood-test file
- [x] **Constraints and defaults exercised against real rows** — `node scripts/check-vet-own-clinic-writes.mjs`, driven as a vet's JWT (`set local role authenticated` + claims), nothing committed. Output: `HARNESS-OK 0110_vet_own_clinic_writes.sql ran twice | pending on dev | 0: before the file the vet rewrote other's visit (1 row) | A: other's visit: update 0, delete 0, insert at other refused, insert with no clinic refused | B: other's rx/procedure/blood test: update 0, delete 0, insert refused; file insert, delete and record_attachment refused | C: own visit update/insert/delete 1, own rx/procedure/blood test/file ok, visit-less rx ok, both clinics still read | D: moving own visit to other clinic, own rx onto other's visit: refused | E: other's doctor rename 0, doctor/bulk insert refused, bulk RPC at other refused, own ok | F: admin/management/staff rewrite other's visit (1 each)`. Step 0 proves the hole was real before the file
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: policies only, no data changed; reverting means restoring 0108's `vet_rw_*` policies and 0108's `record_attachment`, which the file's header names
- [x] Production apply plan stated for the release manager — apply `0110_vet_own_clinic_writes.sql` to production (`dbkodyyxxhtygxcxmfcu`) with `node scripts/apply-migrations.mjs --env production`, before the deploy; a live security gap, so it should not wait for the next release

## 4. Functional checks

- [x] Happy path works end to end — the vet's legitimate writes (own-clinic visit insert/update/delete, prescription/procedure/blood test on an own visit, a visit-less prescription, a file on an own blood test, bulk booking at own clinic) all succeed in the harness
- [ ] Data persists — reload the page and the change is still there — n/a: no data-entering UI changed; the only page change is a read-only notice
- [x] Create / edit / delete all exercised — all three, per table, as a vet's JWT in the harness (see section 3)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or empty state touched
- [x] Invalid input is rejected with a readable message, not a crash — a vet's write at the database is refused (RLS error / 0 rows), and the edit page shows a sentence instead of the form; the action's existing `notAuthorized` covers a hand-posted save
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input fields changed; the boundaries that matter are the clinic-null visit and the visit-less child, both asserted in the harness
- [x] **The regression this PR is most likely to cause — "keep the clinic a visit already has":** editing an own-clinic visit and saving without changing the clinic still works (harness C: `update … where id = own_visit` gives 1); moving a visit out of the clinic is refused (D). A vet can no longer save another clinic's visit at all — deliberate, decisions.md 2026-09-29 — so the form's keep case cannot arise for a vet

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | rewrite another clinic's visit | still allowed | harness F: 1 row |
| management | rewrite another clinic's visit | still allowed | harness F: 1 row |
| staff | rewrite another clinic's visit | still allowed | harness F: 1 row |
| vet | another clinic's visit, prescription, procedure, blood test, blood-test file, doctor list, bulk booking | read yes, write refused | harness A, B, D, E: update 0 / delete 0 / insert refused |
| volunteer | vet tables | read-only, unchanged | n/a: no policy for volunteer touched (0108 / 0001), not exercised |
| signed out | vet tables | no access, unchanged | n/a: no policy for anon touched |

- [x] Every role above tested — admin, management, staff and vet in the harness; volunteer and signed out marked n/a with the reason
- [x] A role that should not have access is blocked server-side — the vet's refusals are at the database (driven as its JWT), not the UI

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual does not describe cross-clinic edit rules; the release note carries the change
- [x] Translatable strings go through the translation path — one new dictionary string `vetVisits.otherClinicReadOnly`, in both `en.ts` and `th.ts`; not translatable content stored in the database
- [ ] Mobile viewport (375px) — n/a: the notice is one `<p>` in the same layout as the existing `noClinicForAccount` notice
- [ ] Browser console clean — n/a: not driven in a browser; see Left for manual verification
- [ ] Network clean — n/a: not driven in a browser; see Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work — typecheck, lint and build pass, including `/vet-visits/[id]/edit` and `/vet-visits/new`; the vet flows are covered at the database by harness C
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `en.ts`/`th.ts` gained one key each, and `releases.ts` one line; no shared value changed
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-29 — read-only decision, the vanished keep case, visit-less records left writable, `vet_doctors` and `bulk_appointments` also scoped, the security-definer audit
- [ ] `README.md` still accurate — n/a: it does not describe vet write rules
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for vets and admins
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "hole was real" claim is harness step 0 (a vet rewrote another clinic's visit, 1 row, before the file); the security-definer audit was read from the migrations (0026, 0027, 0049, 0073, 0102, 0108) and the two invoker functions confirmed by their `security invoker` / lack of `security definer`, and `schedule_bulk_appointments` by a harness call that is refused at another clinic

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the boundary is a clinic-id equality, asserted from both sides (own clinic allowed, other clinic and no clinic refused)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: pasted as printed in section 3, apart from the leading `status 400` wrapper the API adds to the deliberate `raise exception`
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** The code change (edit page notice) reads nothing new from the schema, so the order is not load-bearing. Apply `0110` to production first regardless, since it closes a live gap
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (note CLAUDE.md's caveat: `0110` depends on `0108`'s `current_vet_resident_ids()`, so a dry-run before `0108` is applied to production would report FAILED wrongly; `0108` is already on production per the latest commit on main)
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: policies only
- [ ] Apply plan stated — deferred: release manager; file and project are named in section 3

### Rollback

- [x] Rollback position stated. `npx wrangler rollback --env production` reverts the Worker, not the migration. Leaving 0110 in place under an older Worker is safe: the older edit page would offer a form for another clinic's visit, and its save would be refused with "not authorised". Reverting the policies means re-applying 0108's `vet_rw_*` policies and `record_attachment`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | A vet can still edit or delete any visit-less prescription, procedure or blood test on a resident they can see | accepted — belongs to no clinic; the forms let a vet record one without a visit; decisions.md 2026-09-29 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a vet account with a clinic, open Edit on another clinic's visit: the page says it is read-only; on the vet's own clinic's visit the form works and saves | `/vet-visits/<id>/edit` on the dev server |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1 above

Manual verification by: pending: a person opening Edit on another clinic's visit as a vet account

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR is not open

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
