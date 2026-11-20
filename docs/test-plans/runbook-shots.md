# Feature test plan

## Header

| | |
|---|---|
| Feature | runbook-shots: the three registered runbook screenshots captured and shown in the onboarding runbook |
| Backlog item | `docs/backlog.md` → #onbrb (ticked) |
| Branch / worktree | `claude/runbook-shots` @ `C:\Development\Animal_Shelter_runbook-shots` |
| Dev server | `DEV_SHELTER_ID=<shelter id> npm run dev -- --port 3011` → `http://localhost:3011` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | 34a25d9e5 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three PNGs captured by the existing script and shown at Steps 1, 6 and 7 of the runbook, with two stale notes corrected.
- [x] Files/areas touched listed: `public/manual/runbook-*.png`, `src/lib/manual/screenshot-sizes.json`, `docs/shelter-onboarding-runbook.md`, `docs/backlog.md`, `docs/decisions/2026-11-20-runbook-shots.md`
- [x] Cards affected identified: none; no code or access rule changed. Admin and the public are unaffected.
- [x] Out of scope written down: re-running the other manual screenshots, anything under `src/app/platform/`, a new shelter.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` — all four exit 0:

```
=== gates: typecheck exited 0 after 145s
=== gates: lint exited 0 after 383s
=== gates: test exited 0 after 112s
=== gates: build exited 0 after 327s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration, nothing to undo
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: the script captured all three shots against the dev server; each image was opened and looked at and shows real page content, not a blank frame. The product-admin console one had a real email covered over, and the cover was looked at after.
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete — n/a: no feature, only images and prose
- [ ] Empty state — n/a: no UI changed (the Who does what shot is itself a new shelter's empty state)
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no logic

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (lanna and rehearsal shelters, aal2) | /platform, /admin, /admin/who-does-what | all three open | as expected |

- [ ] Every login above tested — n/a: only Admin was needed to photograph; no access rule changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: the in-app manual is untouched; only the runbook document changed
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: documentation and images only
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: the three pages photographed loaded and rendered
- [ ] Any shared file touched checked from a second page — n/a: `screenshot-sizes.json` only gained three entries; the other 44 are unchanged in the diff
- [x] Nothing merged from `main` during `sync` was broken: gates above ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (#onbrb)
- [x] Non-obvious design choices added as `docs/decisions/2026-11-20-runbook-shots.md`
- [ ] `README.md` still accurate — n/a: nothing README describes changed
- [ ] **Release notes.** — n/a: a runbook document and three images; no screen, page or setting moved
- [x] Commit messages say why, not just what
- [x] Claims were measured: the Step 7 note was corrected only after the page was opened and showed Create a role; the export note was corrected from the previous stream's recorded run, and the export was not run to the end here (it stops at the missing age key), which the runbook now says

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the gates output above is pasted from the run
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy target line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position — n/a: documents and images only; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | None found. | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: nothing left for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR
- [ ] Handed to the production release manager — n/a: handled at release time

Result: pass

Release manager acknowledgement: n/a: not yet
