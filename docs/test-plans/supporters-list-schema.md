# Feature test plan — supporters-list-schema

## Header

| | |
|---|---|
| Feature | Schema half of the supporters list: table `supporters` and `donations.supporter_id` |
| Backlog item | **Donors get their own supporters list** (left open; app half follows) |
| Branch / worktree | `claude/supporters-list-schema` |
| Dev server | not started — no UI surface |
| PR | see PR |
| Tested by / date | Claude / 2026-10-21 at SHA d1ff4894 |
| Carries a migration? | yes — `0244_supporters.sql` |

## 1. Scope and risk

- [x] One sentence: a table of individual donors and a nullable link from a donation to one, read by no code yet
- [x] Files touched — the migration, a decision file, this plan
- [x] Roles affected — Admin and Management (via `donation.receipt`) may read/write; every other role and anon refused
- [x] Out of scope — the list, gift history and inline add (`supporters-list-app`)

## 2. Automated gates

- [x] `node scripts/gates.mjs` — result recorded in the PR
- [x] CI green on the PR — 9 of 9 checks seen green on #817

## 3. Schema and data

- [x] Number is one above `main`'s highest (0243); no other open schema PR
- [x] `--dry-run` clean: `0244_supporters.sql … ok`
- [x] Applied to dev (`qxkmhwybjggxvsfxsxbd`); applying 0244 ok. Not production
- [x] Re-runnable (`if not exists`, `or replace`, `drop trigger if exists`)
- [x] Existing rows unaffected — new table and a nullable column; no existing row changed
- [x] Harness in `begin … rollback` on dev, output `ERROR: P0001: ALL PASSED (rolled back)` (the sentinel raised after every assertion): a Management login inserts and reads back a supporter; a donation links to it with `contact_id` set and intact; a volunteer-only login sees 0 rows and is refused insert; anon is refused select; deleting the supporter keeps the donation with `supporter_id` null
- [x] Down-migration not needed: additive; nothing reads it
- [x] Production plan: apply 0244 with the next release, before the app half ships

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
| admin | supporters | full access | pass — via has_permission (admin always true) |
| management | supporters | read/write | pass — harness §3 |
| staff | nothing | no access | n/a — no donation.receipt cell; same policy as volunteer |
| vet | nothing | no access | n/a — no donation.receipt cell; same policy as volunteer |
| volunteer | nothing | no access | pass — harness §3 |
| signed out | nothing | no access | n/a — anon grant check in §3 |

- [ ] Every role tested — n/a: management, volunteer and anon run in §3; others share the one policy
- [ ] Blocked server-side — n/a: covered by the grant check in §3

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest pages still work — build gate; new table and a nullable column; no existing row changed, nothing existing changed
- [ ] Shared file touched checked elsewhere — n/a: no shared file touched
- [x] Nothing from `main` broken — synced before gates

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open, feature half remains; no other open item is closed (status note added naming 0244; searched `donor` and `supporter`)
- [x] Decision file — `2026-10-21-supporters-table.md`
- [x] `README.md` still accurate — it does not list tables
- [ ] Release notes — n/a: a new table and a nullable link, read by no code yet; the app half carries the user-visible change and its release note
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

- [x] Migration and reading code in the same PR? — no; header names the app files. 0244 must reach production first
- [ ] Production dry-run — deferred: release manager
- [ ] Production backup — n/a: additive only
- [x] Apply plan stated — with the next release, before the app half

### Rollback

- [x] Rollback: code rollback does not revert 0244 and does not need to; nothing reads the table

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

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface, no code reads this table yet

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links it
- [ ] Handed to the production release manager — n/a: handed over via the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
