# Feature test plan: test-calendar-split

## Header

| | |
|---|---|
| Feature | Give test its own Google Calendar |
| Backlog item | `docs/backlog.md` → Give test its own Google Calendar |
| Branch / worktree | `claude/test-calendar-split` @ `C:\Development\Animal_Shelter_test-calendar-split` |
| Dev server | n/a: config only |
| PR | this PR |
| Tested by / date | Claude, 2026-10-22 |
| Carries a migration? | no |
| Tested at SHA | 2de93aa6 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: test's GOOGLE_CALENDAR_ID now names its own calendar; production's is untouched
- [x] Files/areas touched listed: `.env.local` (gitignored), docs/decisions, docs/backlog.md, this plan; no src/
- [x] Roles affected identified: none, no UI or code change; staff using the test calendar only
- [x] Out of scope written down: production env and deploy untouched; clearing old test events from the real calendar

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends as pasted below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] status reviewed — n/a: no migration
- [ ] dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: refresh token lists the new calendar over the Calendar API, HTTP 200, title and Asia/Bangkok zone as expected
- [ ] Data persists — n/a: no UI or data change
- [ ] Create / edit / delete — n/a: no code change
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no code change

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no UI | n/a | n/a |

- [ ] Every role above tested — n/a: no UI surface
- [ ] Role blocked server-side — n/a: no access change

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no user-visible change
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] Nearest pages — n/a: no code or page changed
- [ ] Shared file touched — n/a: no shared file touched
- [x] Nothing merged from main during sync was broken: gates pass after sync

## 7. Documentation

- [x] Backlog item ticked in docs/backlog.md on this branch
- [x] Decision added: docs/decisions/2026-10-22-test-and-production-never-share-a-calendar.md
- [ ] README — n/a: no README content covers this
- [ ] **Release notes.** n/a: test-environment config only, no shelter user would notice
- [x] Commit messages say why
- [x] Claims in commit messages were measured: API response checked, hashes compared

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [x] Deployed to test: `deploy.mjs --env test --secrets` exited 0, Worker version 1e378766
- [ ] Smoke-tested on test.lannacare.org — deferred: Lutan, needs a signed-in session
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is tool output — n/a: only the gates line above, pasted unedited
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] Deploy safety: production ref — n/a: no production deploy in this PR
- [ ] strip-baked-env seen — n/a: test deploy only, output not retained
- [ ] New secret exists in production — n/a: no new secret
- [ ] Migration ordering — n/a: no migration
- [ ] Dry-run production — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: put the old id back in .env.local and redeploy test; production unaffected

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Calendar link Lutan pasted was the public iCal address, so the calendar may be public | deferred to Lutan: untick Make available to public |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Book a vet visit on test: it appears in the TEST calendar and not in the real "Lanna Care: vet visits" one | test.lannacare.org, signed in |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-22

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: item 1 is pending, a person has not yet looked

Manual verification by: pending: a signed-in person books a visit on test and checks it lands in the TEST calendar only

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
