# Feature test plan — who-does-what-view

## Header

| | |
|---|---|
| Feature | Settings → Who does what: every activity × every live role, view only, with every box the system does not yet obey marked from a measured `FIXED_FOR_NOW` list; CSV and print |
| Backlog item | `docs/backlog.md` → `## Next up` → "PRIORITY (Lutan, 2026-10-10): Settings → Who does what…", step (a). **Not ticked**: the item stays open until (e); it gets a status line. Also a progress note on "Roles and permissions each shelter configures" (stage 2's screen, view only) |
| Branch / worktree | `claude/who-does-what-view` @ `C:\Development\Animal_Shelter_who-does-what-view` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | (opened after this commit) |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `a5105287` (code; this plan is the next commit) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the grid as a page, view only, activities grouped by area in plain words in both dictionaries, live roles across the top with Admin as "everything, always", Edit / Read / None or Yes / No per box, laptop-readable, printable and downloadable as CSV, Admin and Management only, and a "fixed for now" mark from `FIXED_FOR_NOW` with its reason
- [x] Files/areas touched listed: `src/app/admin/who-does-what/page.tsx` (new), `src/lib/permissions/fixed-for-now.ts` and `who-does-what.ts` (new), `src/app/admin/page.tsx` and `src/app/management/page.tsx` (one tile each), `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/check-who-does-what.mjs` and `check-who-does-what-page.mjs` (new), `scripts/check-permission-catalogue.mjs` (one PINNED line), `scripts/lib/acceptance-matrix-entries.mjs`, `README.md`, `docs/backlog.md`, `docs/decisions/2026-10-11-who-does-what-view.md`
- [x] Roles affected identified: Admin and Management can open the page and see its tile; every other role is refused; no role's own access to anything else changes
- [x] Anything explicitly **out of scope** written down: editing a box (who-does-what-edit), retiring `/admin/role-draft` (e), converting the 11 functions (perm-functions-schema), the volunteer-floor gap this stream found (filed on the `backlog` branch, decision for Lutan)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date": `main` is still 56ec669; perm-functions-schema has not merged)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 33s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three): #526 at `d2cddc57`, 7 of 7 passing; re-run on the merge with security-role-picker (#525) before merging

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration (the brief forbade one; `0178` is perm-functions-schema's)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration. The stream's own harness (`check-who-does-what.mjs`) is rolled-back probing, recorded in §4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-who-does-what-page.mjs` against the dev server, as a throwaway Admin and a throwaway Management login: the page opens (200), a column for each of the 6 live roles (Management, 2IC, Head of Maintenance, Head of Medical, Volunteer, Doctor), a row for each of the 60 activities, **every one of 360 boxes says what `role_permissions` holds** (read directly by the script, not through the page), **"fixed for now" marks on exactly the boxes FIXED_FOR_NOW shows (49)**, Admin is the line "Everything, always…" and not a column, the CSV holds the heading and 60 rows (61). Also driven by hand in the browser pane as a disposable Admin login at 1440 px: grid, footnotes, rules, Management landing tile
- [x] Data persists — reload the page and the change is still there: the page writes nothing; it was reloaded several times in the pane and after a dev-server restart, same grid
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: view only, by design; no edit control, disabled or otherwise
- [ ] Empty state renders sensibly (no rows yet) — n/a: the catalogue always has 60 activities and there is always at least one live role; a role with no cells shows None / No in every box, which the 360-box comparison covers (the doctor holds 2 cells)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the page takes no input
- [x] Boundary cases checked: a role with no Thai name (the five built-in ones have `name_th` null) falls back to the dictionary's role label in Thai, seen in the pane (ผู้บริหาร, หมอ, อาสาสมัคร); the three configured roles show their own `name_th`; archived Staff and the Public viewer (`opens_app` false) are not columns

**`FIXED_FOR_NOW` is measured.** `node scripts/check-who-does-what.mjs` (dev): every probed box run under each role twice, as is and flipped, in rolled-back subtransactions. On `main`'s schema (before `0178`, runs at 08:29 and 08:33 local, identical): 300 boxes, `OBEYED 157 / WRONG 39 / STICKY 19 / INERT 85 / UNLISTED 0 / STALE 0 / FAULT 0`, and `OK: every probed box is obeyed or listed in FIXED_FOR_NOW.` `WDW_DROP=borrowedFloor` goes red as it must: `UNLISTED 10`. After perm-functions-schema applied `0178` to dev (01:33 UTC), the same check reports `OVERLISTED 5`, exactly the five boxes that migration closes (Management's `stock.correct`, `stock.count`, `recurring.do_any`, `photos.resident_add`; the doctor's `recurring.do_own`); left in, per the brief, for that stream to remove when it merges.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/who-does-what`; tile on Settings and on Management | the grid | 200, grid checked box by box; both tiles present |
| management | `/admin/who-does-what`; tile on Management | the grid (read with the service role, since RLS refuses it the tables) | 200, the same 360 boxes and 49 marks; tile present |
| staff | — | n/a | n/a: retired role (`0173`), no live login can hold it |
| doctor | `/admin/who-does-what` | refused | not driven: the doctor is neither Admin nor Management, the same branch of `opensWhoDoesWhat()` the volunteer and 2IC runs exercise |
| volunteer | `/admin/who-does-what` | sent to `/no-access` | redirect to `/no-access`, none of the grid in the response |
| 2IC (configured) | `/admin/who-does-what`; Management landing | sent to `/no-access`; no tile | redirect to `/no-access`; the 2IC's Management landing does not offer the tile |
| signed out | `/admin/who-does-what` | sent to sign-in | `307 → /login?next=%2Fadmin%2Fwho-does-what` |

- [x] Every role above tested (staff is retired; the doctor shares the refused branch, stated in the row)
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): the volunteer and 2IC fetched the URL directly with their own session cookies and got the redirect, not the page

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no sidebar entry; the page is a tile on the Settings and Management landings, which are the menu for those sections (checked: Admin sees both, Management the Management one, the 2IC neither)
- [x] Manual updated (`src/lib/manual/en.ts`): a Who does what topic in Settings for Admin and Management; the acceptance matrix has its two rows and `acceptance-matrix --check` is ok (76 topics → 110 activities)
- [x] Translatable strings go through the translation path: every word on the page is in both `en.ts` and `th.ts` with the same shape (typecheck enforces it), including all 60 activity names, 12 areas and 9 reasons; the Thai page was seen in the pane
- [x] Mobile viewport (375px) — no overflow, controls reachable: document width 375 at 375; the grid scrolls sideways inside its box with the activity column pinned (scrolled in the pane: the column stayed, Head of Medical and Volunteer came into view); Download CSV and Print are full-size buttons
- [x] Browser console clean — no errors or React warnings: none from the page; the only errors were the dev server's hot-reload socket failing while it was stopped for the gates
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages: the page 200, every asset 200 or 304

## 6. Regression

- [x] The pages nearest the change still work: `/admin` as Admin and `/management` as Admin, Management and 2IC rendered with their tiles (page check, and `/management` in the pane)
- [x] Any shared file touched checked from a second, unrelated page: `en.ts` / `th.ts` gained keys only (the build and typecheck pass on every page that reads them); `manual/en.ts` is read by the acceptance matrix generator, which passes; the `/management` landing, which also renders other dictionary tiles, loaded in the pane
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged (already up to date)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: by the brief, the PRIORITY item stays open until (e); it gets a status line saying (a) is done and what is left, including that (e)'s done-when cannot be met as planned. The gap is a new item on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-11-who-does-what-view.md`): the route, the phone fallback, per-box marks, how the list is measured, every entry and who removes it, what `0178` closes, and the gap no stream closes
- [x] `README.md` still accurate: the Roles section now points to the live grid and its two checks
- [x] **Release notes.** Would a shelter user notice this change? Yes: a new page. `unreleased` has a line for Admin and Management
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned**: every count (300 / 157 / 39 / 19 / 85, 360 boxes, 49 marks, the five boxes `0178` closes, 15 inert boxes it frees) is from the scripts' output in this session

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (Settings → Who does what as an Admin: the grid, the numbered marks, Download CSV)
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing on the page depends on a date
- [ ] **Boundary assertions cover both edges** — n/a: no threshold or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** (the gate lines and the check's count lines above, copied from the runs)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. No new variable; the page uses the existing `SUPABASE_SERVICE_ROLE_KEY`, which production already has (Recent changes and Security use it)

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Code-only; `deploy-pi.sh --ref <previous sha>` removes the page and its tiles, and nothing is left behind in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | The first list marked the 2IC's "Browse the contacts book" as refused; she does browse it, by name and phone (`0155`), so the page would have told an audience something false | fixed: its own entry, "Name and phone only" |
| 2 | major (found, not this stream's to fix) | Every configured role's boxes that need the full resident record or contacts book, and maintenance delete, are refused by the volunteer floor whatever the box says, and no stream in the sequence fixes it, so who-does-what-edit cannot meet its done-when | deferred to backlog: new item on the `backlog` branch, decision for Lutan; marked on the grid meanwhile |
| 3 | minor | At 375 px the pinned activity column left room for one role | fixed: narrower column and smaller type on a phone |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Is the grid clear enough to show someone?** Open it on the laptop you demo with and read it as your audience would: the words of the activities, the numbered marks and their reasons. Only you can judge this | `/admin/who-does-what` on dev (or test.lannacare.org once deployed), Lutan |
| 2 | Press Print: one landscape page set, the grid alone without the menu, every column on the paper. The browser pane cannot open a print preview | same page, Print button |
| 3 | The Thai wording of the activity names and the nine reasons reads naturally | same page in Thai, a Thai-reading person |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; the three items above are Lutan's

Manual verification by: pending: whether the grid is clear enough to show someone, the printout, and the Thai wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links the plan file and quotes its key lines rather than pasting it whole
- [x] Handed to the production release manager: the PR names the hazard (the page's truth depends on FIXED_FOR_NOW being kept current) and §8 lists the deploy checks

Result: pass

Release manager acknowledgement: pending  Date: —
