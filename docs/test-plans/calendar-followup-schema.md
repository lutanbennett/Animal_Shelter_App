# Feature test plan — calendar-followup-schema

| | |
|---|---|
| Feature | Schema follow-up for the two-way calendar (0236) |
| Backlog item | `docs/backlog.md` → Two-way calendar: poll, move, cancel |
| Branch / worktree | `claude/calendar-followup-schema` @ `C:\Development\Animal_Shelter_calendar-followup-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | see PR |
| Tested by / date | Claude / 2026-10-21 |
| Carries a migration? | yes |
| Tested at SHA | d114df67 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds cancel_reason, calendar_changed_at, calendar_change_kind to clinic_visits
- [x] Files/areas touched listed — `supabase/migrations/0236_calendar_followup_schema.sql`, a decision file, the backlog line
- [x] Roles affected identified — none; no code reads the columns yet
- [x] Anything explicitly **out of scope** written down — the app half (System status list, poll writes, audit label) is `calendar-followup-app`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: three new nullable columns, no existing row changes
- [ ] Constraints and defaults exercised against real rows — n/a: only one check constraint (null, moved or cancelled); not exercised in a harness, the app stream's first write will
- [ ] Down-migration written — n/a: purely additive nullable columns, safe to leave
- [x] Production apply plan stated for the release manager — apply 0236 to production with the release, before any code that reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface, no code reads these columns yet
- [ ] Create / edit / delete all exercised — n/a: no UI surface, no code reads these columns yet
- [ ] Empty state renders sensibly — n/a: no UI surface, no code reads these columns yet
- [ ] Invalid input is rejected — n/a: no UI surface, no code reads these columns yet
- [ ] Boundary cases checked — n/a: no UI surface, no code reads these columns yet

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing new | no change | n/a: no UI surface |

- [ ] Every role above tested — n/a: no UI surface, no code reads these columns yet
- [ ] A role that should not have access is blocked server-side — n/a: columns sit on clinic_visits, whose existing policies are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI surface
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: additive nullable columns, no code reads them
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item updated in `docs/backlog.md` on this branch (stays open for the app half)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: README does not describe these columns
- [ ] **Release notes.** n/a: no shelter user would notice a schema-only change
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The audit claim was read from `record_audit()` in 0121, which stores full before/after rows

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no boundary logic
- [ ] Evidence pasted is the tool's actual output — n/a: no evidence beyond the gates line
- [ ] Public pages re-checked — n/a: no public view changes
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR? — n/a: no reading code in this PR
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive nullable columns
- [ ] Apply plan stated — deferred: release manager
- [ ] Rollback position stated — n/a: purely additive schema is safe to leave

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface, nothing for a person to look at

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: handover happens at release time

Result: pass
