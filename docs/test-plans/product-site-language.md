# Feature test plan

## Header

| | |
|---|---|
| Feature | Product pages language control |
| Backlog item | `docs/backlog.md` → #ptlng |
| Branch / worktree | `claude/product-site-language` @ `C:\Development\Animal_Shelter_product-site-language` |
| Dev server | `http://localhost:3011` |
| PR | see the PR |
| Tested by / date | Claude, 2026-11-25 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch |

## 1. Scope and risk

- [x] Change is described in one sentence: an EN / ไทย link pair in the product shell header that goes to the same page's other-language address
- [x] Files touched: `src/app/platform/layout.tsx`, new `src/app/platform/ProductLanguageLinks.tsx`, `src/lib/releases.ts`, decision file, backlog tick
- [x] Cards affected: none; public pages, so signed-out visitors see it; Admin unaffected
- [x] Out of scope: the console, enquire/shelters pages (no Thai address), `#cjseo`, `#cpstr`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 148s
=== gates: test exited 0 after 34s
=== gates: build exited 0 after 45s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: driven in headless Chrome on `/platform/about` and `/platform/features/money`; ไทย goes to `/th/...` (lang=th, Thai h1, Thai canonical), EN returns to the English address
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no list
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: pages with no Thai address (enquire) draw no control; checked, 0 links

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out | product pages | control shown, links work | pass |
| admin | n/a | unchanged | not tested: no card or access change |

- [ ] Every login above tested — n/a: public pages, signed-out driven; no access rule touched
- [ ] Blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: the control is not a nav entry
- [ ] Manual — n/a: nothing in the manual describes the product site header
- [ ] Translatable strings — n/a: labels are the language names themselves, as in `LanguageSwitcher`
- [ ] Mobile viewport — n/a: 44px tap targets copied from the existing switcher; not measured at 375px
- [x] Browser console clean — the driven pages loaded and navigated without a failed step
- [ ] Network clean — n/a: not separately inspected beyond 200s on the four product addresses

## 6. Regression

- [x] Pages checked by loading: `/platform/about`, `/th/platform/about`, `/th/platform/features/money`, `/platform/features/money`, `/platform/enquire`
- [x] Shared file `platform/layout.tsx` checked from `/platform/enquire`, an unrelated page: loads 200 with no control
- [x] Nothing merged from `main` during sync (already up to date)

## 7. Documentation

- [x] Backlog item ticked
- [x] Decision file added
- [ ] `README.md` — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` gained an admin-flagged line (product administrators see the product site)
- [x] Commit messages say why
- [x] Claims measured: step-zero statuses and the driven clicks were run, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding — n/a: no thresholds
- [ ] Evidence is unedited tool output — n/a: gate lines above are verbatim
- [ ] Public pages re-checked after cache purge — deferred: release manager
- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — deferred: release manager; the change is one component and one layout edit, reverted by reverting the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

### Automated and scripted checks

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-25

### Manual verification

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing left for a person to check

### Result

- [x] Open defects are fixed or accepted
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR's diff
- [ ] Handed to the production release manager — pending: release

Result: pass

Release manager acknowledgement: pending
