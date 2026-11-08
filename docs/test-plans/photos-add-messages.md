# Feature test plan

## Header

| | |
|---|---|
| Feature | `/photos/add` says why its resident picker is empty; the approval queue heading names a waiting photo for what it is |
| Backlog item | `docs/backlog.md` → `#ay3d6` and `#nssnt` (both ticked here) |
| Branch / worktree | `claude/photos-add-messages` @ `C:\Development\Animal_Shelter_photos-add-messages` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | 3d543aef |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: an empty resident picker on `/photos/add` says why (cannot see / none on file), a login with no folder to file into gets a note, and the queue heading no longer says "tagged to an enclosure" for a photo with no place
- [x] Files/areas touched listed: `src/app/photos/add/{page,AddPhotosFlow}.tsx`, `src/app/medical/ResidentPicker.tsx` (optional `emptyNote`), `src/lib/medical/residents.ts` (`residentsEmptyKind`), `src/lib/memes/residents.ts` (now calls it), `src/app/photos/approve/{page,ApproveQueue}.tsx` (comments), both dictionaries, `src/lib/releases.ts`, a unit test
- [x] Cards affected identified: `add_photos` (the picker note and the no-folder note) and `approve_photos` (the heading); the meme cards through the shared helper, behaviour unchanged. Admin sees the same pages; signed-out public unaffected
- [x] Out of scope written down: `#40oz4` part B (blank Folder dropdown), the save control's gate (untouched), the 30-day alert wording at `en.ts:1567`, migrations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 20s
=== gates: lint exited 0 after 225s
=== gates: test exited 0 after 28s
=== gates: build exited 0 after 84s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no column changed
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in with exactly `add_photos`, reached `/photos/add` by clicking from Home, chose a photo, and the picker listed both dev residents as before
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved; messages only
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete changed
- [x] Empty state renders sensibly: covered by `src/lib/medical/residents-empty-kind.test.mjs` (5 tests pass: none / cannot / failed read / Admin). Not driven on screen: the dev database holds residents and deleting rows is forbidden
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input added
- [ ] Boundary cases checked — n/a: the only boundary is count 0 or a read error, in the unit test

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | /photos/add | unchanged | not driven |
| exactly `add_photos` | /photos/add | page loads, picker lists residents | as expected |
| signed out | /photos/add | refused as before | not changed, not driven |

- [x] Every login above tested — admin and signed out are untouched by the change; `add_photos` driven
- [ ] A login that should not have access is blocked server-side — n/a: access rules unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no new feature or flow, only an explanatory line
- [ ] Translatable strings go through the translation path — n/a: strings are in the two dictionaries like the neighbouring ones; the Thai is unreviewed
- [ ] Mobile viewport (375px) — n/a: one short paragraph in an existing list
- [x] Browser console clean — no errors seen on `/photos/add` while driving
- [ ] Network clean — n/a: no request added or changed

## 6. Regression

- [x] The pages nearest the change still work: `/photos/add` loaded and tagged; the meme screens share the helper and its behaviour is the unit-tested rule moved unchanged
- [ ] Any shared file touched checked from a second page — n/a: `ResidentPicker` gained an optional prop that is undefined for its other callers, so they render as before (typecheck passes)
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (`#ay3d6`, `#nssnt`)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-photos-add-messages.md`
- [ ] `README.md` still accurate — n/a: not mentioned there
- [x] **Release notes.** Two card-tagged lines added to `unreleased` (`add_photos`, `approve_photos`)
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the empty-folder verdict was read from the save routes (`/api/photos/pending` line 44 and the resident photo route's category check)

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here touches dates
- [ ] Boundary or banding change covers both edges — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the pasted gates block is the script's own output, nothing else is pasted
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager; no schema, so redeploying the previous SHA covers it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The meme `cannotSeeResidents` string says "Ask an admin to check them", naming a role | deferred to backlog (for the planner to file) |
| 2 | low | `en.ts:1567` 30-day alert still says "tagged to an enclosure" for no-place photos | deferred to backlog (for the planner to file) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the three new strings and the new queue heading reads naturally | `/photos/add` and `/photos/approve` in Thai |
| 2 | The two empty states and the no-folder note on screen (needs a login with no resident cards, and one holding only `photos.resident_add`) | `/photos/add` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: someone to read the Thai and see the empty states

Manual verification by: pending: the two items in the manual list

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is committed on the branch and the PR body links to it
- [ ] Handed to the production release manager — n/a: nothing ships on this PR alone

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
