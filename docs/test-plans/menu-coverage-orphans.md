# Feature test plan — menu-coverage-orphans

## Header

| | |
|---|---|
| Feature | Account menu gains Manual and Release notes; first pass at working the menu-coverage orphan list down (80 to 68) |
| Backlog item | `docs/backlog.md` → **Choose each role's home tiles … no left-hand menu** (status note added; item left open) |
| Branch / worktree | `claude/menu-coverage-orphans` @ `C:DevelopmentAnimal_Shelter_menu-coverage-orphans` |
| Dev server | not started — checked by the coverage script and the gates |
| PR | not yet opened at this commit |
| Tested by / date | Claude / 2026-10-15 |
| Carries a migration? | no |
| Tested at SHA | `d282ac9f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Account menu gets two links (manual, release notes); the coverage declarations record them
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/AccountMenu.tsx`, `scripts/lib/menu-coverage-declared.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, one decision file
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every role that opens the app sees two more links in the account menu; no cell, card or policy changed
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: removing the menu, any new card, any card assignment, any cell change; the 68 orphans left are classified in the decision file

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 101s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 259s
=== gates: test — npm test
=== gates: test exited 0 after 4s
=== gates: build — npm run build
=== gates: build exited 0 after 392s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` — n/a: no migration in this PR
- [ ] Existing rows still read correctly after — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one — n/a: no migration in this PR
- [ ] Production apply plan stated for the — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — `check-menu-coverage.mjs` re-run: the manual and releases links are found in `AccountMenu.tsx` and both pages now read `ok` for all six roles (80 → 68)
- [ ] Data persists — reload the page and the chan — n/a: no data, form or input in this change; it adds two links
- [ ] Create / edit / delete all exercised (whiche — n/a: no data, form or input in this change; it adds two links
- [ ] Empty state renders sensibly (no rows yet) — n/a: no data, form or input in this change; it adds two links
- [ ] Invalid input is rejected with a readable me — n/a: no data, form or input in this change; it adds two links
- [ ] Boundary cases checked (long text, zero, neg — n/a: no data, form or input in this change; it adds two links

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | account menu | two new links | n/a — not driven in a browser |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no policy, cell or card changed; both pages already opened for every role that opens the app, only the way to them is new
- [ ] A role that should not have access is blocke — n/a: no policy, cell or card changed; both pages already opened for every role that opens the app, only the way to them is new

## 5. Cross-cutting

- [x] Nav entry correct — no `NavLinks.tsx` change; the account menu links go to existing pages
- [ ] Manual updated — n/a: the manual's account topic already says every login can read the manual; no new behaviour to document
- [x] Translatable strings go through the translation path — the links use `t.nav.manual` and `t.nav.releaseNotes`, existing keys in both dictionaries (typecheck would fail otherwise)
- [ ] Mobile viewport (375px) — n/a: not driven in a browser; left for manual verification below
- [ ] Browser console clean — no errors  — n/a: no browser run in this change; left for manual verification below
- [ ] Network clean — no unexpected 4xx/ — n/a: no browser run in this change; left for manual verification below

## 6. Regression

- [x] The pages nearest the change still work — typecheck and the production build compile every page that imports the header
- [ ] Shared file touched — n/a: none of `NavLinks.tsx`, `manual/en.ts` or shared libs were touched; `AccountMenu.tsx` is used only by `AppHeader`
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item — not ticked on purpose (the item as a whole stays open); a dated status note was added to it, and no other open item's outcome was closed
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-15-menu-orphans-worked-down.md`
- [x] `README.md` still accurate — nothing in it describes the account menu
- [x] **Release notes.** `unreleased` has a line for the two new account-menu links; no manual step outstanding
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured — the 80 and 68 are the script's own output on dev

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl — deferred: production release manager, at deploy
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager, at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager, at deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager, at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient ho — deferred: production release manager, at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of — deferred: production release manager, at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited — deferred: production release manager, at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  — deferred: production release manager, at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ** — deferred: production release manager, at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — deferred: production release manager, at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: production release manager, at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If y — deferred: production release manager, at deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — deferred: production release manager, at deploy
- [ ] For a **destructive or rewriting** migration only: a production backup — deferred: production release manager, at deploy
- [ ] Apply plan stated: which file, which project, and whether it runs befo — deferred: production release manager, at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: production release manager, at deploy

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
| 1 | Tap your name in the header on a phone (375 px): Manual and Release notes appear, open the right pages, and the menu still fits | any signed-in login, dev |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-15

### Manual verification

One item, listed above: the account menu on a phone.

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is awaiting a person, see the signature below

Manual verification by: pending: Lutan to open the account menu on a phone

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: pasted once the PR exists
- [ ] Handed to the production release manager — n/a: handed over once the PR merges

Result: pass

Release manager acknowledgement: pending
