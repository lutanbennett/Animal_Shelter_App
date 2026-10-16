# Feature test plan — public-stories-schema

## Header

| | |
|---|---|
| Feature | Schema only: opt-in column and `public_adoption_updates` view for success stories; volunteer `refused` insert policy on `assistant_actions` |
| Backlog item | `docs/backlog.md` → **Show adoption updates to the public as success stories** and **A volunteer turned away from an assistant write leaves no audit row** (both left open, status notes added) |
| Branch / worktree | `claude/public-stories-schema` @ `C:\Development\Animal_Shelter_public-stories-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-16 |
| Carries a migration? | yes — `0214_public_stories_and_refused_insert.sql` (two unrelated halves sharing a number because a batch carries one migration) |
| Tested at SHA | `9eee4c81` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog items asked for — Half A: the opt-in and the narrow public view; Half B: the one-policy widening for a volunteer's refused row
- [x] Files/areas touched listed — `0214` migration, `scripts/check-public-views.mjs` (list), `scripts/check-public-stories-schema.mjs` (harness), `docs/backlog.md` (notes), a decision file, this plan
- [x] Roles affected identified — anon gains `select` on one view; a volunteer gains insert of own `refused` rows only; nobody sees a screen change
- [x] Anything explicitly **out of scope** written down — the tick-box UI, the `/adopt` strip, the animal-page line, the photo proxy branch, and the client that sends a refusal are all the next batch

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before opening the PR; `origin/main` merged in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — see the PR body for the final line
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0214` over `0213`; no open `*-schema` PR; the commit hook printed `migration numbers: ok`
- [x] `apply-migrations.mjs --status` reviewed — 214 applied, 1 pending before apply
- [x] `--dry-run` reviewed — `ok`; the consumer warning is the expected "lands before its reader"
- [x] Applied to **dev** from this branch: `applying 0214_public_stories_and_refused_insert.sql … ok`
- [x] File is re-runnable — `add column if not exists`, drop-then-add constraint, `create or replace view`, drop-then-create policy
- [x] Existing rows still read correctly — three `adoption_updates` rows exist on dev; all have `share_publicly = false`; `anon` sees 0 rows of the view
- [x] **Constraints and defaults exercised against real rows** — `node scripts/check-public-stories-schema.mjs` (rollback harness): existing rows 3, ticked 0, anon sees 0; a fresh update defaults false and stays hidden; ticked shows 2 photos (the Medical-folder one excluded) with exactly `id,resident_id,drive_file_id,public_story,public_first_name`; a non-public resident's story disappears; a two-word first name is refused; a volunteer inserts own `refused` row, is refused `confirmed`, is refused a row for another user, reads 0 rows; Management's `confirmed` insert still works. `HARNESS-OK`
- [x] Public-view write refusal — `check-public-views.mjs` on dev: `public_adoption_updates` anon SELECT 200, PATCH refused, DELETE refused
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive columns, a new view, one policy restated
- [x] Production apply plan stated — with the next release; `0214` only adds; check `--status --env production` first, as it applies every pending file

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these objects yet
- [ ] Data persists — n/a: no UI surface; the harness covers the database
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; database refusals are in §3
- [ ] Boundary cases checked — n/a: no UI surface; the one-word first name rule is in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | assistant_actions | unchanged | n/a — `assistant_actions_admin_all` untouched |
| management | assistant_actions insert | unchanged | pass — harness inserted a `confirmed` row |
| volunteer | assistant_actions | insert own `refused` only; read nothing | pass — harness |
| signed out | `public_adoption_updates` | select only | pass — PATCH and DELETE refused |

- [ ] Every role above tested — n/a: no other role's rights changed; only volunteer, management and anon were touched
- [x] A role that should not have access is blocked server-side — volunteer refused `confirmed` and other-user rows; anon refused writes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader; the change only adds columns and a view
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: neither item is finished; both annotated with what landed and what remains. Searched `adoption_updates`, `assistant_actions`, `Happy endings`: no other open item closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-16-public-adoption-updates-columns.md` (column-by-column table, and the policy shape)
- [x] `README.md` still accurate — it does not list these columns
- [ ] **Release notes.** — n/a: schema only; the public strip and the refusal client are the next batch
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — via the harness and `check-public-views.mjs`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public page reads the view yet

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the readers are next batch and must not deploy before `0214` is on production
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive only
- [x] Apply plan stated — with the next release, before the readers deploy

### Rollback

- [x] Rollback position stated — older code ignores the new columns, view and wider policy; no revert needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | none found | n/a |

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

Manual verification by: n/a: no UI surface, no code reads these objects yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
