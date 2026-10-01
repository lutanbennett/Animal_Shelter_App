# Feature test plan

## Header

| | |
|---|---|
| Feature | Placement history guarded in the database: `end_date` changes only inside `close_prior_placement()` (DB-3), and a Lifecycle-zone target must belong to the placement type (DB-4). One migration, no UI change |
| Backlog item | `docs/backlog.md` → **Guard placement history in the database (DB-3, DB-4)** — ticked on this branch |
| Branch / worktree | `claude/schema-placement-guards` @ `C:\Development\Animal_Shelter_schema-placement-guards` |
| Dev server | not started. No `src/` change |
| PR | see the PR for this branch |
| Tested by / date | Claude (automated) / 2026-10-01 |
| Carries a migration? | yes: `0119_placement_history_guards.sql` |
| Tested at SHA | branch on `main` @ `76dc683`, plus the migration, its harness, a two-line flag in `scripts/fix-panda-placements.mjs`, the decision note and this plan |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `end_date` can no longer be set by hand (a transaction-local flag raised by `close_prior_placement()` is required), and a before-insert trigger refuses a Lifecycle-zone target unless the placement type owns that pseudo-enclosure
- [x] Files/areas touched listed: `supabase/migrations/0119_placement_history_guards.sql`; `scripts/check-placement-guards.mjs` (dev-only harness); `scripts/fix-panda-placements.mjs` (raises the new flag beside the deceased bypass so the one-off keeps working); `docs/decisions/2026-10-01-placement-history-guards.md`; `docs/backlog.md`; this plan. No `src/`, no `worker/`
- [x] Roles affected identified: volunteer (can no longer insert a ChangeEnclosure into a Lifecycle pseudo-enclosure), staff, management and admin (can no longer edit `end_date`, and are held to the same type/target rule on insert). Vet and signed-out public: no placement writes, unchanged
- [x] Anything explicitly **out of scope** written down: no UI; existing rows are not touched (the trigger checks inserts only, so dev's Foster-into-Unassigned from the import stays); `placement_history` RLS policies are unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at the time of the PR (see PR)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

  ```
  === gates: build exited 0 after 146s

  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `main` tops out at `0118_unit_conversions.sql`; this is batch 19's only migration slot; `check-migration-numbers` reports `0119_placement_history_guards.sql` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: `118 applied, 0 pending` on `qxkmhwybjggxvsfxsxbd`, no drift against `main`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: the harness runs the whole file twice inside `begin … rollback` against dev, which is the same check with assertions on top
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0119_placement_history_guards.sql … ok`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`): `create or replace` for all three functions, `drop trigger if exists` before the new trigger; the harness runs the file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): nothing is rewritten and the trigger fires on INSERT only. Dev's 146 placements (including a Foster into Unassigned and a SendToHospital with no enclosure) are unchanged
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `scripts/check-placement-guards.mjs`, against dev's real Lifecycle pseudo-enclosures and `undo_deceased_placement()`, as real `authenticated` volunteer, staff and admin sessions plus the table owner. Asserted: **refused** — `end_date` reopened or set by staff, admin and the owner, with the row unchanged afterwards; volunteer ChangeEnclosure into Deceased and into Adopted; ChangeEnclosure into Hospital; Adopt into Hospital; Deceased into Adopted; Intake into Deceased; a row naming only the Lifecycle zone; and a refused insert closes nothing. **Still works** — notes edit; ChangeEnclosure between ordinary enclosures by a volunteer and by staff, each closing the prior row through `close_prior_placement()`; the deceased workflow (Deceased row, cascade cancels a scheduled visit and writes the snapshot, `undo_deceased_placement()` restores the visit and puts the resident back); Intake, SendToHospital, ReturnFromHospital, Foster, Adopt and ReturnToShelter each into the target that owns it; death from hospital and undo back into Hospital; the flag is not left on after a close. Output, unedited:

  ```
  status 400
  Failed to run sql query: ERROR:  P0001: HARNESS-OK file ran twice | R1 end_date cannot be set, cleared or changed by hand (staff, admin, owner); a refused update changes nothing | R2 notes still editable | R3 refused: volunteer ChangeEnclosure -> Deceased and -> Adopted, ChangeEnclosure -> Hospital, Adopt -> Hospital, Deceased -> Adopted, Intake -> Deceased, zone-only Lifecycle row; a refused insert leaves the prior placement open | P1 ChangeEnclosure between ordinary enclosures (volunteer and staff) closes the prior row via close_prior_placement() | P2 Deceased cascade snapshots and undo_deceased_placement() restores | P3 Intake, SendToHospital, ReturnFromHospital, Foster, Adopt, ReturnToShelter each into its own target | P4 death from hospital and undo back to Hospital | P5 flag not left on
  CONTEXT:  PL/pgSQL function inline_code_block line 165 at RAISE
  ```

  (`status 400` is by design: the transaction ends in a `raise`, so nothing commits; the script exits 0 only on `HARNESS-OK`. This run was before the real apply; the file is inside the transaction itself.)
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no data changes. To undo: drop trigger `placement_history_check_lifecycle_target`, drop `check_placement_lifecycle_target()`, and `create or replace` the two functions from 0049 and 0024
- [x] Production apply plan stated for the release manager: `0119_placement_history_guards.sql` to production `dbkodyyxxhtygxcxmfcu`, by Lutan from the main checkout (`--env production --dry-run`, then without). Safe before or after any deploy; no code reads it. Before applying, confirm nobody is mid-way through a maintenance script that edits `end_date`

## 4. Functional checks

- [x] Happy path works end to end: harness P1–P4 are the app's own flows (move, hospital, foster/adopt/return, deceased and undo) at the database
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface
- [x] Create / edit / delete all exercised (whichever the feature has): inserts of every placement type, notes edit, refused `end_date` edits
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: refusals say which placement type cannot target which pseudo-enclosure, and that `end_date` is set only by `close_prior_placement()`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): no enclosure but Lifecycle zone; DeceasedInError into Hospital; Intake into a physical enclosure

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | edit `end_date`; undo a death | refused; allowed | passed (harness R1, P2, P4) |
| management | same policy text as staff | refused | not driven separately; the trigger does not look at role |
| staff | edit `end_date`; every placement type | refused; allowed to the right target | passed (harness R1, R3, P1–P4) |
| vet | no placement write | unchanged | no insert or update policy |
| volunteer | ChangeEnclosure insert | allowed to physical, refused to Deceased/Adopted | passed (harness P1, R3) |
| signed out | nothing | refused | unchanged |

- [x] Every role above tested: volunteer, staff and admin driven as `authenticated` with claims; management shares staff's policy and the trigger does not look at role; vet and anon have no placement write policy
- [x] A role that should not have access is blocked server-side: yes, by trigger, for every role including the table owner

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can reach changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings; the refusals are unreachable through the app
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: no UI change
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): no page loaded. The app's placement writers (`move.ts`, `hospital.ts`, `rehome.ts`, `deceased.ts`, `record_intake`, `undo_deceased_placement`) each have their type and target reproduced in the harness and pass
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-01-placement-history-guards.md` (flag mechanism, why a trigger and not RLS, the type/target table, DeceasedInError, INSERT-only)
- [x] `README.md` still accurate: it does not list triggers
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no UI surface; the refusals are unreachable through the app, which the harness's flow cases prove
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned**: dev's mismatched rows come from a query on 2026-10-01; every behaviour claim comes from the harness run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager (SQL only, already on the dev database that `test.lannacare.org` reads)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the type/target table is covered case by case on both sides (allowed and refused)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public view reads this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No: no `src/` change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan (production reads are refused from feature worktrees)
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no data rewritten
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy (see §3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: no Worker change, so `wrangler rollback` does not apply. Undoing the migration is the three statements in §3 and loses nothing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty. There is no screen; the refusals are unreachable through the app.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: the manual list is empty — schema-only change, verified by the rollback harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this plan rather than duplicating it
- [x] Handed to the production release manager: the PR states the production apply as Lutan's

Result: pass

Release manager acknowledgement: n/a: schema PR; acknowledged at release time
