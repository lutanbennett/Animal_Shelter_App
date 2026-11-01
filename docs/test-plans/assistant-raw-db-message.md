# Feature test plan — assistant-raw-db-message

## Header

| | |
|---|---|
| Feature | A refused assistant write shows a plain sentence instead of the database's text |
| Backlog item | `docs/backlog.md` → **THE ASSISTANT SHOWS A RAW DATABASE MESSAGE WHEN A WRITE IS REFUSED BY A POLICY** (ticked) |
| Branch / worktree | `claude/assistant-raw-db-message` @ `C:\Development\Animal_Shelter_assistant-raw-db-message` |
| Dev server | `http://localhost:3003` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `85490ae1` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — runWrite() swaps database text for a sentence; the refusal itself is unchanged
- [x] Files/areas touched listed — `src/app/assistant/actions.ts`, `src/lib/assistant/refusal.ts`, both dictionaries, backlog, decision file, this plan
- [x] Roles affected identified — none by role; any login whose assistant write is refused by a policy
- [x] Anything explicitly **out of scope** written down — read paths in `src/app/assistant/lookups.ts` returning `error.message`; naming the exact card

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branch cut from current main this morning, nothing to merge in
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on a login holding only the `assistant` card, "Angsumalin weighs 12.4 kg" was refused and the panel showed: "Your cards don't let you make this change, so nothing was saved. Ask someone whose cards cover it, or use the resident's own page." No database text
- [ ] Data persists — n/a: nothing is written on a refusal
- [ ] Create / edit / delete all exercised — n/a: only the refusal message changed
- [ ] Empty state — n/a: no list
- [ ] Invalid input rejected readably — n/a: unchanged
- [ ] Boundary cases — n/a: other database-shaped text now goes to the generic message with a log ref; not driven, no way to provoke one from the UI

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any login | assistant | refused write shows the sentence | verified on one-card login (`assistant`) |

- [x] Every role above tested — one-card `assistant` login, which is the case the item names
- [ ] A role that should not have access is blocked server-side — n/a: the check is untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: no new feature
- [x] Translatable strings go through the translation path — `assistant.cardRefused` in en and th
- [ ] Mobile viewport — n/a: same bubble component
- [ ] Browser console clean — n/a: not inspected
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] The pages nearest the change still work — 416 tests and the build pass
- [ ] Shared file touched checked from a second page — n/a: runWrite is only used by the assistant
- [x] Nothing merged from main was broken — branch is on a fresh main

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices in `docs/decisions/2026-11-01-assistant-raw-db-message.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a refusal sentence in an error path; nobody was relying on the old text
- [x] Commit messages say why
- [x] **Claims were measured** — the refusal sentence was seen on screen; the gate output is the tool's

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted is unedited** — deferred: release manager
- [ ] Public pages re-checked — n/a: not public

### Deploy safety

- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] production dry-run — n/a: no migration
- [ ] backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the PR; no data or schema involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Detection is by message wording, since helpers drop the Postgres code | accepted — in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai sentence `assistant.cardRefused` reads naturally | th.ts, a Thai reader |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item was checked by a person — n/a: one item, the Thai wording, is left for a Thai reader

Manual verification by: pending: Thai wording check

### Result

- [x] Open defects are fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
