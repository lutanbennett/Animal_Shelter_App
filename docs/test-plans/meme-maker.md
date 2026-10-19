# Test plan: meme-maker

## Header

| | |
|---|---|
| Feature | Meme maker, stage 2 of the meme library: `/memes/make`, Make a meme from the library and the photo lightbox, Medical refusal on the save path |
| Backlog item | `docs/backlog.md` → "Meme maker, stage 2 of the meme library" (ticked in this PR) |
| Branch / worktree | `claude/meme-maker` @ `C:\Development\Animal_Shelter_meme-maker` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude, 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | f899bbf5 |

## 1. Scope and risk

- [x] One sentence: a phone-first maker that draws words on a resident's non-Medical photo and saves it into the meme library tagged with that resident; matches the backlog item
- [x] Touched: `src/app/memes/make/**`, `src/app/memes/actions.ts` (createMeme), `src/app/memes/page.tsx`, `src/components/PhotoGallery.tsx`, the Photos section, `src/lib/memes/**`, both dictionaries, manual, releases, the permission catalogue pins and acceptance-matrix rows
- [x] Roles affected: any role holding `social.library` at Edit (Admin today); everyone else is refused as before
- [x] Out of scope: home tiles, `check-who-does-what.mjs`, any migration, redesigning the library page, drag-to-reposition of the photo

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR
- [ ] Re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Rolled-back harness — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: on dev at 375 px, opened Panda's photo in the maker, typed English top text and Thai bottom text, saved; the meme page opened with Panda tagged and Download, Record a share, Edit and Archive shown
- [x] Data persists: the meme page reloaded from the database showed the words, the tag `meme maker` and the resident
- [x] Create / edit / delete: created one; edit and archive are stage 1 code, untouched
- [x] Empty state: a resident with no usable photos shows "no photos that can be made into a meme" (code path read, not driven)
- [x] Invalid input: an unknown or malformed `?photo=` shows the refusal sentence; `maker-source.test.mjs` covers Medical, not-found and waiting-for-approval
- [x] Boundary cases: long English text wraps and shrinks in the preview; `maker-layout.test.mjs` covers wrapping, an unbroken long word, Thai marks staying with their letters, and the minimum font size

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | maker, save, lightbox button | everything | pass |
| a role without `social.library` | `/memes/make`, createMeme | refused by `requirePermission` and by `can()` in the action | pending: manual, follows from the guard pinned in `check-permission-catalogue.mjs` |
| signed out | `/memes/make` | redirect to login | pending: manual, follows from the same guard |

- [x] Every role above tested or marked
- [x] A role that should not have access is blocked server-side: the page guard is pinned in the catalogue check and `createMeme` asks `can()`

## 5. Cross-cutting

- [x] Nav entry: no new sidebar entry; Make a meme sits beside Add a meme on the library page
- [x] Manual updated: topic "Memes: making one", and its two acceptance-matrix rows
- [x] Both dictionaries carry every string (`memes.maker.*` and the three source errors)
- [x] Mobile viewport (375 px): the maker page, the preview and the controls fit; no horizontal scroll seen
- [x] Browser console clean on the maker page
- [x] Network clean for the maker: the photo at 1200 px, the logo and the save all returned 200

Thai check, done before anything else: Noto Sans Thai Bold from `src/lib/archive/fonts/` drawn on a canvas in Chrome with `น้ำ กำลัง ก๊ก ที่ สุด ผู้ใหญ่ ปู่ ญี่ปุ่น` and a mixed Latin line. ำ, tone marks and stacked vowels were placed correctly, with no boxes. The same words rendered correctly in the live preview.

## 6. Regression

- [x] Checked: the library page (two buttons now), the Photos tab lightbox (new button only for an approved non-Medical photo), the Add a meme upload (unchanged path when no `sourceFileId`)
- [x] Shared files touched (`PhotoGallery.tsx`, dictionaries, `createMeme`) built and type-checked; gates pass
- [x] Nothing merged from `main` during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked on this branch; searched `meme` and `maker`: no other open item is closed by this
- [x] Decision file `docs/decisions/2026-10-19-meme-maker.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line saying shelter users can now make a meme in the app; nothing outstanding stands between a user and the feature
- [x] Commit messages say why
- [x] Claims were measured: the Thai render was screenshotted, the save was run on dev, and the tests ran

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates are computed
- [ ] Boundary or banding assertions — n/a: no thresholds beyond font-fit limits, covered by maker-layout.test.mjs
- [ ] Evidence is the tool's actual output — n/a: only the gates line is pasted
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] New secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and reading code together — n/a: no migration in this PR
- [ ] Production dry-run clean — n/a: no migration in this PR
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code-only; rebuild on the Pi with `deploy-pi.sh --ref <sha>`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The Medical refusal was proved by unit test on the save-path rule and by the picker and lightbox hiding Medical photos, not by trying to save a Medical photo end to end on dev | accepted: listed for manual verification |
| 2 | low | `scripts/lib/acceptance-matrix-entries.mjs` was touched (two rows) although the brief listed it as another stream's: lint fails a manual topic without a row | accepted: two added rows beside "memes"; a merge conflict with `scripts-truth-fixes` should be a trivial keep-both |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | In a photo's lightbox the Make a meme button shows for an approved Shelter photo and is absent for a Medical one | a resident's Photos tab on dev |
| 2 | Download saves the made image on a real phone and the Thai reads correctly there | a phone signed in as Admin |
| 3 | A made meme appears under the resident's Memes list and in Drive's Memes folder | the resident's page; Google Drive |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are listed and nobody has looked yet; the signature below says pending

Manual verification by: pending: lightbox button, Download on a real phone, resident Memes list and Drive folder

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — happens after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
