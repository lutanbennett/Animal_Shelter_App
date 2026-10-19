# Feature test plan — alert-test-relay-schema

## Header

| | |
|---|---|
| Feature | Schema half of the Status alert test relay: table `status_alert_test_requests` |
| Backlog item | **Relay for the Status alert mail test from a Pi-drawn page** (left open; feature half follows) |
| Branch / worktree | `claude/alert-test-relay-schema` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-19 |
| Carries a migration? | yes — `0226_status_alert_test_requests.sql` |

## 1. Scope and risk

- [x] One sentence: a service-role-only table where the Pi can queue one "send a test alert" request for the Worker cron
- [x] Files touched — the migration, a decision file, this plan
- [x] Roles affected — none; nothing reads or grants it to a signed-in role
- [x] Out of scope — Pi button, Worker cron change, tile wording (feature stream)

## 2. Automated gates

- [x] `node scripts/gates.mjs` — result recorded in the PR
- [x] CI green on the PR — read from the PR status before merging

## 3. Schema and data

- [x] Number is one above `main`'s highest (0225); no other open schema PR
- [x] `--dry-run` clean: `0226 … ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`); `--status` 227 applied, 0 pending. Not production
- [x] Re-runnable (`if not exists`, `or replace`, `drop trigger if exists`)
- [x] Existing rows unaffected — new table only
- [x] Harness in `begin … rollback` on dev, result `ALL PASSED`: insert claiming `sent` with a note and pickup time is forced to pending and blanked; a second pending row is refused; anon cannot select and authenticated cannot insert; service role can insert
- [x] Down-migration not needed: additive new table nothing reads
- [x] Production plan: apply 0226 with the release, before the feature half's Worker deploy

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads this table yet
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface; insert exercised in §3
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI input; trigger and index refusals proved in §3
- [ ] Boundary cases — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing directly | no access | n/a — no grant to signed-in roles |
| management | nothing | no access | n/a — as above |
| staff | nothing | no access | n/a — as above |
| vet | nothing | no access | n/a — as above |
| volunteer | nothing | no access | n/a — as above |
| signed out | nothing | no access | n/a — anon grant check in §3 |

- [ ] Every role tested — n/a: no policy or grant for any app role; anon/authenticated checked in §3
- [ ] Blocked server-side — n/a: covered by the grant check in §3

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — build gate; new table only, nothing existing changed
- [ ] Shared file touched checked elsewhere — n/a: no shared file touched
- [x] Nothing from `main` broken — synced before gates

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, feature half remains; no other open item is closed (searched `alert` and `status_alert`)
- [x] Decision file — `2026-10-19-status-alert-test-requests.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] Release notes — n/a: no shelter user would notice a table nothing reads yet
- [x] Commit messages say why
- [x] Claims measured, not reasoned — harness output above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates derived
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — deferred: release manager
- [ ] Public pages re-checked — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none

### Migration ordering

- [x] Migration and reading code in the same PR? — no; `-- consumer: none`. The feature half will read it, so 0226 must reach production first
- [ ] Production dry-run — deferred: release manager
- [ ] Production backup — n/a: additive only
- [x] Apply plan stated — with the next release, before the feature's Worker deploy

### Rollback

- [x] Rollback: code rollback does not revert 0226 and does not need to; nothing reads the table

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

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface, no code reads this table yet

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the production release manager — n/a: handed over via the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
