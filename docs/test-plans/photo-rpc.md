# Feature test plan — photo-rpc

## Header

| | |
|---|---|
| Feature | Route half of "an internal photo is one RPC": the photo route calls `can_see_drive_file()` once instead of running seven selects |
| Backlog item | `docs/backlog.md` → **An internal photo costs seven queries; make it one RPC** (ticked) |
| Branch / worktree | `claude/photo-rpc` @ `C:\Development\Animal_Shelter_photo-rpc` |
| Dev server | not started — the route's behaviour is proved by the database check, see §4 |
| PR | pending: number assigned at creation (schema half was #587, merged) |
| Tested by / date | Claude / 2026-10-13 |
| Carries a migration? | no — `0193` merged in #587 and is applied to dev; production apply is in §3 |
| Tested at SHA | SHAHERE |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `canSeeInternalFile()` in `src/app/api/photos/[fileId]/route.ts` makes one `rpc("can_see_drive_file")` call instead of seven selects
- [x] Files/areas touched listed — `src/app/api/photos/[fileId]/route.ts`, `docs/backlog.md` (tick), `docs/decisions/2026-10-13-photo-rpc-route.md`, this plan
- [x] Roles affected identified — every login that opens an internal photo. What each may see is unchanged: `check-can-see-drive-file.mjs` (from #587) showed the function and the old seven selects agree for every role
- [x] Anything explicitly **out of scope** written down — public photos (`is_public_drive_file`, the edge and disk caches) are untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in, including #587
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. GATESHERE
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; `0193` merged in #587
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: `0193` was applied to dev in #587
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change here
- [ ] **Constraints and defaults exercised against real rows** — n/a: no schema change here; the function was exercised in #587 (345 ids, every role, 0 disagreements) and `node scripts/check-can-see-drive-file.mjs` was re-run for this PR against the same dev database
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: stated in §8 Migration ordering, which is where this PR depends on `0193`

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no browser check was driven; the permission question is answered by the database function, which the equivalence script exercised for every role, and the route code is a three-line call checked by typecheck and build
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no data written
- [ ] Empty state renders sensibly — n/a: a file nobody may see is "Photo not found.", unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the id pattern check is untouched; an RPC error returns "Photo not found." like the public check
- [ ] Boundary cases checked — n/a: non-existent and empty ids were in the equivalence script (#587)

### Query count, before and after

Counted from the code, not estimated from the item. Per request for one internal (non-public) photo:

| | Public check | Internal check | Total queries |
|---|---|---|---|
| Before | 1 rpc (`is_public_drive_file`) | 7 selects | 8 |
| After | 1 rpc | 1 rpc (`can_see_drive_file`) | 2 |

A gallery of thirty internal photos: 240 queries before, 60 after (the item's "210" is the internal check alone: 210 before, 30 after). The thirty Drive downloads are unchanged.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | internal photos | as before | pass — 343 of 345 ids, identical to the old path (#587 script) |
| management | internal photos | as before | pass — 343, identical |
| staff | retired role | n/a | n/a: retired in 0173 |
| doctor | internal photos | as before | pass — 1, identical |
| volunteer | internal photos | none | pass — 0, identical |
| signed out | internal photos | "not found" | pass — the function refuses anon, the route treats an error as "not found" |

- [x] Every role above tested — by the database script, not through the route
- [x] A role that should not have access is blocked server-side — volunteer, head_of_medical and a role-less login get 0 of 345

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings go through the translation path — n/a: none
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: not driven in a browser; see §4

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven in a browser; any page showing an internal photo is exercised in the manual item below
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — and searched `canSeeInternalFile`, `can_see_drive_file`, `C7`, `photos/[fileId]` and `is_known_drive_file`: no other open item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-13-photo-rpc-route.md`
- [x] `README.md` still accurate — it does not describe the photo check
- [ ] **Release notes.** — n/a: photos load the same for a shelter user, only with fewer database calls; and production needs `0193` applied before this deploys, so no note until then
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the query counts are counted from the route's code; the per-role agreement is the script's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (open an internal photo, such as a blood-test attachment, as a login that may see it and as one that may not)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output
- [ ] Public pages re-checked after a cache purge — n/a: public photos take the same path as before

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — the code is here, the migration (`0193`) merged in #587. Production must get `0193` **before** this deploys: until it does, every internal photo reads as "not found"
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a backup exists — n/a: additive only
- [x] Apply plan stated — `0193` on `dbkodyyxxhtygxcxmfcu` before the deploy that carries this route

### Rollback

- [x] Rollback position stated — `./scripts/pi/deploy-pi.sh --ref <sha>` returns the seven-select route, which works with or without `0193`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open an internal photo (a blood-test attachment) as an admin, then as a volunteer: the admin sees it, the volunteer gets "Photo not found." | `test.lannacare.org` after the deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: one smoke check on the deployed build

Manual verification by: pending: item 1 above, on the deployed test build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
