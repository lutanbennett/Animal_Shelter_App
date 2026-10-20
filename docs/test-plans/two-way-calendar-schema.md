# Feature test plan — two-way-calendar-schema

## Header

| | |
|---|---|
| Feature | Schema half of the two-way calendar: `calendar_sync_state` table and `clinic_visits.calendar_etag` / `calendar_event_updated_at` |
| Backlog item | `docs/backlog.md` → **Two-way calendar** (left open, status note on the backlog branch) |
| Branch / worktree | `claude/two-way-calendar-schema` @ `C:\Development\Animal_Shelter_two-way-calendar-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending |
| Tested by / date | Claude / 2026-10-20 |
| Carries a migration? | yes — `0232_calendar_two_way_schema.sql` |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] Change is described in one sentence — a service-only sync-state table and two nullable columns on clinic_visits
- [x] Files/areas touched listed — `supabase/migrations/0232_calendar_two_way_schema.sql`, `docs/decisions/2026-10-20-two-way-calendar-schema.md`, this plan
- [x] Roles affected identified — none: table is service-role only, columns are nullable and unread
- [x] Out of scope written down — all sync logic, Worker cron, cancel-with-reason, Director's note (app half)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — GATES_SYNC
- [x] `node scripts/gates.mjs` — GATES_LINE
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — highest was 0231
- [x] `--status` reviewed — 232 applied, 0 pending, no drift
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`) — `applying 0232_calendar_two_way_schema.sql … ok`
- [x] File is re-runnable — every statement uses if not exists / or replace and the drop-free form
- [ ] Existing rows still read correctly — n/a: two nullable columns, no default, no view changed
- [ ] Constraints and defaults exercised against real rows — n/a: none defined beyond the primary key and a created_at default
- [x] Down-migration not needed — additive; older code ignores it
- [x] Production apply plan — apply 0232 with the next release; `-- consumer: none`

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no UI input
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | unchanged | n/a — table is service role only |
| management | nothing new | unchanged | n/a — as above |
| staff | nothing new | unchanged | n/a — as above |
| vet | nothing new | unchanged | n/a — as above |
| volunteer | nothing new | unchanged | n/a — as above |
| signed out | nothing | nothing | n/a — all grants revoked from anon |

- [ ] Every role tested — n/a: no policy changed; new table grants only service_role
- [ ] Blocked server-side — n/a: RLS on and grants revoked in the file; not exercised with a harness

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages still work — n/a: no code reads the new objects; the dirty trigger does not list them
- [ ] Shared file from a second page — n/a: no app file touched
- [x] Nothing merged from main was broken — gates ran after sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; status note added on the backlog branch
- [x] Decision file added — `2026-10-20-two-way-calendar-schema.md`
- [x] README still accurate — it does not list these tables
- [ ] Release notes — n/a: a table with no code reading it yet; nobody would notice
- [x] Commit messages say why
- [x] Claims measured — apply and dry-run output read directly

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing derives a date
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence unedited — n/a: no deploy output here
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering

- [x] Migration and reading code in one PR? — no; `-- consumer: none`; app half follows
- [ ] Production dry-run — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive only
- [x] Apply plan stated — with the next release, before the app half deploys

### Rollback

- [x] Rollback position — code rollback does not revert 0232 and does not need to; older code ignores it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty — no UI surface

Manual verification by: n/a: no UI surface, no code reads these objects

### Result

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
