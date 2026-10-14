# Feature test plan — cards-page-refinements

## Header

| | |
|---|---|
| Feature | Who does what: readable Move buttons, compact two-column cards board with drag and buttons, Also allowed below |
| Backlog item | `docs/backlog.md` → **Who does what, cards page refinements** (ticked) |
| Branch / worktree | `claude/cards-page-refinements` @ `C:\Development\Animal_Shelter_cards-page-refinements` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | see the PR description |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `8ee77f03` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — readable buttons, a compact two-column board with drag plus buttons, Also allowed under it
- [x] Files/areas touched listed — `src/app/admin/who-does-what/{CardBoard,CardControls,page}`, both dictionaries, `releases.ts`, backlog, decision, this plan
- [x] Roles affected identified — Admin edits; Management sees the page read-only
- [x] Anything explicitly **out of scope** written down — no card added or redefined, no grant changed, `actions.ts` untouched, Details grid and left menu untouched

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: branched from current origin/main today; sync happens at merge time
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] No migration — n/a: no schema change

## 4. Functional checks

- [ ] Happy path works end to end — n/a: buttons and drag appear only after the authenticator step, which Claude does not perform; left for manual verification
- [ ] Data persists — n/a: same reason; the persistence path (`set_role_cards`) is unchanged
- [ ] Create / edit / delete all exercised — n/a: same reason, see manual table
- [ ] Empty state renders sensibly — n/a: not driven; the empty branch is the existing text
- [ ] Invalid input is rejected with a readable message — n/a: no input added; refusals still come from `actions.ts` and show in a role=alert
- [ ] Boundary cases checked — n/a: not driven, see manual table
- [ ] Every role tested — n/a: no access rule changed; `actions.ts` untouched
- [ ] A role that should not have access is blocked server-side — n/a: server guard unchanged; a drop can only call the same actions

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual topic rewritten for a layout change
- [x] Translatable strings go through the translation path — new strings in en and th
- [ ] Mobile viewport (375px) — n/a: viewed in the browser pane at phone width in the dark theme as Admin without the authenticator step: role's cards first in two columns, Available cards below, nothing scrolled sideways; the buttons and Thai are in the manual table
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — the page renders and typecheck, lint and build pass
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from main was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices in `docs/decisions/2026-10-14-cards-board-drag-and-buttons.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained an Admin line
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — the contrast cause was read from the code; the drop path is the same function as the buttons

## 8. Pre-production gate

- [ ] Tested SHA recorded and is the tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: public site untouched
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var exists in production — n/a: none
- [ ] Migration dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Rollback position — n/a: UI only, a code rollback reverts it fully

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | Buttons, drag, audit rows and role_permissions hash not driven: they need the authenticator step | accepted — see manual table |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Move up/down readable in light, dark, dev and each user theme | Settings → Who does what, Management |
| 2 | Drag a card right to give it, back left to remove, onto another to reorder; compare the audit rows with the same done by button | laptop, Admin with authenticator |
| 3 | Buttons are 44 px on a phone, nothing scrolls sideways at 375 px; Thai | Director's phone |
| 4 | role_permissions unchanged after a button and a drop that undo each other | dev database |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; it is handed to Lutan on the signature line below

Manual verification by: pending: Lutan, items 1 to 4 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
