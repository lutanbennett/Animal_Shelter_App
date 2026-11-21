# Feature test plan

## Header

| | |
|---|---|
| Feature | One-off script to remove one inert shelter |
| Backlog item | `docs/backlog.md` → #tstsh (not ticked: the production run is Lutan's) |
| Branch / worktree | `claude/remove-one-shelter-script` @ `C:\Development\Animal_Shelter_remove-one-shelter-script` |
| Dev server | n/a, script only |
| PR | see PR |
| Tested by / date | Claude, 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | d30c0d58d |

## 1. Scope and risk

- [x] `scripts/remove-shelter.mjs` removes one inert shelter by key, read-only unless `--apply`
- [x] Touched: `scripts/remove-shelter.mjs`, one decision file, this plan
- [ ] Cards affected — n/a: a script run by Lutan; no card, no page, no public surface changes
- [x] Out of scope: any console button (`#pacon`), any migration, the production run

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main was merged at branch start; no sync needed before PR (checked at PR time)
- [x] `node scripts/gates.mjs`

```
=== gates: typecheck exited 0 after 49s
=== gates: lint exited 0 after 233s
=== gates: test exited 0 after 62s
=== gates: build exited 0 after 209s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: disposable dev shelter, dry run then `--apply`, deleted and confirmed gone
- [ ] Data persists — n/a: re-ran the key afterwards, "No shelter" returned
- [x] Delete exercised; create and edit are n/a: the script only deletes
- [ ] Empty state — n/a: no UI
- [x] Invalid input refused: two keys, no `--env`, unknown key
- [x] Boundary: shelter with a `shelter_hosts` row refused with the count; `lanna` refused by name

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | n/a: no page | n/a | n/a |

- [ ] Every login tested — n/a: no page or login surface
- [ ] Blocked server-side — n/a: the script uses the service token on the operator's machine

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [ ] Nearby pages — n/a: nothing under src/ changed
- [ ] Shared files — n/a: none touched
- [x] Nothing merged from main broken: build and tests pass

## 7. Documentation

- [ ] Backlog item ticked — n/a: #tstsh's done-when needs the row gone, which is Lutan's run
- [x] Decision file `docs/decisions/2026-11-21-remove-one-shelter-script.md`
- [ ] README — n/a: no change to anything it describes
- [ ] **Release notes.** n/a: a one-off maintenance script; nothing a shelter user can see
- [x] Commit messages say why
- [x] Claims were measured: the 114 / 111 / 1 / 2 split came from the dev catalogue, and the refusals were run

## 8. Pre-production gate

- [ ] Tested SHA — deferred: release manager
- [ ] Deployed SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke test — deferred: release manager
- [ ] Timezone — n/a: no date logic
- [ ] Boundary assertions — n/a: no banding or thresholds
- [ ] Evidence is unedited tool output — n/a: proof output is in the PR body as printed
- [ ] Public pages — n/a: no public change
- [ ] Deploy ref line — n/a: not a deploy
- [ ] strip-baked-env — n/a: not a deploy
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: nothing deployed; the script deletes one inert row that holds no data

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Refusal exit codes were lost (always 0) while building | fixed before commit |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan runs it against production once the allow rule exists | his machine |

## Sign-off

- [x] Everything that could be verified without human eyes was run
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-21

- [ ] Manual list is not empty; only the person who looked may tick — pending: Lutan runs it against production once the allow rule exists

Manual verification by: pending: Lutan runs it against production once the allow rule exists

### Result

- [x] Open defects are fixed
- [ ] Checklist pasted into the PR — n/a: the plan file is in the PR
- [ ] Handed to the release manager — n/a: not a release item

Result: pass
