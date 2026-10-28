# Feature test plan — is-admin-sql-and-photo-guard

## Header

| | |
|---|---|
| Feature | Admin bypass keyed on `roles.is_admin` instead of the name `'admin'`; Medical test on `set_resident_profile_photo()`; a lint check that fails when `src/` selects a `roles` column no migration creates |
| Backlog item | `docs/backlog.md` → **FOLLOW-UP TO THE `roles.is_admin` OUTAGE…** and **`set_resident_profile_photo()` HAS NO MEDICAL TEST…** (both ticked) |
| Branch / worktree | `claude/is-admin-sql-and-photo-guard` @ `C:\Development\Animal_Shelter_is-admin-sql-and-photo-guard` |
| Dev server | not started — no UI surface, nothing under `src/` changed |
| PR | pending: number is assigned when the PR is opened |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | yes — `0277_admin_by_flag_and_profile_photo_medical.sql` |
| Tested at SHA | `47f54f83` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — six functions test `roles.is_admin` where they tested the name `'admin'`, the profile-photo function refuses Medical files, and `check-roles-columns.mjs` compares `roles` selects to migrations
- [x] Files/areas touched listed — `supabase/migrations/0277_…sql`, `scripts/check-roles-columns.mjs`, `scripts/check-admin-by-flag.mjs`, `scripts/check-no-role-column-security.mjs`, `package.json` (lint chain), `docs/hard-coded-security-registry.json`, `docs/decisions/2026-10-28-admin-by-flag-and-profile-photo-medical.md`, `docs/backlog.md`, this plan. Nothing under `src/`
- [x] Roles affected identified — Admin (bypass keyed differently, answers unchanged today); every other role unchanged; any login holding `photos.resident_manage` can no longer set a Medical file as profile photo
- [x] Anything explicitly **out of scope** written down — `can.ts:67` untouched, Admin given no cards, no new card, no `src/` change. Not an incident fix: a Medical profile photo cannot reach the public site (`0101`, `0103`, `0267`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 189s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0277` against highest `0276`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 276 applied, 1 pending (`0277`)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; the first run warned about the consumer header, which was corrected to plain paths
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0277_… ok`
- [x] File is re-runnable — every statement is `create or replace`; the harness replays the file inside its transaction and `check-admin-by-flag.mjs` still passes after the real apply
- [x] Existing rows still read correctly after the change — the flag is true on exactly the row `key = 'admin'` is, so no answer changes; bodies are the live ones from `0272` and `0264` with only the tested lines altered
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`node scripts/check-admin-by-flag.mjs`, ends `HARNESS-OK`). Asserted: Admin gets `true` from `has_permission()` on an activity no card names, `is_admin()`, `holds_app_role()` and `my_permissions().is_admin`, before and after; a RENAMED Admin (key changed, flag untouched) still passes after; a non-Admin login is refused the bypass and `is_admin()` is false; a role merely named `admin` without the flag gets nothing; Admin has no cells; a `photos.resident_manage` login is refused five Medical spellings (`Medical`, `medical`, ` Medical `, tab-padded, newline-padded `MEDICAL`), the profile is unchanged by the refusals, a Shelter file is accepted and takes effect, an unknown file and a login without the card are refused. Not run: the OLD functions failing the renamed case (evident from `0272`'s text)
- [x] Down-migration written, or the reason one is not needed is stated — not needed: `create or replace` of function bodies; `0272` and `0264` hold the previous bodies
- [x] Production apply plan stated for the release manager — `0277` on `dbkodyyxxhtygxcxmfcu` with the next release; `0276` is also pending there and the runner applies in order, and `0277` depends on nothing `0276` creates. `roles.is_admin` (`0275`) is applied on production

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, nothing under `src/` changed; behaviour asserted in the §3 harness
- [ ] Data persists — n/a: no UI surface; the profile photo write is asserted in §3
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input; the database refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI surface; the Medical spelling boundaries are in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | harness: all four answers `true`, before and after, and after a rename |
| management | cards as before | unchanged | n/a — no card or grant changed |
| staff | retired | n/a | n/a — retired (`0173`) |
| doctor | cards as before | unchanged | n/a — no card or grant changed |
| volunteer | cards as before | unchanged | n/a — no card or grant changed |
| signed out | nothing | nothing | n/a — no grant changed |

- [x] Every role above tested — the harness exercised Admin, a non-Admin with one cell, and a `photos.resident_manage` login; the others hold only cards, which this change does not touch
- [x] A role that should not have access is blocked server-side — the non-Admin gets `false` from the bypass and the photo function refuses a Medical file for the card holder

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — the build gate compiles every reader of `my_permissions()`; `check-no-role-column-security.mjs` (updated to look for `r.is_admin`) and `check-hard-coded-security.mjs` pass against dev
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync brought nothing in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — both items ticked; no other open item names these functions
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-admin-by-flag-and-profile-photo-medical.md`
- [x] `README.md` still accurate — it does not describe these functions
- [ ] **Release notes.** — n/a: a keying change nobody sees, and a guard on an internal inconsistency that cannot reach the public site
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the guard was negative-tested by hiding `is_admin` from `0275` (it failed on both selects, then the file was restored); the Medical claims come from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no code under `src/` changed; `can.ts` already reads `my_permissions().is_admin`, which keeps its shape
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: function bodies only
- [x] Apply plan stated — `0277` on production with the next release, after (or with) `0276`

### Rollback

- [x] Rollback position stated — Pi `--ref` rollback does not revert `0277`, and does not need to: the new bodies give the same answers as the old for today's data. To undo, a new migration restoring the `0272` and `0264` bodies

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `check-hard-coded-security.mjs` flagged three re-created definer functions until they were declared in the registry | fixed — three records added for `0277` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty list, nothing for a person to look at

Manual verification by: n/a: no UI surface and nothing under src/ changed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened, below
- [ ] Handed to the production release manager — n/a: happens at release time

Result: pass

Release manager acknowledgement: n/a: release time
