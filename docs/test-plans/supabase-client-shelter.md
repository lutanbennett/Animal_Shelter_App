# Feature test plan

## Header

| | |
|---|---|
| Feature | Browser Supabase client may not read data (design record + guard test) |
| Backlog item | `docs/backlog.md` → #bcl1t |
| Branch / worktree | `claude/supabase-client-shelter` @ `C:\Development\Animal_Shelter_supabase-client-shelter` |
| Dev server | n/a |
| PR | pending: number assigned on creation |
| Tested by / date | Claude, 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | 461961ab7 |

## 1. Scope and risk

- [x] Change is described in one sentence: the browser Supabase client makes no data reads today, so the design is recorded and a test forbids any (backlog #bcl1t)
- [x] Files touched: `src/lib/supabase/browser-client-no-data.test.mjs`, `docs/decisions/2026-11-16-browser-client-shelter.md`, this plan
- [ ] Cards affected identified — n/a: no card, login or page behaviour changes; only a test is added
- [x] Out of scope: client.ts, server.ts, admin.ts, proxy.ts unchanged; no policy, no migration; Part 5 and the service-role call sites untouched

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: origin/main merged in before the gates ran
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 49s
=== gates: lint exited 0 after 207s
=== gates: test exited 0 after 39s
=== gates: build exited 0 after 166s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` — n/a: no migration
- [ ] `--dry-run` — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints and defaults — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [ ] Happy path — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no UI surface
- [ ] Boundary cases — n/a: no UI surface
- [ ] Every login tested — n/a: no login's access changes
- [ ] A login without access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual — n/a: no UI surface
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console — n/a: no UI surface
- [ ] Network — n/a: no UI surface

## 6. Regression

- [ ] Nearest pages — n/a: no page changed, test only
- [ ] Shared file touched — n/a: none touched
- [x] Nothing merged from main broke this branch (branch is on current main)

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; its Done-when asks for a signed-in-read proof that cannot exist before Part 5 (for the planner)
- [x] Decision file `docs/decisions/2026-11-16-browser-client-shelter.md`
- [x] README still accurate (not affected)
- [ ] **Release notes.** n/a: a test and a design note; no user-visible change
- [x] Commit messages say why
- [x] Claims were measured: the planted violation was caught by the test; the client call sites were read

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Boundary or banding — n/a: none
- [ ] Evidence is the tool's actual output — n/a: pasted unedited above
- [ ] Public pages — n/a: not touched
- [ ] Deploy safety ref — deferred: release manager
- [ ] strip-baked-env — deferred: release manager
- [ ] New secret/env var — n/a: none
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — deferred: release manager
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback — n/a: test only, nothing to roll back

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-16

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface and no behaviour change

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body carries the summary
- [ ] Handed to the production release manager — pending: next release

Result: pass

Release manager acknowledgement: pending: next release
