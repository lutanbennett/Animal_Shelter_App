# Test plan: page-editor-read-only

## Header

| | |
|---|---|
| Feature | Website page editor: read-only fields and no style toolbar without website.content; UnitsTable control list |
| Backlog item | `docs/backlog.md` → ONE PLACE LEFT: THE WEBSITE PAGE EDITOR |
| Branch / worktree | `claude/page-editor-read-only` @ `C:\Development\Animal_Shelter_page-editor-read-only` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3020` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | 4a1ac02b |

## 1. Scope and risk

- [x] One sentence: title and body boxes become read-only and the style toolbar is not drawn when canEdit is false; matches the item
- [x] Touched: SitePageForm.tsx, its test, a decision file, this plan
- [x] Cards affected: website.content at read (the website_photos card); no role named
- [x] Out of scope: any other screen; UnitsTable needed no code change, only a list

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing line:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no data read or written differently
- [ ] Harness assertions — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: the extended test asserts toolbar gated, both fields readOnly, preview and translation panels kept
- [ ] Data persists — n/a: nothing saved differently; the server check is unchanged
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input path changed
- [ ] Boundary cases — n/a: single boolean gate, default false

| Role | Can reach | Expected | Result |
|---|---|---|---|
| holder of website.content at edit | editor | toolbar and editable fields, Save | pending: not driven, editor loads only by typed address |
| holder at read only | editor | words readable, no toolbar, no Save | pending: not driven, same reason; established by reading the file |

- [ ] Every role that matters tested — n/a: pane does not hydrate directly loaded pages (CLAUDE.md); established by reading and the test
- [ ] Blocked server-side — n/a: server checks untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual — n/a: no user-visible workflow change
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport — n/a: fewer controls, no layout added
- [ ] Browser console — n/a: not driven
- [ ] Network — n/a: no new requests

## 6. Regression

- [x] Nearest: the existing page-controls tests all still pass in npm test
- [ ] Shared file touched — n/a: SitePageForm is used only by the page editor
- [x] Nothing merged from main broke this branch (gates after sync)

## 7. Documentation

- [ ] Backlog item ticked — n/a: items live on the backlog branch; planner closes it
- [x] Decision file docs/decisions/2026-11-02-website-page-editor-read-only.md
- [x] README.md still accurate
- [ ] **Release notes.** n/a: nobody who could edit notices; the login that does could never save
- [x] Commit messages say why
- [x] Claims were measured: read from the action and page files, asserted in the test

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: no thresholds
- [x] Evidence pasted is the tool's actual output (gates line above)
- [ ] Public pages re-checked — n/a: admin screen only

### Deploy safety

- [ ] Deploy project ref line — deferred: release manager
- [ ] strip-baked-env line — deferred: release manager
- [ ] New secrets — n/a: none

### Migration ordering

- [ ] Migration and reading code together? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback: revert the PR; no data or schema involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | none | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in with only the website_photos card, open a page editor by typing its address after clicking in: no toolbar, boxes will not type, no Save | /admin/website/pages/<slug> |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [ ] Looked at by a person — n/a: nobody has looked yet; pending Lutan

Manual verification by: pending: Lutan to try the read-only editor with the website_photos card

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links the file
- [ ] Handed to the release manager — n/a: at release time

Result: pass

Release manager acknowledgement: pending
