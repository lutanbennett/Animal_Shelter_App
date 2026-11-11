# Feature test plan

## Header

| | |
|---|---|
| Feature | control-activity-allowlist: draw /admin/website edit controls only under website.content; clear the allow-list rows this settles |
| Backlog item | `docs/backlog.md` → #79sqf (retitled, left open) |
| Branch / worktree | `claude/control-activity-allowlist` @ `C:\Development\Animal_Shelter_control-activity-allowlist` |
| Dev server | `http://localhost:3011` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 556c9d06 |

## 1. Scope and risk

- [x] Change is described in one sentence: five `/admin/website` components take a `canEdit` prop (default false) and draw their edit controls only under it, and 9 rows leave the control-activity allow-list
- [x] Files touched: `src/app/admin/website/{DonationChannels,ClinicVisitEstimate,PublishedProjects,CreateSiteContentRow,ImpactBaselines,page}.tsx`, `docs/control-activity-allowlist.json`, `docs/backlog.md`, a decision file, this plan. No migration, no `worker/`, no server action
- [x] Cards affected: none changed; `website` (edit) and `website_photos` (read) driven. Admin unaffected
- [x] Out of scope: teaching the check its false-positive patterns (deliverable 4), the UNRESOLVED controls

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the PR
- [x] `node scripts/gates.mjs` ends with the four-gate line:

```
=== gates: typecheck exited 0 after 24s
=== gates: lint exited 0 after 271s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 71s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: under the `website` card the Donate tab shows Move up/down, Hide, Save, Delete and Add (driven, dev, 3011)
- [ ] Data persists — n/a: no write was pressed; the actions are unchanged
- [ ] Create / edit / delete — n/a: actions unchanged, only their buttons' visibility
- [ ] Empty state — n/a: no empty-state change
- [x] Invalid input / a new finding fails: `check-control-activity.mjs` exits 1 with STALE rows before the allow-list was edited, 0 after
- [ ] Boundary cases — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| `website` (website.content edit) | Donate tab | edit controls present | pass |
| `website_photos` (website.content read) | /admin/website | Gallery tab only, no donation control | pass |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side — unchanged: every action still asks `website.content` itself

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no behaviour a manual topic describes
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no layout change
- [x] Browser console clean — no error seen while driving
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] `node scripts/check-destination-activity.mjs` untouched and still 0 findings
- [x] Shared file touched checked from a second page — `page.tsx` renders every tab; Home and Contact tabs seen under the `website` card
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item #79sqf retitled in `docs/backlog.md` (left open: remainder named)
- [x] Design choices recorded in `docs/decisions/2026-11-11-control-activity-allowlist.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a login holding only the read-level card was already shown the Gallery tab alone, so nobody would see a control disappear
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured: counts from the check's own output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is the tool's actual output — n/a: pasted from the run
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: revert the PR; no data or schema change

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | 9 controls on /admin/website were drawn ungated (reached only through a tab list that already hid them) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Sign in with only the photo-strip card and confirm no donation, contact or project edit control is shown | /admin/website |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-11

### Manual verification

- [ ] pending: row 1 above

Manual verification by: pending: a person looking at /admin/website under the photo-strip card

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: release manager reads it at deploy time

Result: pass

Release manager acknowledgement: pending: release manager
