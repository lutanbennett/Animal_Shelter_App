# Feature test plan — assistant-retention-schema

## Header

| | |
|---|---|
| Feature | Schema half of assistant retention (DB-11): daily delete of old `assistant_actions` rows |
| Backlog item | `docs/backlog.md` → **Assistant retention (DB-11)** (left open for the privacy page) and **Who may read other people's assistant rows** (ticked: no SQL needed) |
| Branch / worktree | `claude/assistant-retention` @ `C:\Development\Animal_Shelter_assistant-retention` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number known once opened |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | yes — `0227_assistant_retention.sql` |
| Tested at SHA | `SHA_HERE` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rows older than 2 days are deleted daily, except unmatched/refused rows, kept 90 days
- [x] Files/areas touched listed — `supabase/migrations/0227_assistant_retention.sql`, `scripts/check-assistant-retention.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-19-assistant-retention.md`, this plan
- [x] Roles affected identified — none: no policy or grant changed; the function is callable by no login
- [x] Anything explicitly **out of scope** written down — the `/privacy` line and manual are PR 2

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — GATES_HERE
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (`0226`) and no other stream carries one — the brief names this the batch's only migration
- [x] `--status` reviewed before applying — 227 applied, 1 pending
- [x] `--dry-run` reviewed — `0227 … ok`
- [x] Applied to **dev** and recorded — `applying 0227_assistant_retention.sql … ok`
- [x] File is re-runnable — extension `if not exists`, `create or replace`, `cron.schedule` on a name replaces the job
- [x] Existing rows still read correctly — no column or policy touched
- [x] Constraints exercised against real rows — `check-assistant-retention.mjs` (begin/rollback on dev): 7 rows aged 1 to 100 days, function returned 4, left exactly new-confirmed, unmatched 30d, refused 30d; cron job exists once; `authenticated` cannot execute. `HARNESS-OK`
- [x] Down-migration not needed — undo is `select cron.unschedule('purge-assistant-actions'); drop function purge_assistant_actions();`
- [x] Production apply plan stated — apply `0227` with the next release; production Supabase must allow `create extension pg_cron` (dev did)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; asserted in the section 3 harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; delete exercised in section 3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases checked — n/a: no UI; rows either side of each limit are in the section 3 harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all assistant rows | unchanged | n/a — no policy changed (0153) |
| management | own rows only | unchanged | n/a — no policy changed (0150) |
| staff | own rows only | unchanged | n/a — as above |
| vet | nothing | unchanged | n/a — as above |
| volunteer | insert refused rows only | unchanged | n/a — 0214 untouched |
| signed out | nothing | nothing | n/a — no grant changed |

- [ ] Every role above tested — n/a: no policy and no grant changed; read rule confirmed from the migration text (0150, 0153, 0214)
- [ ] A role that should not have access is blocked server-side — n/a: execute on the function is revoked from authenticated, asserted in section 3

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing reads or writes differently; the status page count only sees fewer old rows
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — the Auth item (who reads rows) ticked with evidence; DB-11 stays open until the privacy line lands
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-19-assistant-retention.md`
- [x] `README.md` still accurate — it does not describe retention
- [ ] **Release notes.** — n/a: a scheduled delete nobody sees; the privacy line and its note come in PR 2
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — read rule from the policy text in 0150/0153/0214; delete rules from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: cutoffs are intervals from now(), no calendar dates
- [ ] **Boundary or banding change** — n/a: no user-visible threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: none pasted beyond gates
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: the migration deletes nothing itself; the first cron run deletes old rows by design
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — unschedule the job and drop the function; code is unaffected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Production must allow `pg_cron`; untested there | deferred to backlog: release manager's production dry run |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
