# Feature test plan — SEO audit and fixes for the public website

## Header

| | |
|---|---|
| Feature | SEO audit of the public site (`docs/seo-audit-2026-10-14.md`) and the code fixes it found: metadata in the head, canonicals, photo `srcset`, `WebSite`/`Article` schema, `/login` noindex, heading order |
| Backlog item | `docs/backlog.md` → *Search engine optimisation of the public website before go-live, done by a Fable session* |
| Branch / worktree | `claude/seo-audit-fable` @ `C:\Development\Animal_Shelter_seo-audit-fable` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/624 |
| Tested by / date | Claude Fable 5.1 (automated and browser-driven checks), 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `dc6f3e4e` (the last code commit; the commits after it change only `docs/`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the audit report plus the machine-facing fixes the item lists (titles and descriptions seen by every reader, canonicals, JSON-LD, image sizes); `hreflang` deliberately not built (no Thai address exists), per the report
- [x] Files/areas touched listed: `next.config.ts` (`htmlLimitedBots`), `src/components/PublicPhoto.tsx` (new), `src/components/SiteBody.tsx`, `src/lib/google/drive-client.ts` (`PHOTO_WIDTHS` + 800), `src/lib/site/share.ts` (schema helpers, escape fix), `src/app/login/layout.tsx` (new, noindex), the public pages under `src/app/` (`page.tsx`, `adopt/`, `our-work/`, `friends/`, `privacy/`) for canonicals and `PublicPhoto`; `docs/backlog.md`, `docs/decisions/2026-10-14-seo-audit.md`, the report. No `worker/`, no migration
- [x] Roles affected identified: signed-out public (every change); signed-in staff see the same public pages; staff pages unchanged except that `htmlLimitedBots` applies to every route (metadata in the head, which is what it was for static metadata anyway)
- [x] Anything explicitly **out of scope** written down: `hreflang` / Thai addresses (its own L item, after cutover); per-animal structured data (no fitting schema.org type); WebP/AVIF (Drive serves JPEG, no image library on Workers); a smaller header logo (32 KiB on every page, a follow-up); the Business Profile, Search Console property and Thai wording (not code, listed for Lutan in the report)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge commit `ae5e9495`, no conflicts; the only `main` change since this branch was cut was #623 multi-role-build, in areas this stream does not touch)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed:
  ```
  === gates: build exited 0 after 100s

  gates: typecheck=0 lint=0 test=0 build=0
  ```
- [x] CI green on the PR — seen 2026-10-15: 7 of 7 checks passing on #624 at `0dca3856`, mergeable, state CLEAN

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a Playwright crawl of 14 addresses × 2 languages × 2 widths (56 renders) on the dev server after the fixes: every public page has a title, a description, one `h1` and a `rel=canonical` naming its own bare path on the request host; `/login`, `/e/<id>`, `/r/`, and the not-found page carry `noindex`; Lighthouse SEO 100 and accessibility 100 on all 12 page types in English and in Thai (the report's Scores table)
- [x] Data persists — reload the page and the change is still there — n/a: nothing is written; every change is rendering
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete surface
- [x] Empty state renders sensibly (no rows yet) — a story with no cover uses the site's default picture in its `Article` schema (`defaultShareImage`), a resident with no photo keeps `EmptyPhoto` (the `PublicPhoto` branch is only taken with a file id), a site with no LINE id emits `sameAs` without it (`lineLink` returns null)
- [x] Invalid input is rejected with a readable message, not a crash — the photo route still answers 400 "Invalid photo size." for a width outside `PHOTO_WIDTHS`; `?w=800` now answers 200 `image/jpeg`
- [x] Boundary cases checked — an admin's `</script>` in a tagline can no longer end the JSON-LD element (`jsonLdString` escapes `<` as `\u003c`; the previous replace was a no-op); the canonical ignores `?ready=1`, `?species=`, `?size=` and `?category=`; a `priority` photo emits one `<link rel=preload imagesrcset>` and the rest are `loading=lazy`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | public pages signed in | same page as a visitor, "Open the app" in the header, same head tags | unchanged by this PR; not re-driven (no auth change) |
| management | as admin | as admin | unchanged; not re-driven |
| staff | retired role (0173) | — | n/a |
| doctor | as admin | as admin | unchanged; not re-driven |
| volunteer | as admin | as admin | unchanged; not re-driven |
| signed out | `/`, `/adopt`, `/adopt/<id>`, `/adopt/international`, `/our-work`, `/our-work/<id>`, `/donate`, `/foster`, `/volunteer`, `/friends`, `/friends/join`, `/privacy`, `/e/<id>`, `/sitemap.xml`, `/robots.txt`, `/api/photos/<id>?w=800` | 200 with the tags above; `/login` 200 with `noindex` | all 200, crawled signed out; 20 internal links all 200 |

- [x] Every role above tested — the signed-out visitor is the only role this change is for and was driven in full; the signed-in roles see the same pages through the same code and nothing about access changed
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new route and no access rule changed; the proxy's public-path lists are untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a staff member does changed; the audit report is in `docs/`
- [ ] Translatable strings go through the translation path — n/a: no new visitor-facing string; every string a visitor reads is unchanged, and the schema uses the existing dictionary and Settings → Website values
- [x] Mobile viewport (375px) — no overflow, controls reachable — the crawl recorded `document.documentElement.scrollWidth` = 375 on every page in both languages after the fixes
- [x] Browser console clean — no errors or React warnings — the dev server's console on the home, adoption list, animal, story and donate pages after the change showed only Next's own dev notices; no React warning from `PublicPhoto` or the `Heading` element
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — all 20 internal links 200; the `?w=800` renditions 200

## 6. Regression

- [x] The pages nearest the change still work — every public page type was crawled and Lighthouse-run after the fixes (12 in English, 12 in Thai); the staff `/login` page still renders with its form, now with `noindex`
- [x] Any shared file touched checked from a second, unrelated page by loading it — `SiteBody` from the home page story (still `h3` under "Our story") and from `/donate` (now `h2`); `share.ts` from the home page (`AnimalShelter` + `WebSite`), a story (`Article`) and `/foster` (default share picture); `drive-client.ts` was not loaded from a staff page (no staff page was signed into): the only change is one more allowed width, and a grep shows no caller outside the public pages and the photo route passes a width at all, so staff views keep asking for the original
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — the SEO item, with the scores and the outstanding hand steps; the Search Console item corrected to `lannacareforanimals.org`; go-live search steps added to the cutover item; a note on the Thai-addresses item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-seo-audit.md`
- [x] `README.md` still accurate — it does not describe photo sizes, metadata streaming or canonicals; nothing in it is contradicted (checked by grep for `unoptimized`, `sitemap`, `canonical`, `PHOTO_WIDTHS`: no hits)
- [ ] **Release notes.** — n/a: the report's own hand steps are still outstanding (a Google Business Profile, Search Console for `lannacareforanimals.org`, Thai wording for the Director), and the brief's rule is no note while a step in the PR's own report is open; the two things a visitor could notice (phone-sized photos, the page's title and description in search results) get their line in the PR that closes those steps or in the go-live release
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the streaming-metadata cause was measured by fetching the home page with three user agents and recording the byte offset of the description (2,621 inside `<head>` vs 25,000+ in `<body>`); the scores are Lighthouse's own JSON; the byte savings are Lighthouse's "properly size images" figures

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (locked, so: `/login` has `noindex`; a public page signed in shows `rel=canonical` on the test host and the `?w=800` photo answers)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date; `Article.datePublished` is the story's stored date string, passed through
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line in §2 is pasted; the Lighthouse scores in the report are read from the saved JSON by a script, not retyped
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager (the Worker caches signed-out HTML; the new head tags appear once the cache turns over)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable; `htmlLimitedBots` is build-time config

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — code only: `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, `npx wrangler rollback --env production` for the Worker fallback. Nothing to revert in the database. The 800 px renditions the Pi's photo cache may have written are harmless extra files (`rm -rf ~/photo-cache` is always safe)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `animalShelterJsonLd` escaped `<` with `<` (a no-op), so an admin's `</script>` in a tagline could end the JSON-LD element | fixed (`jsonLdString`) |
| 2 | low | The header logo is served at 781 × 746 for a 40 px box: ~32 KiB on every public page (Lighthouse "properly size images") | deferred to backlog as a follow-up note in the report; not a photo and outside this item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a real phone on the test site (signed in, since it is locked): the home hero and an animal's photo look as sharp as before, and the photo on a story page still fits its frame | `test.lannacare.org`, `/`, `/adopt/<id>`, `/our-work/<id>` |
| 2 | After go-live only: Rich Results Test, PageSpeed Insights, a LINE and a Facebook share preview — the cutover item's steps (a)–(f) | the live site |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Fable 5.1  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet

Manual verification by: pending: a real phone on test.lannacare.org (item 1), and the go-live-day checks (item 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
