# Feature test plan — cooperjaidee-product-page

## Header

| | |
|---|---|
| Feature | The CooperJaidee product page rebuilt as a product introduction (#cjlnd), and the product host's own search switch, robots.txt, sitemap and metadata (#cjseo) |
| Backlog item | `docs/backlog.md` → #cjlnd (ticked) and #cjseo (`PROOF OWED:`, Lutan sets the switch) |
| Branch / worktree | `claude/cooperjaidee-product-page` @ `C:\Development\Animal_Shelter_cooperjaidee-product-page` |
| Dev server | `PLATFORM_HOST=localhost next dev --port 3001` |
| PR | pending: number known once the PR is open |
| Tested by / date | Claude / 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] One sentence: the platform front page becomes a product introduction page, and the platform host gets its own search switch (`PLATFORM_SEARCH`, closed by default) instead of borrowing the shelter's lock
- [x] Files: `src/app/platform/about/`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/lib/public-site.ts`, `src/lib/platform-seo.ts`, `src/lib/platform-search.ts`, `src/lib/site-hosts.ts`, `src/lib/public-paths.ts`, `src/lib/supabase/proxy.ts`, both dictionaries
- [x] Cards affected: none; no card gates the page (a plain public page) and nothing was added. Admin unaffected; the signed-out public sees the page as before
- [x] Out of scope: opening the host to search engines, Cloudflare, Search Console, real screenshots (all rejected, see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing lines, as printed by my run:

```
GATES_HERE
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, no table read
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: on the platform host (dev mapped with `PLATFORM_HOST`) `/platform/about` and `/th/platform/about` return 200 with the right title, canonical and hreflang; `/robots.txt` disallows everything and `/sitemap.xml` answers (empty while closed)
- [ ] Data persists — n/a: static page, nothing is saved
- [ ] Create / edit / delete — n/a: static page, no action
- [ ] Empty state — n/a: reads no table
- [ ] Invalid input — n/a: the page takes no input
- [x] Boundary cases: `src/lib/platform-seo.test.mjs` covers the switch unset, empty, a typo and `OPEN` (all closed), `open` (open), both directions of the host decoupling, and both languages in the sitemap

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| signed out, platform host | `/platform/about`, `/th/platform/about`, `/robots.txt`, `/sitemap.xml` | 200 on each, `noindex` while closed | as expected |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side — n/a: the page is public by design, and no gated page was touched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav entry added
- [ ] Manual updated — n/a: the product page is not part of the shelter user manual
- [x] Translatable strings: every new string is in both `en.ts` and `th.ts`; the Thai page was loaded and its h1 and title are Thai
- [x] Mobile viewport (375px): hero, call to action and picture fit with no sideways scroll
- [ ] Browser console clean — pending: the browser console was not read in this run
- [ ] Network clean — n/a: static page, the only requests are the document and its own assets

## 6. Regression

- [ ] The pages nearest the change still work — pending: a shelter-host `/robots.txt` and a public page were not loaded in this run; the unit tests prove the shelter-host branch is unchanged
- [ ] Shared file touched checked from a second, unrelated page — pending: `proxy.ts` and `public-paths.ts` changed; a signed-in page was not loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch (the gates ran after the merge)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (#cjlnd ticked; #cjseo marked `PROOF OWED:`)
- [x] Decision file `docs/decisions/2026-11-22-cooperjaidee-product-page.md`
- [x] `README.md` still accurate (it does not mention the product page)
- [x] Release notes: `unreleased` gained one line for the redesigned product page
- [x] Commit messages say why, not just what
- [x] Claims were measured: the closed and open behaviour of robots, sitemap and the header were run, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on the deployed build — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: nothing here derives a date
- [ ] Boundary or banding change — n/a: no banding
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is the only pasted evidence and is unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] Production project ref read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] New env var exists in production — n/a: `PLATFORM_SEARCH` is deliberately not set anywhere; unset means closed, and Lutan sets it when ready

### Migration ordering

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/th/platform/about` redirected to sign-in because it was not a public page | fixed: `thPathRest` and `PLATFORM_KEEPS` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan looks at the design (mockups stand in for screenshots) and reads the Thai wording | `/platform/about` on the platform host after the next deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan to look at the page

Manual verification by: pending: Lutan to look at the page and read the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted once the PR is open
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: n/a: not yet released
