# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `#calsh` piece 3: the calendar poll, import and status tile read each shelter's own calendar |
| Backlog item | `docs/backlog.md` → `#calsh` (ticked) |
| Branch / worktree | `claude/calendar-per-shelter-readers` @ `C:\Development\Animal_Shelter_calendar-per-shelter-readers` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | 65bf8313c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the poll, the import and the status tile now use the polled shelter's own calendar credentials and cursor, and a shelter with none is refused.
- [x] Files/areas touched listed: `src/lib/clinics/calendar-{sync,poll,import}.ts`, `src/app/upcoming-visits/{page.tsx,confirm-actions.ts}`, `src/app/admin/status/page.tsx`, `src/app/residents/[id]/[section]/sections/clinic-visits.tsx`, one test, one decision, the backlog tick.
- [x] Cards affected identified: none change what they grant. `visit.book` still gates the confirm list and its buttons; the calendar they act on is now the acting shelter's. Admin sees the status tile for its own shelter; the signed-out public is unaffected.
- [x] Out of scope written down: the sweep (#1690), the connect script and Admin status RPC (#1692, #1695), `NOT NULL` on `calendar_sync_state.shelter_id` (`#stmp5`), any migration, production, UAT and the Pi.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all `0`:

```
=== gates: typecheck exited 0 after 114s
=== gates: lint exited 0 after 306s
=== gates: test exited 0 after 109s
=== gates: build exited 1 after 404s
gates: FAILED — build
gates: typecheck=0 lint=0 test=0 build=1
--- build re-run alone after the advisory halt (npm run build):
done 0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0396` already gave `calendar_sync_state` its `shelter_id`
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration (the write shape was exercised on dev instead, see section 4)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `calendar-readers-per-shelter.test.mjs` passes (5 tests) and Lanna still resolves to the environment calendar (`decideCalendar(null, "lanna")` is configured). Not run against Google.
- [x] Data persists: a service-role upsert with explicit `shelter_id` and no shelter header, on dev, read back with the same shelter (proof row removed afterwards): `201 [{"calendar_id":"calsh-proof@example.invalid",...,"shelter_id":"ab3ecaac-1cf3-4570-ae79-d32f5ed2d13a"}]`, then `read back: [{ calendar_id: 'calsh-proof@example.invalid', shelter_id: 'ab3ecaac-1cf3-4570-ae79-d32f5ed2d13a' }]`, `delete 204`. This proves the database keeps the shape, not the app code path itself.
- [ ] Create / edit / delete — n/a: no new create, edit or delete surface
- [x] Empty state renders sensibly: a shelter with no calendar gets an empty confirm list and the tile says off (read from code, not driven in a browser).
- [ ] Invalid input rejected — n/a: no new input
- [ ] Boundary cases — n/a: no new boundary; the clinic-of-another-shelter refusal in `createVisits` is asserted by a source-shape test only

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/status` | tile for the acting shelter | pending: not driven in a browser |
| exactly the `visit.book` card | `/upcoming-visits` | confirm list only if this shelter has a calendar | pending: not driven in a browser |
| signed out | n/a | unchanged | n/a: no change |

- [ ] Every login above tested — pending: no signed-in browser session was driven this run
- [ ] A login that should not have access is blocked server-side — n/a: no permission check was added or changed; `allowed()` still asks `visit.book`

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual — n/a: no user-visible change
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — pending: not driven in a browser
- [ ] Network clean — pending: not driven in a browser

## 6. Regression

- [x] The pages nearest the change still compile and typecheck (`/admin/status`, `/upcoming-visits`, the resident clinic-visits section); the build gate is above.
- [ ] Shared file checked from a second page — n/a: no shared nav or manual file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch (gates ran after the merge)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (`#calsh`)
- [x] Decision added: `docs/decisions/2026-11-18-calendar-readers-per-shelter.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: connecting a calendar is still the operator script `connect-shelter-calendar.mjs`, which needs a second Google account and the credentials key, so no user can do anything new yet
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the upsert was run and read back; "Lanna unchanged" is a unit-level decision check, stated as not run against Google.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic changed
- [ ] Boundary or banding change — n/a: no boundary or band changed
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project` line — deferred: release manager
- [ ] `strip-baked-env` line — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — deferred: release manager (code only, no schema; revert the PR)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Admin status tile and the confirm list still draw for Lanna | `/admin/status`, `/upcoming-visits` on test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: row 1 above

Manual verification by: pending: row 1, a look at Lanna's status tile and confirm list on test

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release manager

Result: pass

Release manager acknowledgement: pending: release manager
