# Feature test plan: thai-read-guided

## Header

| | |
|---|---|
| Feature | First weekly Thai read of the new strings, done in chat with Lutan |
| Backlog item | `docs/backlog.md` → `#hzmxi`, `#c7zjk`, `#y1dqu` (not ticked: they close when `RULE_3_BLOCKS` is flipped, a later stream) |
| Branch / worktree | `claude/thai-read-guided` @ `C:\Development\Animal_Shelter_thai-read-guided` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | pending: recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: Lutan and a bilingual reader read all 417 new Thai strings; 2 were changed and one wording rule (บัตรสิทธิ์ for permission cards) was applied across `th.ts`
- [x] Files/areas touched listed: `src/lib/i18n/dictionaries/th.ts` (77 lines), `docs/thai-read-progress.md`, `docs/decisions/2026-11-13-thai-read-guided.md`, this plan
- [x] Cards affected identified: none change behaviour; only the Thai words shown for cards and refusals change; admin and the public site see the same pages with new wording
- [x] Out of scope written down: the English dictionary, `RULE_3_BLOCKS`, the manual, `src/lib/merch/`, migrations

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`th.ts` auto-merged)
- [x] `node scripts/gates.mjs` run, all four gates zero:

```
=== gates: typecheck exited 0 after 46s
=== gates: lint exited 0 after 142s
=== gates: test exited 0 after 39s
=== gates: build exited 0 after 152s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema or data change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no behaviour change, only Thai wording in a dictionary
- [ ] Data persists — n/a: no data is written
- [ ] Create / edit / delete all exercised — n/a: no such feature
- [ ] Empty state renders sensibly — n/a: no UI change
- [ ] Invalid input is rejected with a readable message — n/a: no UI change
- [ ] Boundary cases checked — n/a: no logic change

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no access change | n/a: wording only |
| signed out | n/a | no access change | n/a: wording only |

- [ ] Every login above tested — n/a: no access change
- [ ] A login that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual is English-only and untouched
- [x] Translatable strings go through the translation path: `node scripts/check-thai-dictionary.mjs` exits clean (rule 1: 0 to translate, rule 2: 0, rule 3: 0)
- [ ] Mobile viewport (375px) — n/a: Thai strings only; a longer or shorter word is the only layout effect and บัตรสิทธิ์ is about 2 characters longer than การ์ด
- [ ] Browser console clean — n/a: not driven; no code changed
- [ ] Network clean — n/a: not driven; no code changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven in a browser; typecheck and build pass with the edited dictionary
- [ ] Any shared file touched checked from a second, unrelated page — n/a: `th.ts` is only edited inside string values
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: items close when `RULE_3_BLOCKS` is flipped, a later stream
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-13-thai-read-guided.md`
- [ ] `README.md` still accurate — n/a: no README text concerns this
- [ ] **Release notes.** n/a: corrections to a title and the word for permission cards in Thai text; not a visible improvement a shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the 76-line count came from the script's own output, and the skipped lines were each read first

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no boundary change
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no destructive migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the commit and redeploy; nothing in the database changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The two words for "supplier" and "size" differ between the shop staff pages and Who does what | accepted: Lutan looked and said fine; recorded in the progress file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none: Lutan and a bilingual reader read every string in chat | n/a |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person: the read itself was the manual check, done by Lutan and his wife in chat

Manual verification by: pending: Lutan has read every string in chat; he has not signed this line, and Claude does not sign for him

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: release manager
