# Feature test plan

## Header

| | |
|---|---|
| Feature | Sign-in redirect allow-list check |
| Backlog item | `docs/backlog.md` → #aucbk (left open, note added) |
| Branch / worktree | `claude/callback-allowlist-check` @ `C:\Development\Animal_Shelter_callback-allowlist-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: opened after this plan |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | f109f9672 |

## 1. Scope and risk

- [x] Change is described in one sentence: `check-deployed-hosts.mjs` also fails when an address has no `/auth/callback` entry in the environment's Supabase allow-list, and reports `site_url`
- [x] Files touched: `scripts/check-deployed-hosts.mjs`, `scripts/lib/deployed-hosts.mjs`, `scripts/deployed-hosts.test.mjs`, `docs/release-procedure.md`, decision file, backlog note
- [x] Cards affected: none, it is a read-only release script; admin and the public unaffected
- [x] Out of scope: any Supabase setting, UAT and production runs, `#nxtqs`, CI wiring

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly before the gates run
- [x] `node scripts/gates.mjs` ends with one line

```
=== gates: typecheck exited 0 after 90s
=== gates: lint exited 0 after 335s
=== gates: test exited 0 after 73s
=== gates: build exited 0 after 408s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: dev run reads the real endpoint and prints list, `site_url`, per-address result
- [ ] Data persists — n/a: read-only script
- [ ] Create / edit / delete — n/a: read-only script
- [ ] Empty state — n/a: an empty list is covered by a unit test (every address missing)
- [x] Invalid input: API error or missing `uri_allow_list` exits 1 with a message
- [x] Boundary: glob entry, other-host entry, empty list, `www.` forms covered in `scripts/deployed-hosts.test.mjs`

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | no app surface | n/a | n/a |

- [ ] Every login tested — n/a: no app surface
- [ ] Blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest thing, the `shelter_hosts` half of the same script, still passes on dev
- [ ] Shared file touched — n/a: only a script library shared with the hosts check, exercised by the same run
- [x] Nothing merged from `main` was broken by this branch

## 7. Documentation

- [x] Backlog item note added on this branch (left open: UAT and production runs outstanding)
- [x] Decision file `docs/decisions/2026-11-20-callback-allowlist-check.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a release script, nobody at a shelter or an Admin would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the endpoint shape and dev's output come from the real run

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding — n/a: none
- [ ] Evidence is the tool's actual output — n/a: dev output is quoted unedited in the PR body
- [ ] Public pages re-checked — n/a: no public change
- [ ] deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: scripts only, nothing deployed; revert the commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Dev fails the new check: no entry for `www.test.lannacare.org` | accepted, expected, the check's purpose; not fixed per brief |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no surface a person needs to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is in the PR as a file
- [ ] Handed to the production release manager — pending: the planner runs UAT and production

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
