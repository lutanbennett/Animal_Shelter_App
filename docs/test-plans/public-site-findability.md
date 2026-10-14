# Feature test plan

## Header

| | |
|---|---|
| Feature | Public site findability: `AnimalShelter` JSON-LD on the home page, a default share picture on every public page, share tags on Our work, a home page title with a descriptor, and `/sitemap.xml` named in robots.txt |
| Backlog item | `docs/backlog.md` → **Say what the site is: an `AnimalShelter` schema on the home page, a default share picture, and share tags on Our work**, **Home page title with a descriptor**, **A sitemap** (ticked here); **Give the Thai site its own addresses** left open with a status note |
| Branch / worktree | `claude/public-site-findability` @ `C:\Development\Animal_Shelter_public-site-findability` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened after this commit; number recorded in the follow-up commit |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `882e967f` (after sync with `origin/main`, already up to date) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the public site now tells search engines and link previewers what it is — a schema block, a picture for every share, tags on Our work, a descriptive home title and a sitemap — with every absolute address built from `getSiteOrigin()`
- [x] Files/areas touched listed: `src/lib/site/share.ts` (new), `src/app/sitemap.ts` (new), `src/app/robots.ts`, `src/lib/public-paths.ts` (+ its test), `src/app/page.tsx`, `src/app/our-work/page.tsx`, `src/app/our-work/[id]/page.tsx`, `src/app/adopt/page.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/adopt/SitePageView.tsx` (donate, foster, volunteer, international, friends/join), `src/app/friends/page.tsx`, `src/app/privacy/page.tsx`, both dictionaries (`home.metaTitle`, `adopt.pageTitle`), `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-14-public-site-findability.md`
- [x] Roles affected identified: signed-out public only — metadata and two routes. Signed-in roles see the same public pages with the same tags; no staff page changes. No permission, table or RLS change
- [x] Out of scope written down: the Thai addresses item (L, Lutan's decision on the shape, after the cutover); the canonical tag and `hreflang` (Search Console item, go-live); `updated_at` on the public views for an animal's `lastmod` (a migration); the §5.2 rewrite of the adoption list's heading beyond sentence case; an `/opengraph-image` route (decision file says why the plain logo instead)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the script's own lines, output redirected to a file:

```
=== gates: typecheck exited 0 after 14s
=== gates: lint exited 0 after 62s
=== gates: test exited 0 after 2s
=== gates: build exited 0 after 218s
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

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

All driven with `curl` against the dev server on port 3004, signed out and with no cookie (which is what a crawler and a link previewer send), reading the rendered `<head>` and body.

- [x] Happy path works end to end: `/` renders `<title>Lanna Care for Animals — dog and cat rescue, Mae Wang, Chiang Mai</title>`, `og:title`, `og:description` (the tagline), `og:url`, `og:image` = the hero through `/api/photos/…?w=1200` with `og:image:alt`, `twitter:card summary_large_image`, and one `application/ld+json` block of `@type AnimalShelter` with `name`, `description`, `url`, `logo`, `image` (logo + hero), `address`, `telephone`, `email`, `openingHours` (two lines as typed in Settings → Website) and `sameAs` (the Facebook page); `/our-work` now has the full `og:*` and `twitter:*` set it had none of; `/adopt`, `/foster`, `/donate` carry the hero as `og:image`; with cookie `locale=th`, `/` renders the Thai title and `og:locale th_TH`; `/robots.txt` reads `Allow: /` and `Sitemap: http://localhost:3004/sitemap.xml`; `/sitemap.xml` is a valid urlset of 13 entries — the 10 static pages, the 2 public animals and the 1 published story (with `<lastmod>2026-09-22</lastmod>`)
- [x] Data persists — reload the page and the change is still there: nothing is written; every value is read fresh per request from `site_content` and the public views (second fetches identical)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only metadata and routes, nothing to create or edit
- [x] Empty state renders sensibly (no rows yet): an animal with no photo (Markey, `e07ad9e2…`) shares with the hero rather than no picture; the code path with no hero set returns `/lca-logo.jpg` as a `summary` card (`defaultShareImage()`), and blank Settings → Website fields are omitted from the JSON-LD rather than sent empty; a locked site returns an empty sitemap and a robots.txt with no `Sitemap:` line (read in code — the dev server is unlocked; see Left for manual verification)
- [x] Invalid input is rejected with a readable message, not a crash: no input; `"<"` in any admin text is escaped to `\u003c` inside the JSON-LD block so a typed `</script>` cannot end it (same rule as the breadcrumb)
- [x] Boundary cases checked: both pictures fetched signed out — `/lca-logo.jpg` 200 `image/jpeg`, the hero `/api/photos/1nxKl…?w=1200` 200 `image/jpeg`; a story with a cover keeps its own picture; Friends keeps a Friend's logo and the `summary` card; a page whose body is long still cuts the description as before (`/foster` ends with `…`)

### Role access matrix

Nothing here is gated by role: every touched page was already public, and the two routes are new public paths.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the same public pages, `/sitemap.xml` | same tags as a visitor; no admin page changed | n/a: no role-specific surface |
| management | same | same | n/a: no role-specific surface |
| staff | same | same | n/a: retired role (`0173`) |
| doctor | same | same | n/a: no role-specific surface |
| volunteer | same | same | n/a: no role-specific surface |
| signed out | `/`, `/adopt`, `/adopt/[id]`, `/our-work`, `/our-work/[id]`, `/foster`, `/donate`, `/robots.txt`, `/sitemap.xml`, `/lca-logo.jpg`, the hero photo | 200 with the tags above | pass — all fetched with no cookie |

- [ ] Every role above tested — n/a: no role-specific surface; the signed-out row is the one that matters and was driven
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `/sitemap.xml` was itself blocked by the session gate (redirected to `/login?next=%2Fsitemap.xml`) until added to the public paths — which is the gate working; `src/lib/public-paths.test.mjs` (6 tests, extended to the new path in both states) passes

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a staff member operates; the inputs are the existing Settings → Website fields, already documented
- [x] Translatable strings go through the translation path: the two new strings (`home.metaTitle`, the sentence-case `adopt.pageTitle`) are in both dictionaries; the Thai title was read from the rendered page with the `locale=th` cookie. `/management/translations` is for database text, which this change does not add
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no visible layout change; the JSON-LD `<script>` renders nothing
- [x] Browser console clean — no errors or React warnings on `/` (read via the browser pane's console, errors only: none)
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: every `curl` above answered 200; the only redirect seen was the sitemap's, fixed in the second commit

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `/`, `/adopt`, `/adopt/e07ad9e2…` (Markey), `/our-work`, `/our-work/0be6e079…`, `/foster`, `/donate`, `/robots.txt` — all 200 with their existing content and breadcrumb JSON-LD intact
- [x] Any shared file touched checked from a second, unrelated page by loading it: `src/lib/public-paths.ts` is read by the proxy on every request — `/adopt` and `/login`-gated behaviour unchanged (an unknown path still redirects, as the first sitemap fetch showed); `src/app/adopt/SitePageView.tsx`'s shared metadata checked on `/foster` and `/donate`; both dictionaries load (typecheck and every page above)
- [x] Nothing merged from `main` during `sync` was broken by this branch: sync brought nothing in ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**: the three built items ticked with what closed them; the Thai addresses item carries a STATUS note; the Search Console item carries a note that its "is a sitemap wanted" question is answered and its three complaints remain go-live work
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-14-public-site-findability.md` — where the configured host lives (nowhere new: `getSiteOrigin()`), the default picture and why no `/opengraph-image` route, no `lastmod` for animals, `/sitemap.xml` public in both states
- [x] `README.md` still accurate: it does not describe the public pages' metadata or robots.txt, so nothing to change
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained one line in this PR, written for a shelter user: the new home page title, the share picture a link now carries, Our work previewing properly, and the "Meet our residents" heading. The schema block and the sitemap are invisible and are not described as features in it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision file were measured, not reasoned.** The anonymous reachability of both pictures, the sitemap's redirect before the fix, the rendered tags in both languages and the 13 sitemap entries were all read from `curl` output; the absence of `updated_at` on both public views was read from PostgREST's own `42703` error, not assumed from the migration files

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (on a locked host the visible result is an empty `/sitemap.xml` and a robots.txt with no `Sitemap:` line; the share tags are present but no external previewer can fetch them until go-live)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic; a story's `lastmod` is the stored `sort_date` string passed through
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or boundary in this change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The `gates:` lines above are as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [x] Any new secret/env var exists in the production Cloudflare environment: none added; `NEXT_PUBLIC_SITE_URL` stays optional and unset, as before

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**: code only — `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, `npx wrangler rollback --env production` for the Worker fallback. No schema, no data, no setting changed, so nothing is left behind by a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | `/sitemap.xml` was redirected to `/login` by the session gate on first fetch | fixed — added to `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS` (commit `c3c3d602`), test extended |
| 2 | low | An animal's sitemap entry has no `lastmod`: neither public view exposes `updated_at` | accepted — a migration this stream may not carry; noted in the backlog tick and the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On a locked host, `/sitemap.xml` answers an empty urlset and `/robots.txt` has no `Sitemap:` line (the dev server is unlocked, so this branch of the code was read, not run) | `test.lannacare.org/sitemap.xml` and `/robots.txt` after the next test deploy |
| 2 | A share preview in Facebook's or LINE's own tool shows the hero and the new title | n/a until go-live: the site is locked to signed-out visitors, so no external previewer can fetch a page; re-check at go-live with the Search Console item |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items await a person and are named on the pending line below; nobody has looked yet

Manual verification by: pending: the locked-host sitemap and robots.txt on test.lannacare.org after the next test deploy; the external share preview at go-live

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened, in the follow-up commit that records the PR number
- [ ] Handed to the production release manager — n/a: happens at the next release cut, not at PR time

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
