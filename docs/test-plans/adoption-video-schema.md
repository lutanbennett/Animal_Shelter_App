# Feature test plan — adoption-video-schema

## Header

| | |
|---|---|
| Feature | Schema half: `public_adoption_updates` also lists videos of publicly shared adoption updates |
| Backlog item | `docs/backlog.md` → **AN ADOPTION UPDATE CANNOT TAKE A VIDEO** (left open; schema half struck, app half open) |
| Branch / worktree | `claude/adoption-video-schema` @ `C:\Development\Animal_Shelter_adoption-video-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | see the PR |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | yes — `0303_public_adoption_updates_videos.sql` |
| Tested at SHA | `7b726663` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the view's one file-name test gains mp4/mov/m4v/webm; nothing else it publishes changes
- [x] Files/areas touched listed — `supabase/migrations/0303_public_adoption_updates_videos.sql`, `docs/backlog.md`, `docs/hard-coded-security-registry.json` (declares the restated grant to anon), `docs/decisions/2026-11-03-adoption-video-schema.md`, this plan
- [x] Roles affected identified — signed-out public visitors can now be entitled to videos of shared updates (via `is_public_drive_file`); no signed-in access changes; no page lists them yet
- [x] Anything explicitly **out of scope** written down — all of `src/` (form, public pages, dictionaries) is the app half

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged; one conflict in `docs/backlog.md` (item moved by main), resolved by keeping main's position and re-applying the strike
- [x] `node scripts/gates.mjs` ends with the closing lines below, pasted as printed:

```
=== gates: typecheck exited 0 after 125s
=== gates: lint exited 0 after 363s
=== gates: test exited 0 after 41s
=== gates: build exited 0 after 332s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0303` after `0302`; the brief names this the batch's only migration stream
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev showed 303 applied, 1 pending (this file)
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; the `-- consumer:` header was first mis-parsed (prose after commas), fixed to a single path
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0303 … ok`
- [x] File is re-runnable — `create or replace view` plus grants
- [x] Existing rows still read correctly after the change — the harness asserts a shared image is still listed; `check-public-views.mjs` ran clean
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev: listed — shared video (and `is_public_drive_file` true), shared image; absent — unshared update's video, Medical-folder video, deceased resident's video, unapproved video, shared pdf; `is_public_drive_file` false for unshared, medical and deceased. Result `HARNESS-OK 0303`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: restate the `0217` view to undo; nothing depends on videos being listed yet
- [x] Production apply plan stated for the release manager — `0303` on `dbkodyyxxhtygxcxmfcu` with the next release, any time; production is also missing `0302` (Lutan's command), and the runner applies both

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface, no code reads this yet; database behaviour is in section 3's harness
- [ ] Data persists — n/a: no UI surface; a view stores nothing
- [ ] Create / edit / delete all exercised — n/a: no UI surface; the view is read-only
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: boundaries (file extension, folder, deceased, share flag, approval) are in section 3's harness

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | view | unchanged | n/a — no grant or policy changed |
| management | view | unchanged | n/a — as above |
| staff | view | unchanged | n/a — retired role |
| doctor | view | unchanged | n/a — as above |
| volunteer | view | unchanged | n/a — as above |
| signed out | view | now also lists videos of shared updates only | harness ran the view and `is_public_drive_file`, which anon uses; grants restated identical |

- [ ] Every role above tested — n/a: grants unchanged; only the signed-out meaning is new and is asserted in section 3
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible change until the app half
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page reads the new rows; `check-public-views.mjs` passes
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately NOT ticked; the schema half is struck and the app half stays open
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-03-adoption-video-schema.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: nothing a shelter user can see changes until the app half ships; the form still refuses videos
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The decision file's claims were read from the migration files and routes and proved by the harness (two harness faults found and explained there)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates derived
- [ ] Boundary or banding change assertions cover both edges — n/a: not a threshold change; allowed and refused extensions both asserted
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block is pasted as printed; the harness result is summarised in section 3
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: migration only, no code
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive view restatement
- [ ] Apply plan stated — deferred: release manager (file `0303` to `dbkodyyxxhtygxcxmfcu`, any time; no code depends on it)

### Rollback

- [ ] Rollback position stated — n/a: restate the `0217` view; purely additive, safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at in a view-only change

Manual verification by: n/a: no UI surface; the public effect is asserted in the harness

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan file is in the PR
- [ ] Handed to the production release manager — n/a: handed over through the PR

Result: pass

Release manager acknowledgement: n/a: not yet released
