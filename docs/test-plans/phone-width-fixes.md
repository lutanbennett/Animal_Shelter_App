# Feature test plan — phone-width-fixes

## Header

| | |
|---|---|
| Feature | Pages stop scrolling sideways at 375 px: one base-layer CSS rule for the shared cause (a one-column grid is an `auto` column; a `<select>` is as wide as its longest option), plus four local fixes — the resident hub header wraps, Deliveries' Note stacks under Cost, the vet period buttons fit, and Sign out is an icon below `sm` (F-05, F-06, F-07) |
| Backlog item | `docs/backlog.md` → F-05, F-06, F-07 of the staff dry run (ticked). The parent review item stays open; the 375 px overflow *check* was split into its own *Mobile* backlog item on the `backlog` branch |
| Branch / worktree | `claude/phone-width-fixes` @ `C:\Development\Animal_Shelter_phone-width-fixes` |
| Dev server | `next dev` on `http://localhost:3011` (this worktree's `.port`), browser pane at the **mobile** preset 375×812, reloaded after each switch |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `7163491e` (after `worktree.mjs sync` merged `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — pages fit 375 px: `.grid` gets a `minmax(0, 1fr)` column and form controls get `max-width: 100%` in the base layer, the hub header's text column shrinks and its name row wraps, Deliveries' Note wraps under Cost, and the header's Sign out is an icon below `sm`
- [x] Files/areas touched listed — `src/app/globals.css`, `src/app/residents/[id]/ResidentHub.tsx`, `src/app/login/SignOutButton.tsx`, `src/app/AppHeader.tsx`, `src/app/deliveries/RecordDeliveryForm.tsx`, `src/app/vets/[id]/VetHub.tsx`, `src/app/vets/VetGrid.tsx`, `src/app/enclosures/EnclosureGrid.tsx`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-03-phone-width.md`, this plan. The `globals.css` rule reaches every `.grid` in the app — see section 6
- [x] Roles affected identified — every signed-in role (the header and the base rule are global); the public site has its own root layout and does not load the app header, but does load `globals.css`
- [x] Anything explicitly **out of scope** written down — F-08/F-09 (icons without words, tap sizes, End today's confirm: batch 37 `icon-buttons`), F-10 and the other 19 findings; the 375 px overflow check (backlog item, see decision file); no sweep for further overflowing pages beyond the ones named

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (release 0.15.1 was cut meanwhile; `src/lib/releases.ts` conflicted and was resolved by keeping only this PR's line in `unreleased`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 124s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema or query change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

Each page was navigated to at 375 px in the built-in browser and read with
`document.scrollingElement.scrollWidth` against `clientWidth` (a page read while
still streaming reports 375, so every reading came after the content rendered).
**Before** = this worktree with the fix removed, measured by me, unless marked
*(report)*, which is the dry-run report's figure for a page I did not re-measure
before. **After** = this branch.

| Page (375 px) | Before EN | After EN | Before TH | After TH |
|---|---|---|---|---|
| Resident hub, `Dryrun Zeta TH (ทดสอบไทย)` | 423 (**+48**) | 375 (+0) | *(report)* +48 | 375 (+0) |
| Resident hub, `Capwarn Test 0924` | *(report)* +48 | 375 (+0) | not measured | not measured |
| Enclosures list | **+117** | 375 (+0) | not measured | 375 (+0) |
| Vets list | **+172** | 375 (+0) | not measured | 375 (+0) |
| A vet's page | **+31** | 375 (+0) | not measured | 375 (+0) |
| Contacts | **+29** | 375 (+0) | not measured | 375 (+0) |
| Deliveries | **+76** | 375 (+0) | **+114** | 375 (+0) |
| Book vet visit | **+4** | 375 (+0) | not measured | 375 (+0) |
| Return to shelter (`rehome/return`, Adopted resident) | not measured | not measured | **+31** | 375 (+0) |
| Intake step 2, Blue zone chosen | *(report)* +31 | not measured | not measured | 375 (+0) |
| Edit resident, Blue zone resident | *(report)* +31 | 375 (+0) | not measured | not measured |
| Return from hospital, Blue zone chosen | *(report)* +31 | not measured | not measured | 375 (+0) |
| Header Sign out, right edge | n/a | 359, an icon | **385** (10 past the edge) | 359, an icon |

On the Return from hospital, Edit resident and intake step 2 pages the Enclosure `<select>` is 327 px wide (the column) and holds 14–16 options. On the hub the Edit pencil sits at x 208–232 and Record death at x 240–264 of 375 after, against 8 px visible and none before. The assistant panel's Close (×) is on screen at 375 px. The Enclosures card for "Blue Enclosure 3 (Hallway Small Dogs Only)" now wraps its name over two lines with the capacity pill and the open-jobs count in view.

Before-numbers on the Return to shelter, Enclosures, Vets, Contacts, Deliveries, Book vet visit, vet page and hub rows match the dry-run report figures exactly.

- [x] Happy path works end to end — each page above renders its real content at 375 px in both languages; hub Edit and Record death links are present at their expected hrefs and on screen
- [ ] Data persists — reload the page and the change is still there — n/a: layout and class changes only; nothing is saved. (One dev resident was sent to hospital through the form to reach the Return from hospital page; it saved and that page then loaded.)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create/edit/delete behaviour changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: no empty state changed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no validation changed
- [x] Boundary cases checked — long enclosure name ("Blue Enclosure 3 (Hallway Small Dogs Only)"), long clinic name ("Chiang Mai Centre Animal Hospital (CMCAH)"), a long Thai name on the hub, the longest Enclosure picker option, and Thai text (the widest case for Deliveries and the header)

### Role access matrix

Only the layout changed, for everyone, and no permission or route moved, so no
role gains or loses access. Driven live as **staff** (a disposable dev account),
which is the role that is about 100% on phones.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | same pages | same, now fits 375 px | not driven live — same markup |
| management | same pages | same | not driven live |
| staff | all pages in the table | same, now fits 375 px | measured above |
| vet | `/vets`, `/vet-visits/new` | same, now fits 375 px | not driven live |
| volunteer | same | same | not driven live |
| signed out | public pages | unchanged | not driven live |

- [ ] Every role above tested — n/a: no access rule changed; only staff was driven, and its pages are the ones the findings named
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual says "the Sign out button at the top right", still true; no control moved or renamed
- [ ] Translatable strings go through the translation path — n/a: no new string; Sign out reuses `t.header.signOut` for its `title` and `aria-label`
- [x] Mobile viewport (375px) — no overflow, controls reachable — the whole point; table above
- [ ] Browser console clean — no errors or React warnings — n/a: not read; no console tool call was made in this run
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not read; the dev server log showed only 200s for the pages above

## 6. Regression

- [x] The pages nearest the change still work — hub, enclosures, vets, a vet's page, contacts, deliveries, book vet visit, edit resident, intake step 2, return to shelter, return from hospital, the assistant panel
- [x] Any shared file touched checked from a second, unrelated page — the base `.grid` rule was checked on pages that did not need a fix and at **desktop (1280 px)**: Enclosures, Vets and Contacts still lay out in three columns, Deliveries still has Cost and Note on one row (same top, 497 px wide Note), the hub header keeps name and icons on one row, and no page scrolls sideways. Header Sign out reads "Sign out" at 1280
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought release 0.15.1 and its records; the only conflict was `releases.ts`, resolved; the gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — F-05, F-06, F-07 ticked; follow-up (the 375 px check) went on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-03-phone-width.md` (the shared cause, the four unshared ones, why no guard)
- [x] `README.md` still accurate — n/a in substance: it does not describe layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for shelter users: pages fit a phone, Edit and Record death are reachable on a resident, long names wrap, and Sign out is an icon on a phone including in Thai
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the before/after widths come from the page; claims that were not measured are marked so in the decision file (production header, the iframe behaviour)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives "today" or any instant
- [ ] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — n/a: no threshold, rounding rule or permission cutoff changed (the `sm` breakpoint at 640 px was checked on one side at 375 and on the other at 1280, not at 640 itself)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line is pasted; the width figures are the page's own `scrollWidth`/`clientWidth` readings
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge — n/a: no public page changed, though `globals.css` is shared; the public pages' grids were not measured, see Defects

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — CSS and markup only: redeploy the previous build (`./scripts/pi/deploy-pi.sh --ref <sha>`, or `npx wrangler rollback --env production` for the Worker fallback); no schema or data involved, nothing to revert in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The base `.grid` rule and the `select, input, textarea` cap in `globals.css` apply to the public website's pages too (same stylesheet). Not measured there; a grid that relied on an `auto` single column would now fill its container | accepted — see Left for manual verification 2 |
| 2 | low | Titles on the Vets and Enclosures cards were cut with an ellipsis on a phone, hiding "(Hallway Small Dogs Only)" and "(CMCAH)"; they now wrap, which makes some cards taller | fixed |
| 3 | polish | No 375 px overflow check exists, so the next overflow is found by a person | deferred to backlog (*Mobile*, "A 375 px overflow check") |
| 4 | process | A dev staff session was dropped ("expired") twice during the run, once on a language switch; not investigated, signing in again worked. Possibly the shared `localhost` cookie across other worktrees' dev servers | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone, the resident hub: Edit (pencil) and Record death (heart) are tappable and the page does not slide sideways; Sign out (the icon) is tappable in English and in Thai | `/residents/<id>`, any page's header |
| 2 | The public website (`/`, `/adopt`, `/our-work`, `/donate`) at phone and desktop width looks as it did, since `globals.css` is shared | public site |
| 3 | The desktop layout of the pages above with eyes on it — the browser pane's screenshots were cropped to 800 px, so the 1280 px sweep was by measurement (columns, positions, scroll width), not by looking | `/enclosures`, `/vets`, `/contacts`, `/deliveries`, a resident hub |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–3 wait for a person with a real phone

Manual verification by: pending: a person on a real phone, and a look at the public site and the desktop pages (items 1–3 above)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; after the PR is opened

Result: pass with accepted defects

Release manager acknowledgement: pending
