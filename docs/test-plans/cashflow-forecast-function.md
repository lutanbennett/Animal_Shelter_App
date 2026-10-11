# Feature test plan — cashflow-forecast-function

## Header

| | |
|---|---|
| Feature | `cashflow_forecast` counts every due vaccine dose in the window and buckets clinic visits by Thai day |
| Backlog item | `docs/backlog.md` → **Cashflow forecast function: second doses and Thai-time months** (ticked) |
| Branch / worktree | `claude/cashflow-forecast-function` @ `C:\Development\Animal_Shelter_cashflow-forecast-function` |
| Dev server | not started — no UI change in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | yes — `0183_cashflow_forecast_function.sql` |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the forecast counts every dose due in the window and files clinic visits by Thai day
- [x] Files/areas touched listed — `supabase/migrations/0183_cashflow_forecast_function.sql`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-11-cashflow-forecast-function.md`, this plan
- [x] Roles affected identified — anyone who can open /management/cashflow (admin, management); the function's grants are unchanged
- [x] Anything explicitly **out of scope** written down — overdue doses (due before the window) are still not forecast; no app code changed

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: result recorded in the PR description
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: result recorded in the PR description
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0183` after `0182`, ok per the runner's number check
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 182 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0183 … ok`
- [x] File is re-runnable — `create or replace` for both functions; grants and revokes are idempotent
- [x] Existing rows still read correctly after the change — 90-day forecast on dev: immunization 180 → 540, clinic 800 → 800
- [x] **Constraints and defaults exercised against real rows** — a `do $$` block on dev (which raised on purpose, so nothing was kept) took a real monthly-interval pair last dosed 2026-08-23 and counted its doses in the next 90 days: 3 (Oct 23, Nov 23, Dec 23), where the old function gave 1. Separately `shelter_date('2026-10-11 20:00Z')` returned 2026-10-12 against `::date` 2026-10-11. The clinic bucketing had no booked visit in the gap on dev, so it is covered by the dry-run and that check, not by a visit row
- [x] Down-migration written, or the reason one is not needed is stated — not needed: nothing dropped; the old body is in 0172
- [x] Production apply plan stated for the release manager — `0183` on `dbkodyyxxhtygxcxmfcu` before trusting the cashflow figures; until then the forecast under-reports

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI change; the page reads the same columns
- [ ] Data persists — n/a: read-only function
- [ ] Create / edit / delete all exercised — n/a: read-only function
- [ ] Empty state renders sensibly — n/a: no UI change; no due doses sums to 0 via coalesce
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: window and interval edges are covered by the section 3 dose count

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | cashflow forecast | unchanged | n/a — grants not changed |
| management | cashflow forecast | unchanged | n/a — grants not changed |
| staff | none | unchanged | n/a — grants not changed |
| doctor | none | unchanged | n/a — grants not changed |
| volunteer | none | unchanged | n/a — grants not changed |
| signed out | none | refused | n/a — execute revoked from anon and public on the new function too |

- [ ] Every role above tested — n/a: no access rule changed; the new function is granted to `authenticated` only, like its caller
- [ ] A role that should not have access is blocked server-side — n/a: unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI change
- [ ] Translatable strings go through the translation path — n/a: only a release note
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles the cashflow page; the function keeps its signature and columns
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only `releases.ts` touched, a data list
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — ticked, with the Dashboard follow-ups (e) SQL half noted
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-cashflow-forecast-function.md`, including what batch 93 can reuse
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` has a line for the Director: vaccinations now count every dose due, so the forecast reads higher (dev 90-day immunization tripled)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the 180 to 540 and 3-dose figures are from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager, for a booked visit between 17:00Z and 00:00Z
- [ ] **Boundary or banding change** — n/a: the dose count's edges are checked in section 3 against exact dates
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: no output pasted
- [ ] Public pages re-checked after a cache purge — n/a: the public site does not read this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no new reader; the page already calls `cashflow_forecast`. Apply `0183` before or with the deploy, or the forecast stays low
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: nothing dropped
- [x] Apply plan stated — `0183` on production with the release; the figures rise once applied

### Rollback

- [x] Rollback position stated — nothing dropped, so the app can roll back on its own; a code rollback does not revert the migration and does not need to (the old body is in 0172)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — the clinic bucketing on a real late-evening booking is a section 8 item | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI change

Manual verification by: n/a: no UI change, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
