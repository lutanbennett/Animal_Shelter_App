# Feature test plan — medication-list

## Header

| | |
|---|---|
| Feature | Management → Medication list: a read-only, phone-first page of who needs what medicine today, grouped by zone then enclosure, each animal with photo and name and each medicine with its label photo, amount and how often. Nothing to tap, nothing recorded (§14 of the roles paper) |
| Backlog item | `docs/backlog.md` → "Roles build: the medication list" (ticked). The Medical-records item's medication-round part is marked superseded, not done |
| Branch / worktree | `claude/medication-list` @ `C:\Development\Animal_Shelter_medication-list` |
| Dev server | `next dev` on `http://localhost:3004` (this worktree's `.port`), browser pane at the **mobile** preset 375×812, reloaded after switching |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `928e60fa` (after `worktree.mjs sync`, which found `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one read-only page listing today's medication by zone and enclosure with photos, amount and frequency, and a tile for it on the Management landing page
- [x] Files/areas touched listed — `src/app/management/medication-list/page.tsx`, `src/lib/medication-list/{due,load}.ts`, `src/app/management/page.tsx` (tile), both dictionaries, `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `scripts/check-medication-list-due.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-03-medication-list.md`, this plan. No migration, no `worker/`
- [x] Roles affected identified — admin and management open it; staff, vet, volunteer and signed-out are refused (section 4)
- [x] Anything explicitly **out of scope** written down — no "given", skipped, reason, timestamp or history (ruled out by Lutan); no `has_permission()` or new activity; no clock times; the Head of Medical's home tile (no home screen or role exists yet, so the tile is on the Management landing page and moves with `home-screens`); no explicit walking-order column (it would need a migration)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` was already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 150s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the page only reads rows that already exist, and rendered the dev shelter's 14 current prescriptions
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

- [x] Happy path works end to end — signed in as a management account on dev, `/management/medication-list` showed Front Zone, House Zone and Main Zone with one enclosure each, residents with photos, each medicine with amount and how often, "Last day of the course" on the one course ending today, and a closing "Not in an enclosure today" section for the unassigned residents
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing is written
- [ ] Create / edit / delete all exercised — n/a: read-only page with no form, action or client component (`main` held 0 links, buttons or inputs)
- [ ] Empty state renders sensibly (no rows yet) — n/a: the empty branch is one paragraph and was not driven, because dev has current prescriptions on every day; read from source only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the page takes no input (no query string is read)
- [x] Boundary cases checked — `node scripts/check-medication-list-due.mjs` runs the real `due.ts` through 27 cases, passing under the default clock and `TZ=UTC`: every other day (start day, day before, next dose, across a month end), weekly (6, 7 and 8 days on), every 2 weeks, monthly (day before, day of, day after), the 31st clamping to 30 Nov and to 28 Feb / 29 Feb in non-leap and leap years, every 2 months across a year end, a date before the start, and no frequency / as-needed. On the page: an as-needed row shows as "As needed"; the dev weekly Iron Injection was correctly absent today; medicines with no label photo render without a gap; a label photo shown beside the amount was checked with a stand-in image

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/management/medication-list` | opens the list | opened, 375/375 |
| management | `/management/medication-list` and the tile on `/management` | opens the list | opened EN and TH, 375/375; tile present |
| staff | `/management/medication-list` typed directly | refused | redirected to `/no-access` |
| vet | `/management/medication-list` typed directly | refused | redirected to `/no-access` |
| volunteer | `/management/medication-list` typed directly | refused | redirected to `/no-access` |
| signed out | `/management/medication-list` | sent to sign in | 307 to `/login?next=%2Fmanagement%2Fmedication-list` |

(Roles were set on one disposable dev account between visits, so the matrix was driven by the real guard, `requireManagementUser()`, not by hiding anything in the UI.)

- [x] Every role above tested
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — none by design: Management is a single nav link and the page is a tile on its landing page, in the same place for both languages; `NavLinks.tsx` is unchanged
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — "The medication list" found at `#medication-list`, with Who: Admin, Management
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: that page is for public-site text; this page's strings are in both dictionaries (`management.medicationList`, `nav.medicationList`, the landing tile) and the Thai view was read on the page
- [x] Mobile viewport (375px) — no overflow, controls reachable. `document.scrollingElement.scrollWidth` / `clientWidth`: list EN **375 / 375**, list TH **375 / 375**, Management landing TH **375 / 375**. There are no controls on the page to reach
- [x] Browser console clean — no errors or warnings read (`read_console_messages`, errors only)
- [x] Network clean — `read_network_requests`: the page, its assets and the six `/api/photos/<id>?w=160` requests all 200 or 304

## 6. Regression

- [x] The pages nearest the change still work — `/management` (landing, all 12 tiles present in Thai, 375/375), `/manual`, `/releases`
- [x] Any shared file touched (`manual/en.ts`, both dictionaries, `releases.ts`, `management/page.tsx`) checked from a second, unrelated page — `/releases` loaded and shows the new line; `/manual` loaded and shows the new topic; `/management` loaded in Thai
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-03-medication-list.md`, answering the four small questions
- [x] `README.md` still accurate — it lists role capabilities, not individual Management pages beyond those named, and nothing it states has changed
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a new line for it, tagged admin and management
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The due-day rule is asserted by a script over the real file; the 375 px widths above are readings, not estimates

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — deferred: release manager, who should open the list between 00:00 and 07:00 Thai once, since "today" comes from `todayIso()` (the shelter's clock) and the Workers run in UTC. The due-day rule itself takes its date as an argument and is asserted under `TZ=UTC` above
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the due-day boundaries are asserted on both sides (see section 4), and there is no banding or threshold change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block is as printed; the due-day count and widths are quoted from the runs and are not a pasted table
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated: a pure addition (one page, one tile, one library folder). Rolling back is the usual rebuild on the Pi (`./scripts/pi/deploy-pi.sh --ref <sha>`); nothing in the database changed, so there is nothing to undo there

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found. One typecheck error during the build (a schedule's `interval_unit` typed as `string` against the frequency helper's literal union) was fixed before the first commit | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the list on a real phone, in the kennels, away from Wi-Fi: does a list opened at the office stay readable and do the photos still show while walking round? (§14, "no signal in the kennels") | On site |
| 2 | Read it in Thai as the person who gives out the medicine: do the headings, "× a day" wording and the "Not in an enclosure today" note read naturally? | A Thai-reading staff member |
| 3 | Is zone name then enclosure name really the order they walk? If not, the order needs its own column (a schema item), and the Director should say what the route is | The Director or Head of Medical |
| 4 | With a real medication's box photo uploaded (dev has none; one was checked with a stand-in image and then cleared), is the label legible at 80 px next to the amount? | Management → Medications, then the list |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1 to 4 wait for a person on site and the Director

Manual verification by: pending: items 1 to 4 above, on a real phone on site and with the Director

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR has not merged

Result: pass

Release manager acknowledgement: pending
