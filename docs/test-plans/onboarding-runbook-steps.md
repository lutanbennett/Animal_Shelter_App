# Feature test plan — onboarding-runbook-steps

## Header

| | |
|---|---|
| Feature | onboarding-runbook-steps: docs/shelter-onboarding-runbook.md |
| Backlog item | `docs/backlog.md` → #onbrb (first half only; deliberately not ticked) |
| Branch / worktree | `claude/onboarding-runbook-steps` @ `C:DevelopmentAnimal_Shelter_onboarding-runbook-steps` |
| Dev server | n/a: no UI touched |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | e41a4674c |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one new operator document, as the brief asked
- [x] Files/areas touched: docs/shelter-onboarding-runbook.md, docs/decisions/2026-11-18-shelter-onboarding-runbook.md, this plan; nothing else
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: no card, page or access behaviour changes; one new document under docs/
- [x] Out of scope: screenshots, #shmgt's screen and objects, any change to the four scripts or manual-screenshots.mjs, the backlog

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
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`; output as printed by my run:

```
=== gates: typecheck exited 0 after 8s
=== gates: lint exited 0 after 181s
=== gates: test exited 0 after 41s
=== gates: build exited 0 after 46s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] Data persists — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)

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

- [ ] Every login above tested — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI or code; the document was rehearsed instead (see section 7 and the decision file)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page, string or nav entry changes
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no page, string or nav entry changes
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no page, string or nav entry changes
- [ ] Mobile viewport (375px) — n/a: no page, string or nav entry changes
- [ ] Browser console clean — n/a: no page, string or nav entry changes
- [ ] Network clean — n/a: no page, string or nav entry changes

## 6. Regression

- [x] The pages nearest the change: none exist; ran the connect script and export with refusing inputs to check the document's claims
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no shared file touched

## 7. Documentation

- [ ] Backlog item ticked — n/a: #onbrb is half delivered on purpose and the brief forbids ticking it or editing the backlog
- [x] Non-obvious design choices added as docs/decisions/2026-11-18-shelter-onboarding-runbook.md
- [ ] README.md still accurate — n/a: not touched (a typo in its export command is reported in the PR)
- [ ] **Release notes.** n/a: an operator document; nothing a shelter user sees changes
- [x] Commit messages say why, not just what
- [x] Claims were measured: each documented refusal was run, and the token error was found that way

## 8. Pre-production gate

Owned jointly with the release manager. **The three hosts, as they stand since
2026-11-08:**

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT**, the customer's acceptance-test site | its own project, `fsjagxmxjosauwmxwype`, on a second Supabase account |

**`lannacare.org` is now a 301 to production and is a check of nothing.** It was
production until 2026-11-05 and UAT from then until 2026-11-08, so a plan written
from this template before today may name it as either, and both readings were
correct when written. **UAT is deployed on every release since 2026-11-08**
(`docs/release-procedure.md`, step 6), last of the three.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — deferred: release manager
- [ ] Public pages (/, /adopt, /our-work, /donate) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] deploy: production → Supabase project <ref> line read and the ref **matches production** — deferred: release manager
- [ ] strip-baked-env: removed N env var(s) from the Worker bundle seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below — deferred: release manager
- [ ] node scripts/apply-migrations.mjs --env production --dry-run run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, — n/a: documents only; reverting the commit removes them

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

- [x] Everything verifiable without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list is empty — n/a: nothing for a person to look at

Manual verification by: n/a: a document; the steps that write were deliberately not run, so Lutan's first real onboarding is the manual check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — n/a: docs-only, nothing deploys

Result: pass

Release manager acknowledgement: pending: docs-only change, nothing to deploy
