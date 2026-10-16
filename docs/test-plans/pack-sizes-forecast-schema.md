# Feature test plan — pack-sizes-forecast-schema

## Header

| | |
|---|---|
| Feature | Part (d) of Pack sizes, the rest: diet_forecast and cashflow_forecast price at the latest priced delivery, falling back to the typed price |
| Backlog item | `docs/backlog.md` → **Pack sizes, the rest** (left open, part (d) note added) |
| Branch / worktree | `claude/pack-sizes-forecast-schema` @ `C:\Development\Animal_Shelter_pack-sizes-forecast-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | yes — `0211_forecasts_use_delivery_cost.sql` |
| Tested at SHA | `1a235556` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (d) only: both forecasts price at the latest priced delivery, else the typed price
- [x] Files/areas touched listed — `supabase/migrations/0211_forecasts_use_delivery_cost.sql`, backlog note, decision file, this plan
- [x] Roles affected identified — Cashflow and Diet pages (admin, management) may show different baht figures when a priced delivery exists; no access rule changed
- [x] Anything explicitly **out of scope** written down — parts (a), (b), (c), the screens; the item stays open

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Read directly:

```
=== gates: build exited 0 after 166s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0211 against 0210 (`check-migration-numbers` ok)
- [x] `--status` reviewed before applying — dev 211 applied, 1 pending
- [x] `--dry-run` reviewed — `0211 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0211_forecasts_use_delivery_cost.sql … ok`
- [x] File is re-runnable — `create or replace` only; the harness ran it once inside a transaction before the real apply
- [x] Existing rows still read correctly — window 2026-10-16 to 2026-12-31 on dev, before and after
- [x] **Exercised against real rows** in a rolled-back DO block. Asserted by reading the output: (1) no priced diet delivery, both diets and the whole Cashflow food line identical to before (Renal 762,930; Kibble 34,188; food 166,134 / 310,320 / 320,664), so the fallback does not move or null anything; (2) a 24-can delivery at 2,400 inserted for Renal diet gives 100 a can instead of the typed 180, Renal cost 762,930 to 423,850 (4,238.5 cans x 100) and Cashflow food October 166,134 to 95,454; (3) FBC medication has a priced delivery (200 for 150 = 1.333 a unit against typed 12.50), Cashflow medication October 1,554 to 1,375.33 and November 2,691.25 to 2,467.92, other medications and December unchanged; (4) quantity is in base units so no pack size enters the division
- [ ] Down-migration written — n/a: `create or replace`; 0183 and 0051 hold the old bodies
- [x] Production apply plan — with the next release, before the deploy; run `--status --env production` first as other files may be pending

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, SQL only; numbers proved in section 3
- [ ] Data persists — n/a: no UI surface, SQL only
- [ ] Create / edit / delete all exercised — n/a: no UI surface, SQL only
- [ ] Empty state renders sensibly — n/a: no UI surface; a window with no diets returns no rows, as before
- [ ] Invalid input is rejected with a readable message — n/a: no UI input
- [ ] Boundary cases checked — n/a: priced delivery, fallback and zero typed price covered in section 3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Cashflow, Diets | unchanged | n/a — no policy changed |
| management | Cashflow, Diets | unchanged | n/a — no policy changed |
| staff | nothing | nothing | n/a — retired role |
| doctor | nothing | nothing | n/a — no policy changed |
| volunteer | nothing | nothing | n/a — no policy changed |
| signed out | nothing | nothing | n/a — no policy changed |

- [ ] Every role above tested — n/a: no grant or policy changed; both functions keep their security-invoker form and signatures
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build compiles every reader; both functions keep their signatures and return shapes
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, parts (a), (b), (c) remain; note added
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-forecasts-use-delivery-cost.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: production applies 0211 with the release, an outstanding step, so a note now would promise users something not yet true
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — figures are from the dev harness output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff changed
- [ ] **Evidence pasted into this plan is the tool actual output, unedited** — n/a: figures are quoted from the harness output in section 3; gates lines are verbatim
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: migration only; existing callers keep working before and after
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: two function bodies replaced, no data touched
- [ ] Apply plan stated — deferred: release manager; one file, production project, any time before the next deploy

### Rollback

- [ ] Rollback position stated — n/a: re-run the old bodies from 0051 and 0183 in a new file; no data was changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, SQL only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
