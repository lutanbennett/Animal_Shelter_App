# Feature test plan — residents-card-intake

## Header

| | |
|---|---|
| Feature | A login holding only the Residents card can register a resident; place pickers work for it |
| Backlog item | `docs/backlog.md` → **The `residents` card cannot register a resident** (ticked) |
| Branch / worktree | `claude/residents-card-intake` @ `C:\Development\Animal_Shelter_residents-card-intake` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | to be opened |
| Tested by / date | Claude / 2026-10-23 |
| Carries a migration? | yes — `0248_residents_card_can_register.sql` |
| Tested at SHA | `f3243acc` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `record_intake` becomes security definer gated on `resident.register`; the place pickers read new views
- [x] Files/areas touched listed — `supabase/migrations/0248`, `src/lib/enclosures/options.ts`, backlog, decision, `releases.ts`, this plan
- [x] Roles affected identified — anyone holding `resident.register` (Residents card, Admin, Management, 2IC); pickers also for `placement.move`
- [x] Anything explicitly **out of scope** written down — `dev-signin.mjs` and the resident page see/edit split (other streams); other cards with the same gap were not audited

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, "Already up to date"
- [x] `node scripts/gates.mjs` ends with the line below:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `check-migration-numbers.mjs` ok, 0248 against 0247
- [x] `--status` reviewed before applying — 248 applied, 1 pending
- [x] `--dry-run` reviewed — ok
- [x] Applied to **dev** and recorded — applied; I then edited the unmerged file (invoker to definer, after the probe found three more blocked inserts), removed its `schema_migrations` row and re-applied
- [x] File is re-runnable — `create or replace` throughout
- [x] Existing rows still read correctly — pickers return 17 zones / 67 enclosures, Lifecycle excluded
- [x] Constraints exercised in a begin/rollback probe on dev, impersonating a card-only login (no `facility.enclosures`): direct `enclosures` count 0, `picker_zones` 17, `picker_enclosures` 67, `record_intake` succeeded and wrote an Intake placement (rolled back); a caller without `resident.register` was refused 42501
- [x] Down-migration — not needed: additive views, and the function is replaced by itself; 0242 holds the old body
- [x] Production apply plan — apply 0248 to `dbkodyyxxhtygxcxmfcu` before the deploy; the app code reads the new views

## 4. Functional checks

- [x] Happy path — registering as a card-only login works at database level (probe above)
- [ ] Data persists — n/a: probe rolled back on purpose; the browser walk is deferred (see manual list)
- [ ] Create / edit / delete all exercised — n/a: only create changed
- [ ] Empty state renders sensibly — n/a: no UI change
- [x] Invalid input is rejected — no permission gives 42501; missing diet keeps its existing message
- [ ] Boundary cases checked — n/a: the function body is unchanged apart from the permission check and the place lookup

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | register | unchanged | n/a — holds the permission already; not re-driven |
| management | register | unchanged | n/a — as above |
| staff | register | unchanged | n/a — retired role |
| doctor | register | refused | n/a — no `resident.register`; refusal asserted for a caller lacking it |
| volunteer | register | refused | n/a — as above |
| signed out | register | refused | n/a — execute not granted to anon |
| residents card only | register + pickers | now allowed | pass — probe |

- [x] Every role above tested — by permission, not by login: the function checks `resident.register` and the probe covered holder and non-holder
- [x] A role that should not have access is blocked server-side — 42501 from the function itself

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible procedure changed
- [ ] Translatable strings — n/a: no new UI strings
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: the browser walk could not be run, see manual list
- [ ] Network clean — n/a: as above

## 6. Regression

- [x] Nearest pages — covered by build and typecheck only; `/residents/new`, Move and edit pages share the loader and were not driven
- [ ] Shared file touched checked from a second page — n/a: `options.ts` has 8 callers; those with table access see the same rows by construction (the views are a superset of the RLS rule), not loaded
- [x] Nothing merged from `main` during sync was broken — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] Decision added — `docs/decisions/2026-10-22-residents-card-can-register.md`
- [ ] README still accurate — n/a: nothing it describes changed
- [x] Release notes — `unreleased` gained a line
- [x] Commit messages say why
- [x] Claims were measured — the "three more blocked inserts" came from the probe failing at `resident_diets`, then reading the policies

## 8. Pre-production gate

### Tested build
- [ ] Tested SHA recorded and tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: not a banding change
- [ ] Evidence pasted is the tool's actual output — n/a: gates line pasted verbatim above; probe numbers quoted from its output
- [ ] Public pages re-checked — n/a: no public page reads zones through the new views

### Deploy safety
- [ ] Deploy target ref read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secrets/env vars — n/a: none

### Migration ordering
- [ ] Migration and reading code both present — deferred: release manager (apply 0248 to production before the deploy)
- [ ] Production dry-run clean — deferred: release manager
- [ ] Backup for destructive migration — n/a: additive, no data touched
- [ ] Apply plan stated — deferred: release manager (0248 on dbkodyyxxhtygxcxmfcu, before deploy)

### Rollback
- [ ] Rollback position stated — deferred: release manager (re-apply 0242's function body to revert; the views can stay)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Browser sign-in could not be completed (preview tab moved to 3010 and refused the cookie), so no browser walk was done | accepted — deferred to the next card walkthrough |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in with a Residents-card-only login, open Register resident, confirm the Arrival zone list fills and Register succeeds. Blocked until `card-login-fix` merges | `/residents/new` on the next card walkthrough |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list has one item, awaiting a person
Manual verification by: pending: browser walk of /residents/new as a card-only login, after card-login-fix merges

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: after merge

Result: pass with accepted defects
Release manager acknowledgement: pending: after merge
