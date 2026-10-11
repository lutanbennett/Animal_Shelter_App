# Feature test plan — vaccine-stock-forecast

## Header

| | |
|---|---|
| Feature | Vaccines section on Management → Medications: doses due per vaccine over 7 / 30 / custom beside doses held, with a Short-by warning; stock entry on Settings → Immunization types |
| Backlog item | `docs/backlog.md` → **Vaccine stock forecast: which vaccines, how many doses, when** (ticked); *Dashboard follow-ups* (f) now fully closed |
| Branch / worktree | `claude/vaccine-stock-forecast` @ `C:\Development\Animal_Shelter_vaccine-stock-forecast` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not driven; see §4) |
| PR | filled in on opening |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | no — uses `0183` and `0185` (both merged, both applied to dev) |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — doses due per vaccine over 7 / 30 / custom beside stock on hand with a warning when short, stock read like Medications and Diets
- [x] Files/areas touched listed — `src/app/management/medications/` (page, new `VaccineStockSection.tsx`), `src/app/admin/immunization-types/` (page, table, actions), both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, one decision file, this plan
- [x] Roles affected identified — anyone who can open Medication stock sees the section; only `reference.types` (admin) can enter counts
- [x] Anything explicitly **out of scope** written down — Stocktake sheet counting, vaccine deliveries, reorder flag and days-of-stock (decision file, "Not done")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run after the schema PR merged; `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 178s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; `0183` and `0185` were already applied there
- [ ] File is re-runnable — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — read-only queries on dev: 4 overdue next-due rows, 5 doses due in the next 30 days, 7 residents with any vaccine record of 90
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: no schema change here; the harness for `0185` is in `vaccine-stock-schema.md`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — this PR needs `0183` and `0185` on `dbkodyyxxhtygxcxmfcu` first; the PR body says so

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven in a browser this session (needs a signed-in admin); listed under Left for manual verification
- [ ] Data persists — n/a: not driven; see Left for manual verification
- [ ] Create / edit / delete all exercised — n/a: not driven; saving a count goes through `updateImmunizationType`, which only names `stock_on_hand` when it changed
- [ ] Empty state renders sensibly — n/a: not driven; code shows "No repeating vaccines yet." and "Not counted" without a warning
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven; client and server both refuse negative or non-numeric counts with `stockInvalid`
- [ ] Boundary cases checked — n/a: not driven; see Left for manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Vaccines section, count entry | yes | not driven — left for manual verification |
| management | Vaccines section | yes, no count entry | not driven — left for manual verification |
| staff / vet / volunteer | Medication stock | per existing `stock.medications` | n/a — no permission changed |
| signed out | nothing | nothing | n/a — page guard unchanged |

- [ ] Every role above tested — n/a: not driven this session; left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; the page guard is the existing `requirePermission("stock.medications")` and the count write keeps `reference.types`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new route, no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — a paragraph in "Managing medications"
- [x] Translatable strings go through the translation path — both dictionaries updated (`management.vaccines`, `admin.immunizationTypes.table` and `errors`); vaccine names go through `localLabel`
- [ ] Mobile viewport (375px) — n/a: not driven; the table scrolls horizontally like the others
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — the build compiled Medications and Immunization types
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file (`NavLinks.tsx`, shared libs) touched; `en.ts` and `th.ts` only gained keys
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — and *Dashboard follow-ups* (f) noted fully closed. Sweep: searched `immunization`, `interval_months`, `FIXED_FORECAST_DAYS`; no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-11-vaccine-stock-forecast.md`
- [x] `README.md` still accurate — it does not describe the Medications page in this detail
- [x] **Release notes.** `unreleased` gained a line for the person who buys vaccines. The decision file records no outstanding manual step for a user: applying `0183` and `0185` is the release's normal migration gate, done before the release is cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — dev counts come from queries; the "never returns overdue" claim comes from reading the function (it steps forward from the last dose)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: release manager, with the manual verifier; overdue compares `next_due_date` to the shelter's today (`todayIso`), so the 00:00 to 07:00 Thai-time window is the one to check
- [ ] **Boundary or banding change** — n/a: no threshold changed; the shortfall is `max(0, needed − stock)`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no migration here, but the code reads `0183` and `0185`: both must be on production before this deploys
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [x] Apply plan stated — `0183` and `0185` on production before this deploy

### Rollback

- [x] Rollback position stated — code-only: a Pi `--ref` rollback removes the section; the columns stay and are ignored by older code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The page was not driven in a browser, so rendering, the management role's read access to `immunization_next_due` and `resident_current_state`, and the count-entry flow are unverified | accepted: recorded gap, closed by the manual verification table below |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As admin: set a count on a vaccine (e.g. 2); Vaccines shows it with a counted date; a window needing more shows "Short by n" in red | Settings → Immunization types, Management → Medications |
| 2 | As management: the Vaccines section loads with no "Couldn't load" error (read access to the two views) | Management → Medications |
| 3 | Renaming a vaccine without touching the count leaves the counted date unchanged | Settings → Immunization types |
| 4 | Pick a custom From/To: the extra column appears and the figures change | Management → Medications |
| 5 | Thai mode: headings and the note read correctly | Management → Medications |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: n/a: not yet — five items in the table above are waiting for a person

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 is recorded as an accepted gap, pending the five manual items
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
