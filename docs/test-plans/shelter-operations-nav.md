# Feature test plan — shelter-operations-nav

## Header

| | |
|---|---|
| Feature | Shelter Operations: a new menu section and landing for the daily work (PR 1 of 3 of the agreed Management / Settings / Shelter Operations split) |
| Backlog item | `docs/backlog.md` → *Review which pages belong under Management and which under Settings — the split is inconsistent* (left open: PR 1 of 3) |
| Branch / worktree | `claude/shelter-operations-nav` @ `C:\Development\Animal_Shelter_shelter-operations-nav` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude (shelter-operations-nav session), 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `94b48ab7` (after `sync`, origin/main at `645187e7`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a Shelter Operations menu entry and `/operations` landing of tiles (Enclosures, Medication list, Maintenance, Stocktake, Deliveries, Projects, Vets and Contacts lookups) replace those separate menu entries; the medication list moves to `/operations/medication-list` with a redirect; Website moves from the Settings landing to the Management landing; the `/admin/contacts` and `/admin/vets` stubs are deleted. This is step 1 of the decision file's order of work, as agreed with Lutan on 2026-10-08
- [x] Files/areas touched listed: `src/app/operations/` (new landing, moved medication list), `src/app/management/page.tsx` and `medication-list/page.tsx` (now the redirect stub), `src/app/admin/page.tsx`, `src/app/admin/{contacts,vets}` (deleted), `src/app/NavLinks.tsx`, `src/app/NavPane.tsx`, `src/lib/permissions/routes.ts` (new `section`, `sectionOf`, `opensAnyIn`) and `require.ts` (`requireAnyPageUnder` → `requireAnyPageIn`), `src/lib/home/tiles.ts`, `src/lib/permissions/jobs.ts`, `src/components/hub-icons.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-medical-jobs-app.mjs`, `scripts/lib/acceptance-matrix-entries.mjs`, `docs/role-walkthrough.md`, the decision file, the backlog. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: every role that opens the app. Staff, volunteers, the Head of Medical and Head of Maintenance gain a Shelter Operations entry they have never had a section like before; staff lose the Management entry, which for them only ever held the Medication list (that tile is now under Shelter Operations). Vets see no change. Signed-out public: none
- [x] Anything explicitly **out of scope** written down: PR 2 (split medications and diets) and PR 3 (device-notice sweep) are later batches. **The `website.content` grant is not in this PR.** Management does not yet see the Website tile: the cell needs a migration, and building this found that the website tables' write policies are still `is_admin()` (`0153`), so the grant is the cell plus three policy rewrites. That is wider than the one row the brief allowed, so it waits for Lutan's go-ahead (decision file, backlog item *Let Management edit the impact figures*)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought `0161` and its plan; one auto-merge in `docs/backlog.md`, no conflict)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: typecheck exited 0 after 31s
=== gates: lint exited 0 after 109s
=== gates: build exited 0 after 142s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; no query changed
- [ ] Constraints and defaults exercised in a rollback harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: signed in at 375 px as a disposable staff login, opened Shelter Operations from the phone menu, saw its tiles, opened Enclosures and the medication list from it
- [x] Data persists — n/a: nothing here writes data; the change is navigation. Instead: the redirect from `/management/medication-list?round=lunch&view=list` landed on `/operations/medication-list?round=lunch&view=list` with Lunch and By resident still selected
- [ ] Create / edit / delete — n/a: no create, edit or delete in this change
- [ ] Empty state — n/a: a landing with no tiles cannot be reached; its guard refuses anyone who opens none of them, and the menu entry is hidden for them (`opensAnyIn`, the same question)
- [ ] Invalid input — n/a: no input. Unknown `round` / `view` values on the old URL are passed through and the page already falls back to the suggested round
- [x] Boundary cases: a page that keeps its address but moves section (`/admin/website` → Management) lights up Management, not Settings, in the menu (longest match, checked in code); `/enclosures` lights up Shelter Operations (browser); the deleted `/admin/contacts` now returns 404 (browser)

### Role access matrix

Staff and management were signed in for real at 375 px with disposable dev logins. Every role was also driven by `scripts/check-phone-width.mjs` over `/operations`, `/operations/medication-list`, `/management`, `/admin` and `/home`, in English and Thai: 36 page views opened and 34 refused because the role cannot open that page.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/operations` (8 tiles), `/management` (now with Website), `/admin` (no Website) | every tile; Website on Management | pages open at 375 px, en + th (phone-width check); tile list read from code, not in a browser: no admin login was made |
| management | menu: Home, My tasks, Residents, Shelter Operations, Management; `/operations` 8 tiles incl. Contacts; `/management` 11 tiles | no Settings; no Website tile until the grant | as expected (browser, read item by item) |
| staff | menu: Home, My tasks, Residents, Shelter Operations; `/operations` 7 tiles, no Contacts (`0155`) | no Management, no Settings | as expected (browser); `/management` and `/management/purchasing` typed directly → no-access page |
| vet | menu: Appointments, Residents | no Shelter Operations | `/operations` refused (phone-width check: the vet's page views were skipped as refused) |
| volunteer | `/operations` with Enclosures | Shelter Operations with one tile | opens at 375 px (phone-width check); tile list not read in a browser |
| signed out | `/operations` → `/login?next=%2Foperations` | sign-in | as expected (browser) |

- [x] Every role above tested (staff and management in the browser; admin, vet and volunteer only through the phone-width run, which says so in the table)
- [x] A role that should not have access is blocked server-side: staff typing `/management` and `/management/purchasing` got the no-access page; no page guard was changed

## 5. Cross-cutting

- [x] Nav entry correct: Shelter Operations appears for staff and management, hidden for a vet, and lights up on its pages (`/enclosures`, `/operations/medication-list`); no dead links (the eight tiles open)
- [x] Manual updated: new topic *Shelter Operations: the daily work*, the navigation topic rewritten, and every moved page's path now starts `Shelter Operations →`; Website lines say `Management → Website`. `acceptance-matrix.mjs --check` ok (72 topics). Read in the source, not at `/manual` in a browser
- [ ] Translatable strings through the translation path — n/a: no user-entered or public content changed; the new labels are dictionary strings, in both `en.ts` and `th.ts`
- [x] Mobile viewport (375 px): `check-phone-width.mjs` — "No page scrolls sideways", every component action at least 44 px; the landing in Thai measured `scrollWidth` 375 in the browser
- [x] Browser console clean: one error, the 404 from deliberately opening the deleted `/admin/contacts`; the dev server logged no errors
- [x] Network clean: no unexpected 4xx/5xx; the only 404 is the one above

## 6. Regression

- [x] Pages nearest the change still work: `/enclosures`, `/operations/medication-list` (both views), `/management`, `/home` (staff tiles now link `/operations/medication-list`)
- [x] Shared files checked from an unrelated page by loading it: `/home` for staff (reads `tiles.ts` and the route registry) and `/management` for management (reads the registry through `requireAnyPageIn`)
- [x] Nothing merged from `main` during `sync` was broken: `0161` and its script touch no file this branch touches; gates ran after the merge

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: this is PR 1 of 3, so the item stays open with a status note saying what is built and what is left; the `website.content` item gets the answer and why it is still open
- [x] Non-obvious design choices recorded: `docs/decisions/2026-10-07-management-settings-split.md` moved to AGREED, with the four changes, the answers, and a section on how the sections are decided in code (`section` on the registry)
- [x] `README.md` still accurate (it does not describe the menu)
- [x] **Release notes.** One line in `unreleased`, saying the menu has a new Shelter Operations entry, that staff and volunteers will see it for the first time, that links still work, and that Website is now on Management
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the staff and management menus and tiles were read in the browser; "staff lose nothing from Management" was checked by opening `/management/purchasing` as staff (refused) and reading staff's home tiles; the `is_admin()` policies were read from `0153`

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager at deploy time
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic changed; the medication list's own date handling is untouched
- [ ] Boundary assertions cover both edges — n/a: no threshold or band changed
- [ ] Evidence pasted is the tool's actual output — deferred: release manager at deploy time
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager at deploy time
- [ ] `strip-baked-env` seen — deferred: release manager at deploy time
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR, or roll the Pi back with `./scripts/pi/deploy-pi.sh --ref <sha>`. No data or schema changed, so a rollback is complete. A bookmark to `/operations` or `/operations/medication-list` made in between would then 404; the old addresses work again

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | The brief's single `role_permissions` row would not let Management save the website: `site_content`, `site_content_photos` and `site_pages` still write under `is_admin()` (`0153`) | deferred: the grant is held for Lutan's go-ahead (cell + three policies); recorded in the decision file and on the backlog item *Let Management edit the impact figures* |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Open the new menu on a phone: Shelter Operations is there, its tiles make sense, and you can find each page you used to reach from the menu | a phone, signed in as yourself and, if you can, as a staff login |
| 2 | Read the Thai wording: งานประจำวัน as the section name and the eight tile descriptions | the same, with ไทย selected |

### What was checked at the `0.21.0` release, 2026-10-08

- **1 — done, Lutan**, on test before the production deploy: Shelter Operations
  is in the menu, the tiles make sense, and each page previously reached from
  the menu is reachable. Asked for specifically because this note **leads the
  admin mail** of a major release, and a mail cannot be recalled.
- **2 — still open.** The Thai wording was not looked at. It is the only part of
  this plan outstanding, and it ships either way, since `0.21.0` is live.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (shelter-operations-nav session)  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items wait for Lutan

Manual verification by: pending: item 2, the Thai wording (งานประจำวัน and the eight tile descriptions). Item 1 is done — Lutan confirmed the menu on test in chat on 2026-10-08, before the production deploy, and this line was written by Claude at his request

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — it is handed over when the next release is cut

Result: pass with accepted defects

Release manager acknowledgement: pending
