# Feature test plan — product-console-build

## Header

| | |
|---|---|
| Feature | The console's shelter settings become tabs with measured state marks; the card links to the site; the console's own address cannot be removed |
| Backlog item | `docs/backlog.md` → #pacon |
| Branch / worktree | `claude/product-console-build` @ `C:\Development\Animal_Shelter_product-console-build` |
| Dev server | `http://localhost:3007` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | e51ef8852 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — settings behind a shelter's card are split into Summary, Setup, Google, Website, Contact and Close tabs with a mark per tab, the card links to the shelter's site, and the console's own address is not offered a Remove
- [x] Files/areas touched listed — `src/app/platform/ProductAdminPanel.tsx`, `page.tsx`, `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `docs/`
- [x] Cards affected identified — none: the console is product administrator plus aal2, not a card (`2026-11-18-product-admin-screen.md`); no gate changed
- [x] Anything explicitly out of scope written down — Security tab (#shsec), the does-it-answer check (#hstau), the two name columns (#nmcol), Drive button, production and test123 (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run after this plan is committed, before the PR (result in the PR body)
- [x] `node scripts/gates.mjs` ends with the one-line shape, every exit code `0`:

```
=== gates: typecheck exited 0 after 89s
=== gates: lint exited 0 after 421s
=== gates: test exited 0 after 98s
=== gates: build exited 0 after 263s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema or query changed
- [ ] Constraints and defaults exercised — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: not driven in a browser; the tab bar and marks are typechecked and built only
- [ ] Data persists — n/a: no write path changed; the forms moved unchanged under tabs
- [ ] Create / edit / delete all exercised — pending: not pressed after the move
- [ ] Empty state renders sensibly — pending: not driven
- [ ] Invalid input is rejected with a readable message — n/a: no validation changed
- [ ] Boundary cases checked — n/a: the only logic is tabTone(), read through for each branch

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| a product administrator at aal2 | `/platform` | tabs, Close tab present | pending: not driven |
| a product administrator at aal1 | `/platform` | tabs, no Close tab, no write controls | pending: not driven |

- [ ] Every login above tested — pending: see the table
- [ ] A login that should not have access is blocked server-side — n/a: no gate changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation changed
- [ ] Manual updated — n/a: the console is not in the user manual
- [x] Translatable strings go through the translation path — en and th carry every new key; the Thai was written without a reviewer
- [ ] Mobile viewport (375px) — pending: not driven; the tab bar wraps (flex-wrap)
- [ ] Browser console clean — pending: not driven
- [ ] Network clean — pending: not driven

## 6. Regression

- [ ] The pages nearest the change still work — pending: not driven
- [ ] Any shared file touched checked from a second page — n/a: the dictionaries gained keys only
- [ ] Nothing merged from `main` during `sync` was broken — n/a: checked at merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: #pacon stays open, because the end-to-end onboarding clause is Lutan's to confirm and #shsec, #hstau and #nmcol remain
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-23-console-tabs.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: only a product administrator sees this screen, and today that is one person
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned — the earlier shipping of the redesign and the is_primary history were read from 0428 and the PR log

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no dates derived
- [ ] Boundary or banding change covers both edges — n/a: no threshold
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: only the gates summary, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — deferred: release manager. Revert the commit; nothing here changes data

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Low | The brief described an already-shipped redesign as unbuilt, and misread 0428's undo comment as dropping is_primary | reported in the PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open a shelter's settings, click each tab, confirm the marks and that every old control still works | `/platform` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: nobody has looked at the tabs

Manual verification by: pending: the tab bar in a browser

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is open
- [ ] Handed to the production release manager — pending: not yet released

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet released
