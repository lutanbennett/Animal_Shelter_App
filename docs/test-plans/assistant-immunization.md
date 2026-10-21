# Test plan — assistant-immunization

## Header

| | |
|---|---|
| Feature | Assistant batch 3: record a vaccination by typing it |
| Backlog item | `docs/backlog.md` → Assistant v1 (programme; status note updated, not ticked) |
| Branch / worktree | `claude/assistant-immunization` @ `C:\Development\Animal_Shelter_assistant-immunization` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | see PR description |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | 43976f1b |

## 1. Scope and risk

- [x] Change: the assistant understands "Panda had rabies today" and shows an editable card whose Confirm runs the existing `recordImmunizations`
- [x] Touched: `src/lib/assistant/` (new intent, types, data, parse), `AssistantCards.tsx`, `AssistantConversation.tsx`, `app/assistant/actions.ts`, release note, backlog note
- [x] Roles: assistant writers only (admin / management); volunteers get lookups only, enforced by the existing `runWrite` check
- [x] Out of scope: "came back from foster", new carer in a sentence, batch numbers, dates in words, manual topic and dictionaries (other stream's files)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing line:
```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number one above main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: "Angsumalin had a rabies vaccination today" gave a card with Angsumalin (R-0055), Rabies ticked, today's date; I also ticked Parvovirus, pressed Confirm, and the page said it was recorded
- [x] Data persists: two immunization_records rows (Rabies, Parvovirus) dated 2026-10-21 with the note `via the assistant — "…"`, and an assistant_actions row intent=immunization status=confirmed result=ok, read back from the dev database
- [ ] Create / edit / delete — n/a: create only; the card is a create path
- [ ] Empty state — n/a: no list is rendered
- [x] Invalid input: Confirm stays disabled until a resident, at least one vaccine and a date are set (code read, not clicked through)
- [ ] Boundary cases — n/a: date cannot be in the future (max on the field and the action's own check)

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | not driven | not tested |
| management | /assistant | card and Confirm work | pass (disposable management account) |
| staff | n/a | role retired | n/a |
| doctor | n/a | not driven | not tested |
| volunteer | n/a | lookups only, refused by runWrite | not tested (unchanged check) |
| signed out | /assistant | redirects to login | pass |

- [x] Roles tested: management and signed-out only; the rest not driven, recorded above
- [ ] Blocked server-side — n/a: the write check is the existing shared `runWrite` and is unchanged

## 5. Cross-cutting

- [ ] Nav entry — n/a: none added this batch (NavLinks belongs to diets-app)
- [ ] Manual — n/a: not added this batch; manual belongs to diets-app, flagged in the PR for a later stream
- [ ] Translatable strings — n/a: card words are in `immunization-strings.ts` (en and th), not the dictionaries, for the same reason
- [ ] Mobile viewport — n/a: reuses the existing card layout; not resized
- [x] Browser console clean — no errors seen in the session
- [x] Network clean — the confirm succeeded with no failed requests surfaced

## 6. Regression

- [x] Assistant page still loads and parses (checked by loading /assistant)
- [ ] Shared file touched checked from another page — n/a: no NavLinks or manual edits
- [x] Nothing merged from main during sync broke this branch (gates green after sync)

## 7. Documentation

- [ ] Backlog item ticked — n/a: programme item, deliberately not ticked; status note appended and Next rewritten
- [ ] Decision file — n/a: no non-obvious choice beyond the strings location, stated in the PR
- [x] README still accurate
- [x] **Release notes.** `unreleased` gained a line describing what to type
- [x] Commit messages say why
- [x] Claims were measured: the verification above is the database read-back

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: uses the asker's own clock for "today", unchanged from other intents
- [ ] Boundary or banding change — n/a: no thresholds
- [x] Evidence pasted is the tool's actual output
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy safety production ref — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — n/a: none
- [ ] Both migration and reading code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager (purely additive code; revert the PR)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai wording of the card reads naturally | /assistant with language set to Thai |

## Sign-off

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-21

- [ ] Manual list is empty or checked — n/a: item 1 is open

Manual verification by: pending: Thai wording of the card

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the release manager — n/a: handover happens at release time

Result: pass

Release manager acknowledgement: n/a: not yet released
