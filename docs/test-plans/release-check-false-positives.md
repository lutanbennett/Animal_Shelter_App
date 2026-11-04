# Feature test plan — release-check-false-positives

## Header

| | |
|---|---|
| Feature | Two release checks that reported a fault where there was none: `#pte7h` (code-identity diff in the runbook) and `#kvg7d` (`check-test-plan.mjs` and `admin: true` notes) |
| Backlog item | `docs/backlog.md` → **THE CODE-IDENTITY CHECK COUNTS REPO TOOLING AS SERVED CODE…** (`#pte7h`) and **`check-test-plan.mjs` DOES NOT KNOW ABOUT AN `admin: true` RELEASE NOTE…** (`#kvg7d`), both ticked |
| Branch / worktree | `claude/release-check-false-positives` @ `C:DevelopmentAnimal_Shelter_release-check-false-positives` |
| Dev server | not started: no UI surface |
| PR | see the PR that carries this file |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `d32c2604` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `#pte7h`: the runbook's code-identity diff is now an allow-list of what is built or run at deploy; `#kvg7d`: `check-test-plan.mjs` treats `admin: true` as a tagged note. Matches both backlog items.
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/release-procedure.md`, `scripts/check-test-plan.mjs`, `scripts/lib/release-note-tags.mjs` (new), `scripts/release-note-tags.test.mjs` (new), `docs/backlog.md` (two ticks), `docs/decisions/2026-11-04-release-check-false-positives.md`. No `supabase/`, `worker/` or `src/`.
- [x] Cards affected identified — None: no screen, permission or card changes. Admin and signed-out are unaffected.
- [x] Anything explicitly out of scope written down, so the release manager is not surprised — Out of scope: `deploy.mjs` printing its build SHA beside the release SHA (optional suggestion in `#pte7h`, not built); any other noisy check.

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date").
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code 0. Output below is the run's own:

```
=== gates: typecheck exited 0 after 149s
=== gates: lint exited 0 after 338s
=== gates: test exited 0 after 22s
=== gates: build exited 0 after 193s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness  — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: release tooling and documentation only; no migration, UI, route or database surface

## 4. Functional checks

- [ ] Happy path works end to end — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Data persists — reload the page and the change is still there — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: release tooling and documentation only; no migration, UI, route or database surface

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

- [ ] Every login above tested — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: release tooling and documentation only; no migration, UI, route or database surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Browser console clean — no errors or React warnings — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: release tooling and documentation only; no migration, UI, route or database surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Any shared file touched (`NavLinks — n/a: release tooling and documentation only; no migration, UI, route or database surface
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: release tooling and documentation only; no migration, UI, route or database surface

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (follow-ups go on the `backlog` branch instead) — Both `#pte7h` and `#kvg7d` ticked on this branch with a DONE note; no other item closed (grep for `check-test-plan`, `code-identity`, `release-procedure`, `admin: true` found no other open item).
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-11-04-release-check-false-positives.md`, including allow-list versus deny-list and its risk.
- [x] `README.md` still accurate — Not affected: it does not describe either check.
- [ ] Release notes. Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, in this PR, written for a shel — n/a: release tooling; no shelter user would notice either check changing
- [x] Commit messages say why, not just what — Say why (`#pte7h`/`#kvg7d` and what each check got wrong).
- [x] Claims in commit messages and `docs/decisions — Measured: none of the eight `0.42.0` files matches the allow-list (grepped); `scripts/pi/` and `scripts/lib` import chain read from `deploy-pi.sh`, `deploy.mjs`, `actions-key.mjs`; 5 new tests pass.

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager, at deploy; nothing here is deployed behaviour

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — deferred: release manager, at deploy; nothing here is deployed behaviour
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary  — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait  — deferred: release manager, at deploy; nothing here is deployed behaviour

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production. `scripts/lib/env.mjs` resolves shell over `.env.deploy.product — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.loc — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager, at deploy; nothing here is deployed behaviour

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] `node scripts/apply-migrations — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] For a destructive or rewriting migration only — deferred: release manager, at deploy; nothing here is deployed behaviour
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, at deploy; nothing here is deployed behaviour

### Rollback

- [ ] Rollback position stated, including what it does not cover — deferred: release manager, at deploy; nothing here is deployed behaviour

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
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-04

### Manual verification
- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: nothing here has a surface a person needs to look at

Manual verification by: n/a: nothing to look at; release tooling with no screen

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: release tooling; nothing for the production release manager to apply beyond reading the merged runbook

Result: pass

Release manager acknowledgement: pending: production release manager reads the merged runbook at the next release
