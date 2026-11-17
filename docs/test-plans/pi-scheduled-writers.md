# Feature test plan — pi-scheduled-writers

## Header

| | |
|---|---|
| Feature | Read-only audit of scheduled and Pi-side writers against NOT NULL `shelter_id` (`check-scheduled-writers.mjs`), plus one fix the audit found |
| Backlog item | `docs/backlog.md` → `#pirow` (left open: the Pi half is unseen) |
| Branch / worktree | `claude/pi-scheduled-writers` @ `C:\Development\Animal_Shelter_pi-scheduled-writers` |
| Dev server | not started — no UI surface |
| PR | pending: number assigned when the PR is opened |
| Tested by / date | Claude / 2026-11-17 |
| Carries a migration? | no |
| Tested at SHA | be0372738 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — lists every `cron.job` and writing function from the live dev database, classifies each by shelter, fixes the one in-repo writer found (`merch_supplier_emails` stamp), records the rest and the Pi procedure
- [x] Files/areas touched listed — `scripts/check-scheduled-writers.mjs` (new), `src/lib/merch/supplier-email.ts` (two lines), `docs/decisions/2026-11-17-pi-scheduled-writers.md`, this plan
- [x] Cards affected identified — none: no card, grant or page changed; the supplier email is a Worker cron with no person involved. Admin and the signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — the Pi itself, production's `cron.job`, the label-draft cron fix (finding 2, for the planner), the service-role registry's scope

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branched from current `origin/main` this session; sync is run at merge time
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`. Pasted as printed:

```
=== gates: typecheck exited 0 after 96s
=== gates: lint exited 0 after 306s
=== gates: test exited 0 after 80s
=== gates: build exited 0 after 328s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the script's one query was run against dev and read `cron.job`, `pg_proc` and `information_schema` only
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-scheduled-writers.mjs --env test` read 3 cron jobs and 91 writing functions from dev at 2026-11-17 17:39 UTC and classified each
- [ ] Data persists — n/a: no UI surface; the script writes nothing
- [ ] Create / edit / delete all exercised — n/a: read-only audit script
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input; a failed query prints the HTTP status and exits 1
- [ ] Boundary cases checked — n/a: no UI surface; the classifier's undecidable bucket (dynamic `EXECUTE`) is printed separately, not folded into ok

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no page, policy or grant changed |
| signed out | n/a | unchanged | n/a: no page, policy or grant changed |

- [ ] Every login above tested — n/a: no access rule changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: the one app change is a server-side cron library, no page; typecheck and build cover it
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged in; branched from current main

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open; the Pi half is unseen and production's `cron.job` unread
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-17-pi-scheduled-writers.md`
- [ ] `README.md` still accurate — n/a: README does not list scripts at this level
- [ ] **Release notes.** n/a: nothing a shelter user would notice until it breaks
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the list is from `pg_proc`/`cron.job`; the caller claim is a grep, and the decision file says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: public pages untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — reverting the two-line supplier-email change restores the old behaviour; nothing else is deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `runSupplierEmails` (02:00 UTC Worker cron) inserted `merch_supplier_emails` with no shelter, so it errors since 0397 | fixed — stamped from `suppliers.shelter_id` |
| 2 | medium | `runLabelDrafts` (Worker cron) calls `propose_label_th` with no `x-shelter-id`; errors since 0397 | deferred to backlog — for the planner to file; needs a design choice |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The live Pi has not been exercised; production's `cron.job` has not been read | procedure in `docs/decisions/2026-11-17-pi-scheduled-writers.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-17

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the live Pi exercise and the production `cron.job` read, both Lutan's

Manual verification by: pending: the live Pi has not been exercised; procedure recorded in the decision file

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
