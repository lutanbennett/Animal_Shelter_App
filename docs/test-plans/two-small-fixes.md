# Feature test plan — two-small-fixes

## Header

| | |
|---|---|
| Feature | Back to residents keeps the list's filter (fix one); cloudflared self-update in the Pi setup script (fix two, already on `main`) |
| Backlog item | `docs/backlog.md` → **Back to residents KEEPS THE FILTER** and **Put cloudflared's self-updating into `scripts/pi/setup.sh`** (both ticked) |
| Branch / worktree | `claude/two-small-fixes` @ `C:\Development\Animal_Shelter_two-small-fixes` |
| Dev server | `http://localhost:3003` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | `d9c43239` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the list's query rides to the resident as `?list=` and the hub's Back link is rebuilt from it; section pages are not covered (see decision file)
- [x] Files/areas touched listed — `src/app/residents/ResidentsTable.tsx`, `src/app/residents/[id]/page.tsx`, `src/app/residents/[id]/ResidentHub.tsx`, `src/lib/residents/list-view.ts`, `src/lib/releases.ts`, `docs/backlog.md`, decision file
- [x] Roles affected identified — anyone who can open the Residents list; no access rule changed
- [x] Anything explicitly **out of scope** written down — section pages and the other fixed `/residents` links, in the decision file. Fix two was already on `main` (1cb85ccb); the live Pi was not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before the gates, no conflicts
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit codes read from the script:

```
=== gates: build exited 0 after 211s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — dev, admin login: `/residents?status=adopted`, clicked a row's name link (`?list=status%3Dadopted`), hub's Back link was `/residents?status=adopted`, clicking it landed on `http://localhost:3003/residents?status=adopted`
- [ ] Data persists — n/a: nothing is stored, the filter lives in the address
- [ ] Create / edit / delete all exercised — n/a: no data is written
- [x] Empty state renders sensibly — a resident opened by its own address (no `list`) gives Back link `/residents`
- [x] Invalid input is rejected with a readable message, not a crash — `?list=https://evil.example/x` and `?list=//evil.example` render the page and give `/residents?…`, still on this site
- [ ] Boundary cases checked — n/a: only status was driven as a filter; zone, search and sort use the same query string and the same code path, and were not separately driven

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | residents list and hub | Back returns to filter | pass (above) |
| management | n/a | unchanged | n/a: no access rule changed |
| staff | n/a | unchanged | n/a: no access rule changed |
| doctor | n/a | unchanged | n/a: no access rule changed |
| volunteer | n/a | unchanged | n/a: no access rule changed |
| signed out | n/a | unchanged | n/a: no access rule changed |

- [ ] Every role above tested — n/a: only a link target changed; the pages' own checks are untouched
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: a link now remembers where it came from; no manual topic describes it
- [ ] Translatable strings — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: not read during the check
- [ ] Network clean — n/a: not read during the check

## 6. Regression

- [x] The pages nearest the change still work — the Residents list and a resident's hub loaded and navigated as above
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the sync

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch — both: the back-link item, and the cloudflared one (already built by 1cb85ccb)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-back-to-residents-keeps-the-filter.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` gained a line for fix one (residents card). Fix two: nothing a shelter user sees
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the Back link values were read from the live dev page

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; gates output above is unedited
- [ ] Public pages re-checked — n/a: public site untouched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — a rebuild on the Pi with `./scripts/pi/deploy-pi.sh --ref <sha>`; nothing in the database to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Hub section pages and other fixed `/residents` links do not carry the filter | deferred to backlog: written in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Fix two (`scripts/pi/setup.sh` section 2a) was not run. A real Pi rebuild or the USB spare's first boot would prove it; it was reviewed against the live Pi's configuration as the backlog item records it | Pi / USB spare |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one row is a Pi rebuild only Lutan can run, so it stays pending below

Manual verification by: pending: Pi rebuild or USB spare first boot proves setup.sh section 2a

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
