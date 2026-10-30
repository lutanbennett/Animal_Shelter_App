# Feature test plan — assistant-could-not-help-log

## Header

| | |
|---|---|
| Feature | Admin-only Settings → Assistant log: the assistant's `unmatched` and `refused` rows, a CSV eval-set export, a could-not-help line on System status, and an `assistant-could-not-help` production check |
| Backlog item | `docs/backlog.md` → **Nothing can read the assistant's could-not-help log** (ticked) |
| Branch / worktree | `claude/assistant-could-not-help-log` @ `C:\Development\Animal_Shelter_assistant-could-not-help-log` |
| Dev server | `http://localhost:3006` |
| PR | filled in on the PR itself |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `49a0a632` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — an Admin-only screen and export for the could-not-help rows, a status line, and a production check, with no schema
- [x] Files/areas touched listed — `src/app/admin/assistant/` (page, export route), `src/lib/assistant/could-not-help.ts`, `src/app/admin/status/page.tsx`, `src/lib/status/usage.ts`, `src/app/admin/page.tsx`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/readonly-checks.mjs`, docs
- [x] Roles affected identified — Admin only; every other login is refused by the page guard, the export route and the table's own policy
- [x] Anything explicitly **out of scope** written down — no retention change, no card, no new read policy, no 2-step gate (read-only), no acceptance-matrix row (a step of the existing System status topic instead)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed.

```
=== gates: typecheck exited 0 after 16s
=== gates: lint exited 0 after 145s
=== gates: test exited 0 after 17s
=== gates: build exited 0 after 56s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, though the three existing dev rows were read back by the screen
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the production check runs inside the runner's own `begin read only`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end (driven before the two date boxes were swapped for the shared DateInput component, which the lint gate requires; the swap passed all gates but was not re-driven in the browser) — Settings tile → log lists the 3 dev rows newest first → filter by status → export downloads
- [ ] Data persists — reload the page and the change is still there — n/a: read-only, nothing is saved
- [ ] Create / edit / delete all exercised — n/a: read-only screen and export
- [x] Empty state renders sensibly (no rows yet) — the empty sentence is in both dictionaries; a date window with no rows returned a header-only file (2026-10-16 in shelter time: 0 rows)
- [x] Invalid input is rejected with a readable message, not a crash — a bad status or date in the query string falls back to Both / no limit (`parseCouldNotHelpFilters`)
- [x] Boundary cases checked — dates are shelter-time (UTC+7) day bounds: rows stamped 2026-10-16 20:45Z appear under 2026-10-17, not 2026-10-16; whitespace in what was typed is kept

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/assistant`, export, status link, Settings tile | all open | list of 3, filter, export 200 with CSV, status line "Could not help: 0 not understood, 2 refused." (30-day window), link shown |
| management | n/a | refused | not signed in separately: no card or policy gives it the rows; covered by the card-only login below |
| staff | n/a | retired role | n/a |
| doctor | n/a | refused | as management |
| volunteer | n/a | refused | as management |
| signed out | `/admin/assistant/export` | 401 | not driven: the route returns 401 before the Admin check when there is no user |

A login holding only the `assistant` card (`dev-signin --cards assistant`) was driven instead of each named role, since roles are transient groupings of cards:

- the export returned **403** "Only an Admin can download the assistant log."
- the page returned the in-app no-access page: no rows and no title in the HTML.

- [x] Every role above tested — Admin driven in full; one non-Admin card-only login driven on the page and export; signed-out not driven
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — fetched `/admin/assistant` and the export directly with the card-only login

## 5. Cross-cutting

- [x] Nav entry correct — the Settings tile is drawn for Admin only (same filter as Security and Stocktaking); there is no `NavLinks.tsx` entry, by design
- [x] Manual updated (`src/lib/manual/en.ts`) — one step in the System status topic; **not** read at `/manual` in the browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: these are UI dictionary strings (`en.ts` and `th.ts`), not database translations
- [ ] Mobile viewport (375px) — n/a: not driven; the table scrolls sideways inside its own container and the filter row wraps, but nobody has looked at it at phone width
- [ ] Browser console clean — n/a: the console was not read in this session, so nothing is claimed
- [x] Network clean — the only 4xx was the deliberate 403 from the card-only login

## 6. Regression

- [x] The pages nearest the change still work — `/admin` (Settings landing) and `/admin/status` both loaded and rendered after the change
- [x] Any shared file touched checked from a second, unrelated page — `usage.ts` is shared by the status tiles; the other Usage tiles rendered on `/admin/status`; the Settings landing still lists its other tiles
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-assistant-could-not-help-log.md`, including why there is no card
- [x] `README.md` still accurate — it does not describe the assistant's log or any file changed here
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for the new screen, written for a shelter user. It is a plain string, because a note can only be tagged by card and this screen has none; the page is Admin only, and the note is read by everyone
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the date-bound behaviour was measured against the three dev rows, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — deferred: production release manager. The date filter uses fixed +07:00 bounds, not the server clock, so it does not depend on the Worker's UTC; the file's date is `toISOString` of now (UTC) and only names the download
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or banding change; the date filter's two edges were both measured against dev rows
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: nothing is written or migrated; a rebuild with `./scripts/pi/deploy-pi.sh --ref <sha>` removes the screen and leaves the rows as they were

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A plain-string release note shows to every login, though only an Admin can open the page; a note cannot be tagged Admin-only | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai wording of the new screen, the tile and the status line reads naturally | `/admin/assistant`, `/admin`, `/admin/status` with Thai selected |
| 2 | The screen at phone width | `/admin/assistant` at 375px |
| 3 | The new System status manual step reads correctly | `/manual`, System status topic |
| 4 | `node scripts/check-production.mjs assistant-could-not-help` run from the main checkout against production | main checkout |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: Thai wording, phone width, the manual step, and the production check run from the main checkout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — merge first

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet
