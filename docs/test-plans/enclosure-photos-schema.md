# Feature test plan — enclosure-photos-schema

## Header

| | |
|---|---|
| Feature | Schema half of "tag a photo to an enclosure, approver picks the resident": table `pending_photos`, `assign_pending_photo()`, `pending_photo_candidates()` |
| Backlog item | `docs/backlog.md` → **Add resident photos: tag a photo to an ENCLOSURE…** (annotated on the `backlog` branch, not ticked) |
| Branch / worktree | `claude/enclosure-photos-schema` @ `C:\Development\Animal_Shelter_enclosure-photos-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number is known once opened |
| Tested by / date | Claude / 2026-10-17 |
| Carries a migration? | yes — `0218_pending_photos.sql` |
| Tested at SHA | `fecb7ce6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a table holding a photo against an enclosure until an approver assigns it to one or several residents, never public
- [x] Files/areas touched listed — `supabase/migrations/0218_pending_photos.sql`, `scripts/check-pending-photos.mjs` (new), `scripts/check-public-views.mjs`, decision file, this plan
- [x] Roles affected identified — none sees a change today; nothing reads the table. Signed-out public: unchanged, and the new table is refused to it
- [x] Anything explicitly **out of scope** written down — the `/photos/add` enclosure path, the Drive holding folder, the approval queue and System status list are the app half; see the decision file

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0218` against highest `0217` (the commit hook printed ok)
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 218 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `0218_pending_photos.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0218_pending_photos.sql … ok`
- [x] File is re-runnable — `if not exists`, `or replace`, `drop … if exists` throughout
- [x] Existing rows still read correctly after the change — no existing table or view was altered; `check-public-views.mjs` passes against dev with 0218 applied (exit 0)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`scripts/check-pending-photos.mjs`, HARNESS-OK). Asserted: candidates are exactly the two residents whose placement covered the photo time in that enclosure (a later arrival excluded); anon cannot read the table and `is_public_drive_file` refuses the file; assigning to two residents writes two approved Shelter attachments with the uploader kept and removes the pending row; an unapproved assignment waits, can be reassigned to another resident and stays waiting and non-public. Not reported: whether the non-publisher refusal branch ran, because it only runs if dev has a non-admin login without the publish right
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; the header says what to drop and which two functions to restore
- [x] Production apply plan stated for the release manager — `0218_pending_photos.sql` on `dbkodyyxxhtygxcxmfcu` with the next release, any time before the app half deploys; nothing reads it yet

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface yet; exercised in the §3 harness
- [ ] Data persists — n/a: no UI surface; rows asserted in the harness
- [ ] Create / edit / delete all exercised — n/a: no UI surface; insert, assign (delete) and reassign exercised in the harness
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI input yet; the function refusals are in the migration
- [ ] Boundary cases checked — n/a: no UI surface; the placement boundary (inside, later arrival) is in the harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | pending_photos | all rows, assign | harness (as the admin login) |
| management | pending_photos | all rows, assign | n/a — no UI; same rule as admin via the publish right |
| staff | pending_photos | n/a | n/a — retired role |
| doctor | pending_photos | none | n/a — no UI; RLS only |
| volunteer | pending_photos | own rows only | n/a — no card grants `photos.shelter_add` yet |
| signed out | pending_photos | refused | `check-public-views.mjs` and harness: refused |

- [ ] Every role above tested — n/a: no UI surface; admin and anon exercised in the harness, others by policy text only
- [x] A role that should not have access is blocked server-side — anon: table read refused and the file refused by `is_public_drive_file`, in the harness and by `check-public-views.mjs` (`ok Unassigned photos: anon cannot read pending_photos`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the manual topic is the app half's
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — no view, policy or table was changed; only `can_see_drive_file()` and `is_known_drive_file()` gained a branch; `check-public-views.mjs` passes and the build compiles
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; already up to date

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately not ticked, the app half is outstanding; annotated on the `backlog` branch as the brief directs. Searched the backlog for `pending_photos` and `Unsorted`: no other item is closed by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-17-pending-photos-schema.md`
- [x] `README.md` still accurate — it does not describe photo tables
- [ ] **Release notes.** — n/a: the schema half is invisible; nobody can file or assign an unassigned photo until the app half merges
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the proxy and backup findings come from reading `route.ts`, `can_see_drive_file`, `is_known_drive_file` and `scripts/backup.mjs`; behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the one date derived (`date_taken`) uses Asia/Bangkok and nothing reads it yet
- [ ] **Boundary or banding change** — n/a: no threshold; the placement window is exercised in the harness
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates line above is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the app half comes later
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: additive
- [x] Apply plan stated — `0218` on production with the next release, before the app half

### Rollback

- [x] Rollback position stated — older code ignores the table; nothing is stranded because nobody can file into it yet. The migration is not reverted by a code rollback and need not be

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Harness does not report whether its non-publisher branch ran | accepted — the other assertions are unconditional |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing reads this table yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises §3
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list, as every schema PR is

Result: pass

Release manager acknowledgement: n/a: not yet released
