# Feature test plan

## Header

| | |
|---|---|
| Feature | The Pet relocation page comes off the site; an International adoption page takes its place |
| Backlog item | `docs/backlog.md` → "Hide the Pet relocation page, and give International adoptions a page instead" |
| Branch / worktree | `claude/international-adoptions-page` @ `C:\Development\Animal_Shelter_international-adoptions-page` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-09-27 |
| Carries a migration? | no — its schema half, `0104`, merged in #180 and is applied to dev |
| Tested at SHA | `d3a8401` (the code; this plan follows it) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/relocation` is gone (308 to the new page), and `/adopt/international` shows the renamed `site_pages` row with English and Thai starter text and the sketch-C puppy over the globe in its pyjamas, linked under Adopt in the header and footer and from the `/adopt` listing; Services is hidden while empty. One instruction in the item is superseded by the brief: 0.8.0 shipped the relocation line, so it stays in the `0.8.0` entry and `unreleased` gains a "replaced" line instead of deleting it
- [x] Files/areas touched listed — `next.config.ts` (redirect); `src/app/adopt/international/page.tsx` (new), `src/app/relocation/` (deleted); `src/app/adopt/PublicHeader.tsx`, `PublicFooter.tsx`, `SitePageView.tsx`, `page.tsx`; `src/components/PuppyLoader.tsx` (`PuppyOverGlobe` in, `PuppyFlying` out), `src/app/globals.css`; `src/lib/site/pages.ts`, `src/lib/public-paths.ts`, `worker/index.mjs`; revalidation lists in `src/app/admin/website/actions.ts` and `src/app/management/translations/actions.ts`; both dictionaries; `src/lib/manual/en.ts`; `src/lib/releases.ts`; `docs/decisions.md`, `docs/backlog.md`
- [x] Roles affected identified — signed-out public (the page, menu, footer, redirect); admin (the page's editor on Settings → Website); management (the page's Thai in the translation queue). Staff, vet and volunteer see nothing different
- [x] Anything explicitly **out of scope** written down — the page's real wording (fees, timelines, countries, partners, licences), which only the shelter can give; the Thai *title* translation, which 0104 left pending in the queue and a manager approves; desexing drives, which is what brings Services back. `src/lib/assistant/intents/move.ts` matches the word "relocate" for moving residents between enclosures — checked and left alone

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: `Already up to date.` at `d3a8401`; run again after opening the PR, it brought in the `0105` vets-readonly schema PR (migration, script, docs) and merged cleanly as `ba04285`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — on `d3a8401` and again on the merged tree `ba04285`, which printed:

```
=== gates: build exited 0 after 72s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0104` was applied to dev by #180
- [ ] File is re-runnable — n/a: no migration in this PR
- [x] Existing rows still read correctly after the change (checked against real dev data) — `public_site_pages` on dev returns one row for `slug in (international-adoption, relocation)`: `international-adoption`, title "International adoption", body empty, translations null; the page therefore shows the starter, as intended
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR; `0104` must be on production before this code, which the release process already covers (it is on `main` ahead of this PR)

## 4. Functional checks

- [x] Happy path works end to end — `/adopt/international` renders the heading, the starter's six sections and the contact card, with the puppy beside the heading; `generateMetadata` gives title `International adoption · Lanna Care for Animals`, `og:url` `…/adopt/international` and the starter's first paragraph as description
- [x] Data persists — reload the page and the change is still there — reloaded `/adopt/international` and `/relocation` several times; same page each time
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the page has no create/delete; editing its text is the existing Settings → Website form, left for manual verification row 1
- [x] Empty state renders sensibly (no rows yet) — the dev row's body is empty, which is the empty state: the starter text shows instead of "coming soon"
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no new input; the editor's validation is unchanged
- [x] Boundary cases checked — Thai locale: the body, menu and `/adopt` line are Thai; the heading stays English because the row's title is "International adoption" and its Thai is pending in the queue (see §1, out of scope). `/relocation` as a signed-out request: `HTTP/1.1 308 Permanent Redirect`, `location: /adopt/international`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Settings → Website editor for the page | the International adoption editor, prefilled with the starter | not signed in as — manual verification row 1 |
| management | the page's Thai in Management → Translations | the title's Thai pending against "International adoption" | not signed in as — manual verification row 2 |
| staff | public page only | unchanged | not signed in as; no code path for staff changed |
| vet | public page only | unchanged | not signed in as; no code path for vets changed |
| volunteer | public page only | unchanged | not signed in as; no code path for volunteers changed |
| signed out | `/adopt/international`, `/relocation` | the page renders; the old address redirects | `200` for `/adopt/international` and `/adopt`; `308` → `/adopt/international` for `/relocation` (curl, no cookie) |

- [x] Every role above tested — signed out was driven, in the browser and by curl. The other roles were not signed in as: nothing role-gated changed except which slug the existing admin editor lists, which rows 1–2 of the manual table cover
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: a public page with no restricted surface; the admin editor's guard is unchanged

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: the staff app's menu is untouched. The public header was checked instead: desktop (1366 px) shows `Adopt ▾ · Get involved ▾ · Our work · About & contact`, Adopt opens to Meet our residents / International adoption with the latter `aria-current="page"`, no Services; the phone menu (375 px) shows Adopt laid open with both entries and no Services, in Thai; the footer's links are `/adopt /adopt/international /foster /volunteer /friends /friends/join /donate` with no Services heading
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Website "Pages" and starter-text steps and the public-pages topic now describe International adoption and the `/relocation` redirect; build passed with them. The `/manual` page itself was not opened — manual verification row 3
- [x] Translatable strings go through the translation path — the new strings are in both dictionaries (Thai rendered on the page and in the phone menu); the page's admin text goes through the existing site_pages queue, whose revalidation list now names `/adopt/international`
- [x] Mobile viewport (375px) — no overflow, controls reachable — the page and the open phone menu at 375 × 812, puppy stacked above the heading
- [x] Browser console clean — no errors or React warnings — `read_console_messages` (errors only) on `/adopt/international`: none
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/adopt/international` 200, `/adopt` 200, `/relocation` 308 to the new page

## 6. Regression

- [x] The pages nearest the change still work — `/adopt` (listing, and its line for adopters abroad now reads "รับเลี้ยงจากต่างประเทศใช่ไหม? ดูขั้นตอนการรับเลี้ยงจากต่างประเทศ →" in Thai, linking `/adopt/international`) and `/` both load
- [x] Any shared file touched checked from a second, unrelated page — `PublicHeader.tsx` / `PublicFooter.tsx` / the dictionaries via `/` and `/adopt` loading with the new Adopt group; `public-paths.ts` via `/adopt` loading signed out
- [x] Nothing merged from `main` during `sync` was broken by this branch — the second sync brought in only `0105` and its docs and script, none of which touches the public site; gates pass on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the Settings → Website tabs and Desexing drives items were reworded on the `backlog` branch (they assumed a Pet relocation page)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — the release-note reversal, the config redirect, the route, Adopt as a group, Services hidden not removed, the illustration and `PuppyFlying`'s deletion
- [x] `README.md` still accurate — it does not mention relocation or the public menu's entries
- [x] **Release notes.** A visitor and an admin will both notice: `unreleased` gained a line saying the Pet relocation page was replaced by International adoption, where it is, and that old links land on it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the redirect's status and signed-out behaviour from curl; "redirects run before proxy" from `node_modules/next/dist/docs/…/redirects.md` and the behaviour observed signed out; "nothing else used `PuppyFlying`" from a repo-wide search before deleting it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates lines and the curl status line are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR; the code reads `0104`'s slug, and `0104` reaches production with the release before this code does
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — `npx wrangler rollback --env production` brings back the relocation page's code, but not its row: `0104` renamed it. A rolled-back `/relocation` still renders — with no row, `SitePageView` falls back to the relocation starter text — but its Settings → Website editor has nothing to save into. That is 0.8.0's state on production anyway once `0104` is applied, so rollback costs nothing beyond losing this PR; reversing `0104` is not needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The very first `/relocation` load in the browser pane, while `next dev` was still compiling, reached `/adopt/international` and then showed `/`. Not reproduced on three later loads, nor by curl; most likely the dev server's first-compile reload | accepted — dev-only, not reproduced; worth a glance on `test.lannacare.org` (manual verification row 4) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Settings → Website lists International adoption (not Pet relocation), its box is prefilled with the English starter and the note says so, and "View on site" opens `/adopt/international` | `/admin/website`, as an admin |
| 2 | Management → Translations has the page's Thai title pending against "International adoption"; approving it turns the page's Thai heading Thai | `/management/translations`, as a manager, then `/adopt/international` in ไทย |
| 3 | The manual's Website and public-pages steps read right | `/manual` |
| 4 | An old `/relocation` link lands on International adoption and stays there | `test.lannacare.org/relocation` after the next test deploy |
| 5 | The wording of the starter text, English and Thai, is something the shelter is happy to show until it writes its own | `/adopt/international` in both languages |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: the Website editor and translation queue for the new page, the manual wording, the old link on the test site, and the starter text's wording

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: the one defect is accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — pasted when the PR is opened from this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over when a release is cut

Result: pass with accepted defects

Release manager acknowledgement: pending
