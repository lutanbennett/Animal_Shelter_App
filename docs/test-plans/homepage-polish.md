# Feature test plan

## Header

| | |
|---|---|
| Feature | Homepage polish: centre the impact figures, and rethink the Shelter Friends logo tiles |
| Backlog item | `docs/backlog.md` → "Homepage polish: centre the impact figures, and rethink the Shelter Friends logo tiles" |
| Branch / worktree | `claude/homepage-polish` @ `C:\Development\Animal_Shelter_homepage-polish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | |
| Tested by / date | Claude, 2026-09-28 |
| Carries a migration? | no |
| Tested at SHA | 484a61f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — centre the impact band's figures in their columns, and replace the Shelter Friends logo tile's white "paper" box with a softer tile (chosen from four candidates shown to Lutan), keeping the homepage grid and `/friends`'s `FriendCard` logo square consistent
- [x] Files/areas touched listed: `src/app/page.tsx` (impact band, Shelter Friends grid), `src/components/FriendCard.tsx` (logo square on `/friends`), `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified: signed-out public and every signed-in role, since `/` and `/friends` render for all of them — n/a: no role-gated content changed
- [x] Anything explicitly out of scope written down — no schema change; `src/lib/releases.ts` skipped (see §7); the `/friends/join` form and `FriendCard`'s other fields untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`
  ```
  gates: typecheck=0 lint=0 build=0
  ```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — checked on the dev server: impact band centred on `/`, Shelter Friends tile (softer style, name under logo) on `/`, matching logo square on `/friends`
- [x] Data persists — n/a: no write path touched, purely presentational
- [x] Create / edit / delete all exercised — n/a: no CRUD in this change
- [x] Empty state renders sensibly — checked: a Shelter Friend with no logo shows its name (line-clamp-3) instead of a broken image, same as before
- [x] Invalid input is rejected with a readable message, not a crash — n/a: no form/input in this change
- [x] Boundary cases checked — checked in a scratch preview route (deleted before commit) with a friend with no logo and a wide wordmark logo (the two cases the backlog item calls out as the ones that break a layout), across all four candidate tile styles, before Lutan chose one

### Role access matrix

- [x] n/a: no role-gated surface — `/` and `/friends` are public pages, same access as before this change

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/`, `/friends` | same as signed-out | unchanged |
| management | `/`, `/friends` | same as signed-out | unchanged |
| staff | `/`, `/friends` | same as signed-out | unchanged |
| vet | `/`, `/friends` | same as signed-out | unchanged |
| volunteer | `/`, `/friends` | same as signed-out | unchanged |
| signed out | `/`, `/friends` | impact band centred; softer Shelter Friends tiles | as expected |

- [x] Every role above tested — n/a: this change has no role-conditional rendering; checked signed-out, which is representative
- [x] A role that should not have access is blocked server-side — n/a: no access change

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: no admin/staff-facing screen changed; `/`, `/friends` and `FriendCard` aren't in the manual
- [x] Translatable strings go through the translation path — n/a: no new strings; `sf.yourBusiness`, `friend.name` etc. were already translated/data-driven and are unchanged
- [x] Mobile viewport (375px) — checked: impact band's two-column layout centres each figure; Shelter Friends grid is two tiles per row, softer tile and name-under-logo both fit at that width
- [x] Browser console clean — checked, no errors or React warnings on `/` or `/friends`
- [x] Network clean — checked, no unexpected 4xx/5xx on `/` or `/friends`

## 6. Regression

- [x] The pages nearest the change still work: `/` (hero, impact band, Shelter Friends, how-to-help, pet of the week, our story) and `/friends` (header, staff-draft banner n/a signed out, friend cards, map) all loaded and rendered correctly
- [x] Any shared file touched — `FriendCard` is also used by the contact hub's Shelter Friend preview (`previewPublicFriend()`, per its own doc comment); not loaded in this pass since it's behind staff sign-in — left for manual verification below
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync found nothing to merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-28
- [x] `README.md` still accurate — n/a: no user-facing setup or architecture changed
- [ ] **Release notes.** — n/a: purely visual polish to the impact band and the Shelter Friends tile styling; per the backlog item itself ("a visitor would barely notice"), and a returning visitor is more likely to notice a *nicer* homepage than to need it explained
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — the contrast figures in decisions.md-adjacent verification (ink-muted on the new tile background, both themes) were computed with the actual hex values from `globals.css`, not eyeballed

## 8. Pre-production gate

- [ ] deferred: release manager — no deploy has happened yet for this branch

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

None found.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Look at the softer Shelter Friends tile and confirm it reads well against real business logos (not the placeholder SVGs used to test proportions) — especially any logo with a light or transparent background, which the old white tile would have hidden and the new `bg-site-line` tile no longer does | `/` and `/friends` on `test.lannacare.org` once deployed, with real Shelter Friends |
| 2 | `FriendCard`'s logo square change (`bg-white` → `bg-surface-hover`, border removed) is also used by the contact hub's Shelter Friend preview, which sits behind staff sign-in and wasn't loaded in this pass | Contacts hub, a shelter-friend contact's preview card |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** — n/a: the list is not empty; this is Lutan's to tick after looking

Manual verification by: pending: items 1–2 above

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass

Release manager acknowledgement: pending  Date: —
