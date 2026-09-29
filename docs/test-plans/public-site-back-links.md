# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Public site: Home in the phone menu and footer, a breadcrumb under the header, and a history-aware "back to the list" on resident and project pages |
| Backlog item | `docs/backlog.md` → Public site: make the way back obvious |
| Branch / worktree | `claude/public-site-back-links` @ `C:\Development\Animal_Shelter_public-site-back-links` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude (public-site-back-links session), 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | the PR's head commit; the page checks in §4 ran at `16dbb61` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the phone menu and footer gain Home, sub pages gain a Breadcrumb `nav` with `BreadcrumbList` data, and `/adopt/[id]` and `/our-work/[id]` get a back link that returns through history when the visitor came from the list
- [x] Files/areas touched listed: `src/app/adopt/{PublicHeader,PublicNav,PublicFooter,BackLink,SitePageView}.tsx`, `src/app/adopt/page.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/our-work/{page,[id]/page}.tsx`, `src/app/friends/page.tsx`, `src/app/privacy/page.tsx`, i18n dictionaries, `releases.ts`, docs
- [x] Roles affected identified: signed-out public visitors; the staff app is untouched
- [x] Out of scope written down: a Home entry in the desktop menu and a phone breadcrumb (both left to Lutan, built conservatively as off), `/e/[id]` and `/r/[code]` get no trail

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the PR
- [x] `node scripts/gates.mjs` closing line: `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: curl of `/foster`, `/adopt`, `/our-work`, `/privacy` on :3007 returns 200 with a `nav aria-label="Breadcrumb"` reading Home › … and one `BreadcrumbList` JSON-LD block (Foster: Home, then "Foster with us" as the current page)
- [ ] Data persists — n/a: nothing is written
- [ ] Create / edit / delete all exercised — n/a: no data is created, edited or deleted
- [ ] Empty state renders sensibly — n/a: no list or empty state added
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no fields or dates; the back-link decision was reasoned, not driven, and is listed under manual verification
- [ ] The back link restores filters and scroll from the list, and links to the list from a shared link — n/a: not driven, the browser pane refused localhost; listed under manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | public pages, nothing role-specific | n/a |
| management | n/a | as above | n/a |
| staff | n/a | as above | n/a |
| vet | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | the public pages above | 200 with the trail | 200 via curl with no cookies |

- [x] Every role above tested: the change shows nothing role-dependent; signed-out was requested with no cookies
- [ ] A role that should not have access is blocked server-side — n/a: no new route or data

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added to the desktop menu (decision left to Lutan); the phone menu Home is under manual verification
- [ ] Manual updated — n/a: the staff manual does not describe the public site's navigation
- [x] Translatable strings go through the dictionaries: `publicNav.home`, `publicNav.breadcrumb`, `profile.allAnimals`, `ourWork.backToAll` in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: not checked by Claude, listed under manual verification
- [ ] Browser console clean — n/a: no browser session was driven (the browser pane refused localhost)
- [ ] Network clean — n/a: the only requests were curl GETs, all 200

## 6. Regression

- [x] The pages nearest the change still work: `/adopt`, `/our-work`, `/foster`, `/privacy` render (curl, 200)
- [x] Shared files touched (`PublicHeader`, dictionaries) checked from a second page: every public page renders the header
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-29
- [ ] `README.md` still accurate — n/a: README does not describe public navigation
- [x] **Release notes.** A shelter user would notice this: `unreleased` in `src/lib/releases.ts` gained a line in this PR
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the trail and JSON-LD are from the curl output; the history-back behaviour is reasoned, not driven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold or banding
- [ ] Evidence pasted is the tool's actual output — n/a: the gates line in §2 is pasted as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager (every public page's header changed)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR, or `wrangler rollback`; no schema or data changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The back link uses history only when the previous public page in this tab was the list; list → resident → another resident → back gets the plain link, losing scroll | accepted: fails safe and is rare |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | List → filter → scroll → open a resident → "All dogs and cats" returns with filter and scroll kept; opening the resident from a pasted link goes to the list and stays on the site | dev, `/adopt`, `/our-work` |
| 2 | Phone menu starts with Home and taps well at 375px; footer Home link | dev, phone width |
| 3 | The breadcrumb does not fight the redesign mockups; decide the desktop Home entry and the phone breadcrumb (see decisions.md) | dev, `/foster`, `/adopt/[id]` |
| 4 | Thai wording: หน้าแรก, สุนัขและแมวทั้งหมด, ผลงานทั้งหมด | dev, Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (public-site-back-links session)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see the pending signature below

Manual verification by: pending: a person to run the four rows above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — not merged

Result: pass with accepted defects

Release manager acknowledgement: pending
