# Test plan: csp-client-fetch-check

Evidence: `node --test worker/csp-client-fetch.test.mjs` 5 pass / 0 fail. Blind spots are in the test header and the decision file. The csp-report answer is by reading, not observed.

## Header

| | |
|---|---|
| Feature | csp-client-fetch-check |
| Backlog item | `docs/backlog.md` → #wltz7 |
| Branch / worktree | `claude/csp-client-fetch-check` @ `C:DevelopmentAnimal_Shelter_csp-client-fetch-check` |
| Dev server | n/a, no UI |
| PR | pending |
| Tested by / date | Claude, 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | HEAD |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, worker/, supabase/migrations/, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labe
- [x] Anything explicitly out of scope written down, so the release manager is not surprised

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all four
gates (typecheck, lint, test, build) even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with the gates line; output below

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on main, and no other in-flight branch carries o — n/a: test-only change, no UI, no schema, no route
- [ ] node scripts/apply-migrations.mjs --status reviewed before applying — n/a: test-only change, no UI, no schema, no route
- [ ] node scripts/apply-migrations.mjs --dry-run reviewed — n/a: test-only change, no UI, no schema, no route
- [ ] Applied to dev (qxkmhwybjggxvsfxsxbd) and recorded in schema_migrations — n/a: test-only change, no UI, no schema, no route
- [ ] File is re-runnable (if not exists / or replace / drop … if exists) — n/a: test-only change, no UI, no schema, no route
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: test-only change, no UI, no schema, no route
- [ ] Constraints and defaults exercised against real rows in a begin; … rollback; harness — n/a: test-only change, no UI, no schema, no route
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: test-only change, no UI, no schema, no route
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: test-only change, no UI, no schema, no route

## 4. Functional checks

- [ ] Happy path works end to end — n/a: test-only change, no UI, no schema, no route
- [ ] Data persists — n/a: test-only change, no UI, no schema, no route
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: test-only change, no UI, no schema, no route
- [ ] Empty state renders sensibly (no rows yet) — n/a: test-only change, no UI, no schema, no route
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: test-only change, no UI, no schema, no route
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: test-only change, no UI, no schema, no route

### Role access matrix

Sign in as each login that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

Analyse by CARD, not by role (`CLAUDE.md`, *All analysis is by CARD, never by role*): roles are
a transient grouping of cards and get rebuilt, so a row naming one stops being true. Test a
login holding exactly the card under test (`node scripts/dev-signin.mjs --cards <card> --port <yours>`,
card keys, not activity names), plus admin (outside the card system) and signed out. Where a page
needs two cards together, put both on one row. Do not name `staff` (retired, `0173`) or `resident`
(not a role: a resident is an animal). Read card keys from `/admin/who-does-what`.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| exactly `<card key>` | | | |
| exactly `<card key>` | | | |
| signed out | | | |

- [ ] Every login above tested — n/a: test-only change, no UI, no schema, no route
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails — n/a: test-only change, no UI, no schema, no route

## 5. Cross-cutting

- [ ] Nav entry correct (src/app/NavLinks.tsx) — n/a: test-only change, no UI, no schema, no route
- [ ] Manual updated (src/lib/manual/en.ts) and the topic reads correctly at /manual — n/a: test-only change, no UI, no schema, no route
- [ ] Translatable strings go through the translation path, checked at /management/translations — n/a: test-only change, no UI, no schema, no route
- [ ] Mobile viewport (375px) — n/a: test-only change, no UI, no schema, no route
- [ ] Browser console clean — n/a: test-only change, no UI, no schema, no route
- [ ] Network clean — n/a: test-only change, no UI, no schema, no route

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: test-only change, no UI, no schema, no route
- [ ] Any shared file touched (NavLinks.tsx, manual/en.ts, shared libs) checked from a second, u — n/a: test-only change, no UI, no schema, no route
- [ ] Nothing merged from main during sync was broken by this branch — n/a: test-only change, no UI, no schema, no route

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Decision file `docs/decisions/2026-11-04-csp-client-fetch-check.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a test that guards a header changes nothing a user sees
- [x] Commit messages say why, not just what
- [x] Claims were measured: the scan and test results were run; the csp-report answer is stated as by reading, not observed

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of main at deploy time — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Deployed SHA matches the tested SHA — deferred: release manager (test-only change, nothing to deploy-check)

### On the deployed build

- [ ] Deployed to test: npm run deploy:test — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour. Workers run in UTC — deferred: release manager (test-only change, nothing to deploy-check)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both sid — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited. A hand-maintained ta — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Public pages (/, /adopt, /our-work, /donate) re-checked after a cache purge or a 10-minute — deferred: release manager (test-only change, nothing to deploy-check)

### Deploy safety

- [ ] deploy: production → Supabase project <ref> line read and the ref matches production. scri — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] strip-baked-env: removed N env var(s) from the Worker bundle seen in the deploy output — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager (test-only change, nothing to deploy-check)

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] node scripts/apply-migrations.mjs --env production --dry-run run and clean — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh. (A — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the depl — deferred: release manager (test-only change, nothing to deploy-check)

### Rollback

- [ ] Rollback position stated, including what it does not cover. Production is served by the Pi — deferred: release manager (test-only change, nothing to deploy-check)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up. Listing them again in this
table gives them a second home that nothing ever closes: the check gets done at
deploy time, section 8 is satisfied, and this row stays open for good. Five
release-cut plans accumulated permanently-open rows exactly that way before it
was noticed (2026-09-27).

The test for whether something belongs here: **would a person have to go and look
at it, separately from deploying?** A doctor's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed — deferred: release manager (test-only change, nothing to deploy-check)

Automated checks by: Claude  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above — deferred: release manager (test-only change, nothing to deploy-check)
- [x] Checklist pasted into the PR — deferred: release manager (test-only change, nothing to deploy-check)
- [ ] Handed to the production release manager — n/a: handed over when the release is cut — deferred: release manager (test-only change, nothing to deploy-check)

Result: pass

Release manager acknowledgement: pending
