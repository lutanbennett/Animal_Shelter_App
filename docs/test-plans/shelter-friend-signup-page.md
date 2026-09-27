# Feature test plan

## Header

| | |
|---|---|
| Feature | Become a Shelter Friend page (`/friends/join`), linked from the homepage band, the menu, `/friends` and `/donate` |
| Backlog item | `docs/backlog.md` → Public website → A "Become a Shelter Friend" page for businesses that want to help |
| Branch / worktree | `claude/shelter-friend-signup-page` @ `C:\Development\Animal_Shelter_shelter-friend-signup-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | #175 |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no — the slug and its row ("Become a Shelter Friend", empty body) are 0099 (#164), already on `main` and applied to dev |
| Tested at SHA | `9709007` (browser checks at `ccb8a06` plus the `tel:` fix; gates at `9709007`, and again at `ce2b3c3` after the second sync) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a public, information-only `/friends/join` page built like `/relocation` (site_pages row `shelter-friends-join`, `SitePageView`, starter text until the Director writes hers, Thai via the queue), linked from both homepage tiles, a line on `/friends`, the `/donate` Give in kind card and Get involved in the menu and footer
- [x] Files/areas touched listed: `src/app/friends/join/page.tsx` (new); `src/app/adopt/` (`SitePageView.tsx` starter + join contact card + Give in kind link, `PublicHeader.tsx` Get involved entry, `PublicFooter.tsx` link); `src/app/page.tsx` (two `href`s and a comment only); `src/app/friends/page.tsx` (join line); `src/app/admin/website/` (path map, revalidate); `src/app/management/translations/actions.ts` (revalidate); `src/lib/site/pages.ts` (slug, `SITE_PAGE_PATHS`); `src/lib/site/content.ts` (`lineMessageLink`); both dictionaries; manual; releases; docs. `public-paths.ts` and `worker/index.mjs` need nothing: `/friends/` is already a public, edge-cached prefix
- [x] Roles affected identified: signed-out public (the page, menu, footer, homepage tiles, `/friends`, `/donate`); admin (Settings → Website gains a Become a Shelter Friend form with the starter prefilled). Staff/vet/volunteer/management see nothing new
- [x] Out of scope, written down: no sign-up form or anything that writes to the database (a business gets in touch; staff set the profile up as before); the Shelter Friends tiles' look (held for "Homepage polish" — only their `href`s changed); no fees or terms in the starter text (the Director's to state)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: "Already up to date." at first; after the PR was opened, a second sync merged #173 (public-site guard) and #174 (status alerts) with no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck exited 0 after 15s
=== gates: lint exited 0 after 101s
=== gates: build exited 0 after 181s
gates: typecheck=0 lint=0 build=0
```

Again at `ce2b3c3`, after the second sync:

```
=== gates: typecheck exited 0 after 24s
=== gates: lint exited 0 after 31s
=== gates: build exited 0 after 106s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; 0099 already carries the slug
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (0099 was applied to dev with #164)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page reads the 0099 row as seeded (title "Become a Shelter Friend", empty body), checked on dev
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration and no constraint changed
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration in this PR; 0099 must be on production before this deploys (see section 8)

## 4. Functional checks

- [x] Happy path works end to end: on dev, the homepage's Your business here? tile was clicked and landed on `/friends/join`, which shows the heading, the starter text and a Get in touch card; `<title>` is "Become a Shelter Friend · Lanna Care for Animals", `og:url` is `http://localhost:3004/friends/join` (not `/shelter-friends-join`)
- [x] Contact card links read from the rendered page: Email is `mailto:…?subject=Becoming%20a%20Shelter%20Friend&body=Hello%20Lanna%20Care…`; LINE is `https://line.me/R/oaMessage/%40lannacare/?Hello…` (dev's id is `@lannacare`, an Official Account form); Call is `tel:+66812345678` — after fixing defect 1
- [ ] Data persists — n/a: the public page writes nothing; saving the body on Settings → Website is the existing `updateSitePage` action, unchanged apart from revalidating `/friends/join`
- [ ] Create / edit / delete all exercised — n/a: no new write path; editing the row uses the existing site-page form (the prefill is left for manual verification)
- [x] Empty state renders sensibly: the dev row's body is empty, and the page shows the starter text rather than "coming soon" — in English and, after switching to ไทย, in Thai
- [ ] Invalid input is rejected with a readable message — n/a: no new input
- [ ] Boundary cases checked — n/a: no new field. `lineMessageLink` has three branches (no id → null; id without `@` or a URL → the plain add-friend link; `@id` → oaMessage); only the `@id` branch was seen on dev, the others are the unchanged `lineLink` result returned as is

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/friends/join`, Settings → Website | page as a visitor sees it; Become a Shelter Friend form with starter prefilled | page: not driven signed in; editor: left for manual verification |
| management | `/friends/join` | page as a visitor sees it | not driven signed in — the route has no role logic |
| staff | `/friends/join` | page as a visitor sees it | not driven signed in — the route has no role logic |
| vet | `/friends/join` | page as a visitor sees it | not driven signed in — the route has no role logic |
| volunteer | `/friends/join` | page as a visitor sees it | not driven signed in — the route has no role logic |
| signed out | `/friends/join`, menu, footer, homepage tiles, `/friends`, `/donate` | all public | driven on dev: page renders; links present on all of them |

- [ ] Every role above tested — n/a: the page is public with no role logic, so signed out is the case that matters and was driven; the admin editor is the only role-specific surface and is in Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: nothing on the page is restricted; the only write (`updateSitePage`) is unchanged and still calls `assertAdminRole()`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the staff app's nav is untouched; the public Get involved dropdown was opened on dev at desktop width and lists Foster, Volunteer, Sponsor a resident, Shelter Friends, Become a Shelter Friend; on `/friends/join` Get involved is marked current; the footer's Get involved column has the link in English and Thai
- [x] Manual updated (`src/lib/manual/en.ts`): Settings → Website lists the page and explains its starter text; What the public sees describes the page and its contact card; the Shelter Friends topic's note says the page is always in the menu. Reading it at `/manual` needs sign-in — left for manual verification
- [x] Translatable strings go through the translation path: the row's title and body are `site_pages`, already queued fields (0059); `/friends/join` added to the queue action's revalidate list. The starter, the contact-card text and the prefilled message are dictionary text in both languages
- [x] Mobile viewport (375px) — `scrollWidth > innerWidth` is false at 375; heading and list wrap cleanly
- [x] Browser console clean — no errors after loading `/`, `/friends`, `/friends/join` (EN and TH) and `/donate`
- [ ] Network clean — n/a: no new requests; the page loads the same rows every site page does, and it rendered their data

## 6. Regression

- [x] The pages nearest the change still work: `/` (Shelter Friends band renders, both tiles go to `/friends/join`, no `#contact` left in the band), `/friends` (cards render, join line added), `/donate` (fetched: Meet our Shelter Friends and the new join link both present)
- [x] Shared file touched checked from a second page by loading it: the header and footer (and both dictionaries) loaded on `/friends` in English and `/friends/join` in Thai — menu, footer and Thai strings as intended
- [x] Nothing merged from `main` during `sync` was broken by this branch: the second sync brought #173 (`worker/index.mjs`, `wrangler.jsonc`, deploy scripts) and #174 (`/admin/status`, alerts) — no file this branch changed except `releases.ts`, which merged without conflict and keeps both lines; gates passed after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-27 (own page vs. section, Get involved, starter text, the contact card and LINE prefill, `SITE_PAGE_PATHS`)
- [x] `README.md` still accurate — it does not enumerate the public pages
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for the page, the homepage tiles, the menu entry and the editable starter text
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the `og:url` and the three contact links were read from the rendered dev page; the tel-link bug was seen in the rendered `href` before the fix and after it. The claim that LINE prefills only for Official Accounts is from LINE's documented `oaMessage` scheme and was not tested on a phone — it is item 3 below

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covered on both edges — n/a: no threshold, band or cutoff
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: apart from the gates block, pasted as printed, the evidence is values quoted inline from the browser
- [ ] Public pages re-checked after a cache purge — deferred: production release manager — every public page's header and footer changed, and `/friends/join` is new under the edge-cached `/friends` prefix

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** Not both, but it reads 0099: `/friends/join` loads the `shelter-friends-join` row. Without 0099 on production the page still renders the starter text (no row → starter), but the admin editor has no Become a Shelter Friend form. **0099 should be applied to production before this deploys** (the relocation release needs it too)
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] Production backup fresh — n/a: 0099 widens a check constraint and inserts two rows `on conflict do nothing`
- [x] Apply plan stated: `supabase/migrations/0099_site_pages_relocation_friends_join.sql`, production `dbkodyyxxhtygxcxmfcu`, via `node scripts/apply-migrations.mjs --env production`, before the deploy carrying this PR (if the relocation release has not already done so)

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` removes the page and puts the homepage tiles back on `#contact`. It does not touch 0099 and does not need to: the old code never reads the `shelter-friends-join` row

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The Call button's `tel:` link kept its spaces (`/s+/` instead of `/\s+/` after a patch lost the escape) | fixed — `9709007` |
| 2 | Low | On the Thai page the heading reads "Become a Shelter Friend" in English until the seeded title's Thai translation is approved in the queue | accepted — same as `/relocation`; the queue working as designed for every site page |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Website shows a Become a Shelter Friend form whose Text box is filled with the starter and carries the yellow note (reworded so it no longer mentions licences only); saving it makes the page show the saved text | `test.lannacare.org/admin/website` as an admin |
| 2 | The starter text, in English and Thai, says what the shelter wants to say to a business — the Director's rewording is expected, but nothing in it should be wrong | `/friends/join` |
| 3 | On a phone with LINE installed, the LINE button opens a chat with the shelter with the message already typed; Email opens a draft with subject and message; Call dials | `/friends/join` on a phone |
| 4 | The manual's Settings → Website, What the public sees and Shelter Friends topics read correctly | `/manual` signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items are outstanding; see the pending line below

Manual verification by: pending: the admin editor's starter prefill, the starter wording, the LINE/email/call buttons on a phone, and the manual topics (Left for manual verification 1–4)

### Result

- [x] Open defects are either fixed or explicitly accepted above — one fixed, one accepted
- [ ] Checklist pasted into the PR — n/a: the PR description summarises it and links `docs/test-plans/shelter-friend-signup-page.md`, which is in the PR itself
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
