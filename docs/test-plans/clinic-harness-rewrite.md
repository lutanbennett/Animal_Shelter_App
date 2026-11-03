# Feature test plan — clinic-harness-rewrite

## Header

| | |
|---|---|
| Feature | Three clinic/doctor check harnesses rewritten to the card model; `loadClinicScope()` replaced by the constant `ANY_CLINIC_SCOPE` |
| Backlog item | `docs/backlog.md` → **THE THREE CLINIC/DOCTOR HARNESSES ASSERT THE RETIRED PER-CLINIC MODEL …** (ticked, retitled DONE) |
| Branch / worktree | `claude/clinic-harness-rewrite` @ `C:\Development\Animal_Shelter_clinic-harness-rewrite` |
| Dev server | `http://localhost:3001` |
| PR | filled in on the PR itself |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | TESTED_SHA |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the three harnesses now assert the card model and pass, and the per-page clinic-scope query is gone
- [x] Files/areas touched listed — `scripts/check-clinics-readonly.mjs`, `scripts/check-doctor-multi-clinic.mjs`, `scripts/check-doctors.mjs`, new `scripts/lib/rollback-harness.mjs`, `src/lib/clinics/scope.ts` and the eight files that call it (`appointments/page`, `NavPane`, `residents/page`, `clinic-visits/new/{page,actions}`, `clinic-visits/[id]/page`, `clinic-visits/[id]/edit/{page,actions}`), `src/lib/clinics/appointments.ts` (comment), decision file, backlog tick, this plan
- [x] Cards affected identified — none change: no policy, card or access rule moved. The harnesses assert `clinics.list`, `visit.book`, `medical.visits`, `clinics.doctors`, `resident.record`. The app change returns the same `any` every login already got. Admin and signed-out unaffected
- [x] Anything explicitly **out of scope** written down — deleting the dead `"clinics"`/`"unlinked"` branches, the `/appointments` page and their dictionary strings (dictionaries are another stream's this batch); any migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in (only backlog commits had landed)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`. Run output:

```
GATES_OUTPUT
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration, none allowed in this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the three rewritten harnesses are exactly that, run against dev: `check-clinics-readonly` (clinics.list read/edit/none, policy text), `check-doctors` behaviour and rls (book-only login refused 42501 when a typed name would add a doctor, allowed for an existing name or an id; with `clinics.doctors` adds and renames), `check-doctor-multi-clinic` (A moves/swaps/typed names, B spellings, C no per-clinic reach, D visit.book/medical.visits with no clinic term, E logins, F clinics.doctors, G merges, H old functions gone). All print PASS
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — admin session on dev: `/residents` loads 214 rows with no clinic note, nav links draw, `/operations` to `/upcoming-visits` to `/clinic-visits/new` offers 10 clinics with no locked clinic or doctor
- [ ] Data persists — n/a: no data written by the app change
- [ ] Create / edit / delete all exercised — n/a: the app change writes nothing; the booking and edit server actions changed only where the scope constant is read, and were not submitted
- [ ] Empty state renders sensibly — n/a: no empty state involved
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no boundary changed

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents`, `/clinic-visits/new` via clicks | unchanged: loads, no clinic scope note, all clinics offered | as expected |
| exactly one card | n/a: not driven; the constant is the same value every login already received (`current_user_clinic_ids()` is `{}`), so no login's view could differ | | not run |
| signed out | n/a: these pages sit behind sign-in, unchanged | | not run |

- [x] Every login above tested — admin driven; the rest are marked not run with the reason in the table
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed (the server and database checks are untouched)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added or moved; `NavPane` links were read in the browser and are unchanged
- [ ] Manual updated — n/a: nothing a shelter user sees changed
- [ ] Translatable strings — n/a: no string added or changed
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — no errors reported by the dev server while clicking through the pages above
- [ ] Network clean — n/a: not inspected beyond the pages loading

## 6. Regression

- [x] The pages nearest the change still work — `/residents`, `/operations`, `/upcoming-visits`, `/clinic-visits/new` loaded by clicking through; `/appointments`, the visit detail and edit pages were type-checked and built but not opened
- [x] Any shared file touched checked from a second, unrelated page — `NavPane` (draws on every page) was seen on `/residents` and `/operations`; `scope.ts` is read by `/residents` and `/clinic-visits/new`
- [x] Nothing merged from `main` during `sync` was broken by this branch — only backlog documentation commits came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-03-clinic-harness-rewrite.md`
- [x] `README.md` still accurate — it does not describe these harnesses or the scope file
- [ ] **Release notes.** n/a: no shelter user would notice — the scope loader returned "any clinic" for every login already, so every page shows what it showed before; the rest is test scripts
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Section A's cause was shown by giving the harness actor `clinics.doctors` and watching A pass with its assertion unchanged; the importer count (eight in code, two in comments only) is from `grep`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic touched
- [ ] **For a boundary or banding change** — n/a: no boundary or band changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the gates output, copied from the run
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: a revert of this PR is the whole rollback; no schema or data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/appointments` always shows its "not linked" message and `NavPane` never links it; the clinic-scope branches in the visit forms and the residents note are dead | deferred to backlog (for the planner to file; PR body) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Book and edit a clinic visit as a login holding only the booking cards, and open the visit detail page | `/clinic-visits/new`, `/clinic-visits/<id>`, `/clinic-visits/<id>/edit` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: see row 1; only the person who looked may tick it

Manual verification by: pending: one booking login opens the visit pages listed above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
