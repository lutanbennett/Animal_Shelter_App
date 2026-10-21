# Feature test plan — public-story-drive-view

## Header

| | |
|---|---|
| Feature | `is_public_drive_file` answers for a published adoption story's photo, and the photo proxy's duplicate route is removed |
| Backlog item | `docs/backlog.md` → **Fold `public_adoption_updates` into `is_public_drive_file`** (filed on the `backlog` branch 2026-10-21; its follow-up note on the success-stories item is updated here) |
| Branch / worktree | `claude/public-story-drive-view` @ `C:\Development\Animal_Shelter_public-story-drive-view` |
| Dev server | not started — no UI surface |
| PR | see the PR for this branch |
| Tested by / date | Claude (claude-sonnet-5-5) / 2026-10-21 |
| Carries a migration? | yes — `0245_public_story_drive_file.sql` |
| Tested at SHA | `cc7b736a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the function gets a twelfth branch over `public_adoption_updates`, and the proxy stops asking the view itself
- [x] Files/areas touched listed — `supabase/migrations/0245_public_story_drive_file.sql`, `src/app/api/photos/[fileId]/route.ts`, `scripts/check-public-story-drive-file.mjs`, `docs/decisions/2026-10-21-public-story-drive-file.md`, `docs/backlog.md`
- [x] Roles affected identified — signed-out public (photo proxy); no role sees a difference
- [x] Anything explicitly **out of scope** written down — the other eleven views were not audited; the adoption-stories publish form is untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 252s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0245` over `0244`; `check-migration-numbers` ok
- [x] `--status` reviewed before applying — 245 applied, 1 pending
- [x] `--dry-run` reviewed — `0245 … ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0245_public_story_drive_file.sql … ok`
- [x] File is re-runnable — `create or replace function`, grants restated
- [x] Existing rows still read correctly — harness asserts an existing public photo is still true; `check-public-views.mjs` clean
- [x] **Constraints and defaults exercised** in `scripts/check-public-story-drive-file.mjs` (`begin … rollback`, ends in `raise`), run as anon: unticked story photo false; ticked true; Medical photo of a ticked story false; an existing public site photo still true; unticked again false. Result: `HARNESS-OK unticked false; ticked true; medical false; existing public photo still true; unticked again false`
- [x] Down-migration — not needed: restating 0210's body undoes it, and the proxy no longer depends on the old route
- [x] Production apply plan — `0245` on `dbkodyyxxhtygxcxmfcu` **before** the deploy of this PR's code (the proxy now relies on the function alone)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI; covered by the §3 harness
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: unticked and Medical boundaries asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | photo proxy | unchanged | n/a — no policy or grant changed |
| management | photo proxy | unchanged | n/a — as above |
| staff | photo proxy | unchanged | n/a — as above |
| doctor | photo proxy | unchanged | n/a — as above |
| volunteer | photo proxy | unchanged | n/a — as above |
| signed out | published story photos | served | harness runs as anon |

- [ ] Every role above tested — n/a: grants unchanged (restated identically); only anon's answer is relevant and is asserted
- [ ] A role that should not have access is blocked server-side — n/a: unticked and Medical photos asserted false for anon

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface; the proxy route only drops one query

## 6. Regression

- [x] The pages nearest the change still work — `check-public-views.mjs` clean; build compiles the proxy
- [ ] Shared file touched checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken — nothing merged

## 7. Documentation

- [x] Backlog — the follow-up sentence on the success-stories item now says it is done. The filed item itself lives only on the `backlog` branch (not yet in `main`), so it is ticked at the next daily sync
- [x] Decision added — `2026-10-21-public-story-drive-file.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: the photo proxy already served published story photos; this moves the check into the function and removes the duplicate route, with no change a user can see
- [x] Commit messages say why
- [x] Claims were measured — the eleven-view list and absence of a later restatement came from grep of the migrations; behaviour from the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: no threshold
- [ ] Evidence pasted is actual output — deferred: release manager, for deploy output; gates and harness output above are unedited
- [ ] Public pages re-checked — deferred: release manager, who should open one published story photo after the deploy

### Deploy safety

- [ ] `deploy: production →` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [x] Migration and code that reads it in one PR — yes: the proxy now relies on `0245`; production apply must happen **before** the deploy
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Destructive migration backup — n/a: replaces one function body
- [x] Apply plan stated — `0245` on production before the deploy

### Rollback

- [x] Rollback position stated — Pi `--ref` rollback restores the old proxy, which still works with the new function; the migration is a superset and is safe to leave

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

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
