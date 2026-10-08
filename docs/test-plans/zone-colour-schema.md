# Feature test plan — zone-colour-schema

## Header

| | |
|---|---|
| Feature | Schema half of the zone colour dot: `zones.colour` and `zone_colour` on the four views that carry zone names |
| Backlog item | `docs/backlog.md` → **A colour for each zone, shown as a coloured dot beside its name** (left open, status note added) |
| Branch / worktree | `claude/zone-colour-schema` @ `C:\Development\Animal_Shelter_zone-colour-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | #456 |
| Tested by / date | Claude / 2026-10-08 |
| Carries a migration? | yes — `0162_zone_colour.sql` |
| Tested at SHA | `95fa1b25` (after sync with `origin/main` `a9b8e6f6`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — piece (1) of the item: a nullable `#rrggbb` colour on zones, refused on Lifecycle, carried by the views the screens read zone names from
- [x] Files/areas touched listed — `supabase/migrations/0162_zone_colour.sql`, `docs/backlog.md` (status note), `docs/decisions/2026-10-08-zone-colour-schema.md`, this plan
- [x] Roles affected identified — none see a change: no screen reads the column yet. The four views keep their row filters and grants, so the column reaches exactly who already reads each view
- [x] Anything explicitly **out of scope** written down — the palette on Settings → Zones, the dot component, manual, dictionaries and releases line are batch 74. The public site is untouched (`public_enclosures` does not carry zones)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` `a9b8e6f6` merged in cleanly (two docs files from the 0.21.0 record)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 176s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR — all 7 checks passing on #456, read from the PR status before merging

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0162` against highest `0161`; the brief names this as the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 161 applied, 0 pending, no drift against `origin/main`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run flagged the four views as lacking restated grants; grants restated as they stand, second run `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — applied from this branch on Lutan’s "merge it", 2026-10-08: `applying 0162_zone_colour.sql … ok`; `--status` then 162 applied rows, the one extra being `0162`
- [x] File is re-runnable — the harness below ran the whole file **twice** in one transaction before asserting
- [x] Existing rows still read correctly after the change — the four views were rewritten from their **live** definitions (`pg_get_viewdef` on dev), column for column; `resident_list_view` now joins `private.resident_current_state`, which differs from the 0058 file text, and the rewrite follows the live one. `check-view-write-grants.mjs --with 0162`: 292 statements, 0 failed, every select still works for every role
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev. Asserted: grants on the four views identical before and after (from `information_schema.role_table_grants`); `resident_list_view` keeps `security_invoker=on`; a real zone accepts `#1E88e5`, null and `#1e88e5`; rejects `blue` and `#fff` with `check_violation`; the Lifecycle zone refuses a colour with "takes no colour"; renaming Lifecycle to itself (no colour) still passes the trigger; `resident_list_view.zone_colour` returns the set value for that zone's residents; `zone_colour` selectable from the other three views. Result: `ALL PASSED (rolled back)`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive (one nullable column, four views gaining a trailing column, a trigger function that refuses one more thing). Old code ignores all of it
- [x] Production apply plan stated for the release manager — `0162_zone_colour.sql` on `dbkodyyxxhtygxcxmfcu` with the next release; `-- consumer: none`, so it can go any time before the batch 74 feature's deploy, which **will** read it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface; persistence of the column asserted in §3's harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; writes exercised in §3's harness
- [ ] Empty state renders sensibly — n/a: no UI surface; null (no colour) is every row's state today, which is what every screen already sees
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input yet; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the form boundaries (3-digit hex, a word, mixed case, null) are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | zones table, four views | unchanged | n/a — no policy or grant changed; `check-view-write-grants` ran every role |
| management | zones table, four views | unchanged | n/a — as above |
| staff | zones table, four views | unchanged | n/a — as above |
| vet | views only | unchanged | n/a — as above |
| volunteer | `resident_who_and_where` | unchanged | n/a — row filter kept verbatim |
| signed out | nothing | nothing | n/a — `check-app-access-gate.mjs` HARNESS-OK, anon refused all |

- [ ] Every role above tested — n/a: no policy and no grant changed; `check-view-write-grants.mjs` exercised every role's select on `resident_list_view` with the file applied, and the harness asserted grants on all four views are identical before and after
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed; `check-app-access-gate.mjs` confirms public_viewer and anon gain nothing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the Zones topic is batch 74's
- [ ] Translatable strings go through the translation path — n/a: no strings; the swatch names are batch 74's
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of the four views; the views only gain a trailing column, and `check-view-write-grants` confirmed select still works through `resident_list_view` for every role
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought two docs files only; gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, as the brief says; a status note says the schema half is done and the palette and dot remain. Searched the backlog for `colour`/`color` with `zone`/`dot`/`swatch`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-08-zone-colour-schema.md` (form-only check, hex not key, which views, the white/sand question)
- [x] `README.md` still accurate — it does not list zone columns
- [ ] **Release notes.** — n/a: no screen shows the colour until batch 74
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the view list came from `pg_depend` on dev, the live definitions from `pg_get_viewdef`, and the behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`. The batch 74 feature will read it, so `0162` must be on production before that feature deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — `0162` on production with the next release, any time before the feature half deploys

### Rollback

- [x] Rollback position stated — code rollback via the Pi `--ref` does not revert `0162`, and does not need to: older code ignores the column and the trailing view columns

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First dry run: the four rewritten views had no grant in the file (the runner's grant check) | fixed — grants restated as they stand; harness proves them identical |
| 2 | info | `check-volunteer-narrowing.mjs` reports RED on dev ("policies that still name the volunteer: null") | not this PR — it reads the live database, where `0162` is not applied; red before this change |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
