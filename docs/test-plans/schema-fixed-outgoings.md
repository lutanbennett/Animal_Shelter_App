# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Schema half of fixed monthly outgoings: the `fixed_outgoings` table (0114) and its Data API grant (0115) |
| Backlog item | `docs/backlog.md` → Fixed monthly outgoings in the cashflow forecast, as settings, not payroll (not ticked; batch 11's feature half closes it) |
| Branch / worktree | `claude/schema-fixed-outgoings` @ `C:\Development\Animal_Shelter_schema-fixed-outgoings` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not used: no UI surface) |
| PR | linked from the PR itself |
| Tested by / date | Claude (schema-fixed-outgoings session), 2026-09-29 |
| Carries a migration? | yes, `0114_fixed_outgoings.sql` and `0115_fixed_outgoings_grants.sql` |
| Tested at SHA | `d83a88c` (gates and harness); later commits are this plan only |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a small `fixed_outgoings` table (label, monthly baht amount, note, active, optional start/end month), admin and management only, with no person key and a 24-line cap, plus anon refusal checks in `check-public-views.mjs`
- [x] Files/areas touched listed: `supabase/migrations/0114_fixed_outgoings.sql`, `0115_fixed_outgoings_grants.sql`, `scripts/check-public-views.mjs`, `scripts/check-fixed-outgoings.mjs`, `docs/backlog.md`, `docs/decisions/2026-09-29-fixed-outgoings-not-payroll.md`, this plan. Nothing under `src/` or `worker/`
- [ ] Roles affected identified — n/a: no code reads or writes the table yet, so no role sees a change; the access rule (admin and management only) is asserted in section 4
- [x] Out of scope written down: the edit page, the `cashflow_forecast` lines, the whole-months-or-pro-rata decision, manual, dictionaries and the releases line, all in `fixed-outgoings-cashflow` (batch 11). Payroll is out of scope permanently (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (migration numbers ok against `origin/main` a15573a, highest 0113)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. (The first run failed lint: `check-migration-grants.mjs` wants the grant in the file that creates the table; fixed in 0114, see Defects.)

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0113), and no other in-flight branch carries one (batch 10's only slot). 0115 is a second file in the same PR
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying: 113 applied, 0 pending, in step with `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed: `0114 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0114_fixed_outgoings.sql … ok`, `applying 0115_fixed_outgoings_grants.sql … ok`; then `115 applied, 0 pending`
- [x] Files are re-runnable (`create table if not exists`, `drop … if exists` before each policy and trigger, `create or replace` function); the harness runs the file twice. 0114 was edited after its dev apply to add the grant the lint requires: safe because it is unmerged, never reached production, has no checksum, and is idempotent; 0115 repeats the grant so dev and production apply the same numbered list
- [x] Existing rows still read correctly after the change: the table is new and starts empty (asserted)
- [x] Constraints exercised in a `begin; … rollback;` harness (`node scripts/check-fixed-outgoings.mjs`). Asserted: amount round-trips; negative amount, blank label, mid-month start, mid-month end, end before start and a case/space-variant duplicate label are all refused; the 25th row is refused; `updated_at` is kept on a no-op update and the touch trigger exists; anon holds no grant; RLS is on with exactly two policies, both naming only admin or management; the only foreign key is `updated_by` to `auth.users`. Output ended `HARNESS-OK checks: …`
- [x] Down-migration: not needed. A new empty table nothing reads; leaving it is safe
- [x] Production apply plan for the release manager: apply 0114 and 0115 to production (`dbkodyyxxhtygxcxmfcu`) with `node scripts/apply-migrations.mjs --env production` before the feature half deploys

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this table yet (database behaviour is covered by the section 3 harness)
- [ ] Data persists — n/a: no UI surface, no code reads this table yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update were exercised in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads this table yet
- [x] Invalid input is rejected: every check listed in section 3 (harness). A readable message for the user is the feature half's job
- [x] Boundary cases checked: 24 rows accepted, 25th refused; start and end on the 1st accepted, mid-month refused; end before start refused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `fixed_outgoings` via policy `admin_all_fixed_outgoings` | read and write | policy present (harness); no UI to exercise it yet |
| management | `fixed_outgoings` via policy `management_all_fixed_outgoings` | read and write | policy present (harness); no UI to exercise it yet |
| staff | nothing | refused | no policy names staff (harness asserts exactly two policies, both admin/management) |
| vet | nothing | refused | as staff |
| volunteer | nothing | refused | as staff |
| signed out | the table, any public view, `site_content`, via `/rest/v1` | refused | `check-public-views.mjs`: GET, POST and PATCH on `fixed_outgoings` all HTTP 401; `monthly_amount` HTTP 400 (no such column) on every public object; no `FAIL`, exit 0 |

- [ ] Every role above tested — n/a: staff, vet and volunteer refusal is shown by the absence of any policy for them, not by signing in as each; a real signed-in check belongs to the feature half, when a page reads the table
- [x] A role that should not have access is blocked server-side: anon is refused by the API itself (above), not by a hidden control

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface, no code reads this table yet
- [ ] Translatable strings — n/a: no UI surface, no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: covered by the build passing and by `check-public-views.mjs` finding every public view still readable by anon after the migration (no `FAIL`)
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; batch 11's feature half closes it. A note recording the schema half and the start/end-month decision is on the item
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-09-29-fixed-outgoings-not-payroll.md` (payroll deliberately dropped and why, the 24-line cap, own table not `site_content`, start/end month)
- [x] `README.md` still accurate: it does not describe this table
- [ ] **Release notes.** n/a: nobody would notice a table that nothing reads yet
- [x] Commit messages say why, not just what
- [x] Claims in the commit and `docs/decisions/` were measured: the cap, checks and anon refusal are asserted by scripts run against dev, not reasoned from the SQL

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: `starts_on`/`ends_on` are plain dates checked for day 1; nothing here reads the clock
- [ ] Boundary or banding change covers both edges — n/a: the boundaries (24/25 rows, day 1) are asserted on both sides in the harness
- [ ] Evidence pasted into this plan is the tool's actual output — n/a: the `gates:` line is verbatim; the harness result is quoted from its `HARNESS-OK` line
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: migration only, no code reads it; the feature half ships later and its production apply precedes it
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: a new empty table, nothing rewritten
- [ ] Apply plan stated: 0114 then 0115 to production, before any deploy of the feature half — deferred: release manager

### Rollback

- [ ] Rollback position stated — n/a: an unused empty table is safe to leave; `wrangler rollback` is unaffected as no Worker code changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First gates run failed lint: table grant missing from the creating file (`check-migration-grants.mjs`) | fixed: grant added to 0114, repeated in 0115 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing yet: once the feature half's page exists, read and write the table as admin and management, and confirm staff cannot | batch 11 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (schema-fixed-outgoings session)  Date: 2026-09-29

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI surface, so nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, follows the merge

Result: pass

Release manager acknowledgement: pending
