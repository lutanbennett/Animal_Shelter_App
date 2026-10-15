# Test plan: labels-and-year-schema

## Header

| | |
|---|---|
| Feature | Fix duplicate 0201; `since_year`; Thai breed/colour (schema only) |
| Backlog item | `docs/backlog.md` → "Add since <year>" and "Thai for a resident's breed and colour" (status notes only, not ticked) |
| Branch / worktree | `claude/labels-and-year-schema` @ `C:\Development\Animal_Shelter_labels-and-year-schema` |
| Dev server | n/a: no UI surface |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | yes (0203, 0204, 0205 and a rename to 0202) |
| Tested at SHA | b8d35d3d |

## 1. Scope and risk

- [x] Change is described in one sentence: renumber the clashing map-rooms migration, and add the `since_year` and Thai breed/colour columns with their public views
- [x] Files touched: `supabase/migrations/` 0202 (renamed), 0203, 0204, 0205; `docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`
- [x] Roles affected: signed-out public (two public views widened by two columns each, one by one); no signed-in role sees a change
- [x] Out of scope: Settings field, labels, screens, `translatable_labels` registration; backlog items stay unticked

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (script also runs tests, shown below)
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [x] Migration numbers 0203–0205 follow `main`'s highest (0201) after the rename to 0202; no other in-flight branch carries one
- [x] `--status` reviewed before applying (204 rows, 203 files, phantom 0202)
- [x] `--dry-run` reviewed: all three ok
- [x] Applied to dev and recorded; afterwards 206 files, 206 rows, 0 pending
- [x] Files are re-runnable (`if not exists`, `drop constraint if exists`, `or replace`, exact-name delete)
- [x] Existing rows still read correctly: `check-public-views.mjs` and `check-map-rooms.mjs` (44 checks, GREEN) run against dev after applying
- [x] Constraints exercised in a begin/rollback harness: since_year 1850 and 2101 rejected, 2019 and null accepted; harness printed ok
- [x] Down-migration: not needed — additive nullable columns; the view change only appends columns, and 0203 removes a row that should not exist
- [ ] Production apply plan — n/a: stated in section 8 (apply 0202–0205 in order with the release; 0203 deletes nothing there; production has applied neither 0201 file yet)

View column lists, before → after, from the information schema on dev:

- `public_resident_cards`: 24 → 26, added `breed_th`, `colour_th` at the end, nothing removed, first 24 in the same order
- `public_resident_profiles`: 25 → 27, added `breed_th`, `colour_th` at the end, nothing removed, first 25 in the same order
- `public_impact_figures`: 7 → 8, added `since_year` at the end, nothing removed

`check-public-views.mjs` on dev: no failing check (0 lines starting `fail`), ending on the project line; the one `skip` is "no non-image attachment in a public project folder to ask about".

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface, no code reads these columns yet
- [ ] Data persists — n/a: nothing writes them yet
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: covered by the harness in section 3; no form exists
- [ ] Boundary cases — n/a: covered by the harness in section 3

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles and signed out | n/a: no UI surface | the same two public views, with the new columns readable by anon | check-public-views green |

- [ ] Every role above tested — n/a: no UI surface; anon access to the views is what check-public-views covers
- [ ] A role that should not have access is blocked — n/a: no new access; grants restated and check-public-views confirms anon cannot write

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: columns not yet registered; that is the later item
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [x] Nearest things still work: `check-map-rooms.mjs` 44 checks GREEN after the rename; `check-public-views.mjs` clean
- [ ] Shared file touched from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken (nothing merged)

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately NOT ticked, this is the schema half; status notes go on the `backlog` branch
- [x] Decision file added: `docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`
- [ ] `README.md` still accurate — n/a: no behaviour described there changes
- [ ] **Release notes.** n/a: columns nobody can fill in yet; the app halves carry the notes
- [x] Commit messages say why
- [x] Claims were measured: ledger counts, column lists and the constraint harness come from queries against dev, not from reasoning

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy time — deferred: production release manager
- [ ] Deployed SHA matches — deferred: production release manager
- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: production release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates or clocks involved
- [ ] Boundary or banding change — n/a: the only bounds are the year check, asserted both sides in section 3
- [ ] Evidence pasted is actual tool output — n/a: gates line is pasted verbatim; the view lists are summarised from the diff script's printout
- [ ] Public pages re-checked after cache purge — deferred: production release manager
- [ ] Deploy target line read — deferred: production release manager
- [ ] strip-baked-env line seen — deferred: production release manager
- [ ] New secret or env var — n/a: none
- [ ] Code and migration together — n/a: no code reads the migrations
- [ ] Production dry-run — deferred: production release manager
- [ ] Production backup — n/a: additive columns and a row delete of a ledger row that is absent in production
- [ ] Apply plan stated — deferred: production release manager (apply 0202–0205 before the next deploy)
- [ ] Rollback position — n/a: additive schema is safe to leave; no down-migration needed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

- [x] The manual list above is empty; nothing for a person to look at

Manual verification by: n/a: no UI surface, no code reads these columns yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted once the PR exists
- [ ] Handed to the production release manager — n/a: at release time

Result: pass

Release manager acknowledgement: pending
