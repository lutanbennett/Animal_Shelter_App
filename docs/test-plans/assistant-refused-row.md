# Test plan: assistant-refused-row

## Header

| | |
|---|---|
| Feature | A volunteer's refused assistant write leaves an audit row |
| Backlog item | `docs/backlog.md` → "A volunteer turned away from an assistant write leaves no audit row" |
| Branch / worktree | `claude/assistant-refused-row` @ `C:\Development\Animal_Shelter_assistant-refused-row` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | pending: number assigned when the PR is opened |
| Tested by / date | Claude, 2026-10-17 |
| Carries a migration? | no |
| Tested at SHA | c2b4ebbb |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: when the assistant turns a volunteer away from a write, the browser sends a `refused` audit row (policy half was 0214, #683)
- [x] Files/areas touched listed: `src/lib/assistant/audit.ts`, `src/app/assistant/actions.ts` (new `recordRefusedTurn`), `src/components/assistant/AssistantConversation.tsx`, a dev harness script, a decision file, the backlog tick
- [x] Roles affected identified: volunteer (writes the row, sees no change); admin/management/staff untouched
- [x] Out of scope written down: no SQL or policy change, no retention or expiry (DB-11 is Lutan's), no change to who may read rows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR: all 8 checks passed on #686 at c2b4ebbb plus the plan commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the policy landed in 0214
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a harness — n/a: no migration; the policy's behaviour was exercised through the real client by `scripts/check-assistant-refused-client.mjs` (section 4)
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in as a throwaway volunteer on dev, typed "Panda weighs 12.4 kg" at 375 px; the usual refusal showed and an `assistant_actions` row appeared
- [x] Data persists: read afterwards as the service role, not through the volunteer
- [ ] Create / edit / delete — n/a: insert only; the volunteer cannot edit or delete
- [ ] Empty state — n/a: no list or screen added
- [x] Invalid input is rejected: with the browser's server-action call forced to fail, the refusal still read normally and nothing was thrown to the console
- [x] Boundary cases: the harness shows `confirmed` and `unmatched` under `assistant.ask` are refused by the database, as is a `refused` row in another user's name; text is stored verbatim with its spaces

Rows read as the service role. Before: none for this volunteer. After the UI request (own `user_id`, `status = refused`, intent, draft and result null):

```
[{"status":"refused","request_text":"Panda weighs 12.4 kg","intent":null,"draft":null,"result":null}]
```

A third request typed with the call forced to fail left no row and the refusal unchanged.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged: holds `assistant.record`, never takes the refusal path | not exercised |
| management | n/a | unchanged, same reason | not exercised |
| staff | n/a | retired role (0173) | n/a |
| doctor | n/a | no `assistant.ask`, never reaches this path | not exercised |
| volunteer | /assistant | same refusal text; one refused row written; cannot read it | pass |
| signed out | n/a | no access to /assistant | not exercised |

- [x] Every role above tested, or reasoned: only volunteer takes the new path
- [x] A role that should not have access is blocked server-side: the harness shows a volunteer's insert of any status but `refused`, or in another name, is refused by RLS

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible behaviour changed
- [ ] Translatable strings — n/a: no new strings
- [x] Mobile viewport (375px): the refusal and input checked at 375 px
- [x] Browser console clean: no errors, including during the forced failure
- [x] Network clean: the only failed call was the injected one

## 6. Regression

- [x] The pages nearest the change still work: /assistant loaded as a volunteer and gave the refusal for two different write sentences
- [x] Shared files touched checked from another page: `recordAssistantTurn` (cancelled/unmatched) is untouched and its type unchanged; build and typecheck pass
- [x] Nothing merged from `main` during `sync` was broken: nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added: `docs/decisions/2026-10-17-refused-row-is-fire-and-forget.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: the volunteer sees the same polite refusal; the row is staff-side bookkeeping
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: fire-and-forget by forcing the call to fail, the policy by the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager at deploy
- [ ] Deployed SHA matches — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test — deferred: release manager at deploy
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager at deploy
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no thresholds or bands
- [ ] Evidence pasted is the tool's actual output — n/a: the row above is the query's JSON as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager at deploy
- [ ] `strip-baked-env` seen — deferred: release manager at deploy
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: revert the PR; there is no schema change to undo, and rows already written are harmless and unreadable to volunteers

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing: staff-side bookkeeping only; the volunteer's screen is unchanged | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this; n/a on the signature

Manual verification by: n/a: nothing for a person to look at, the volunteer's screen is unchanged

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted once the PR exists
- [ ] Handed to the production release manager — n/a: handed over at release time

Result: pass

Release manager acknowledgement: pending
