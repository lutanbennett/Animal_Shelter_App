# Feature test plan

## Header

| | |
|---|---|
| Feature | Residents list: sort by clicking a column heading (and a Sort by choice on phones) |
| Backlog item | `docs/backlog.md` → **Residents list: sort by clicking a column heading** (ticked here) |
| Branch / worktree | `claude/residents-list-sort` @ `C:\Development\Animal_Shelter_residents-list-sort` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending |
| Tested by / date | Claude / 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | see the PR's last commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: each heading on `/residents` sorts the list (second click reverses), kept in the address as `?sort=&dir=`, Zone and Enclosure in the shelter's own order, the Download in the same order, and a Sort by choice on phones
- [x] Files/areas touched listed: `src/lib/residents/sort.ts` (new), `src/lib/residents/list-view.ts`, `src/app/residents/page.tsx`, `ResidentsTable.tsx`, `src/app/residents/export/route.ts`, both dictionaries, the manual, releases, `scripts/check-residents-sort.mjs` (new)
- [x] Roles affected identified: everyone who opens /residents: admin, management, staff, doctor, and the volunteer floor (who-and-where view). No public surface
- [x] Out of scope written down: no paging exists, so nothing to do there; ID is not offered in the phone Sort by (the column is not shown on phones); no schema, so Zone, Enclosure and On-site / Off-site are ranked in the app after the query rather than by the database (`docs/decisions/2026-10-11-residents-list-sort.md`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (see PR)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the check script ran against the 82 living residents on dev
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `scripts/check-residents-sort.mjs` requests every column both ways and checks the order of all 82 living residents against the database and Settings → Zones / Enclosures
- [x] Data persists — the order is in the address (`?sort=zone&dir=desc`), so a reload or shared link repeats it; the script fetches those addresses fresh
- [ ] Create / edit / delete all exercised — n/a: read-only feature
- [x] Empty state renders sensibly: the existing "No residents match" row is unchanged; the sort controls do not depend on rows
- [x] Invalid input is rejected with a readable message: `?sort=bogus` or `dir=up` fall back to name A to Z (`parseSort`), no error
- [x] Boundary cases checked: residents with no zone / enclosure / place go last in both directions; ties fall back to name; the script ranks include the Lifecycle zone's enclosures

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | /residents and the Download | sorted by every column, both ways | pass (script) |
| management | /residents | same code path as admin | not run separately |
| staff | /residents | same code path as admin | not run separately |
| doctor | /residents | same code path; no zone/enclosure read, so those ranks are empty and fall back to name | not run |
| volunteer | /residents (who and where) and the Download | sorted by every column, both ways | pass (script) |
| signed out | /residents | unchanged: sent to sign in | not run |

- [x] Every role above tested — n/a: admin and volunteer (the two distinct views) were driven by the script; management and staff share admin's code path, and the doctor case is on the manual table below
- [ ] A role that should not have access is blocked server-side — n/a: this change adds no access; the page's gate is untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated (`src/lib/manual/en.ts`, Finding a resident)
- [x] Translatable strings go through the dictionaries: both `en.ts` and `th.ts` have `sortBy`, `sortLabel`, `sortHeading`, `sortReverse`
- [ ] Mobile viewport (375px) — n/a: not driven here; left for manual verification below
- [ ] Browser console clean — n/a: no browser session was driven; left for manual verification below
- [x] Network clean — the script's requests all returned 200 for both roles

## 6. Regression

- [x] The pages nearest the change still work: `/residents` and the Download with no sort give the old order (default is name A to Z)
- [x] Shared file touched checked from a second page: `list-view.ts` also feeds `/residents/export`, loaded by the script
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates passed after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added: `docs/decisions/2026-10-11-residents-list-sort.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for the sort
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the order and the Download match were measured by the script, which caught a real defect (the Download ignoring the Zone / Enclosure / Location sort) before it was fixed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no thresholds; both directions of every column were checked
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: only the gates line is pasted, as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; nothing here needs a database change to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | The Download ignored the Zone / Enclosure / On-site sort (an edit to the export route had not applied); caught by comparing the file's order with the page's | fixed: the route now calls `inListOrder`, and the script compares both |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | At 375 px the Sort by choice and Reverse button work and look right; on a computer the headings show the arrow | `/residents` on Test |
| 2 | Console is clean on `/residents?sort=zone` | `/residents` on Test |
| 3 | A doctor login sorts sensibly (Zone and Enclosure fall back to name when the doctor cannot read the zones) | `/residents` as a doctor |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
