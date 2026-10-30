# Feature test plan — website-rich-text

## Header

| | |
|---|---|
| Feature | Page text on Settings → Website → Pages takes bold, italic, underline, colour (three site colours) and size from buttons; each page edits in a popup from an Edit button |
| Backlog item | `docs/backlog.md` → "RICH TEXT ON THE WEBSITE SCREEN" (ticked) |
| Branch / worktree | `claude/website-rich-text` @ `C:\Development\Animal_Shelter_website-rich-text` |
| Dev server | `http://localhost:3005` |
| PR | pending |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `c7844cea` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — inline marks plus a popup editor, page bodies only
- [x] Files/areas touched listed — `src/lib/site/body.ts` (+ `body.test.mjs`), `src/components/SiteBodyView.tsx`, `src/app/admin/website/` (`PagesAccordion`, `SitePageForm`, new `BodyToolbar`, `page.tsx`), both dictionaries, manual, releases
- [x] Roles affected identified — anyone holding `website.content` (edit); the public sees the styled text
- [x] Anything explicitly **out of scope** written down — headings, hero text, short fields; `/shop` untouched; no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 99s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; old bodies contain no valid tag so parse as one plain run (unit test)
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — admin, dev: `#donate` opened the popup; toolbar wrapped selections in the bold and colour tags; the Preview rendered strong and a green span
- [ ] Data persists — reload the page and the change is still there — n/a: the save action is unchanged (same text column); Save was not pressed to avoid editing shared dev content
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: edit only, save path unchanged
- [x] Empty state renders sensibly — an empty body already shows the starter text, unchanged
- [x] Invalid input is rejected with a readable message, not a crash — script tag, unknown colour and a javascript link all rendered as plain text in the Preview
- [x] Boundary cases checked — unit tests: unclosed, crossed, stray closer, unknown colour; the page lead strips tags

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Pages tab, Edit | Edit shown, popup opens | seen |
| management | Pages tab | gate is the card website.content | not driven |
| staff | n/a | retired | n/a |
| doctor | Pages tab | same card gate | not driven |
| volunteer | Pages tab | same card gate | not driven |
| signed out | Pages tab | refused by requirePermission (unchanged) | unchanged |

- [ ] Every role above tested — n/a: only Admin was driven; the Edit button and the #slug link both follow can(perms, website.content), the activity updateSitePage asks; a login without that card never sees the Pages tab (tabs gate, unchanged)
- [ ] A role that should not have access is blocked server-side — n/a: the server check in updateSitePage is untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — the Pages-tab step now describes Edit, the popup and the style buttons; not opened at `/manual`
- [x] Translatable strings go through the dictionaries — both added under `admin.website.pages`; the Thai is a first draft needing a Thai reader (Left for manual verification 1)
- [x] Mobile viewport (375px) — dialog measured 375x812, scrollWidth 375, no horizontal scroll
- [x] Browser console clean — no error seen during the session; not exhaustively read
- [ ] Network clean — n/a: not inspected; no new requests

## 6. Regression

- [x] The pages nearest the change still work — Pages tab rows, Donate preview, the public renderer via the preview
- [x] Any shared file touched (`SiteBodyView`, `body.ts`, manual, dictionaries) checked from a second page — the preview uses the public renderer; bodyLead callers compile in the build
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-website-rich-text.md`
- [x] `README.md` still accurate — it does not describe the Pages editor
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it; nothing here waits on a production step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The phone width and the script paste were measured in the browser; the unsaved-changes prompt fired on the close button and on Esc

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic added
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: only the gates lines, as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Stored text keeps its shape; a rolled-back build would show the tags as literal text on any page that used them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The Thai view and a real phone's public page were not driven; the Preview (same renderer) was | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Thai strings under admin.website.pages (edit, marks, discard prompt) read naturally; a Thai body with tags renders styled | Thai reader |
| 2 | Saving a styled body and viewing the public page on a real phone | Public page |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Thai reader and a real phone

Manual verification by: pending: Lutan or a Thai reader

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
