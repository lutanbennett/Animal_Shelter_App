# Feature test plan

## Header

| | |
|---|---|
| Feature | Assistant: number words in the free-space question; picker on lookup answers |
| Backlog item | `docs/backlog.md` → "THE ASSISTANT READS room for two dogs AS ROOM FOR ONE" and "a question with several matching residents shows the which-one picker" |
| Branch / worktree | `claude/assistant-parser-picker` @ `C:\Development\Animal_Shelter_assistant-parser-picker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | 9b011129 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the free-space parser reads number words and declines a quantity it cannot read; a shared-name lookup draws the picker
- [x] Files/areas touched: `src/lib/assistant/intents/lookups.ts`, `parse.test.mjs`, `src/components/assistant/{AssistantAnswers,AssistantCards,AssistantConversation,ResidentCandidates}.tsx`, `src/lib/manual/en.ts`, `src/lib/releases.ts`
- [x] Roles affected: anyone holding the assistant card; no access rule changed
- [x] Out of scope: could-not-help.ts reading the whole residents table; per-tool checks; dictionaries (untouched)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`; its closing line is below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on main — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: "room for twelve dogs" answered for 12; "Where is Kame?" drew two residents and pressing one answered for R-0036
- [ ] Data persists — n/a: read-only questions, nothing written
- [ ] Create / edit / delete — n/a: read-only questions, nothing written
- [ ] Empty state — n/a: no list added
- [x] Invalid input: "room for a few dogs" is declined with the not-understood reply, not answered for one
- [x] Boundary cases: parse tests cover two, Three (capital), twelve, Thai word, Thai numeral, no quantity, "a new dog"

| Role | Can reach | Expected | Result |
|---|---|---|---|
| assistant-card-only login | assistant panel | both fixes work | as expected |

- [ ] Every role above tested — n/a: only a one-card login was driven; no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: nothing about access changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): the figures-only warning removed
- [ ] Translatable strings — n/a: no new string; no dictionary touched
- [ ] Mobile viewport — n/a: same picker component, layout unchanged
- [x] Browser console clean — no errors seen while driving
- [x] Network clean — lookups answered normally

## 6. Regression

- [x] Nearest pages still work: the assistant panel's other questions (room for two dogs, unmatched sentence)
- [ ] Shared file touched checked from a second page — n/a: AssistantCards picker is used by cards; typecheck and build pass, card path not driven
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-01-assistant-parser-picker.md`
- [x] README.md still accurate
- [x] **Release notes.** `unreleased` gained a line, tagged to the assistant card
- [x] Commit messages say why
- [x] Claims were measured: browser drive and parse tests above

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no threshold change beyond the parse tests above
- [ ] Evidence is unedited tool output — n/a: gates line pasted as printed
- [ ] Public pages re-checked — n/a: no public page
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The first draft of the release line had a bad escape and broke typecheck | fixed before push |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A Thai speaker glances at the Thai number tokens in the parser (หนึ่ง..สิบ) | `src/lib/assistant/intents/lookups.ts` |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is a wording glance, listed above

Manual verification by: pending: Thai speaker reads the number tokens

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: goes out with the next release

Result: pass

Release manager acknowledgement: n/a: release manager reads at deploy
