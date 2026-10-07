# Feature test plan

## Header

| | |
|---|---|
| Feature | On a desktop the header and the left-hand menu stay in place while the page scrolls |
| Backlog item | `docs/backlog.md` → "Keep the header and the left-hand menu in place while a page scrolls (desktop)" |
| Branch / worktree | `claude/sticky-header-menu` @ `C:\Development\Animal_Shelter_sticky-header-menu` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — from `md` up the header is sticky at a fixed height, the sidebar is pinned under it and as tall as the rest of the window with its own scrollbar; phones keep the unpinned header
- [x] Files/areas touched listed: `src/app/AppHeader.tsx`, `src/app/NavLinks.tsx`, `src/app/layout.tsx` (header-height variable, `scroll-padding-top`), `src/app/manual/page.tsx` (contents list sits below the header), `src/lib/releases.ts`, `docs/backlog.md`
- [x] Roles affected identified: everyone who signs in on a screen at least 768 px wide (in practice the Director and Lutan); phones unchanged
- [x] Out of scope: header contents and button sizes (#413, #410), the public website, `globals.css`, the phone drawer

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — see PR
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — measured in a real browser as a throwaway admin: scrolling `/residents` and `/manual` 1500 px down leaves the header at top 0 and the menu at top 68 px at 1280×720, 1920×1080 and 768×900
- [ ] Data persists — n/a: layout only
- [ ] Create / edit / delete all exercised — n/a: no CRUD touched
- [ ] Empty state renders sensibly — n/a: no data path touched
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling
- [x] Boundary cases checked — an admin's menu at 1280×720 is taller than the window (68 px header + 652 px menu box, `scrollHeight > clientHeight`), so it scrolls inside its own box; at 1920×1080 it fits with no scrollbar

### Role access matrix

- [ ] n/a: access unchanged; only layout classes were edited

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | any page | header + menu pinned | pinned (measured) |
| management | n/a | same layout | same layout (shared component) |
| staff | n/a | same layout | same layout (shared component) |
| vet | n/a | same layout | same layout (shared component) |
| volunteer | n/a | same layout | same layout (shared component) |
| signed out | n/a | no app header | unchanged |

- [ ] Every role above tested — n/a: no access change; the header and menu are shared components, only admin (the longest menu) was measured
- [ ] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no feature or wording described in the manual changed
- [ ] Translatable strings go through the translation path — n/a: no strings added
- [x] Mobile viewport (375px) — header still scrolls away with the page (top −1500 after scrolling) and takes 119 px as before; no sideways scroll
- [ ] Browser console clean — n/a: no script behaviour changed
- [ ] Network clean — n/a: no requests changed

## 6. Regression

- [x] The pages nearest the change still work: the manual's contents list sits at 92 px (header 68 + 1.5 rem) after scrolling, below the header at 1280 and 1920 wide
- [x] Any shared file touched checked from a second page — layout measured on `/residents`, `/manual` and `/admin/audit`
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: see the gates run after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: header pinned from `md` up only, because on a phone it wraps to 119 px and would cost a seventh of the screen; recorded in the PR
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` gained a line: on a computer the top bar and menu stay in place while the page scrolls
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the numbers above come from the browser run

## 8. Pre-production gate

- [ ] deferred: release manager — no deploy has happened for this branch

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

None found. (`/residents` at 768 px already scrolls sideways from its own toolbar, not from the header; not touched here.)

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open a deep link such as `/manual#…` and `/releases#v…` on a desktop and confirm the heading lands below the header, not under it | `/manual`, `/releases` |
| 2 | Dev / UAT badge still shows in the pinned header | dev or UAT site on a desktop |
| 3 | Look at it on a desktop: scroll a long page, the menu and header stay put | any long page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; for the person who looks

Manual verification by: pending: items 1–3 above

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending  Date: —
