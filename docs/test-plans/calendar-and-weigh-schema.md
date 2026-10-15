# Feature test plan — calendar-and-weigh-schema

## Header

| | |
|---|---|
| Feature | Schema half of two features: per-visit Google Calendar columns on `clinic_visits`, and the narrow `weigh_first_visits()` read for Record Weight |
| Backlog item | `docs/backlog.md` → **Vet visits go into the shelter's Google Calendar by themselves** and **Record Weight: put the residents who saw a vet yesterday or today ... at the top** (both left open; the app halves tick them) |
| Branch / worktree | `claude/calendar-and-weigh-schema` @ `C:\Development\Animal_Shelter_calendar-and-weigh-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number once opened |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | yes — `0207_calendar_and_weigh_schema.sql` |
| Tested at SHA | `cf4161be` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — four nullable calendar columns, a dirty-marking trigger and a staff-only narrow read; nothing visible
- [x] Files/areas touched listed — `supabase/migrations/0207_calendar_and_weigh_schema.sql`, `docs/decisions/2026-10-15-calendar-and-weigh-schema.md`, this plan
- [x] Roles affected identified — none see a change; the narrow read returns rows only to logins holding `medical.weight` at edit, and no permission cell was touched
- [x] Anything explicitly **out of scope** written down — every screen, action, the Calendar API code, the Worker sweep, the Record Weight page; the brief's `clinic_calendar_days` table, superseded by the item's last change (see decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — up to date with `origin/main` `59e2e140`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: build exited 0 after 107s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs` ok, `0207` against highest `0206`; no open PR matched "schema"
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 208 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; only consumer-header warnings (the readers do not exist yet)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0207 … ok`, then 209 applied, 0 pending. The two function bodies were afterwards re-applied by hand to match the file after the harness found a search-path fault (defect 1); the committed file is the final text
- [x] File is re-runnable — `if not exists`, `create or replace`, `drop trigger if exists`
- [x] Existing rows still read correctly after the change — columns are nullable with no default; existing visits are unchanged apart from the trigger stamping future changes
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev: insert marks out of date; a visit at 01:00 Bangkok today and one yesterday are returned, one two days ago and a cancelled one are not; admin sees 2, a Volunteer 0, anon is refused; a calendar-only write does not re-mark; a cancel does. Output: `HARNESS-OK admin=2 volunteer=<id>` (rolled back)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive columns, one trigger and one function nothing calls yet
- [x] Production apply plan stated for the release manager — `0207` on production with the next release; the readers land in the app halves, which must not deploy before it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these objects yet
- [ ] Data persists — n/a: no UI surface; the columns' behaviour is in the §3 harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert and update exercised in the §3 harness
- [ ] Empty state renders sensibly — n/a: no UI surface; an empty result is the Volunteer case in the harness
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface
- [ ] Boundary cases checked — n/a: no UI; the 01:00-Bangkok and cancelled boundaries are in the §3 harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `weigh_first_visits()` | rows | pass — saw 2 in the harness |
| management | same | rows | n/a — not run; holds `medical.weight` by `0132`, same code path as admin |
| staff | same | rows | n/a — as above |
| doctor | same | rows | n/a — as above |
| volunteer | same | none | pass — 0 rows in the harness |
| signed out | same | refused | pass — anon refused |

- [ ] Every role above tested — n/a: admin, volunteer and anon were run; the rest share one permission check and no cell changed. The Head of Medical herself is for the app half to prove
- [ ] A role that should not have access is blocked server-side — n/a: covered by the volunteer and anon rows above

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the app halves own it
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `clinic_visits`; the columns are additive
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; the app halves tick both items. No other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-calendar-and-weigh-schema.md`
- [x] `README.md` still accurate — it does not list these columns
- [ ] **Release notes.** — n/a: nobody would notice; the note goes in the PR that ships each feature
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the harness found `shelter_date()` fails under an empty search path, which reasoning had missed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: proved in the §3 harness (01:00 Bangkok counts as today); nothing deployed reads it yet
- [ ] **Boundary or banding change** — n/a: no threshold in a UI
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager for deploy output; the gates and harness lines above are unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none in this PR

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; readers come in the app halves, so `0207` must reach production before they deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — with the next release, before either app half

### Rollback

- [x] Rollback position stated — older code ignores the columns, trigger and function; no revert needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First draft used `public.shelter_date()` under an empty search_path; it failed ("function shelter_time_zone() does not exist") | fixed — function uses `shelter_time_zone()` directly |
| 2 | info | `check-cards-schema.mjs` (module resolution) and `check-permission-parity.mjs` (dev resident-code collision in its own seed) do not run on this machine | accepted — neither reads anything added here |

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

Manual verification by: n/a: no UI surface, no code reads these objects yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
