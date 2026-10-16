# Feature test plan

## Header

| | |
|---|---|
| Feature | Appeals, the public pages: `/appeals`, `/appeals/[id]` and the links to them |
| Backlog item | `docs/backlog.md` → Sponsorship drives for sick residents, part (2). Not ticked: the staff side is still to come |
| Branch / worktree | `claude/appeals-public-pages` @ `C:\Development\Animal_Shelter_appeals-public-pages` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: the number is known once the PR is open |
| Tested by / date | Claude, 2026-10-16 |
| Carries a migration? | no (`0210` merged earlier in #667) |
| Tested at SHA | 6c75b3ea |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the public half of Sponsorship drives, a list page and a detail page with honest progress numbers, how to give, share tags, and links from the header, home page and resident page
- [x] Files/areas touched listed: `src/app/appeals/**` (new), `src/lib/appeals/**` (new), `src/app/page.tsx`, `src/app/adopt/PublicHeader.tsx`, `src/app/adopt/[id]/page.tsx`, `src/app/sitemap.ts`, `src/lib/public-paths.ts` (+ its test and `scripts/check-public-paths.mjs`), both dictionaries, `docs/`
- [x] Roles affected identified: signed-out public (the audience); staff see the same page as a visitor
- [x] Anything explicitly out of scope written down: the staff side (create, edit, publish, record a gift, close), the manual topic, the release note, and the progress style inside the share preview image; see the decision file section 10

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync`: `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: typecheck — npm run typecheck

=== gates: typecheck exited 0 after 12s

=== gates: lint — npm run lint

=== gates: lint exited 0 after 80s

=== gates: test — npm test

=== gates: test exited 0 after 3s

=== gates: build — npm run build

=== gates: build exited 0 after 38s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR (0210 shipped in #667)
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration; 0210 was already applied (`--status`: 0 pending)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; the pages were exercised against rows inserted on dev, see section 4
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

Test appeals were inserted on dev by script (Panda, Markey, Dryrun Yota EN) because the staff form does not exist yet; dev test data is disposable.

- [x] Happy path works end to end: list shows live appeals, detail shows photos, story, cost, progress, ways to give, share buttons; signed out, port 3002
- [x] Data persists — reload: the pages are read-only, so this was checked as a gift inserted in `donations`/`donation_lines` designated to the appeal moved the figure after reload (฿6,000 of ฿15,000 → 40%; ฿17,250 → 115%) on reload
- [ ] Create / edit / delete all exercised — n/a: the public pages only read; creating appeals is the staff half
- [x] Empty state renders sensibly: an appeal with no gifts reads "No gifts recorded yet."; an appeal with no photos shows "No photo yet" (cards) or the resident's profile photo (detail); the list with none open shows its own sentence (read in code, not driven)
- [x] Invalid input is rejected with a readable message, not a crash: a malformed id and a draft's id both show the not-found page, and the draft's title is not in the page or the list
- [x] Boundary cases checked: 0%, 40%, 100%+ (115%), each style; 99.6% reads 99%; satang rounding (`state.test.mjs`, 6 cases); funded and closed phases drop the ways to give; days left, last day and passed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/appeals`, `/appeals/[id]` | the same public page a visitor sees | n/a — the pages read two anon views and carry no role logic |
| management | same | same | n/a — as above |
| staff | same | same | n/a — as above |
| doctor | same | same | n/a — as above |
| volunteer | same | same | n/a — as above |
| signed out | both pages, photos via the proxy | readable on an unlocked site | driven: signed out on dev, pages and photos load |

- [x] Every role above tested — the pages have no per-role behaviour; the browser was signed out, and the data comes from `public_appeals` / `public_appeal_photos`, which `check-public-views.mjs` already covers for anon
- [x] A role that should not have access is blocked server-side — draft appeals are excluded by the view in SQL (checked by `check-appeals-schema.mjs` in #667, and the draft's page and list entry were absent here); no new write path exists

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: public site only; the public header's entry is covered in section 6
- [ ] Manual updated — n/a: the topic "Running an appeal" is for staff and comes with the staff half
- [x] Translatable strings go through the translation path: appeal prose is read with `localizedField` from the view's `translations`; chrome is in both dictionaries (Thai driven at 375 px). `/management/translations` not checked: no appeal can be created yet to appear there
- [x] Mobile viewport (375px) — no overflow (scrollWidth 375), controls reachable; English and Thai
- [x] Browser console clean — no errors on the list page
- [x] Network clean — photos through `/api/photos/…` loaded; no 4xx/5xx seen

## 6. Regression

- [x] The pages nearest the change still work: `/` (strip and the help card), `/adopt/[id]` (sponsor line swapped for the appeal when live, plain gift line otherwise), `/donate` (its ways to give are reused on an appeal and were not changed)
- [x] Shared files touched checked by loading the pages: `PublicHeader.tsx` (entry switches to "Help a sick resident" while live), `page.tsx`, `adopt/[id]/page.tsx`, both dictionaries (type-checked; Thai driven). `src/lib/public-paths.ts` list checked by `node --test` (126 pass) and `check-public-paths.mjs`
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked, the staff side is open; an UPDATE note saying part (2) shipped and what is left is added to the item in this PR
- [x] Non-obvious design choices added as `docs/decisions/2026-10-16-appeals-public-pages.md`
- [x] `README.md` still accurate — no route list or setup step changed
- [ ] **Release notes.** — n/a: the pages cannot be reached by a shelter user until the staff half lets someone create an appeal and the public site is unlocked at go-live, so a note now would promise something that does not work yet; the line goes in the staff-side PR
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the 114%-for-115% fault was seen on the dev server, reproduced in `state.test.mjs`, and fixed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: dates shown are a deadline and the last gift's date; days left is whole days between two shelter-clock dates (`todayIso`), asserted in `state.test.mjs`; the last-updated date is formatted by `formatDate`, a date only
- [ ] Boundary or banding change covers both edges — n/a: percent and phase boundaries are covered both sides in `state.test.mjs` (99/100/115, under/at/over target), recorded here for the reviewer
- [ ] Evidence pasted is the tool's actual output — n/a: the gates block above is pasted unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager; `/appeals` is deliberately not edge-cached, `/` and `/adopt/[id]` are

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in the same PR — n/a: no migration here; 0210 is already on production's path through the release that carries this code, and the release manager must apply it before deploying this code (the views are read by these pages)
- [ ] `--env production --dry-run` — deferred: release manager (0210 is the pending file this code reads)
- [ ] Destructive migration backup — n/a: 0210 is additive
- [ ] Apply plan stated — deferred: release manager: apply 0210 to production before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager; this PR is code and docs only, so `deploy-pi.sh --ref <sha>` of the previous release reverts it, and 0210 is additive and safe to leave

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A 115% appeal read "114% of the goal" (floating point) | fixed in this PR, covered by a test |
| 2 | low | The share preview is the photo, not the progress picture the item asked for | deferred to backlog (noted on the item) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Director agrees the over-raising sentence: "the extra goes to the medical care of the other animals here" | `appeals.extraGoes`, shown on every open appeal |
| 2 | The Thai wording reads naturally to a Thai reader | `/appeals/[id]` in Thai |
| 3 | A real phone: the blurred-photo warning, the share buttons, LINE sharing | any appeal on the deployed test site |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the three items above

Manual verification by: pending: the Director's yes on the over-raising wording, a Thai reader, and a phone check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over
