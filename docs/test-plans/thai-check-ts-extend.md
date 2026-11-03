# Feature test plan — thai-check-ts-extend

## Header

| | |
|---|---|
| Feature | Upload/download/export route refusals read the Thai dictionary (`t.uploads.errors`, 34 keys); `check-thai-dictionary.mjs` rule 3 reads `.ts` files report-only |
| Backlog item | `docs/backlog.md` → **EXTEND `check-thai-dictionary.mjs` TO `.ts` FILES** (retitled, left open) |
| Branch / worktree | `claude/thai-check-ts-extend` @ `C:\Development\Animal_Shelter_thai-check-ts-extend` |
| Dev server | not started — see section 4 |
| PR | see PR |
| Tested by / date | Claude / 2026-11-03 |
| Carries a migration? | no |
| Tested at SHA | `2e616735` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — route refusals now come from the dictionary in both languages, and the check reads .ts files (report only), gated on the `user` class
- [x] Files/areas touched listed — 23 files under `src/app/**/route.ts`, two `actions.ts`, `src/lib/bills/upload.ts`, both dictionaries (`uploads.errors`), `scripts/check-thai-dictionary.mjs`, `src/lib/releases.ts`, decision file, backlog retitle, this plan
- [x] Cards affected identified — none: no permission check changed; only the text of existing refusals. Admin and signed-out see the same refusals, now in their language
- [x] Anything explicitly **out of scope** written down — the 17 admin-only strings stay English; `.tsx`, the 11 "maybe", 14 position-missed `user` strings, manual and releases untouched

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: done by the finishing sequence immediately before the PR; see PR body
- [x] `node scripts/gates.mjs` ends with the gates line, all four exit codes 0:

```
=== gates: typecheck exited 0 after 105s
=== gates: lint exited 0 after 372s
=== gates: test exited 0 after 54s
=== gates: build exited 0 after 454s
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
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — rule 3 run on the pre-change tree flagged 64 strings; on this tree it reports 0 (`node scripts/check-thai-dictionary.mjs`)
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no data operation changed
- [ ] Empty state renders sensibly — n/a: no screen changed
- [ ] Invalid input is rejected with a readable message — n/a: browser not driven; routes were not exercised live, only compiled (typecheck, build). A refusal path now awaits `getT()`; four `notFound()` helpers became async
- [ ] Boundary cases checked — n/a: no thresholds

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | same routes | unchanged | n/a: no check changed |
| exactly one card | same routes | unchanged | n/a: no check changed |
| signed out | same routes | unchanged refusal, now translated | n/a: not driven |

- [ ] Every login above tested — n/a: no permission logic touched
- [ ] A login that should not have access is blocked server-side — n/a: unchanged, only the text of the refusal moved to the dictionary

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: none
- [ ] Manual updated — n/a: no feature behaviour change beyond refusal wording
- [x] Translatable strings go through the translation path — that is the change; Thai is new and unread (see Left for manual verification)
- [ ] Mobile viewport — n/a: no layout
- [ ] Browser console clean — n/a: browser not driven
- [ ] Network clean — n/a: browser not driven

## 6. Regression

- [x] The pages nearest the change still work — typecheck and build compile every route touched; `node scripts/check-thai-dictionary.mjs` passes rules 1 and 2 (Thai entries complete)
- [ ] Any shared file touched checked from a second page — n/a: dictionaries are shared with stream 7; only added a block, nothing reformatted
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the branch point; re-run at sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately NOT ticked; retitled to say what is left
- [x] Non-obvious design choices added to `docs/decisions/` — `2026-11-03-thai-check-ts-extend.md`
- [x] `README.md` still accurate — it does not describe this check's rules
- [x] **Release notes.** — one line added to `unreleased` about Thai upload refusals (says the Thai is unread)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — counts from `measure-english-in-ts.mjs`; false-positive rate from reading all 64 flagged strings on the pre-change tree

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (upload a >15MB file with the app in Thai)
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: gates block above is pasted unedited
- [ ] Public pages re-checked — n/a: not touched

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both migration and code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated — Pi `--ref <sha>` rebuild; no migration to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Brief's counts (261 / 78) differ from a fresh run (263 / 80) | accepted — noted in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A Thai speaker reads the 34 new Thai strings in `uploads.errors` | `src/lib/i18n/dictionaries/th.ts`, block `uploads.errors` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the Thai read is outstanding, so this is not ticked

Manual verification by: pending: a Thai speaker reading the 34 new strings in th.ts uploads.errors

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: after merge

Result: pass

Release manager acknowledgement: pending
