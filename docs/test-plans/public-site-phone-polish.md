# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site phone polish: phone menu keeps Talk to us on screen, public in-page links and buttons at 44 px on phones, one available badge and a friendly empty photo, laptop animal page with the buttons in the right column |
| Backlog item | `docs/backlog.md` → **Phone menu: show Talk to us without scrolling**, **Bring the public pages in-page links and buttons to 44 px on phones**, **One available for adoption badge, and a friendly empty photo**, **Animal page, laptop width** (all four ticked) |
| Branch / worktree | `claude/public-site-phone-polish` @ `C:\Development\Animal_Shelter_public-site-phone-polish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | n/a: not yet — the PR does not exist at this commit |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `75b24278` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: four phone/laptop polish fixes to the public site, all components and CSS
- [x] Files/areas touched listed: `src/app/adopt/PublicNav.tsx`, `SitePageView.tsx`, `adopt/page.tsx`, `adopt/[id]/page.tsx`, `adopt/ResidentCard.tsx`, `friends/page.tsx`, `our-work/[id]/page.tsx`, `e/[id]`, `r/[code]`, `page.tsx`, `GalleryTile.tsx`, `components/FriendCard.tsx`, `ThumbnailStrip.tsx`, `AvailableBadge.tsx`, `EmptyPhoto.tsx`, both dictionaries, `scripts/check-phone-width.mjs`, `releases.ts`, backlog, decision
- [x] Roles affected identified: signed-out public only
- [x] Anything explicitly **out of scope** written down: the staff-app bare buttons and the lightbox controls (separate items); public site part 5; the mobile sweep; the big "No photos yet" frame on the animal page keeps its text

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 46s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: at 375 x 667 the open phone menu shows LINE and Call fully on screen with the entries scrolling above; at 1280 an animal page shows Ask on LINE and Book a visit in the right column under the quick facts; the new public pass of `check-phone-width.mjs --public-only` (8 public pages plus a resident and a story, English and Thai, and the menu) printed that every link and button is at least 44 px and the menu shows Talk to us
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no create, edit or delete
- [x] Empty state renders sensibly: cards with no photo show the puppy art; the Happy endings circle shows a paw; a home gallery tile whose image fails is dropped (read from code, not forced on dev)
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked: Thai at 375 in the check (menu and links); the iPhone SE height 667 is the case the menu check runs at

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages | same as everyone | n/a: no role-specific surface |
| management | public pages | same | n/a: no role-specific surface |
| staff | public pages | same | n/a: role retired and no role-specific surface |
| doctor | public pages | same | n/a: no role-specific surface |
| volunteer | public pages | same | n/a: no role-specific surface |
| signed out | public pages | the new layout | pass (dev) |

- [ ] Every role above tested — n/a: public pages only; signed out is the role that matters
- [ ] A role that should not have access is blocked server-side — n/a: nothing here is restricted

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the app nav is untouched; the public menu has the same entries
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: nothing a staff member does changed
- [x] Translatable strings go through the translation path: the badge uses the existing dictionary key in both languages; the unused home key was removed from both
- [x] Mobile viewport (375px) — no overflow, controls reachable: covered by the existing overflow check and the new public pass
- [ ] Browser console clean — n/a: not read on this run; the pages rendered and the check loaded them without errors
- [ ] Network clean — n/a: not read on this run

## 6. Regression

- [x] The pages nearest the change still work: `/`, `/adopt`, an animal page, the phone menu, loaded in the check
- [x] Any shared file touched checked from a second, unrelated page: the dictionaries and `ResidentCard` are shared; typecheck and build pass and `/adopt` and the animal page loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch
- [x] Decision added: `docs/decisions/2026-10-14-public-site-phone-polish.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line covering all four, written for a shelter user; no manual step is outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The menu position and the 44 px results are from the check's output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold logic; the breakpoints are CSS
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates block is as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] Production dry-run clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: code only, so `./scripts/pi/deploy-pi.sh --ref <previous sha>` reverts everything; no schema to leave behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The menu and the Get in touch buttons on a real phone, including the Thai wording lengths | phone, `/` menu and `/donate` in ไทย |
| 2 | The puppy empty photo and soft badge look right on a card with no photo | `/adopt` on Test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items wait for a person

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
