# Feature test plan — website-page-visibility-app

## Header

| | |
|---|---|
| Feature | Show or hide public website pages: one hidden check in the page list, Not found for visitors, staff banner, Admin → Website switches, Desexing sign-up refusal (parts 3–6) |
| Backlog item | `docs/backlog.md` → **Show or hide public website pages** (ticked; one follow-up named in it) |
| Branch / worktree | `claude/website-page-visibility-app` @ `C:\Development\Animal_Shelter_website-page-visibility-app` |
| Dev server | `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no — `0256` already holds the record |
| Tested at SHA | `ff616190` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a page or a whole menu section can be switched off from Admin → Website, and every place that links to it, lists it or serves it honours that
- [x] Files/areas touched listed — `src/lib/public-pages.ts`, `src/lib/public-page-access.ts` (new), `src/lib/site/content.ts`, `src/app/adopt/` (header, nav, footer, the page view and four pages), `src/app/page.tsx`, `src/app/sitemap.ts`, `src/app/appeals/`, `src/app/friends/`, `src/app/our-work/`, `src/app/services/desexing/`, `src/app/admin/website/`, both dictionaries, manual, releases, acceptance rows
- [x] Roles affected identified — signed-out public (pages hidden), admin / management (switches; see a hidden page with the banner), volunteer (sees Not found like the public)
- [x] Anything explicitly **out of scope** written down — a true HTTP 404 (the page streams as 200 with `noindex`, see the decision file), purge on save (no purge token in the running app), `site_content` in `AUDITED_TABLES` (owned by `cards-grants-app`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 46s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0256` landed earlier
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; `0256` is already applied to dev and production
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no migration; `scripts/check-hidden-public-pages-schema.mjs` proved 0256's constraint when it landed
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — on dev: Hide on Desexing drives from Admin → Website → Pages, then signed out: the Services menu, the home page's links, the footer link and the sitemap entry are gone
- [x] Data persists — the switch survives the page re-render and the public pages read it from the database on the next request
- [x] Create / edit / delete all exercised — Hide and Show exercised for a page (Desexing, Foster) and for a section (Services); there is no create or delete in this feature
- [x] Empty state renders sensibly — nothing hidden is the default; every public page rendered normally before the first switch
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the switches take no typed input; the action refuses an unknown entry with a plain message and the database refuses Home, Privacy and typos (0256)
- [x] Boundary cases checked — a section hidden with its pages shown (pages read "Hidden by its section"), un-hiding the section brings back the pages not hidden on their own, Home and Privacy have no switch, and a hidden Donate page also removes the Donate button

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Admin → Website → Pages; a hidden page's address | the switches work; a hidden page opens with the banner "This page is hidden from the public" | pass (driven on dev) |
| management | the same (holds `website.content`) | the same | n/a: not driven separately; the guard is `can(perms, "website.content")` for both |
| staff | retired role | n/a | n/a: retired by 0173 |
| doctor | a hidden page's address | Not found | n/a: not driven; same branch as volunteer (no `website.content`) |
| volunteer | `/foster` while Foster was hidden | "404 This page could not be found.", no banner | pass (driven on dev, dev-signin-volunteer) |
| signed out | hidden page, sitemap, home, header, footer | links and sitemap entries gone; the address returns the Not found page with `noindex` and none of the page's content | pass (driven with curl and fetch without cookies; the Not found screen itself was seen as the Volunteer) |

- [x] Every role above tested — admin and volunteer in the browser, signed out with curl; management and doctor share a branch with those and are `n/a` above with reasons
- [x] A role that should not have access is blocked server-side — the volunteer reached `/foster` directly by address and got Not found; the Desexing sign-up action was submitted by an editor while the page was hidden and refused with "Sign-ups are not open right now."

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no app navigation entry added; the switches live inside the existing Website page's Pages tab
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic "Website: hiding a page"; acceptance-matrix rows added so `npm run lint` passes
- [x] Translatable strings go through the translation path — all new words are in both dictionaries (`publicNav.hiddenBanner`, `desexing.errors.pageHidden`, `admin.website.visibility`)
- [ ] Mobile viewport (375px) — n/a: not driven; listed under Left for manual verification below
- [x] Browser console clean — no errors during the drive; only the dev server's existing font-preload warnings
- [x] Network clean — one failed action seen once, from a lapsed dev sign-in (the proxy redirected the POST to `/login`), not from the feature; repeated after signing in again without error

## 6. Regression

- [x] The pages nearest the change still work — home, Adopt (header and footer), Foster, Desexing drives and the sitemap, loaded signed out and as admin
- [x] Any shared file touched checked from a second, unrelated page — `PublicHeader`, `PublicFooter` and `public-pages.ts` are shared by every public page; the home page, `/adopt` and `/services/desexing` were loaded in each state
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged: already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-25-hiding-public-pages.md`
- [x] `README.md` still accurate — the README does not describe the public menu or the website settings
- [x] **Release notes.** One line added to `unreleased` for admins and management, mentioning the ten-minute delay; this PR records no outstanding manual step
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 200-with-`noindex` behaviour of a hidden address and the absence of the page's content were measured with curl on dev; the "no purge token in the app" claim was read from `scripts/purge-cache.mjs` and `docs/decisions/2026-10-18-purge-from-the-deploy-machine.md`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no thresholds; the page-or-section rule was driven both ways (page alone, section alone)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted output is the gates block above
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager (the edge cache is why a switch takes up to ten minutes; it is said beside the switch)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration; the code reads `0256`, already live on production
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi reverts the app; nothing was added to the database, and a hidden list left behind is harmless to the older build, which does not read it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A hidden page's address answers HTTP 200 with `noindex`, not 404, because the root loading boundary streams first; its title and share tags remain in the head | accepted — same as every existing Not found under the root; recorded in the decision file |
| 2 | low | A switch is written to `audit_log` but is not listed on Recent changes, because `site_content` is not in `AUDITED_TABLES` | deferred to backlog — the cards-grants stream owns that file; named in the backlog item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Pages on the website panel at phone width, and its Thai wording | Settings → Website → Pages, on the Director's phone, in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item (phone width and Thai wording) is still with a person, recorded as pending on the signature below

Manual verification by: pending: the phone-width and Thai look at the new panel

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed with the PR and linked from it
- [ ] Handed to the production release manager — n/a: handed over by the PR

Result: pass with accepted defects

Release manager acknowledgement: n/a: given at release time
