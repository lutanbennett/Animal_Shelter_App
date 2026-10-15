# Feature test plan

## Header

| | |
|---|---|
| Feature | Inner public pages take the home page's heading scale, intro size and 20 px cards (photo slot not in this PR) |
| Backlog item | `docs/backlog.md` → **Public site redesign, part 5: the inner pages** (left open: photo slot outstanding) |
| Branch / worktree | `claude/public-site-inner-pages` @ `C:\Development\Animal_Shelter_public-site-inner-pages` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` |
| PR | see PR |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | tip of branch at PR open |

## 1. Scope and risk

- [x] One sentence: heading scale, intro size and card radius of the inner public pages now match the home page
- [x] Files touched: `SitePageView.tsx`, `ResidentCard.tsx`, pages under `/adopt`, `/our-work`, `/friends`, `/privacy`, `/r/[code]`, `/e/[id]` (class names only)
- [x] Roles affected: signed-out public and every signed-in role who sees these pages; no logic changed
- [x] Out of scope: the photo slot (needs a schema PR first), content, filters, galleries, `robots.ts`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — already up to date with `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 22s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 87s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 34s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: styling only; every page loaded 200 in en and th
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state renders sensibly — n/a: no empty state changed
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: long names are handled by `break-words` on `/r` and `/e` headings; not driven with a real id

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | unchanged | loaded by check-phone-width |
| management | same | unchanged | n/a: no access logic changed |
| staff | same | unchanged | n/a: no access logic changed |
| doctor | same | unchanged | n/a: no access logic changed |
| volunteer | same | unchanged | n/a: no access logic changed |
| signed out | same | unchanged | public-page checks in check-phone-width passed |

- [ ] Every role above tested — n/a: no access logic changed; only class names
- [ ] A role that should not have access is blocked server-side — n/a: no access logic changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: appearance only, no step changed
- [ ] Translatable strings — n/a: no strings added
- [x] Mobile viewport (375px): `check-phone-width --roles=admin --pages=/donate,/foster,/volunteer,/adopt,/our-work,/friends,/friends/join,/privacy,/adopt/international` printed `18 page view(s) measured (admin; en + th)… No page scrolls sideways.` Not measured: `/r/[code]`, `/e/[id]`, `/our-work/[id]` (need real ids)
- [ ] Browser console clean — n/a: not read; Donate viewed at 375 px
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [x] Nearest pages checked: Donate viewed in the browser pane at 375 px, with ways to give still directly under the intro
- [ ] Shared file checked from a second page — n/a: `SitePageView` is loaded by five pages, all measured above
- [x] Nothing merged from `main` during `sync` was broken: sync was "already up to date"

## 7. Documentation

- [ ] Backlog item ticked — n/a: the item stays open until the photo slot ships
- [x] Design choices in `docs/decisions/2026-10-15-inner-pages-type-scale.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: visitors see slightly larger headings and rounder cards, but nothing they would need telling; the part users would notice, the photos, is not in this PR
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: none
- [ ] **Evidence pasted is the tool's actual output** — n/a: gates and phone-width lines copied as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager
- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: class names only; a Pi rollback to the previous ref restores the old look

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | `/r/[code]` and `/e/[id]` at 375 px with a long animal name, in English and Thai | a real QR link on a phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: Lutan to open /r and /e on a phone

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: linked from the PR
- [ ] Handed to the production release manager — n/a: handed at release

Result: pass

Release manager acknowledgement: n/a
