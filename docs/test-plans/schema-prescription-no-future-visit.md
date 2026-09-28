# Test plan — schema-prescription-no-future-visit

## Header

| | |
|---|---|
| Feature | A prescription is never linked to a vet visit still to come, held by the database: `0107_prescriptions_visit_not_in_future.sql` adds two triggers — `prescriptions_visit_not_in_future` (on linking) and `vet_appointments_linked_rx_not_future` (on moving a visit that has prescriptions) — plus the importer's matching guard |
| Backlog item | `docs/backlog.md` → "A prescription should not be attachable to a future vet visit." (ticked by the feature PR, `claude/prescription-no-future-visit`, which carries the form half) |
| Branch / worktree | `claude/schema-prescription-no-future-visit` @ `C:\Development\Animal_Shelter_schema-prescription-no-future-visit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | #191 |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | yes — `0107_prescriptions_visit_not_in_future.sql` |
| Tested at SHA | `61e8fd4` on `origin/main` @ `531e199` (`sync`: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: linking a prescription to a vet visit dated after today at the shelter is refused by the database, as is moving a visit that has prescriptions to after today — the item's "whether the rule belongs in the database as well as the form", answered yes as 0106 did for weight
- [x] Files/areas touched listed: `supabase/migrations/0107_prescriptions_visit_not_in_future.sql`; `scripts/check-prescription-visit-not-future.mjs` (rollback harness); `scripts/import-appsheet.mjs` (unlinks a future-visit link with a note, so a later snapshot cannot fail the import); this plan. No route, component, lib or `worker/` change
- [x] Roles affected identified: every role that writes `prescriptions` (admin, vet via `for all`; staff via 0027's insert/update policies) or `vet_appointments.appointment_date` is held to the rule; volunteer and signed-out public cannot write either before or after. No policy or grant changes on tables; `execute` on the two trigger functions is revoked from public/anon/authenticated (EXECUTE is checked when a trigger is created, not when it fires — harness A–C write as a signed-in staff user and prove the triggers still run)
- [x] Anything explicitly **out of scope** written down: the form half — picker filter, hiding Add prescription on a future visit, readable error text, `visitDate()` on the shelter day — is the feature PR `claude/prescription-no-future-visit`, synced onto `main` after this merges. Until then a stale form that links a future visit fails with the raw trigger message. Not covered: a prescription linked to *another resident's* visit (no count found any on dev, but it is a different rule)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.` with `origin/main` @ `531e199`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 88s
=== gates: lint exited 0 after 102s
=== gates: build exited 0 after 227s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #191 at `8375119` — `check` pass (1m21s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0106_weight_one_per_visit_and_day.sql`; the brief gives this batch's migration slot to this item; `check-migration-numbers` on commit: `ok — 0107_prescriptions_visit_not_in_future.sql (against origin/main 531e199, highest 0106_weight_one_per_visit_and_day.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: dev at 106 applied, `0107` the one pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 106 applied, 1 pending.
dry-run 0107_prescriptions_visit_not_in_future.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 106 applied, 1 pending.
applying 0107_prescriptions_visit_not_in_future.sql … ok
```

  `--status` afterwards: `Against origin/main 531e199: 106 file(s), 107 applied row(s).` / `Applied here, no file on origin/main: 1` / `0107_prescriptions_visit_not_in_future.sql` — expected until this PR merges

- [x] File is re-runnable: `create or replace function`, `drop trigger if exists` before each `create trigger`, idempotent `comment on` and `revoke`; the harness runs the whole file twice
- [x] Existing rows still read correctly after the change: **violations counted before the file was written** — dev: 61 prescriptions, 55 linked; 0 linked to a visit after today, 0 linked to a visit dated after the day the prescription was created, 0 linked to another resident's visit. The AppSheet snapshot (`appsheet-export/latest`, sheet modified 2026-09-21): 64 prescriptions, 59 with a visit id, 57 naming a visit the export has; 0 after today, 0 after the prescription's start date; the latest visit in the export is 2020-12-11. A trigger reads no row it is not asked to write, so it cannot fail over old data anyway
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-prescription-visit-not-future.mjs`. A harness resident with visits yesterday 10:00, tonight 23:30, tomorrow 10:00, tomorrow 06:00 (23:00Z today — the UTC-vs-shelter-day edge, and the harness asserts it is on today's UTC date) and three days ago, all built in `Asia/Bangkok`. Writes in A–D run as a **signed-in staff user through the tables** (`set local role authenticated`, JWT claims) — the second-tab / direct-API case. Asserted: **A** a new prescription on tomorrow's visit is refused with `check_violation` and the `prescriptions_visit_not_in_future:` message, and on 06:00 tomorrow too; **B** yesterday's visit, 23:30 tonight and unlinked are accepted; **C** re-linking an existing prescription to tomorrow is refused, while editing its dose, end date and notes is accepted (and landed — asserted, not assumed, since RLS filters silently); **D** a future link planted with the trigger disabled (a pre-rule row) survives edits to other columns and a resend of the same link — nothing is refused after the fact; **E** moving a visit that has a prescription three days into the future is refused with the same message prefix, while moving it a day earlier, and moving a prescription-free visit ten days into the future, are accepted. Output, unedited — first with the file pending on dev, then after the apply:

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0107_prescriptions_visit_not_in_future.sql ran twice | pending on dev | A: staff insert on tomorrow's visit refused, 06:00 tomorrow too | B: yesterday's visit, 23:30 tonight and unlinked accepted | C: staff re-link to tomorrow refused, dose/date/notes edit accepted | D: pre-rule future link survives edits, same link resent included | E: visit with a prescription cannot move past today; earlier day and prescription-free visit can
CONTEXT:  PL/pgSQL function inline_code_block line 91 at RAISE
```

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0107_prescriptions_visit_not_in_future.sql ran twice | applied on dev | A: staff insert on tomorrow's visit refused, 06:00 tomorrow too | B: yesterday's visit, 23:30 tonight and unlinked accepted | C: staff re-link to tomorrow refused, dose/date/notes edit accepted | D: pre-rule future link survives edits, same link resent included | E: visit with a prescription cannot move past today; earlier day and prescription-free visit can
CONTEXT:  PL/pgSQL function inline_code_block line 91 at RAISE
```

- [x] Down-migration written, or the reason one is not needed is stated: none written. The inverse is `drop trigger if exists prescriptions_visit_not_in_future on prescriptions; drop trigger if exists vet_appointments_linked_rx_not_future on vet_appointments;` and dropping the two functions. The file changes no row, so there is nothing to restore
- [x] Production apply plan stated for the release manager: **needs Lutan's go**, from the main checkout after merge: `node scripts/apply-migrations.mjs --env production --status`, `--dry-run`, then apply to `dbkodyyxxhtygxcxmfcu`. Independent of the deploy — no code in this PR, and the feature PR's code works with or without the triggers

## 4. Functional checks

- [x] Happy path works end to end: a prescription on a past visit, on tonight's visit, or unlinked still inserts as staff; editing one still updates (harness B, C)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI; the triggers persist on dev (harness second run, `applied on dev`)
- [x] Create / edit / delete all exercised (whichever the feature has): insert refused and allowed (A, B); update refused and allowed (C, D); visit update refused and allowed (E). Delete is not constrained
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI in this PR; the feature PR maps the `prescriptions_visit_not_in_future:` refusal to a sentence on both forms
- [x] Boundary cases checked: the shelter-day boundary both ways — 23:30 tonight Bangkok (accepted) and 06:00 tomorrow Bangkok, which is today in UTC (refused); a pre-rule link (D); a same-link resend (D); the visit side in both directions (E)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `prescriptions` insert/update, `vet_appointments` update | refused on a future visit | n/a: a trigger holds for every writer regardless of role; no policy changed |
| management | `prescriptions` | unchanged policies | n/a: this file changes no policy |
| staff | `prescriptions` insert/update | refused on a future visit | refused — harness A and C run as a signed-in staff user; B and C's allowed writes landed |
| vet | `prescriptions` insert/update | refused on a future visit | n/a: same trigger, same `for all` policy shape as admin |
| volunteer | `prescriptions` read | unchanged | n/a: this file changes no policy |
| signed out | `prescriptions` | no access | n/a: this file changes no grant on a table |

- [ ] Every role above tested — n/a: a trigger is not role-dependent; staff, the role most likely to meet it, was run as a signed-in user
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: access is unchanged by this file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual text ships with the form in the feature PR
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no client code changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the deceased cascade and its undo write `end_date` / `status`, never `vet_appointment_id` / `appointment_date`, so the column-list triggers do not fire for them (read in 0049/0073); the vet-visit edit form resends the unchanged date on every save, which the visit trigger passes on `is not distinct from` (and on a past date anyway) — exercised through the feature branch's dev server against this applied file: a normal visit edit is unaffected, moving 8 Dec 2025 → 15 Oct 2026 on a visit with a prescription is refused
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged nothing new; gates run after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this is the schema half; the item asks for the picker filter too, so the feature PR ticks it
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: the migration header carries the reasoning (triggers over a CHECK or a copied column, shelter day, counts), and the dated `docs/decisions.md` entry for the whole item is in the feature PR, which merges right after this one
- [ ] `README.md` still accurate — n/a: README does not list triggers
- [ ] **Release notes.** — n/a: nobody would notice — no page changes, and neither dev nor the import source has a link the rule would refuse; the user-facing line comes with the form in the feature PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Violation counts are query output against dev and a read of `Prescriptions.csv` / `Vet_Appointments.csv`; the per-case behaviour, including the UTC/shelter-day edge, is harness output above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [x] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** The triggers derive "today" in SQL through `shelter_today()` / `shelter_date()` (0073), not the Worker's clock, so the Workers-in-UTC concern does not reach them. The boundary is asserted with fixed instants relative to `shelter_today()`, both sides: 23:30 tonight Bangkok accepted, 06:00 tomorrow Bangkok (23:00Z today, asserted to be on today's UTC date) refused
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** Both sides of midnight Bangkok (above), and both sides of UTC's date line relative to it; the visit side both ways (E)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads `prescriptions`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no app code in this PR. The feature PR's code works with or without the triggers (it only turns their refusals into sentences), so apply order against its deploy does not matter either
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, from the main checkout
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: the file rewrites no row; it adds two triggers and their functions
- [x] Apply plan stated: `0107_prescriptions_visit_not_in_future.sql` → production `dbkodyyxxhtygxcxmfcu`, any time after merge, independent of the deploy (§3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: the Worker is unchanged by this PR, so `wrangler rollback` does nothing here. Reverting means dropping the two triggers and functions in a new file (§3); no data was changed, so nothing else to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

None — no page changed, and every behaviour is asserted in the harness.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface — nothing a person could look at changes; every case is asserted in the harness

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR (#191 body)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
