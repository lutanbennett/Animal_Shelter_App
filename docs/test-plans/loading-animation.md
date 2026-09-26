# Feature test plan

## Header

| | |
|---|---|
| Feature | Puppy-at-a-laptop loading animation |
| Backlog item | `docs/backlog.md` → "A puppy-at-a-laptop loading animation for page changes and slow loads" |
| Branch / worktree | `claude/loading-animation` @ `C:\Development\Animal_Shelter_loading-animation` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `6dcbff3` (feature + `origin/main` merged twice; browser checks at `e4929de`, gates rerun at `6dcbff3`) |

## 1. Scope and risk

- [x] Change in one sentence: while a page loads, the public site shows an original puppy-at-a-laptop animation and the staff app a small one-colour version, after a 300 ms delay, with a `role="status"` "Loading" label in en/th and a still puppy under reduced motion. This matches the item's corrected concept (a puppy at a laptop, not a run cycle). Lutan chose the drawings from three sketches before the build: A for public, C for staff
- [x] Files touched:
  - new: `src/components/PuppyLoader.tsx`, `src/app/loading.tsx` (root)
  - `src/app/globals.css` (a "Puppy loader" block at the end)
  - `common.loading` in `src/lib/i18n/dictionaries/{en,th}.ts`
  - upload buttons: `src/app/admin/website/{HeroPhoto,GalleryPhotos}.tsx`, `src/app/contacts/[id]/ShelterFriendCard.tsx`
  - docs, `src/lib/releases.ts`
- [x] Roles affected: every role and signed-out visitors (the root `loading.tsx` wraps every page). Upload buttons: admins (website) and whoever can edit a Shelter Friend
- [x] Out of scope:
  - The photo and attachment uploaders keep their real per-file progress bars. A loop is worse than a measurement.
  - Form submit buttons keep their existing "Saving..." text.
  - Search-param changes on the same page (e.g. `/adopt?species=Dog`) do not show the loader. That is Next behaviour: the segment does not change.
  - Accepted trade-off (decisions.md): a missing page after a database read now streams 200 + `noindex` instead of 404.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged twice. The first merge (`e4929de`) brought in `0093`/`0094` from other streams with no conflicts. The second (`6dcbff3`) brought in `image-magic-bytes`; it conflicted only in `unreleased`, where both lines were kept
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run after the sync:

```
=== gates: typecheck exited 0 after 29s
=== gates: lint exited 0 after 88s
=== gates: build exited 0 after 118s
gates: typecheck=0 lint=0 build=0
```

Rerun after the second sync, at `6dcbff3`:

```
=== gates: typecheck exited 0 after 31s
=== gates: lint exited 0 after 65s
=== gates: build exited 0 after 97s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end (browser pane, dev :3013). `/privacy` and `/vets` had a temporary 2.5 s `await` so the loader would stay up long enough to check. It was removed before commit and both files match `main`.
  - Public: a client-side navigation `/donate` → `/privacy` shows the puppy scene centred on the cream background with "Loading…". Screenshot taken.
  - Staff, signed in as the dev test user: Residents → Vets shows the glyph plus "Loading…" in the content area. The header and sidebar stay, with no overlay. The glyph is teal on dev.
- [x] **300 ms delay**, sampled every 25 ms from the moment the status element mounted:
  - `visibility: hidden, opacity 0` at 0 ms
  - `visible, 0.34` at 308 ms
  - `1.00` at 435 ms
  - A fast navigation (`/privacy` → `/donate`) mounted the loader, but it was never visible before the page replaced it.
- [x] **Thai label**: after switching to ไทย, the status text read `กำลังโหลด…`. Screenshot taken.
- [x] **Reduced motion.** The pane cannot emulate `prefers-reduced-motion`, so this was a substitute check: the stylesheet's own `@media (prefers-reduced-motion: reduce)` rules were read back from the page and applied unconditionally. Result during a slow load:
  - 0 animations running on the drawing
  - the bar held at `matrix(0.65, 0, 0, 1, 0, 0)`
  - the label still became visible (opacity 1) after the delay

  Seeing it with the real OS setting is manual item 2.
- [ ] Data persists — n/a: nothing is saved; the loader is presentation only
- [ ] Create / edit / delete — n/a: no records involved
- [ ] Empty state — n/a: the loader has no data
- [ ] Invalid input — n/a: no input
- [x] Boundary cases:
  - A search-param-only change on the same page shows no loader. That is expected; see §1.
  - The upload-button glyph waits 1 s (`PendingPuppy`, `--puppy-delay: 1000ms`), so a quick upload never shows it. This was checked in code and the build, but no slow Drive upload was driven. That is manual item 3.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | any page while loading | inline glyph | seen as the dev test user |
| management | any page while loading | inline glyph | not driven — same component, no role logic |
| staff | any page while loading | inline glyph | not driven — same component, no role logic |
| vet | any page while loading | inline glyph | not driven — same component, no role logic |
| volunteer | any page while loading | inline glyph | not driven — same component, no role logic |
| signed out | public pages while loading | puppy scene | as expected (`/privacy`, `/donate`) |

- [ ] Every role above tested — n/a: the loader has no role logic; it picks public vs staff by path only (`isPublicPage`), and no route, proxy or RLS rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: there is nothing to operate; a loading indicator needs no instructions
- [ ] Translatable strings through the translation path — n/a: one UI dictionary string, `common.loading`, in both `en.ts` and `th.ts`
- [x] Mobile viewport (375px): the loader is centred (192 px wide, x 91.5–283.5) with `scrollWidth` 375, so there is no overflow. The pane's screenshot at the emulated size did not paint the loader, so how it looks on a phone is manual item 1
- [x] Browser console clean — the only error seen came from my own probe script (`Cannot read properties of null (reading 'click')`), not the app
- [x] Network clean — nothing unexpected caused by this change. The status change on missing pages is intended and measured; see §6

## 6. Regression

- [x] Nearest pages still work: `/privacy` and `/donate` in EN and ไทย, plus `/my`, `/stocktake`, `/residents` and `/vets` signed in. All rendered normally after loading
- [x] Shared files checked from a second page by loading it: the dictionaries (`common.*`) on `/stocktake` and `/residents`, whose labels rendered normally; `globals.css` on the staff pages (dark theme intact) and public pages (cream palette intact)
- [x] Nothing merged from `main` during `sync` was broken: gates rerun on the merge commit, all 0
- [x] **Status codes of missing pages**, measured with `curl` on dev:

| URL | without root `loading.tsx` | with it |
|---|---|---|
| `/adopt/00000000-…` | 404 | 200 + `noindex` |
| `/r/ZZZZ` | 404 | 200 + `noindex` |

Accepted and recorded in `docs/decisions.md`.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-26
- [ ] `README.md` still accurate — n/a: the README does not describe loading states and nothing it says changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for shelter users and visitors
- [x] Commit messages say why, not just what
- [x] Claims measured, not reasoned: the delay timings, the reduced-motion state, the Thai label and the 404→200 change were all measured above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates or times involved
- [ ] Boundary or banding change — n/a: no threshold logic
- [x] Evidence pasted is the tools' actual output (the gates lines above are copied as printed)
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] Production ref read and matches — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback: `npx wrangler rollback --env production` reverts it entirely. There is no schema or data change, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Missing pages after a database read stream 200 + `noindex` instead of 404 (Next streaming behaviour with a `loading.tsx`) | accepted — decisions.md, 2026-09-26 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The artwork itself: the drawing, colours and motion read well, at desktop size and on a phone | any public page loading slowly, e.g. `/adopt` on a slow connection |
| 2 | With the device set to reduce motion, the puppy stands still next to "Loading…" | OS setting "Reduce motion", then a slow public page |
| 3 | A slow upload shows the small puppy in the button after about a second | Settings → Website → hero or gallery photo; a Shelter Friend logo |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the three items above wait for Lutan, who is also signing off the artwork

Manual verification by: pending: Lutan to check items 1–3 and sign off the artwork

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release time
