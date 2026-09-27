# Feature test plan

## Header

| | |
|---|---|
| Feature | Pet relocation information page (`/relocation`), a Services menu group, and the caped puppy |
| Backlog item | `docs/backlog.md` → Public website → A "Pet relocation" information page on the public site |
| Branch / worktree | `claude/pet-relocation-page` @ `C:\Development\Animal_Shelter_pet-relocation-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | #171 |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no — the slug and its empty row are 0099 (#164), already on `main` and applied to dev |
| Tested at SHA | `f8a83cc` (after `worktree.mjs sync`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a public, information-only `/relocation` page built like `/foster` (site_pages row, `SitePageView`, edited on Settings → Website, Thai via the queue) with a flying caped puppy beside the heading, linked from the menu, the footer and `/adopt`
- [x] Files/areas touched listed: `src/app/relocation/page.tsx` (new); `src/app/adopt/` (`SitePageView.tsx` hero slot and starter text, `PublicHeader.tsx` Services group and short name at lg, `PublicNav.tsx` comments, `PublicFooter.tsx` link, `page.tsx` overseas line); `src/app/admin/website/` (path, revalidate, starter prefill); `src/app/management/translations/actions.ts` (revalidate); `src/components/PuppyLoader.tsx` (`PuppyFlying`); `src/app/globals.css` (its keyframes); `src/lib/site/pages.ts`; `src/lib/public-paths.ts`; `worker/index.mjs` (edge-cache list); both dictionaries; manual; releases; docs
- [x] Roles affected identified: signed-out public (the page, menu, footer, `/adopt` line); admin (Settings → Website editor). Staff/vet/volunteer/management see nothing new
- [x] Out of scope, written down: no enquiry form, booking, tracking or payments (the item says information only); no licence block, timelines or prices (the Director supplies those); desexing drives, which Lutan wants under Services later — added to the `backlog` branch as its own item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (docs-only changes came in)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 77s
=== gates: build exited 0 after 97s
gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: `check`, `migration-numbers` and `test-plan` all passed on #171 at `508a92b`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; 0099 already carries the slug
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0099 was applied to dev with #164)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page reads the 0099 row as seeded (title "Pet relocation", empty body), checked on dev
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration and no constraint changed
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration in this PR; 0099 must be on production before this deploys (see section 8)

## 4. Functional checks

- [x] Happy path works end to end: `/relocation` on dev renders the flying puppy, the heading and the starter text, then the Get in touch card; `<title>` is "Pet relocation · Lanna Care for Animals"
- [ ] Data persists — reload the page and the change is still there — n/a: the public page writes nothing; saving the body on Settings → Website is the existing `updateSitePage` action, unchanged apart from revalidating `/relocation`
- [ ] Create / edit / delete all exercised — n/a: no new write path; editing the row uses the existing site-page form (the prefill is left for manual verification)
- [x] Empty state renders sensibly: the dev row's body is empty, and the page shows the starter text rather than "coming soon" — in English and, after switching to ไทย, in Thai
- [ ] Invalid input is rejected with a readable message — n/a: no new input; an empty title is still refused by the existing action
- [ ] Boundary cases checked — n/a: no new field; the starter only appears while the body is empty, and any saved body replaces it (a two-branch `||`, read in `SitePageView.tsx`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/relocation`, Settings → Website | page as a visitor sees it; Pet relocation form with starter prefilled | page: not driven signed in; editor: left for manual verification |
| management | `/relocation` | page as a visitor sees it | not driven signed in — the route has no role logic |
| staff | `/relocation` | page as a visitor sees it | not driven signed in — the route has no role logic |
| vet | `/relocation` | page as a visitor sees it | not driven signed in — the route has no role logic |
| volunteer | `/relocation` | page as a visitor sees it | not driven signed in — the route has no role logic |
| signed out | `/relocation`, menu, footer, `/adopt` line | all public | driven on dev: 200, menu and footer links present, `/adopt` link goes to `/relocation` |

- [ ] Every role above tested — n/a: the page is public with no role logic, so signed out is the case that matters and was driven; the admin editor is the only role-specific surface and is in Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: nothing on the page is restricted; the only write (`updateSitePage`) is unchanged and still calls `assertAdminRole()`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the staff app's nav is untouched; the public nav gained a Services group, checked on dev at 1280 px (dropdown opens, "Pet relocation" marked current on `/relocation`), 1024 px in Thai (all five entries fit, short name beside the logo) and 375 px (phone menu lists บริการ → ขนย้ายสัตว์เลี้ยง)
- [x] Manual updated (`src/lib/manual/en.ts`): Settings → Website lists the page and explains the starter text; What the public sees describes the page. Reading it at `/manual` needs sign-in — left for manual verification
- [x] Translatable strings go through the translation path: the row's title and body are `site_pages`, already queued fields (0059); `/relocation` added to the queue action's revalidate list. The starter itself is dictionary text in both languages, not queue text, by design (`docs/decisions.md`)
- [x] Mobile viewport (375px) — `document.documentElement.scrollWidth` is 375, puppy stacked above the heading, phone menu usable
- [x] Browser console clean — no errors on `/relocation` or `/adopt`
- [ ] Network clean — n/a: no new requests; the page loads the same two rows (`public_site_pages`, `site_content`) every site page does, and it rendered their data

## 6. Regression

- [x] The pages nearest the change still work: `/adopt` (listing, How adoption works, and the new line) and `/relocation` loaded on dev; the header and footer changes render on both
- [x] Shared file touched checked from a second page by loading it: `PublicHeader.tsx` / `PublicFooter.tsx` / dictionaries loaded on `/adopt` in Thai at 1024 px — menu, footer and short name as intended
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge brought only docs, and gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the desexing-drives follow-up went on the `backlog` branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-27 (starter text in code, Services group, sketch B)
- [x] `README.md` still accurate — it does not enumerate the public pages
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for the page, the Services menu, the `/adopt` pointer and the editable starter text
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the three-line wrap was seen on dev at 1024 px in Thai before the fix and one line after; the teal cape on dev was seen in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covered on both edges — n/a: no threshold, band or cutoff; the header's short-name range (lg to xl) was checked at 1024 and 1280 px
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: apart from the gates block, pasted as printed, the evidence is values quoted inline from the browser
- [ ] Public pages re-checked after a cache purge — deferred: production release manager — `/relocation` is a new edge-cached path in `worker/index.mjs`, and every public page's header and footer changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Not both, but it reads 0099: `/relocation` loads the `relocation` row. Without 0099 on production the page still renders the starter text (no row → starter), but the admin editor has no Pet relocation form. **0099 should be applied to production before this deploys**
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] Production backup fresh — n/a: 0099 widens a check constraint and inserts two rows `on conflict do nothing`
- [x] Apply plan stated: `supabase/migrations/0099_site_pages_relocation_friends_join.sql`, production `dbkodyyxxhtygxcxmfcu`, via `node scripts/apply-migrations.mjs --env production`, before the deploy carrying this PR (if #164's release has not already done so)

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes the page, the Services menu and the `/adopt` line at once. It does not touch 0099 and does not need to: the old code lists five slugs and never reads the `relocation` row

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Five menu entries wrapped "Lanna Care for Animals" onto three lines at 1024 px in Thai | fixed — short name between `lg` and `xl` |
| 2 | Low | On the Thai page the heading reads "Pet relocation" in English until the seeded title's Thai translation is approved in the queue | accepted — that is the queue working as designed for every site page; approve it on Management → Translations |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The caped puppy (sketch B with pyjamas) looks right and reads as our character, and the cape is terracotta on production (teal on the test site is the dev recolour) | `/relocation` on a laptop and a phone |
| 2 | Settings → Website shows a Pet relocation form whose Text box is filled with the starter and carries the yellow note; saving it makes the page show the saved text | `test.lannacare.org/admin/website` as an admin |
| 3 | The manual's Settings → Website and What the public sees topics read correctly | `/manual` signed in |
| 4 | With the operating system's "reduce motion" on, the puppy is still (the rule is present and was checked in the stylesheet, but not seen with the setting on) | `/relocation` on a device with reduce motion on |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items are outstanding; see the pending line below

Manual verification by: pending: the puppy's look, the admin editor's starter prefill, the manual topics and reduced motion (Left for manual verification 1–4)

### Result

- [x] Open defects are either fixed or explicitly accepted above — one fixed, one accepted
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/pet-relocation-page.md`, which is in the PR itself
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
