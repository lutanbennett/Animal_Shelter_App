# Feature test plan — website-switches-schema

## Header

| | |
|---|---|
| Feature | Schema half of per-statistic website switches: `impact_baselines.show_on_website`, table `public_stat_switches`, both public views honouring them, and the `page:events` hide key |
| Backlog item | `docs/backlog.md` → `#jdoto` and `#e7v1q` (both left open, status notes added) |
| Branch / worktree | `claude/website-switches-schema` @ `C:\Development\Animal_Shelter_website-switches-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-11-06 |
| Carries a migration? | yes — `0328_website_statistic_switches.sql` |
| Tested at SHA | `e5dcec82` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a switch per statistic (lifetime and live) in the database, and the `page:events` key; defaults keep today's site unchanged
- [x] Files/areas touched listed — `supabase/migrations/0328_*.sql`, `supabase/harness/0328_*_harness.sql`, `docs/hard-coded-security-registry.json` (grant-to-anon record), `docs/backlog.md` (two status notes), `docs/decisions/2026-11-06-website-switches-schema.md`, this plan
- [x] Roles affected identified — none see a change: nothing reads the new column or table yet and every default is "shown"
- [x] Anything explicitly **out of scope** written down — all of `src/` (the ticks, the confirm-then-save, null handling, dropping `noOwnSwitch`) is batch 2's `website-switches-app`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with all four exit codes 0, read from the output file:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `ls` showed `0327` highest, `gh pr list --state open` empty; `check-migration-numbers.mjs` ok
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 329 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0328 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0328_website_statistic_switches.sql … ok`; `--status` lists it as applied here with no file on `origin/main` yet
- [x] File is re-runnable — `if not exists`, `or replace`, `drop … if exists` throughout; the dry-run and the real apply both ran it clean
- [x] Existing rows still read correctly after the change — `public_shelter_stats` re-created column for column from 0124; harness compares every column before and after a switch
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev. Output: `HARNESS PASS: off keeps baseline 412/2026-01-01/2019 and restores total 423; live in_treatment null when off, others untouched; audit, page:events, anon grants ok`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the undo steps are in the migration header
- [x] Production apply plan stated for the release manager — `0328` on `dbkodyyxxhtygxcxmfcu` with the release carrying the app half; nothing reads it before then

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence asserted in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; updates exercised in the harness, insert of an unknown key refused
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals (`page:home`, unknown key) are asserted in the harness
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any login holding `website.content` at Edit | the two switches | may change them | n/a — not drivable until the app half; policies resolve through `has_permission()` |
| any login without it | the two switches | refused | n/a — as above |
| signed out | both public views | read as before; switches table refused | pass — harness ran `set local role anon`: both views read, `public_stat_switches` refused |

- [ ] Every role above tested — n/a: no screen; the policy shape is the existing `impact_baselines` one
- [ ] A role that should not have access is blocked server-side — n/a: no screen; anon refusal proven in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the homepage is the only reader of both views; the live count columns keep their names and types, and with every switch on the harness shows they are non-null
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought one backlog line; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, both items have app halves outstanding; status notes added. Searched the backlog for `impact_baselines`, `public_shelter_stats` and `hidden_public_pages`: the other hits are ticked items
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-06-website-switches-schema.md`
- [x] `README.md` still accurate — it does not list these tables
- [ ] **Release notes.** — n/a: schema only, no screen offers a switch until the app half lands
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the behaviour is the harness output above; the view definition was taken from 0124 and 0204 and checked by the migration applying and the harness comparing columns

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the date logic of both views is carried over verbatim
- [ ] **Boundary or banding change** — n/a: `LIVE_TILE_MIN` is untouched and lives in the app
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the harness and gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: with every switch on the public output is unchanged

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer:` names the app half, which will read it
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0328` on production with the release carrying the app half

### Rollback

- [x] Rollback position stated — code rollback does not revert `0328` and does not need to: older code ignores the new column and table, and the views keep their columns

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `check-hard-coded-security.mjs` failed on the restated `grant ... to anon` | fixed — recorded in the registry with its reason, as 0285/0303/0314/0316 do; check now ends `no coded security outside the Admin bypass` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
