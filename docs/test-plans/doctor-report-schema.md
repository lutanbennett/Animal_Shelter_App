# Feature test plan — doctor-report-schema

## Header

| | |
|---|---|
| Feature | Schema half of the doctor's report on a clinic visit: `attachments.purpose` (`bill`/`report`), doctor own-clinic rule for visit reports, Bills readers filtered to bills |
| Backlog item | `docs/backlog.md` → **Attach the doctor's written report to a clinic visit** (left open; the app half ticks it) |
| Branch / worktree | `claude/doctor-report-schema` @ `C:\Development\Animal_Shelter_doctor-report-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-18 |
| Carries a migration? | yes — `0220_doctor_report_purpose.sql` |
| Tested at SHA | `67430daa` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) only: a way to tell a report from a bill on a visit, the permission rules, and bills reading only bills
- [x] Files/areas touched listed — `supabase/migrations/0220_doctor_report_purpose.sql`, `src/lib/bills/photos.ts`, `src/app/bills/page.tsx`, `scripts/check-doctor-report-schema.mjs`, decision file, this plan
- [x] Roles affected identified — none sees a change today (no report can be created yet); a doctor login gains the ability to file/read visit *reports* at its own clinic, never bills
- [x] Anything explicitly **out of scope** written down — all screens, upload, Drive filing, resident list, manual, dictionaries (the app half, `clinic-visit-record`); reading report text into notes

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`, read from the output:

```
=== gates: build exited 0 after 210s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0220` against highest `0219`; `check-migration-numbers` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — pending only `0220`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0220 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0220_doctor_report_purpose.sql … ok`
- [x] File is re-runnable — `add column if not exists`, constraints guarded by `pg_constraint`, `create or replace`, `drop policy/function if exists`
- [x] Existing rows still read correctly after the change — **the quiet-breakage gate, named separately:** dev before: `clinic_visit` 2, `stock_receipt` 1, `maintenance_bill` 2 attachments; after: the same five, every one `purpose = 'bill'`; 350 rows total, 0 null purpose. `check-bill-photos-listed.mjs`: 21 checks held
- [x] **Constraints and defaults exercised against real rows** — `check-doctor-report-schema.mjs` (rolled back): default is `bill`; bill+report on one visit, the bill query returns only the bill; report on a resident refused; management add/remove ok; volunteer sees none and cannot add; doctor adds/reads a report at own clinic (insert and `record_attachment`), refused at another clinic, refused a bill, cannot read a bill. Result `HARNESS-OK`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive column with a default; undo steps are in the file header
- [x] Production apply plan stated for the release manager — **`0220` must be applied BEFORE this PR's code deploys**: `loadBillPhotos()` and the Bills inbox now select on `purpose`, so code without the column errors

## 4. Functional checks

- [x] Happy path works end to end — the read paths that already run (bill photos, Bills inbox held-set) were exercised by the harness's bill query and `check-bill-photos-listed.mjs`; no report UI exists
- [ ] Data persists — n/a: no UI surface; persistence of `purpose` shown by the 5 rows read back after apply
- [ ] Create / edit / delete all exercised — n/a: no UI surface; create/delete asserted in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface; a visit with no bills still returns an empty list (same query plus a filter)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; bad purpose / report on non-visit refused by the database in the harness
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | visit bills/reports | unchanged (medical.visits) | n/a — no staff policy changed |
| management | visit reports | read/add/remove | pass — harness C |
| staff | n/a | unchanged | n/a — no policy changed |
| doctor | reports on own-clinic visits | add/read; not bills; not other clinics | pass — harness D |
| volunteer | none | none | pass — harness C |
| signed out | nothing | nothing | n/a — no grant to anon changed |

- [x] Every role above tested — as marked: roles with a changed rule were asserted through real JWTs; unchanged ones n/a'd above
- [x] A role that should not have access is blocked server-side — volunteer and doctor-at-other-clinic refused by RLS and `record_attachment`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: nothing a user can do yet; app half writes the topic
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build gate compiles the two edited readers; harness ran the exact bill queries
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only two query filters touched, both covered by the harness
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; the app half ticks it. No other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-18-doctor-report-schema.md`, with "What the app half must do"
- [x] `README.md` still accurate — it does not list attachment columns
- [ ] **Release notes.** — n/a: a shelter user cannot do anything new until the app half lands
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — row counts and behaviours come from dev queries and the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (Bills inbox still lists a visit bill photo)
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates derived
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public view reads this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — yes: `loadBillPhotos()` and the Bills inbox read `purpose`. Production must get `0220` first
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0220` on production before the code deploy

### Rollback

- [x] Rollback position stated — older code ignores the column; the default keeps old writers writing bills

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `worktree.mjs sync` pushed the branch before this plan existed (the brief asked not to) | accepted — only CI's test-plan check was briefly red |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing a user can do yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
