# Feature test plan — proof-line-run

## Header

| | |
|---|---|
| Feature | `check-backlog-waiting.mjs --proofs` prints each waiting:lutan proof line (run-it vs not-a-command); `/plan-day` runs it before naming Lutan |
| Backlog item | `docs/backlog.md` → **An item that says a step is Lutan's must say how to prove it is done** (#prvln, ticked) |
| Branch / worktree | `claude/proof-line-run` @ `C:\Development\Animal_Shelter_proof-line-run` |
| Dev server | not started — no UI surface |
| PR | n/a: filled when the PR is opened |
| Tested by / date | Claude / 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | `19bc4a46b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the second half: a printing helper and a plan-day step, no runner
- [x] Files/areas touched listed — `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, `.claude/skills/plan-day/SKILL.md` and `reference.md`, decision file, backlog tick, this plan
- [x] Cards affected identified — none: no app code, no access rule; admin and the signed-out public unaffected
- [x] Anything explicitly **out of scope** written down — no runner that executes proof lines; `decision by:lutan` stays out; no proof lines written

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the line below:

```
=== gates: typecheck exited 0 after 81s
=== gates: lint exited 0 after 157s
=== gates: test exited 0 after 44s
=== gates: build exited 0 after 181s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `--proofs` run on the live backlog: 7 items under RUN IT, 4 under NOT A COMMAND (#mzu7v, #z04wr, #gvnrr, #s0jgi), none without a line; `--proofs "#shfil" "#mzu7v"` prints one of each class
- [ ] Data persists — n/a: prints only, writes nothing
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state renders sensibly — n/a: with no match it prints "no matching waiting:lutan items" (code path read, not forced)
- [x] Invalid input is rejected — a bare unknown id matches nothing and prints that line; strict check unchanged: `BACKLOG_PROOF_STRICT=1` exits 0 on the merged backlog
- [ ] Boundary cases checked — n/a: class read from the first 220 characters only, by design (decision file)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page | n/a | n/a |
| exactly `none` | n/a: no page | n/a | n/a |
| signed out | n/a: no page | n/a | n/a |

- [ ] Every login above tested — n/a: no UI or access surface
- [ ] A login that should not have access is blocked server-side — n/a: no access surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: none
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — `check-backlog-sections.mjs`, `-ids`, `-titles` and `-waiting` all ok after the change
- [ ] Shared file touched from a second page — n/a: no shared app file touched; `scripts/lib/backlog-waiting.mjs` is read by the waiting check, run above
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates green after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #prvln, both halves true
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-23-proof-lines-run-before-naming-him.md`
- [x] `README.md` still accurate — unaffected
- [ ] **Release notes.** n/a: a planner script and skill; no shelter user, Admin or product administrator would see anything appear, move or disappear
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Counts and classes above are from the live run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager at deploy
- [ ] Deployed SHA matches — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — n/a: no app change
- [ ] Smoke-tested — n/a: no app change
- [ ] Timezone-sensitive behaviour — n/a: no date logic added
- [ ] Boundary/banding assertions — n/a: no threshold in app code
- [ ] Evidence pasted is actual output — n/a: gates block above is pasted from the run
- [ ] Public pages re-checked — n/a: untouched

### Deploy safety

- [ ] `deploy:` line — n/a: nothing deploys
- [ ] `strip-baked-env` — n/a: nothing deploys
- [ ] New secret/env var — n/a: none (`BACKLOG_PROOF_STRICT` already existed)

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: revert the commit; nothing deployed, no schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `--proofs` takes ids only as 5-char tokens; a mistyped id silently matches nothing | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is in the PR
- [ ] Handed to the production release manager — n/a: docs and scripts only

Result: pass

Release manager acknowledgement: n/a: no deploy
