# Feature test plan — prescription-dose-schema

## Header

| | |
|---|---|
| Feature | Schema half of the prescription schedule: `prescription_rounds.dose_quantity` (amount per round), back-filled from each prescription |
| Backlog item | `docs/backlog.md` → **Prescription schedule: three round ticks plus a notes field** (left open; status note added) |
| Branch / worktree | `claude/prescription-dose-schema` @ `C:\Development\Animal_Shelter_prescription-dose-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | TBD |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | yes — `0234_prescription_round_dose.sql` |
| Tested at SHA | TBD |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a nullable amount on each prescription round, back-filled from the prescription's single amount
- [x] Files/areas touched listed — `supabase/migrations/0234_prescription_round_dose.sql`, `docs/decisions/2026-10-20-prescription-round-dose-schema.md`, this plan
- [x] Roles affected identified — none see a change: no code reads the new column; the table's policies and grants are untouched
- [x] Anything explicitly **out of scope** written down — per-round amount boxes, readers summing per round, the frequency-screen replacement and dropping `frequency_id` are `prescription-frequency-screen`. No new note column: the existing `prescriptions.notes` is the note

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in, pushed
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 build=0` — GATES_PLACEHOLDER
- [ ] CI green on the PR — deferred: read on the PR before merging; section 2 cannot hold it yet

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0234` after `0233`; the only migration in this batch
- [x] `--status` reviewed — dev 234 applied, 1 pending, no drift
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — `applying 0234_prescription_round_dose.sql … ok` (re-applied once after removing a redundant note column from the file; dev was reset by hand first)
- [x] File is re-runnable — every statement is `if not exists` / `or replace` / `drop … if exists`; back-fill touches only null amounts
- [x] Existing rows still read correctly — `prescriptions` is untouched; the harness asserted no round differs from its prescription's amount after the back-fill
- [x] **Constraints and defaults exercised against real rows** in a `do $$ … raise exception` harness on dev, rolled back. Asserted: back-fill left zero differing rounds; editing a prescription's amount carried to its rounds; a round set by hand to a different amount survived a later edit; amount `0` refused with `check_violation`. Result: `HARNESS-OK`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive nullable column and two triggers; old code ignores them
- [x] Production apply plan stated — `0234` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in section 3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update exercised in section 3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusal of 0 is asserted in section 3
- [ ] Boundary cases checked — n/a: no UI surface; null and zero asserted in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | `prescription_rounds` | unchanged | n/a — no policy or grant changed |

- [ ] Every role above tested — n/a: no policy and no grant changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `check-medication-rounds.mjs` run: 77 held, 2 failed, both on a frequency row ("Every 6 hours (dry run)") and a diet row, unrelated to prescription rounds and not touched here
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; the schema half is done and the app half remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-20-prescription-round-dose-schema.md`
- [x] `README.md` still accurate — it does not list these columns
- [ ] **Release notes.** — n/a: nothing on screen changes; no code reads the column
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — behaviour from the dev harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0234` on production with the next release

### Rollback

- [x] Rollback position stated — code rollback does not revert `0234` and does not need to: older code ignores the column

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First draft added `schedule_note`/`_th` columns duplicating the existing `prescriptions.notes` | fixed — removed from the file before the PR |
| 2 | info | `check-medication-rounds.mjs` has 2 red back-fill checks (a frequency and a diet) | accepted — frequency and diet rows, untouched here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
