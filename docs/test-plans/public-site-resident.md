# Feature test plan — public-site-resident

## Header

| | |
|---|---|
| Feature | Public site redesign, part 3 of 4: the resident page (`/adopt/[id]`) |
| Backlog item | `docs/backlog.md` → "Public site redesign — build the "Lanna Care for Animals" mockups" (part 3; **not ticked**, part 4 remains) |
| Branch / worktree | `claude/public-site-resident` @ `C:\Development\Animal_Shelter_public-site-resident` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` |
| PR | #150 |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no (reads `0094`, already on `main` and applied to dev) |
| Tested at SHA | `5b30386` (merge of `origin/main` at #149 into `66fc84a`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/adopt/[id]` is rebuilt to `docs/design/resident-profile-mobile.png` on part 1's shell — status badge, hook line, quick-facts panel, "Gets along with" chips, story and ideal-home sections, a How to meet box, a sponsor link and a sticky Ask on LINE / Book a visit bar that leaves the sponsor link uncovered (the item's resident-page portion)
- [x] Files/areas touched listed:
  - public: `src/app/adopt/[id]/page.tsx` (rewritten), `PhotoGallery.tsx`, `src/components/ShareButton.tsx` (new `site` variant; only caller is this page), `src/lib/residents/public.ts` (two columns)
  - staff: `src/app/residents/[id]/edit/` (form, action, page select), `src/app/residents/[id]/ResidentHub.tsx` and `page.tsx`, `src/lib/residents/adoption-profile.ts` (limits and `readAdoptionCopy`)
  - `src/lib/i18n/dictionaries/en.ts` / `th.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/decisions.md`
  - `PublicHeader.tsx`, `PublicFooter.tsx` and the homepage are not touched
- [x] Roles affected identified: signed-out public (the resident page); admin / management / staff (two new fields on Edit resident, two rows on the hub, labels on Translations)
- [x] Out of scope written down:
  - Part 4 (sponsor flow and stats). The sponsor line goes to `/donate` until the `/donate` item exists.
  - Messenger / WhatsApp beside Ask on LINE: `contact-channels`.
  - Intake does not ask for the hook line or ideal home; they are written later from Edit resident.
  - The homepage's Pet of the week still uses the bio lead; switching it to the hook line is a new backlog item ("Pet of the week: use the resident's hook line").
  - No schema; size needed none (`residents.size`, 0051).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: #149 (`contact-channels`) came in as `5b30386` with no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 195s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on PR #150: `check`, `migration-numbers` and `test-plan` all pass (run 36234980225)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration; the length limits are the form's (0094 left them to it) and are covered in section 4
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration of its own. It reads `0094`'s columns, so `0094` must be applied to production before this deploys (the release manager's check; `0094` merged in #146)

## 4. Functional checks

- [x] Happy path works end to end (browser pane, dev :3015, signed in by Lutan). On Edit resident for Panda, filled hook line, ideal home, past story and temperament, and set dogs Yes / cats Not yet known / children No / energy Medium, then saved. `/adopt/<Panda>` then showed:
  - the hook under the name
  - quick facts: Age ~6.5 years, Sex Female, Breed Welsh Corgi, Size Small, Health "Desexed · Vaccinated", Energy Medium
  - chips "Dogs: Yes", "Cats: Not yet known", "Children: No"
  - "Panda's story" as past story → bio → temperament
  - "Her ideal home"
  - How to meet with dev's visiting hours and address
  - the sponsor line, similar residents, and the bar
- [x] Data persists — after the save, a fresh navigation to the hub and the public page showed every value; the hub lists Hook line and Ideal home with their translation boxes
- [x] Create / edit / delete exercised: set (above), and a Thai translation of the hook line added and approved from the hub's translation box. Clearing a field is the same `str()` → null path as the bio; not driven separately
- [x] Empty state renders sensibly: Markey on dev has no hook, no ideal home, no story (no bio, temperament or past story), no age, energy or "gets along" values. The page shows photo, badge, name, facts (Sex, Breed, Health), How to meet, the sponsor line and the bar — no empty headings. Checked at 375px and 1280px, EN and ไทย
- [x] Invalid input is rejected with a readable message: with `maxlength` stripped in the page (as a paste bypassing it would), a 130-character hook came back "Keep the hook line to 120 characters — one sentence." and nothing was saved
- [x] Boundary cases checked:
  - Whitespace in the hook is folded: "will    follow" was saved as "will follow" (a text input already drops pasted line breaks).
  - 45 photos: the thumbnail strip first widened the phone layout to about 3,260px (defect 1, fixed) and now scrolls inside the column.
  - No LINE / no phone set: code path only (dev has both). Ask on LINE hides; Book a visit falls back to `mailto:`.
  - The ideal home at exactly 600 characters, or the hook at exactly 120: not driven; `maxLength` and `> MAX` agree on the limit by construction.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/adopt/[id]`, Edit resident | public page; the two new fields | the account Lutan signed in with (admin or management — it reached Translations and approved one) — edited and saved as expected |
| management | as admin | as admin | not driven — no access rule changed |
| staff | as admin | as admin | not driven — no access rule changed |
| vet | `/adopt/[id]` | public page; the edit action refuses (unchanged role check) | not driven — no access rule changed |
| volunteer | as vet | as vet | not driven — no access rule changed |
| signed out | `/adopt/[id]` | the new page | as expected (Markey, before signing in) |

- [ ] Every role above tested — n/a: no route, RLS, grant or role check changed. The two columns are on `public_resident_profiles`, which anon already reads (0094's grants), and the edit action's existing admin/management/staff check covers the new fields
- [ ] A role that should not have access is blocked server-side — n/a: no access rules changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`): The public pages → Adopt describes the new profile and the bar; Editing a resident's details describes the two fields and their limits; Translating public text lists them; intake step 4 no longer names the "Is (name) right for you?" block
- [x] Translatable strings go through the translation path, checked at `/management/translations`: "Panda (R-0002) · Ideal home" is in the queue with its label, and the approved Thai hook line appears on `/adopt/<Panda>` in ไทย while the untranslated fields fall back to English
- [x] Mobile viewport (375px) — no overflow (`scrollWidth − clientWidth` = 0 for Markey and, after the fix, Panda); every link and button in `<main>` is at least 44px tall (script found none shorter); the bar's buttons are 52px
- [x] Browser console clean — no errors on `/adopt/[id]`
- [x] Network clean — no unexpected 4xx/5xx caused by this change. As parts 1 and 2 recorded, some dev photos come back from `/api/photos/…` empty, so a few thumbnails are blank

## 6. Regression

- [x] The pages nearest the change still work: `/adopt` (the listing, links to both profiles), the resident hub, Edit resident (save and error paths), `/management/translations`
- [x] Shared files checked from a second page by loading it:
  - The dictionaries from `/our-work/[id]` ("Rescues from Wat on 20 Sep 2026") and the resident hub; no console errors.
  - `/r/R-0002` redirects a signed-in user to the hub, so its signed-out card (which uses `t.adopt.details`, `recommendation`, `health`) was not seen. Typecheck proves those keys still exist; seeing it is manual item 4.
  - `src/lib/manual/en.ts`: compiled by the build; reading it at `/manual` is manual item 5.
- [x] Nothing merged from `main` during `sync` was broken: #149 changed `PublicFooter`, `PublicHeader`, `PublicNav` and `src/lib/site/content.ts`. After the merge, gates passed and `/adopt/<Panda>` at 375px still renders the hook, has no overflow, and the bar still comes to rest on the footer (bar bottom = footer top) below the sponsor line; console clean

## 7. Documentation

- [ ] Backlog item ticked — n/a: part 3 of 4; the brief says leave it unticked. The follow-up (Pet of the week) went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: empty fields, size, story order, quick facts, "Not yet known", sponsor link, sticky bar, LINE and Book a visit, length limits, translations, `font-site!`, desktop layout
- [x] `README.md` still accurate — no mention of the resident page's layout or the edit form's fields
- [x] **Release notes.** `unreleased` gained a line describing the new resident page and the two Edit resident boxes for a shelter user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The bar resting above the footer and below the sponsor line was read from the running page at 1280px (bar bottom = footer top = 539.5; sponsor bottom 37.5 above it). The thumbnail-strip width in the fix commit was read from the page (frame 3,264px). Overflow and touch targets were read from the page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date; age comes from the existing `formatAge`
- [ ] Boundary or banding change — n/a: none; the length limits are single thresholds checked in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration in this PR; it depends on `0094` being on production first (section 3)
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores the previous resident page and edit form. No schema is involved; any hook lines and ideal homes staff have written stay in `residents` and simply stop showing

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A resident with many photos (Panda, 45) widened the phone layout: the grid's implicit column grew to the thumbnail strip's full width (~3,260px) | fixed in `66fc84a` (`grid-cols-1`); re-checked at 375px |
| 2 | low | After a rejected save, Edit resident puts every field back to its saved value, so the text typed into the hook line is lost with the error. The whole form already behaves this way (React resets an uncontrolled form after its action) | accepted: pre-existing form behaviour, not introduced here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The page looks like the mockup to the person who designed it (type, colour, spacing, order), filled in (Panda) and empty (Markey) | :3015 or test.lannacare.org vs `docs/design/resident-profile-mobile.png` |
| 2 | The deviations in `docs/decisions.md` (2026-09-26, part 3) are acceptable — e.g. sponsor copy without a price, Book a visit phoning, colour dropped from the facts, the caveat under the chips | `docs/decisions.md` |
| 3 | Thai wording of the new page and of the two Edit resident fields and hints | `/adopt/<id>` in ไทย; Edit resident in ไทย |
| 4 | The signed-out RFID card still shows its details (it shares the `adopt` dictionary) | `/r/R-0002`, signed out |
| 5 | The manual's updated passages read correctly (The public pages → Adopt; Editing a resident's details; Translating public text) | `/manual`, signed in |
| 6 | The sticky bar and the tel:/LINE links on a real phone | test.lannacare.org on a phone |

All six were checked by Lutan, 2026-09-26: "checked all six, looks fine" (confirmed in chat; recorded by Claude at their request).

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — all six looked at by Lutan, 2026-09-26

Manual verification by: Lutan — confirmed in chat; line written by Claude at their request  Date: 2026-09-26

### Result

- [x] Open defects are either fixed or explicitly accepted above — defect 1 fixed; defect 2 accepted as pre-existing form behaviour
- [x] Checklist linked from the PR description (`docs/test-plans/public-site-resident.md`)
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: after merge
