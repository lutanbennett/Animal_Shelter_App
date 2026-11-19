# Feature test plan — new-shelter-absent-rows

## Header

| | |
|---|---|
| Feature | `#shrow`: the table list for a new shelter, and what a shelter sees when `group_origins`, `donation_channels`, `site_content` or cards are absent (a read and a look; no code change) |
| Backlog item | `docs/backlog.md` -> #shrow (ticked) |
| Branch / worktree | `claude/new-shelter-absent-rows` @ `C:\Development\Animal_Shelter_new-shelter-absent-rows` |
| Dev server | `http://localhost:3001`, pointed at `test-shelter-2` for the look, then restored to Lanna |
| PR | pending: number known at creation |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | `0ee409d10` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for - a decision file recording the table list and what is seen for each absent row, from the harness and from `test-shelter-2`'s public pages
- [x] Files/areas touched listed - `docs/decisions/2026-11-19-absent-shelter-rows.md`, `docs/backlog.md` (tick), this plan. No `src/`, `worker/` or `supabase/` change
- [x] Cards affected identified - none: no behaviour changed
- [x] Anything explicitly **out of scope** written down - the owed `site_content` seed (a migration, for the planner to file); `seed_shelter_defaults` was not run on any existing shelter; the intake picker and Stocktaking switch were read from code, not driven, because a login has no role on `test-shelter-2`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (one backlog-only commit, aafc558f0)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all four `0`, pasted as run:

```
=== gates: typecheck exited 0 after 110s
=== gates: lint exited 0 after 381s
=== gates: test exited 0 after 66s
=== gates: build exited 0 after 219s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR - n/a: not yet, the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` - n/a: no migration
- [ ] `--status` reviewed before applying - n/a: no migration
- [ ] `--dry-run` reviewed - n/a: no migration
- [ ] Applied to **dev** - n/a: no migration
- [ ] File is re-runnable - n/a: no migration
- [ ] Existing rows still read correctly - n/a: no migration
- [x] **Exercised against real rows** in a rolled-back harness: `node scripts/run-harness.mjs supabase/harness/new_shelter_rows.sql` re-run on dev; it reported 115 tables, new shelter holding `bill_kinds` 14, `frequency` 10, `site_pages` 8, `public_stat_switches` 4, `translations` 8, `audit_log` 4 and 0 elsewhere, including `site_content`, `group_origins`, `donation_channels`. Nothing survived the rollback
- [ ] Down-migration - n/a: no migration
- [ ] Production apply plan - n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end - every public route on `test-shelter-2` fetched: 200 with a plain empty state, or a placeholder (`/foster`, `/volunteer`, `/donate`); `/services` is not a route (404)
- [ ] Data persists — n/a: nothing written
- [ ] Create / edit / delete all exercised — n/a: nothing written
- [x] Empty state renders sensibly - this is the subject: see the decision file, section 2
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked - n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | public pages on `test-shelter-2` | render | all 200, no error text |
| admin (dev-signin) | `/residents/new` on `test-shelter-2` | no role there | redirected to `/login?error=no_role`, as it should be |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side - n/a: no access rule changed; the `no_role` redirect above is incidental evidence

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated - n/a: no UI change
- [ ] Translatable strings - n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI change
- [ ] Browser console clean — n/a: pages were read as server-rendered HTML, not driven in the pane
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work - n/a: nothing in `src/` changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` - `#shrow`. Searched `#shsed` and `#pirow`: `#shsed` already ticked; nothing else closed
- [x] Non-obvious design choices added in `docs/decisions/2026-11-19-absent-shelter-rows.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** - n/a: docs only; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — page results are from fetches; the `site_content` silent-save and the intake picker are labelled read-from-code, not driven; the existing-shelter answer is labelled from the function text

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is unedited; no deploy output
- [ ] Public pages re-checked after a cache purge — n/a: no code change; the pages were read on a dev server

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Migration and code that reads it?** - n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated - n/a: no migration

### Rollback

- [ ] Rollback position stated - n/a: docs only, nothing deployed changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A shelter with no `site_content` row: Settings → Stocktaking's switch reports success and changes nothing (`update … where id = true` matches 0 rows). Read from the code, not driven | deferred to backlog: a `site_content` seed, for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — nothing a person must look at | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: docs only

Manual verification by: n/a: docs only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: docs only

Result: pass

Release manager acknowledgement: n/a: not yet released
