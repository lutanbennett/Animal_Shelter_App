# Test plan: control-check-false-positives


---

## Header

| | |
|---|---|
| Feature | Teach the control-activity check its false-positive patterns |
| Backlog item | `docs/backlog.md` → #79sqf (not ticked: pieces remain) |
| Branch / worktree | `claude/control-check-false-positives` @ `C:\Development\Animal_Shelter_control-check-false-positives` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | 178039b3 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog i — see Header and docs/decisions/2026-11-11-control-check-false-positives.md
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, — see Header and docs/decisions/2026-11-11-control-check-false-positives.md
- [x] Cards affected identified (the cards whose behaviour changes; who hold — see Header and docs/decisions/2026-11-11-control-check-false-positives.md
- [x] Anything explicitly — see Header and docs/decisions/2026-11-11-control-check-false-positives.md

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` — four gates, run output pasted below

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 116s
=== gates: test exited 0 after 32s
=== gates: build exited 0 after 127s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against r — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin;  — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, whic — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-control-activity.mjs` on the real tree: 0 new findings, 4 allow-list rows; `node --test scripts/check-control-activity.test.mjs`: 10 of 10 pass
- [ ] Data persists — n/a: script and test change only, no page or UI surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: script and test change only, no page or UI surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: script and test change only, no page or UI surface
- [x] Invalid input is rejected — a fixture finding exits 1 with `NOT CLEAN`; a stale allow-list row also exits 1
- [x] Boundary cases checked — every pattern has a negative fixture that must still fail (refusing `can()` in an `if`, wrong-page caller, uncovered arm, ungated submit, second `onSubmit` form)

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
| n/a: no page or access path changed | | | |

- [ ] Every login above tested — n/a: no page; the check reasons about cards statically
- [ ] A login that should not have access is blocked server-side — n/a: no access path changed; the check only reads source

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: script and test change only, no page or UI surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: script and test change only, no page or UI surface
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: script and test change only, no page or UI surface
- [ ] Mobile viewport (375px) — n/a: script and test change only, no page or UI surface
- [ ] Browser console clean — n/a: script and test change only, no page or UI surface
- [ ] Network clean — n/a: script and test change only, no page or UI surface

## 6. Regression

- [x] The pages nearest the change still work — the check was run on the whole real tree (750 controls), same totals as before for controls read and reaching an action
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync reported already up to date

## 7. Documentation

- [ ] Backlog item ticked — n/a: #79sqf is deliberately NOT ticked (brief deliverable 9): pieces remain, another stream has them; what is left is reported in the PR body for the planner
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-11-control-check-false-positives.md`
- [ ] `README.md` still accurate — n/a: README does not describe this check
- [ ] **Release notes.** — n/a: a CI script and its allow-list; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the 71 to 72 question was answered by running the check at three commits and diffing the lists; each pattern's tests were run against the script from before it

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient ho — n/a: no deployed-build surface in this PR (a CI script)
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of — n/a: no deployed-build surface in this PR (a CI script)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited — n/a: no deployed-build surface in this PR (a CI script)
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  — n/a: no deployed-build surface in this PR (a CI script)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If y — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — n/a: no migration in this PR
- [ ] For a — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs befo — n/a: no migration in this PR

### Rollback

- [ ] Rollback position stated, — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `MyTaskList` recurring arm and the two `ResidentPicker` rows remain on the allow-list as check limitations (predicate guard; tab-array gate) | accepted, reasons rewritten in the allow-list |

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
| | none: a script and its tests, nothing a person must look at | |

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

Automated checks by: Claude  Date: 2026-11-11

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, so nothing is signed for by a person — n/a on the signature below

Manual verification by: n/a: nothing a person must look at; a script and its tests

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is opened
- [ ] Handed to the production release manager — pending: at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release time
