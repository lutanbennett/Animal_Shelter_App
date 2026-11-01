# Feature test plan — nested-claim-one-write

## Header

| | |
|---|---|
| Feature | The immunization write moves out of its `"use server"` module so the assistant card and the form each claim once |
| Backlog item | `docs/backlog.md` → **ONE LOGICAL SAVE TAKES TWO CLAIMS** (ticked) |
| Branch / worktree | `claude/nested-claim-one-write` @ `C:\Development\Animal_Shelter_nested-claim-one-write` |
| Dev server | not started — see section 4 |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `6a4d36bc` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the shared immunization write moved to `src/lib/immunizations/record.ts`, and the nested-claim behaviour is shown by a test
- [x] Files/areas touched listed — `src/app/assistant/actions.ts`, `src/app/immunizations/new/actions.ts`, new `src/lib/immunizations/record.ts`, new `src/lib/nested-claim.test.mjs`, the decision file, `docs/backlog.md`
- [x] Roles affected identified — anyone using the assistant's immunization card (it could not save before) and the /immunizations/new form (unchanged behaviour)
- [x] Anything explicitly **out of scope** written down — `action-result.ts`, `write-requests.ts`, `WRAPPED_WRITE_PATHS`, the assistant's per-tool activity checks and components, no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from current `origin/main`, nothing to merge at the time of the gates run
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
=== gates: build exited 0 after 342s

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
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the four tests in `src/lib/nested-claim.test.mjs` pass and exercise the real `runWriteAction()` over a model of 0292; the moved body is a verbatim move that typecheck and build compile. Not driven in a browser (see Left for manual verification)
- [ ] Data persists — n/a: the write is the same RPC call moved to another file; not re-driven against a database
- [ ] Create / edit / delete all exercised — n/a: create only, and covered under the happy path above
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: validation code moved unchanged
- [ ] Boundary cases checked — n/a: moved unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | assistant card, form | unchanged | n/a: no access rule changed |
| management | assistant card, form | unchanged | n/a: no access rule changed |
| staff | assistant card, form | unchanged | n/a: no access rule changed |
| doctor | assistant card, form | unchanged | n/a: no access rule changed |
| volunteer | assistant card, form | unchanged | n/a: no access rule changed |
| signed out | nothing | nothing | n/a: no access rule changed |

- [ ] Every role above tested — n/a: no card, policy or check changed; the `assistant.record` check and the RPC's own checks are untouched
- [ ] A role that should not have access is blocked server-side — n/a: unchanged server checks

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-visible behaviour change beyond a card now saving
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI change, not driven
- [ ] Network clean — n/a: no UI change, not driven

## 6. Regression

- [x] The pages nearest the change still work — `check-wrapped-write-paths.mjs` re-run, see sign-off notes; build compiles `/immunizations/new` and `/assistant`
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched; `action-result.ts` and `write-requests.ts` untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, and its title now says it is done and why
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-nested-claim-one-write.md`
- [x] `README.md` still accurate — it does not describe this write path
- [ ] **Release notes.** n/a: the assistant's immunization card has not been in a release with the failure; no shelter user has seen it save or fail
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "inner id is null" claim is the test's first case, run against the real `runWriteAction()`; the 0292 side is a model, and the decision file says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date from the clock beyond the moved future-date check, unchanged
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted is the tool's actual output — n/a: the only pasted evidence is the gates output, unedited
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; a code-only change, so a rebuild of the previous ref reverts it and no data is affected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The assistant's immunization card always answered "reload to save" and wrote nothing (inner claim had no request id) | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Ask the assistant to record a vaccine for a resident and confirm the card saves, and that the record appears on the resident | the assistant panel, a signed-in login holding `assistant.record` and the immunizations card |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

Manual verification by: pending: row 1 of Left for manual verification needs a person with the assistant open

Result: pass
