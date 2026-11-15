# Test plan: report photo retention (#6rkux)

## Header

| | |
|---|---|
| Feature | Daily removal of expired and orphaned report-an-animal photos |
| Backlog item | `docs/backlog.md` → #6rkux |
| Branch / worktree | `claude/report-photo-retention` @ `C:\Development\Animal_Shelter_report-photo-retention` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | pending: opened after this commit |
| Tested by / date | Claude / 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | 464df3c8c |

## 1. Scope and risk

- [x] One sentence: a daily Worker stage removes the photo of reports closed over 90 days and any object with no report row, never the row itself
- [x] Touched: `worker/index.mjs`, `src/proxy.ts`, `src/app/api/animal-reports/photo-retention/route.ts`, `src/lib/animal-reports/photo-store.ts`, `src/lib/animal-reports/photo-retention.ts`, the security registry, eslint config, decision file
- [x] Cards: none affected. The route is bearer-guarded by the service-role key, uncarded on purpose; Admin and the signed-out public are unaffected (signed out gets 401)
- [x] Out of scope: the rate limit (#8t3rk), the form, the staff photo route, any storage policy or card

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in (one backlog.md conflict resolved)
- [x] `node scripts/gates.mjs` — closing lines, as printed:

```
=== gates: typecheck exited 0 after 96s
=== gates: lint exited 0 after 312s
=== gates: test exited 0 after 56s
=== gates: build exited 0 after 281s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on main — n/a: no migration in this PR
- [ ] apply-migrations --status reviewed — n/a: no migration in this PR
- [ ] apply-migrations --dry-run reviewed — n/a: no migration in this PR
- [ ] Applied to dev and recorded — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path on dev: two reports closed 100 days lost their photo; the 10-day and still-new reports kept theirs; an orphan with no row was removed; all four report rows survived (see Evidence)
- [x] Data persists: re-listing after the run showed the same state
- [ ] Create / edit / delete all exercised — n/a: the job only removes; fixtures were created and aged for the proof
- [x] Empty state: a run with nothing due returned zero expired and no errors (run 1)
- [x] Invalid input rejected: no bearer header returns 401
- [x] Boundary: a fresh orphan (under one hour) survived the default grace; a still-new report 100 days old kept its photo; 10 vs 100 days either side of the 90-day cut-off

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | route by URL | 401 without the service-role bearer, as any login | 401 |
| signed out | route by URL | 401 | 401 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (no bearer, no run)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: nothing a user sees changes
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI; the dev server log showed no errors
- [ ] Network clean — n/a: no page; the route answered 200 and 401 as expected

## 6. Regression

- [x] Nearest pages: the gates build compiled all routes, including report-animal and management/animal-reports
- [x] Shared files touched (`src/proxy.ts`, `worker/index.mjs`): the proxy change only adds one more bearer-guarded path beside the existing three; the other stages in the scheduled handler are unchanged, and the build and tests passed after the merge
- [x] Nothing merged from main during sync was broken (gates green after the merge)

## 7. Documentation

- [x] #6rkux ticked in `docs/backlog.md` on this branch
- [x] Decision file `docs/decisions/2026-11-14-report-photo-retention.md`
- [x] README still accurate
- [ ] **Release notes.** — n/a: a shelter user sees nothing change, and the job does not run on production until 0377 is applied and the Worker is deployed
- [x] Commit messages say why
- [x] Claims were measured: that a trigger resets handled_at was found by running it, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the 20:00 UTC tick is fixed in UTC, no local date is derived
- [ ] Boundary assertions cover both edges — n/a: covered under section 4 (10 vs 100 days, fresh vs aged orphan); the lib is server-only so no unit test exists
- [x] Evidence pasted into this plan is the tool's actual output (below)
- [ ] Public pages re-checked — n/a: no public page changes

### Deploy safety

- [ ] Production deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var exists in production — n/a: no new secret or env var

### Migration ordering

- [ ] Code and migration in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: purely additive; rolling the Worker back stops the job, and removed photos are not restorable by design

### Evidence (dev, real output)

Before: 4 report rows (OLD_RESOLVED 100d, OLD_DISMISSED 100d, RECENT_RESOLVED 10d, OLD_NEW 100d still open), each with its object, plus one orphan object.

Run 1, default grace, fixtures not yet aged: `{"expiredRemoved":0,"orphansRemoved":1,"scanned":7,"errors":[]}`. The fresh orphan survived; the one removed was an older stray object already on shared dev.

After ageing, run 2 with `orphan_grace_minutes=0`: `{"expiredRemoved":2,"orphansRemoved":1,"scanned":4,"errors":[]}`

After:
```
 OLD_RESOLVED(100d): row=true photo_path=- object=false
 OLD_DISMISSED(100d): row=true photo_path=- object=false
 RECENT_RESOLVED(10d): row=true photo_path=dbf69e61-cdd6-47cd-a438-13718b1e9cea.jpg object=true
 OLD_NEW(100d, still open): row=true photo_path=0f9bf2da-647b-4dcf-8df2-5d1dcbb36c89.jpg object=true
 ORPHAN(no row): row=false photo_path=- object=false
```

Left on dev: the four fixture report rows (description "retention proof fixture").

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 0 | none | none found | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The job runs on production only after 0377 is applied and the Worker is deployed, both Lutan's | production |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: 0377 apply and Worker deploy

Manual verification by: pending: 0377 and the Worker deploy are Lutan's; proved on dev

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: after merge
