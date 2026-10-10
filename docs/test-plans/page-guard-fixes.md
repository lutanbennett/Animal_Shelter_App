# Feature test plan

## Header

| | |
|---|---|
| Feature | Page guard fixes: four medical edit pages at Edit, and the resident record hub's own guard |
| Backlog item | `docs/backlog.md` → "Four medical edit pages open at Read (app, small)" and "`/residents/[id]` has no permission guard of its own (app, small)" |
| Branch / worktree | `claude/page-guard-fixes` @ `C:\Development\Animal_Shelter_page-guard-fixes` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `df652a93` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the four `[id]/edit` pages guard at Edit (and their saves ask Edit), and `/residents/[id]` calls `requireFullResident()` after the who-and-where redirect; section F updated to match
- [x] Files/areas touched listed: `src/app/{weight,prescriptions,diets,clinic-visits}/[id]/edit/page.tsx`; `src/app/{weight,prescriptions,diets}/actions.ts`, `src/app/clinic-visits/[id]/edit/actions.ts`; `src/app/residents/[id]/page.tsx`; `scripts/check-permission-catalogue.mjs` (section F); new `scripts/check-page-guards-live.mjs`; docs
- [x] Roles affected identified: a login holding a medical activity at Read only (by migration the volunteer, and the Head of Medical for diets and prescriptions) now gets no-access on those edit pages; a configured role with no `resident.record` that does not answer 'volunteer' now gets no-access on the hub. Admin, management and doctor (Edit on all four by `0132`) unchanged; volunteer, Head of Medical and 2IC still go to `/r/` from the hub
- [x] Anything explicitly **out of scope** written down: the create and "End today" actions in the same files still ask no `can()` (backlog follow-up); the record tabs still show Edit links to a Read-only holder (backlog follow-up). Both in `docs/decisions/2026-10-10-page-guard-fixes.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 260s

gates: typecheck=0 lint=0 build=0
```

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

- [x] Happy path works end to end: `scripts/check-page-guards-live.mjs` (throwaway management login) opens each of the four edit pages with its form, and the hub
- [ ] Data persists — reload the page and the change is still there — n/a: no data is written by this change; the save paths only gained a permission check in front (left for manual: a real save as management and as a doctor)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: the change is to who may open and save, not to the write itself; a real edit-and-save is in Left for manual verification
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new list or view
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed; a refused save returns the existing `t.common.notAllowed` / `vetVisits.errors.notAuthorized` wording
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input handling changed

### Role access matrix

From `node scripts/check-page-guards-live.mjs` against dev and `localhost:3008`, throwaway logins, deleted after. "no-record role" is a throwaway configured role (opens the app, one `stock.count` cell, no `resident.record`, legacy `management`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | not driven: `can()` answers Admin yes for every key (catalogue check C, in lint) |
| management | four edit pages; hub | open, form shown | ok: 200 with form on all four; hub 200 |
| staff | — | — | n/a: role archived (`0173`), no live login can hold it |
| doctor | clinic-visit edit for its own clinic | unchanged (Edit on all four by `0132`) | not driven: on dev the doctor role holds only `resident.microchip` and `resident.record` (hand-edited there), so a dev doctor cannot prove the migration's cells. Left for manual verification |
| volunteer | four edit pages; hub | edit: no-access; hub: `/r/<id>` | ok: no-access ×4; hub → `/r/<id>` |
| Head of Medical | diets and prescriptions edit (Read); hub | edit: no-access; hub: `/r/<id>` | ok: no-access ×2 (was 404 before the fix, measured by restoring the old pages); hub → `/r/<id>` |
| no-record role | hub | no-access | ok: no-access (was the public card `/r/<id>` before the fix, measured the same way) |
| signed out | — | `/login` | n/a: the proxy gate is unchanged and runs before any page guard |

- [x] Every role above tested (or the reason it was not is in its row)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): every probe is a direct GET by URL

Wrong door, not a leak (the brief's check): the script prints what each login's own client reads. The volunteer reads none of the four tables and not `residents`; the Head of Medical reads the weight, prescription and diet rows but not `residents`, which is why the old page 404'd for her instead of showing a form. The pages render only what that client returns.

Section F before and after (`node scripts/check-permission-catalogue.mjs`):

Before (at `4081637d`):

```
F 108 pages: 37 in the registry, 44 pinned, 27 exempt
KNOWN /clinic-visits/[id]/edit: guards requirePermission("medical.visits", "read"); should be requirePermission("medical.visits") (backlog: "Four medical edit pages open at Read")
KNOWN /diets/[id]/edit: guards requirePermission("medical.diet", "read"); should be requirePermission("medical.diet") (backlog: "Four medical edit pages open at Read")
KNOWN /prescriptions/[id]/edit: guards requirePermission("medical.prescriptions", "read"); should be requirePermission("medical.prescriptions") (backlog: "Four medical edit pages open at Read")
KNOWN /weight/[id]/edit: guards requirePermission("medical.weight", "read"); should be requirePermission("medical.weight") (backlog: "Four medical edit pages open at Read")

all ok
```

After (at `df652a93`):

```
F 108 pages: 37 in the registry, 45 pinned, 26 exempt

all ok
```

Proven red both ways: with the pages fixed but the `known` entries still present, four `STALE` failures; with the hub's guard moved above the redirect, `FAIL F /residents/[id] sends a who-and-where login to /r/ before its guard`.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual describes who edits records by role, which is unchanged for every live role
- [ ] Translatable strings go through the translation path — n/a: no new strings; existing `notAllowed` / `notAuthorized` reused
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: server-side guard change, no client code touched; the pages were fetched by script and returned 200 with their forms
- [ ] Network clean — n/a: server-side guard change, no client requests added

## 6. Regression

- [x] The pages nearest the change still work: the four edit pages and the hub open for management (script); the volunteer's hub → card journey still works (script)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; `requireFullResident` and `can` are used as they are, not changed
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged: already up to date; gates green)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (both items; two follow-ups on the `backlog` branch)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-10-page-guard-fixes.md`)
- [ ] `README.md` still accurate — n/a: README says nothing about page guards
- [ ] **Release notes.** — n/a: nobody on a live role would notice. The Read-only holders of these activities (volunteer, Head of Medical) answer 'volunteer' and cannot open the record tabs where the Edit links are, so they never reached these pages from the app; doctor and management hold Edit. Every live role holds `resident.record`, so the hub opens or redirects exactly as before
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Before-and-after behaviour (404 → no-access; card → no-access) measured by running the live script with the old pages restored, then the new; role cells read from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: a permission cutoff, and both sides were asserted (Read refused, Edit opens; no-record refused, record opens; who-and-where redirected first)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** (the gates lines and the section F lines are as printed)
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (app-only change; a Pi rebuild at the previous SHA reverts it fully, nothing in the database to undo)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | Record tabs show Edit links to a login holding the tab at Read only | deferred to backlog ("Record tabs show Edit links to a login at Read only") |
| 2 | minor | Medical create and "End today" actions ask no `can()` | deferred to backlog ("The medical create and "End today" actions ask no permission") |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a doctor with a linked clinic: Appointments → Edit on one of your visits → change the notes → Save. The form opens and saves, as before | `/appointments` → `/clinic-visits/<id>/edit` |
| 2 | As management (the Director on her phone): open a resident → Weight tab → Edit a reading → Save; same for a Diet and a Prescription row. Each opens and saves, as before | `/residents/<id>/weight`, `/diet`, `/prescriptions` |
| 3 | As a volunteer: Residents → tap a resident. The name card opens, as before (not a no-access page) | `/residents` → `/r/<id>` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — three items are waiting for Lutan

Manual verification by: pending: the three rows in Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: both are minor and deferred to the backlog, recorded above; accepting them is the release manager's call
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
