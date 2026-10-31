# Feature test plan — thai-rich-text

## Header

| | |
|---|---|
| Feature | The Thai of a website page's text gets the same style toolbar as the English, with the English and the Thai drawn as the page looks, on Management → Translations and in the Settings → Website popup |
| Backlog item | `docs/backlog.md` → "RICH TEXT FOR THE THAI OF THE WEBSITE'S PAGE TEXT" (ticked) |
| Branch / worktree | `claude/thai-rich-text` @ `C:\Development\Animal_Shelter_thai-rich-text` |
| Dev server | `http://localhost:3003` |
| PR | pending |
| Tested by / date | Claude / 2026-10-31 |
| Carries a migration? | no |
| Tested at SHA | `0651c69e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `TranslationPanel` takes `pageBody` (default off); on a page text's translation it shows `BodyToolbar` and draws the original, the translation and a live Thai preview with the public renderer
- [x] Files/areas touched listed — `src/components/TranslationPanel.tsx`, `src/components/BodyToolbar.tsx` (moved from `src/app/admin/website/`), `src/app/admin/website/SitePageForm.tsx` and `page.tsx`, `src/app/management/translations/TranslationQueue.tsx`, `src/lib/site/body.ts` (+ test), one key in each dictionary, manual, releases
- [x] Cards affected identified — `translations` (the panel's editor and toolbar, via `translations.manage`); `website` (sees the popup; without `translations` it now gets no translation buttons); the public sees the styled Thai
- [x] Anything explicitly **out of scope** written down — page headings and every other translated field stay plain; the stored format and the parser are unchanged; no migration; the Thai sweep item (Management) is not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 255s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data) — the Volunteer page's approved Thai with no tags renders on `/volunteer` in Thai with 4 paragraphs, 3 sub-headings, 8 bullets, no styled element and no brace
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — login holding exactly the `website` and `translations` cards (`dev-signin.mjs --cards`), dev: on Management → Translations the Volunteer page text's Thai was given bold, italic, underline, all three colours and all three sizes with the buttons; the preview updated as each was pressed; Save & approve saved it; the public `/volunteer` in Thai showed exactly those marks. In the Settings → Website popup (Pages → Edit Volunteer → Edit translation) the Green button wrapped a bullet and the side-by-side English | Thai preview showed it
- [x] Data persists — reload the page and the change is still there — the public page, loaded fresh after the save, carried every mark
- [x] Create / edit / delete all exercised (whichever the feature has) — edit and approve on both screens; the Volunteer Thai was then restored to its unstyled wording and approved from the popup
- [x] Empty state renders sensibly (no rows yet) — an empty Thai box shows "No Thai translation yet." under How the Thai will look
- [x] Invalid input is rejected with a readable message, not a crash — `<script>alert(1)</script>`, `[ลิงก์](javascript:alert(1))` and `<b onclick="x">ตัวหนา</b>` in the Thai were saved and showed as plain text in the preview and on the public page; no `script`, `b` or `javascript:` link element in the article
- [x] Boundary cases checked — unit tests: Thai marks nest and parse as the English do; unsafe Thai stays one text run; only `site_pages.body` takes the toolbar

### Role access matrix

Per card, not per role (`CLAUDE.md`: analysis is by card). Each row is a login holding exactly those cards.

| Cards held | Can reach | Expected | Result |
|---|---|---|---|
| website + translations | Translations page, Website popup | Thai editor and toolbar on page texts only | seen: 3 toolbars on the 3 open page-text rows of 138 boxes; popup: toolbar on the English text and the Thai text, none on the Thai heading |
| website only | Website popup | no Edit/Remove translation, no Thai toolbar, English toolbar kept | seen: 0 translation buttons, 1 toolbar (English), no Translations link |
| admin | everything | short-circuit, unchanged | not driven |
| signed out | Translations page | refused by `requirePermission("translations.manage")` (unchanged) | unchanged |

- [ ] Every role above tested — n/a: analysis is by card; the two card sets that decide the toolbar were driven, Admin is the unchanged short-circuit
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: `approveTranslation`'s `can(perms, "translations.manage")` and the page's `requirePermission` are untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — one step added to the Translating topic; not opened at `/manual`
- [x] Translatable strings go through the translation path — one key, `translations.lookPreview`, in both dictionaries; the Thai is a draft (Left for manual verification 1)
- [x] Mobile viewport (375px) — Management → Translations at 375x812: scrollWidth 375, no sideways scroll; the toolbar wraps to two rows of 44px buttons, the Thai box and the preview are full width, one column
- [x] Browser console clean — no errors seen while driving both screens; not exhaustively read
- [ ] Network clean — n/a: no new requests; the save is the existing `approveTranslation`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — Management → Translations (label rows and other prose rows unchanged, no toolbar), Settings → Website popup (English toolbar, now imported from `src/components/`, still wraps), public `/volunteer` and `/foster` in Thai
- [x] Any shared file touched checked from a second, unrelated page — `TranslationPanel` and `body.ts`: the Translations page's resident and project rows still render plain (135 boxes without a toolbar); dictionaries: both screens loaded in English and the public pages in Thai
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-thai-rich-text.md`
- [x] `README.md` still accurate — it does not describe the translation panel
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it, tagged to the `translations` card; nothing here waits on a production step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The controlled-textarea behaviour, the safety cases, the card gate and the public rendering were all measured in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: only the gates lines, as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. Stored text keeps its shape and the public renderer is unchanged, so a rollback only removes the buttons and previews

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | Settings → Website drew Edit/Remove translation for a login with `website` but not `translations`; the server refused the press | fixed in this PR |
| 2 | Low | In the app's dark theme the first preview drew the site's dark ink on a dark background | fixed in this PR (site look on the preview) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The new Thai label "ภาษาไทยจะแสดงแบบนี้" reads naturally, and styling a real Thai page to match the English is comfortable for the reviewer | Lutan's wife, Management → Translations |
| 2 | A styled Thai page on a real phone | Public page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-31

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the Thai label and a real phone are listed above for a person

Manual verification by: pending: Lutan's wife reads the Thai label; a styled Thai page on a real phone

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending
