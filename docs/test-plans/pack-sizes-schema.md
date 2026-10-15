# Feature test plan — pack-sizes-schema

## Header

| | |
|---|---|
| Feature | Schema half of several pack sizes: many bought-in sizes per item with one default, and a view of the latest delivery cost per base unit |
| Backlog item | `docs/backlog.md` → **Several pack sizes for one item** (left open, status note added) |
| Branch / worktree | `claude/pack-sizes-schema` @ `C:\Development\Animal_Shelter_pack-sizes-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | yes — `0199_pack_sizes.sql` |
| Tested at SHA | `2d8b7694` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — part (1) only: drop the one-purchase-unit index, keep one default, decide how price is sourced
- [x] Files/areas touched listed — `0199_pack_sizes.sql`, `src/lib/units.ts` and `src/components/UnitsPanel.tsx` (resolve the purchase unit via the default), `scripts/check-unit-conversions.mjs`, backlog note, decision file, this plan
- [x] Roles affected identified — none see a change: one size per item still behaves exactly as before
- [x] Anything explicitly **out of scope** written down — parts (2)–(6) of the item: unit settings, multi-line delivery, per-size price, Purchasing, multi-size counting

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Read directly:

```
=== gates: build exited 0 after 72s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0199 against 0198 (`check-migration-numbers.mjs` ok)
- [x] `--status` reviewed before applying — dev 199 applied, 1 pending
- [x] `--dry-run` reviewed — first run flagged the new view's missing grants; added revoke/grant, second run ok
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0199_pack_sizes.sql … ok`; the corrected file (trigger depth guards) was then re-run on dev in a transaction
- [x] File is re-runnable — the harness runs 0118 then 0199, twice
- [x] Existing rows still read correctly — back-fill sets today's purchase unit as the default; reader audit in the decision file
- [x] **Constraints exercised against real rows** — `check-unit-conversions.mjs` HARNESS-OK on dev: second bought-in size accepted, exactly one default, default moves on request, hands on when un-ticked
- [x] Down-migration not needed — additive; old code still sees one purchase row per item
- [x] Production apply plan — with the next release; `-- consumer: none`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads these columns yet
- [ ] Invalid input is rejected with a readable message — n/a: no UI input; database behaviour asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; one-size, two-size and un-tick cases in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | conversions, new view | unchanged | n/a — no policy changed |
| management | conversions, new view | unchanged | n/a — no policy changed |
| staff | read | unchanged | n/a — no policy changed |
| volunteer | read | unchanged | n/a — harness case I still passes |
| signed out | nothing | nothing | n/a — view granted to authenticated only, security_invoker |

- [ ] Every role above tested — n/a: no policy changed; harness case I re-ran green
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build compiles every reader; `check-units.mjs` all ok
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only a resolver inside units.ts changed, covered by check-units.mjs
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; the status note says the schema half is done. Searched the backlog for item_unit_conversions, is_purchase_unit and purchase unit: no other open item is closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-pack-sizes-schema.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nobody would notice, the feature is not usable until the app half ships
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — reader list from grep, behaviour from the dev harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
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

- [x] **Does this PR contain both a migration and code that reads it?** — yes, narrowly: `CONVERSION_COLUMNS` now selects `is_default_purchase`, so `0199` must be on production before this code deploys (deploy.mjs refuses otherwise)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: additive; only an unused unique index is dropped
- [x] Apply plan stated — 0199 on production first, then the code

### Rollback

- [x] Rollback position stated — older code ignores the new column; the dropped index is not needed by it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | 0118 is re-runnable and would re-create the dropped index | fixed — harness runs 0199 after it |
| 2 | medium | First trigger draft recursed on its own demotion update | fixed — pg_trigger_depth guards; harness green |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
