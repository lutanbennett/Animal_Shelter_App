# Test plan — schema-weight-one-per-day

## Header

| | |
|---|---|
| Feature | One weight per vet visit and one per resident per day, held by the database: `0106_weight_one_per_visit_and_day.sql` adds `weight_one_per_visit` (partial unique on `vet_appointment_id`) and `weight_one_per_day` (unique on `resident_id, date`) |
| Backlog item | `docs/backlog.md` → "One weight per vet visit: hide visits that already have one." (ticked by the feature PR, `claude/one-weight-per-visit`, which carries the form half) |
| Branch / worktree | `claude/schema-weight-one-per-day` @ `C:\Development\Animal_Shelter_schema-weight-one-per-day` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #187 |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | yes — `0106_weight_one_per_visit_and_day.sql` |
| Tested at SHA | the commit adding this plan, on `origin/main` @ `0700a9e` (`sync`: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a second weight on a vet visit, or a second weight for a resident on one day, is refused by the database — the item's "back it with a constraint rather than only the form — a unique index on the linking column", plus the per-day rule Lutan added the same day
- [x] Files/areas touched listed: `supabase/migrations/0106_weight_one_per_visit_and_day.sql`; `scripts/check-weight-one-per-day.mjs` (rollback harness); `docs/decisions.md`; this plan. No route, component, lib or `worker/` change
- [x] Roles affected identified: every role that writes `weight` (admin, staff, vet via the `for all` policies from `0001`; management has no weight policy) is held to the same two rules; volunteer and signed-out public cannot write `weight` before or after. No policy or grant changes
- [x] Anything explicitly **out of scope** written down: the form half — picker filter, the edit page, the same-day correction, readable error text — is the feature PR `claude/one-weight-per-visit`, synced onto `main` after this merges. Until then a second reading on a taken day or visit fails in the current form with the raw constraint message

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.` with `origin/main` @ `0700a9e`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 58s
=== gates: lint exited 0 after 105s
=== gates: build exited 0 after 323s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: #187 at `62579a6` — `check` pass (1m46s), `migration-numbers` pass, `test-plan` pass

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one: `origin/main` tops out at `0105_vets_readonly_for_vets.sql`; `gh pr list --state open` was empty; the brief gives this batch's one migration slot to this item
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: dev at 105 applied, `0106` the one pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 105 applied, 1 pending.
dry-run 0106_weight_one_per_visit_and_day.sql … ok
Dry run only — nothing was applied.
```

- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`:

```
Environment: test — project qxkmhwybjggxvsfxsxbd
This checkout: 105 applied, 1 pending.
applying 0106_weight_one_per_visit_and_day.sql … ok
```

  `--status` afterwards: `Against origin/main 0700a9e: 105 file(s), 106 applied row(s).` / `Applied here, no file on origin/main: 1` / `0106_weight_one_per_visit_and_day.sql` — expected until this PR merges

- [x] File is re-runnable: the clean-up `update` is a no-op once nothing is duplicated, the guard only reads, both indexes are `create unique index if not exists`, `comment on` repeats; the harness runs the whole file twice
- [x] Existing rows still read correctly after the change (checked against real dev data): **duplicates counted before the file was written** — dev: 23 readings, 7 linked, 0 visits with two readings, 0 resident-days with two (max 1 per day); both indexes built over all of them on apply. The AppSheet snapshot the production import is built from (`appsheet-export/latest/Weight.csv`): 18 readings, no same-day pair; its one pair sharing a visit id (`79e45e85`, 7 and 9 July) names a visit absent from `Vet_Appointments.csv`, so the importer loads both unlinked
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: `node scripts/check-weight-one-per-day.mjs`. A harness resident taken in through the real `record_intake` with an intake weight, and two visits (one on the intake day). Asserted: **0** two readings planted on one visit before the file → the older is unlinked and kept, the newer keeps the visit; **A** a second reading on a visit that has one, on a free day, is refused by `weight_one_per_visit` specifically; **B** a second unlinked reading on a taken day, and a visit's reading on the intake reading's day, are both refused by `weight_one_per_day` specifically; **C** unlinked readings on two different days are accepted (the visit index is partial, so unlinked readings don't collide); **D** correcting the intake reading in place — new kg, linked to the same-day visit — is allowed and leaves exactly one reading that day; **E** a same-day duplicate present at apply time makes the file refuse, naming the resident, and it chooses nothing. Output, unedited — first with the file pending on dev, then after the apply:

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0106_weight_one_per_visit_and_day.sql ran twice | pending on dev | 0: planted pair → older unlinked and kept, newer still linked | A: second reading on a visit refused by weight_one_per_visit | B: second reading on a day refused by weight_one_per_day (unlinked, and a visit on intake day) | C: unlinked readings on two different days accepted | D: intake reading corrected in place and linked to the same-day visit | E: same-day duplicate at apply time → file refuses, naming the resident
CONTEXT:  PL/pgSQL function inline_code_block line 175 at RAISE
```

```
status 400
Failed to run sql query: ERROR:  P0001: HARNESS-OK 0106_weight_one_per_visit_and_day.sql ran twice | applied on dev | 0: skipped, file already applied on dev | A: second reading on a visit refused by weight_one_per_visit | B: second reading on a day refused by weight_one_per_day (unlinked, and a visit on intake day) | C: unlinked readings on two different days accepted | D: intake reading corrected in place and linked to the same-day visit | E: same-day duplicate at apply time → file refuses, naming the resident
CONTEXT:  PL/pgSQL function inline_code_block line 175 at RAISE
```

- [x] Down-migration written, or the reason one is not needed is stated: none written. The inverse is `drop index if exists weight_one_per_visit; drop index if exists weight_one_per_day;`. The clean-up `update` changed no row on dev (no duplicates), so there is nothing to restore
- [x] Production apply plan stated for the release manager: **needs Lutan's go**, from the main checkout after merge: `node scripts/apply-migrations.mjs --env production --status`, `--dry-run`, then apply to `dbkodyyxxhtygxcxmfcu`. If production holds same-day duplicates the dry-run fails naming them, and a person resolves them before the apply. Independent of the deploy — no code in this PR

## 4. Functional checks

- [x] Happy path works end to end: one reading per day, linked or not, still inserts; a correction in place still updates (harness C, D)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI; the indexes persist on dev (harness second run, `applied on dev`)
- [x] Create / edit / delete all exercised (whichever the feature has): insert refused and allowed (A, B, C); update in place allowed (D). Delete is not constrained
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI in this PR; the feature PR maps both index names to sentences
- [x] Boundary cases checked: the collision the per-day rule was written for (a vet's reading on the intake day, B), which of the two rules refuses each case (constraint name asserted in A and B, not assumed), and duplicates present at apply time (E)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `weight` insert/update | one per day, one per visit | n/a: an index holds for every writer regardless of role; RLS is unchanged by this file |
| management | `weight` | no policy, unchanged | n/a: this file changes no policy |
| staff | `weight` insert/update | one per day, one per visit | n/a: as admin |
| vet | `weight` insert/update | one per day, one per visit | n/a: as admin |
| volunteer | `weight` read | unchanged | n/a: this file changes no policy |
| signed out | `weight` | no access | n/a: this file changes no grant |

- [ ] Every role above tested — n/a: a unique index is not role-dependent, and no policy or grant changed
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: access is unchanged by this file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual text on one weight per day ships with the form in the feature PR
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no client code changed
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: `record_intake` with a weight (what `/residents/new` calls) still writes its reading under the new indexes (harness setup), and reads of `weight` are unaffected by an index
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` merged nothing new; gates run after it, all 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this is the schema half; the item asks for the picker filter too, so the feature PR ticks it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-27 — two indexes for two rules, the duplicate counts, clean-up by rule (unlink per visit, refuse per day) and the intake case
- [ ] `README.md` still accurate — n/a: README does not list table constraints
- [ ] **Release notes.** — n/a: nobody would notice — no page changes, and neither dev nor the import source has a reading the rules would refuse; the user-facing line comes with the form in the feature PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Duplicate counts are query output against dev and a read of `Weight.csv` / `Vet_Appointments.csv`; the per-rule behaviour is harness output above, with the refusing constraint's name asserted

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the file derives no date; `weight.date` is a `date` the app writes
- [ ] **Boundary or banding change covers both edges** — n/a: not a threshold; both sides of each rule (refused and allowed) are in harness A–D
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page reads `weight`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no code in this PR. The feature PR's code works with or without the indexes (it only turns their refusals into sentences), so apply order against its deploy does not matter either
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, from the main checkout
- [ ] For a **destructive or rewriting** migration only: a production backup exists — deferred: Lutan — the clean-up `update` rewrites `vet_appointment_id` on any same-visit duplicate; the production dry-run shows whether there are any, and a backup is only needed if there are
- [x] Apply plan stated: `0106_weight_one_per_visit_and_day.sql` → production `dbkodyyxxhtygxcxmfcu`, any time after merge, independent of the deploy (§3)

### Rollback

- [x] Rollback position stated, **including what it does not cover**: the Worker is unchanged by this PR, so `wrangler rollback` does nothing here. Reverting means dropping the two indexes in a new file (§3); a visit link unset by the clean-up would not come back from that, and on dev there were none

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

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface — nothing a person could look at changes; both rules are asserted in the harness

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR (#187 body)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
