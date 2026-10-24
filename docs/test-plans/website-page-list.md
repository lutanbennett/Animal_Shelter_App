# Test plan: website-page-list

## Header

| | |
|---|---|
| Feature | One list of public pages, read by the header, footer, home page and sitemap |
| Backlog item | `docs/backlog.md` → Show or hide public website pages (part 2 of 6) |
| Branch / worktree | `claude/website-page-list` @ `C:\Development\Animal_Shelter_website-page-list` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | see PR |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | 252c9316 |

## 1. Scope and risk

- [x] One sentence: the four hand-kept lists of public pages become one (`src/lib/public-pages.ts`), with no visible change; matches part (2) of the item
- [x] Touched: src/lib/public-pages.ts (new), PublicHeader.tsx, PublicFooter.tsx, src/app/page.tsx, src/app/sitemap.ts, a decision file, the backlog note, this plan
- [x] Roles: signed-out public pages, which every role sees alike
- [x] Out of scope: hiding anything, the Admin → Website switches, the edge cache, the Desexing refusal (parts 3 to 6); Appeals and Shelter Friends keep their own rules

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main already merged in
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

- [x] Happy path: header menu, phone-menu markup, footer Help column, home page links and /sitemap.xml render as before
- [ ] Data persists — n/a: nothing is saved
- [ ] Create / edit / delete — n/a: nothing is saved
- [ ] Empty state — n/a: the empty-group rule is the unchanged filter in the header; no hidden check exists yet
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: Appeals live or not and Shelter Friends present or not keep their old logic; the dev data shows the live-appeals, friends-present state

| Role | Can reach | Expected | Result |
|---|---|---|---|
| signed out | home, adopt, foster, donate, appeals, about, desexing, sitemap, en and th | identical to before | pass (link sets and sitemap compared before and after) |

- [x] Every role that matters tested (signed out is the only audience)
- [ ] Role that should not see it blocked — n/a: nothing is gated

## 5. Cross-cutting

- [ ] Nav entry — n/a: no new page
- [ ] Manual — n/a: nothing a user sees changed
- [ ] Translatable strings — n/a: no new strings; labels still come from the dictionaries
- [x] Mobile viewport: the phone menu's links are in the compared markup
- [x] Browser console: dev server logs clean on the pages loaded
- [ ] Network — n/a: no new requests

## 6. Regression

- [x] Nearest: SitePageView.tsx still imports PublicSection, re-exported from the header; typecheck proves it
- [x] Shared file touched from a second page: the header and footer are on every public page; seven pages in two languages compared
- [x] Nothing merged from main broke this branch (sync was a no-op)

## 7. Documentation

- [ ] Backlog item ticked — n/a: one of six parts; a PART (2) DONE note records it instead, by brief
- [x] Decision file docs/decisions/2026-10-24-public-pages-list.md holds the key and group vocabulary
- [x] README.md still accurate
- [ ] **Release notes.** n/a: a refactor with no visible change; the switches are the next PR
- [x] Commit messages say why
- [x] Claims were measured: link sets and the sitemap were compared before and after, not read

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds
- [x] Evidence pasted is the tool's actual output (gates line above)
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] Deploy project ref line — deferred: release manager
- [ ] strip-baked-env line — deferred: release manager
- [ ] New secrets — n/a: none added

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
| 1 | The header menu, phone menu, footer and home page look as they did | the public site at desktop and phone width |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list has been looked at by a person — n/a: nobody has looked yet; the sign-off line below says it is pending Lutan

Manual verification by: pending: Lutan to glance at the public site, desktop and phone width

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: PR body links the file instead
- [ ] Handed to the release manager — n/a: handed over at release time, after merge

Result: pass

Release manager acknowledgement: pending
