# Feature test plan — public-site-home

## Header

| | |
|---|---|
| Feature | Public site redesign, part 2 of 4: the homepage |
| Backlog item | `docs/backlog.md` → "Public site redesign — build the "Lanna Care for Animals" mockups" (part 2; **not ticked**, parts 3–4 remain) |
| Branch / worktree | `claude/public-site-home` @ `C:\Development\Animal_Shelter_public-site-home` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | #141 |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `52d419a` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/` is rebuilt to the homepage mockup on part 1's shell. It has the hero with Meet the animals / Give monthly, the four-stat impact band, the Shelter Friends band with a "Your business here?" tile, four "How you can help" cards, and Pet of the week beside Our story with a photo row (the item's suggested part 2)
- [x] Files/areas touched listed: `src/app/page.tsx` (rewritten), new `src/lib/site/impact.ts`, i18n `en.ts`/`th.ts` (`home`, `shelterFriends.homeStrip`), `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/decisions.md`. `PublicHeader.tsx`/`PublicFooter.tsx` are not touched
- [x] Roles affected identified: signed-out public (the home page). Signed-in staff and public viewers see the same page. No app page changes
- [x] Out of scope written down:
  - The resident page is part 3, and sponsor and the mockup's stats are part 4.
  - The mockup's three figures without data are a new backlog item, "Impact band: find data…".
  - Give monthly and Sponsor go to `/donate` until the `/donate` item is built. Become a Shelter Friend goes to the footer (`#contact`).
  - No schema.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date." at `52d419a`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 251s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on PR #141: `check`, `migration-numbers` and `test-plan` all pass (run 36214393785)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end (browser pane, dev :3008, 1280px):
  - Hero heading and both buttons render. Meet the animals goes to `/adopt` and Give monthly to `/donate`.
  - The band shows real dev counts: 73 in care, 2 adopted this year, 1 in foster, 8 in vet care.
  - The Shelter Friends band shows the one published friend, then the dashed tile and the "Meet all…" link.
  - All four help cards render.
  - Pet of the week (Panda) shows "Female · Welsh Corgi · ~6.5 years old (estimated) · Desexed", the bio lead, and "Read Panda's story →" to `/adopt/<id>`.
  - Our story shows three gallery photos and the Our work link.
- [ ] Data persists — n/a: the page only reads; nothing is saved
- [ ] Create / edit / delete — n/a: read-only page
- [x] Empty state renders sensibly — code path, not driven (dev has every section's data). Each section is guarded on its own data:
  - no hero photo: the text takes the full width
  - no stats: no band
  - no published friend: no band
  - no featured resident, or one since hidden: Our story alone at `max-w-3xl`
  - no gallery: no photo row
- [ ] Invalid input rejected — n/a: no input on the page
- [x] Boundary cases checked:
  - Thai at 1280px: the heading wraps onto three lines, and every section renders in Thai.
  - The bio lead is cut at 160 characters with an ellipsis (Panda's shows "…").
  - Missing facts drop out of the facts line, and "Desexed" appears only when it is true (code path).

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | / | the new home page | not driven — access unchanged |
| management | / | as admin | not driven — access unchanged |
| staff | / | as admin | not driven — access unchanged |
| vet | / | as admin | not driven — access unchanged |
| volunteer | / | as admin | not driven — access unchanged |
| signed out | / | the new home page (the dev server serves it signed out) | as expected |

- [ ] Every role above tested — n/a: no route, proxy, RLS or header change. The page reads the same public views as before and adds only `sex`, `estimated_age_years`, `age_estimated_on` and `is_desexed` from `public_resident_profiles`, which anon already has (0060)
- [ ] A role that should not have access is blocked server-side — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): The public pages → Home describes the new layout. Settings → Website says the hero photo sits beside the heading, the tagline is the hero paragraph, and the gallery shows three photos. Shelter Friends describes the home band
- [ ] Translatable strings through the translation path — n/a: new strings are UI dictionary entries in both `en.ts` and `th.ts`. Admin content (tagline, Our story) keeps its existing paired/translation path
- [x] Mobile viewport (375px) — no overflow (`scrollWidth` 375). Every link in `<main>` is at least 44px tall (script found none shorter). The band is 2×2, and the cards and friends grid stack
- [x] Browser console clean — no errors on `/`
- [x] Network clean — no unexpected 4xx/5xx caused by this change. Observed but not caused here, as part 1 recorded: on dev the hero photo comes back from `/api/photos/…` as zero bytes, so the hero frame is empty

## 6. Regression

- [x] The pages nearest the change still work: `/` in EN and ไทย. Header and footer are part 1's, unchanged. Dev still reads as dev: Donate and the action colours are teal on the green-tinted cream
- [x] Shared files checked from a second page by loading it:
  - The dictionaries from `/friends` (h1 "Shelter Friends") and `/donate` (h1 "Donate", with the "Give in kind" Friends mention still present). Both loaded with no console errors.
  - `src/lib/manual/en.ts` could not be loaded: `/manual` redirects to `/login` signed out. The edit is text only, inside existing `steps` arrays, and the build compiles it. Reading it at `/manual` is manual item 5
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked — n/a: part 2 of 4; the brief says leave it unticked
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: stats band, Give monthly, Become a Shelter Friend, contrast, copy sources, what was dropped
- [x] `README.md` still accurate — its home-page mention (Pet of the week chosen at `/admin/website`) still holds
- [x] **Release notes.** `unreleased` gained a line describing the new home page for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Contrast ratios were computed with the WCAG formula in the page:
  - action-hover on sand: 6.62
  - action on paper: 5.38
  - dev action on cream: 5.65

  Overflow and touch targets were read from the running page.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date. "Adopted this year" comes from the view, which uses `shelter_today()` since 0073
- [ ] Boundary or banding change — n/a: none
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the previous home page entirely; no schema is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The Thai hero heading breaks "ครั้งที่สอง" across lines at 60px (Thai has no spaces, so the browser picks the break) | accepted: Lutan read the Thai, 2026-09-26, "looks fine" |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The homepage looks like the mockup to the person who designed it (type, colour, spacing, section order) | :3008 or test.lannacare.org vs `docs/design/homepage-desktop.png` |
| 2 | The deviations in `docs/decisions.md` (2026-09-26, part 2) are acceptable. Examples: the band's four real figures; Sponsor card copy without a price; Become a Shelter Friend going to the footer; What we do / Ready panel dropped | `docs/decisions.md` |
| 3 | Thai wording of the new home copy, and whether the hero heading's line break reads well | `/` in ไทย |
| 4 | The page on a real phone | test.lannacare.org on a phone |
| 5 | The manual's updated passages read correctly (The public pages → Home; Settings → Website; Shelter Friends) | `/manual`, signed in |

All five were checked by Lutan, 2026-09-26: "checked all five, looks fine" (confirmed in chat; recorded by Claude at their request).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — all five looked at by Lutan, 2026-09-26

Manual verification by: Lutan — confirmed in chat; line written by Claude at their request  Date: 2026-09-26

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist linked from the PR description (`docs/test-plans/public-site-home.md`)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
