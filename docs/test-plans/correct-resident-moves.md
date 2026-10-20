# Feature test plan

## Header

| | |
|---|---|
| Feature | `correct-resident.mjs --enclosure-moves`: a duplicate's enclosure changes are removed with it |
| Backlog item | `docs/backlog.md` → none: asked in chat on 2026-10-20 to remove R-0048 (duplicate of R-0065) |
| Branch / worktree | `claude/correct-resident-moves` @ `C:\Development\Animal_Shelter_correct-resident-moves` |
| Dev server | `node scripts/worktree.mjs dev` (not used: script only) |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | `064064d2` (sync: already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked: a new `--enclosure-moves` flag lets the script remove a duplicate whose only history beyond intake is enclosure changes; Lutan asked for exactly this option in chat
- [x] Files/areas touched listed: `scripts/correct-resident.mjs`, `README.md`, `docs/decisions/2026-10-20-correct-resident-enclosure-moves.md`
- [x] Roles affected identified: none. The script runs as the database owner through the Management API; no app login uses it
- [x] Out of scope written down: foster, adoption, hospital and other placements still refuse; no app change; the live removal of R-0048 is run from the main checkout after merge, not from this stream

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` (run at `064064d2`; the later commit is docs only):

```
=== gates: build exited 0 after 175s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: the dry run on dev of R-0048 → R-0065 with `--copy sex --force-names --enclosure-moves` ran the real delete (Intake and ChangeEnclosure placements, 1 diet with 2 rounds, 1 translation) and the copy of `sex` inside the script's `begin…rollback`, with its row-count and kept-unchanged assertions: `Trying it (rolled back) … ok`
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, dry run on dev: with `--enclosure-moves` the R-0048 removal runs cleanly and prints the apply line
- [x] Data persists: after #771 merged, R-0048 was removed on live from the main checkout (`Doing it … ok`, `R-0048 is deleted.`, R-0065 now reads `Dog, Female`), receipt `removed-R-0048-live-2026-10-20.json` on the Desktop
- [x] Create / edit / delete all exercised: the delete and the `sex` copy inside the rolled-back transaction
- [ ] Empty state renders sensibly — n/a: unchanged by this PR; no new input path
- [x] Invalid input is rejected with a readable message, not a crash: the same dry run without the flag refuses with "They are only enclosure changes: if it is a duplicate, add --enclosure-moves and they go with it."
- [ ] Boundary cases checked — n/a: dev has no duplicate with a Foster or Hospital placement to run `--enclosure-moves` against; read from the code instead (`moved` keeps every type outside `SEED_PLACEMENTS` and `ENCLOSURE_MOVES`, and the message falls back to "sort it out in the app")

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | script only | n/a |
| management | n/a | script only | n/a |
| staff | n/a | script only | n/a |
| doctor | n/a | script only | n/a |
| volunteer | n/a | script only | n/a |
| signed out | n/a | script only | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page
- [ ] Manual updated — n/a: no user-facing feature
- [ ] Translatable strings go through the translation path — n/a: console output for the operator only
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The nearest thing still works: the dry run without the new flag still refuses a moved resident, as before
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged (already up to date) and gates green

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: no backlog item; asked in chat
- [x] Non-obvious design choices added as `docs/decisions/2026-10-20-correct-resident-enclosure-moves.md`
- [x] `README.md` still accurate: the scripts list names the flag and the new decision file
- [ ] **Release notes.** — n/a: a maintenance script no shelter user sees; nothing in the app changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision file were measured, not reasoned**: R-0048's placements (Intake, ChangeEnclosure) were read from the script's own dry runs on live and dev; that the delete already removed every placement row was read from the delete SQL (`delete from placement_history where id = any(...)` over all of them)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: a script run from the main checkout; nothing is deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no app change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**: the gates lines and quoted messages are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deployed
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: nothing deployed depends on the script, so reverting the PR removes the flag. A removal already applied is not undone by any rollback; its receipt on the Desktop holds every deleted row

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The "To do it" command printed after a clean dry run left out `--enclosure-moves`, so pasting it as printed would have been refused. Found on the live R-0048 run after #771 merged; the removal was run with the flag added by hand | fixed in the follow-up PR: the printed line now carries the flag. Re-checked on dev: `… --force-names --enclosure-moves --apply` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a maintenance script with no screen; the live removal's own output is the check

### Result

- [x] Open defects are either fixed or explicitly accepted above: #1 fixed
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: n/a: nothing to deploy
