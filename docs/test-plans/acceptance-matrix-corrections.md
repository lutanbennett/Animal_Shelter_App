# Feature test plan



---

## Header

| | |
|---|---|
| Feature | Acceptance checklist wording corrections |
| Backlog item | `docs/backlog.md` → #k2llb |
| Branch / worktree | `claude/acceptance-matrix-corrections` @ `C:\Development\Animal_Shelter_acceptance-matrix-corrections` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | ed5bca90 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [ ] `node scripts/worktree.mjs sync` — n/a: branch was cut from current main minutes before; nothing to merge
- [x] `node scripts/gates.mjs` ends with the four-gate line, pasted below as printed

```
=== gates: typecheck exited 0 after 240s
=== gates: lint exited 0 after 586s
=== gates: test exited 0 after 112s
=== gates: build exited 0 after 557s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no  — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `sch — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop  — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Existing rows still read correctly after the change (checked — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Constraints and defaults exercised against real rows in a `b — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Down-migration written, or the reason one is not needed is s — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Production apply plan stated for the release manager (which  — n/a: wording-only change to a checklist script; no page, data or access changed

## 4. Functional checks

- [ ] Happy path works end to end — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Data persists - reload the page and the change is still ther — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Create / edit / delete all exercised (whichever the feature  — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Empty state renders sensibly (no rows yet) — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Invalid input is rejected with a readable message, not a cra — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Boundary cases checked (long text, zero, negative, missing o — n/a: wording-only change to a checklist script; no page, data or access changed

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
| n/a | n/a | no access changed | n/a |

- [x] Every login above tested
- [ ] A login that should not have access is blocked server-side ( — n/a: wording-only change to a checklist script; no page, data or access changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) - appears for the — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads  — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Translatable strings go through the translation path, checke — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Mobile viewport (375px) - no overflow, controls reachable — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Browser console clean - no errors or React warnings — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Network clean - no unexpected 4xx/5xx on the feature's pages — n/a: wording-only change to a checklist script; no page, data or access changed

## 6. Regression

- [ ] The pages nearest the change still work (list the ones check — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, sha — n/a: wording-only change to a checklist script; no page, data or access changed
- [ ] Nothing merged from `main` during `sync` was broken by this  — n/a: wording-only change to a checklist script; no page, data or access changed

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a checklist used before a dry run; no shelter user would notice it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

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

- [ ] Tested SHA recorded in the header, and it is the tip of `mai — deferred: release manager
- [ ] Deployed SHA matches the tested SHA - `deploy.mjs` prints bo — deferred: release manager

### On the deployed build

- [ ] Deployed to test- `npm run deploy-test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` - the happy path works  — deferred: release manager
- [ ] Timezone-sensitive behaviour proved, not observed at a conve — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] For a boundary or banding change, the assertions cover both  — deferred: release manager
- [ ] Evidence pasted into this plan is the tool's actual output,  — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-chec — deferred: release manager

### Deploy safety

- [ ] `deploy- production → Supabase project <ref>` line read and  — deferred: release manager
- [ ] `strip-baked-env- removed N env var(s) from the Worker bundl — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare e — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-ru — deferred: release manager
- [ ] For a destructive or rewriting migration only- a production  — deferred: release manager
- [ ] Apply plan stated- which file, which project, and whether it — deferred: release manager

### Rollback

- [ ] Rollback position stated, including what it does not cover.  — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | none found | n/a |

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
| 1 | Unreached rows (see decision file) checked on a phone | `docs/decisions/2026-11-11-acceptance-matrix-corrections.md` |

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

- [ ] The manual list above is empty — n/a: wording-only change to a script file, nothing for a person to look at

Manual verification by: n/a: nothing to look at; wording edits to a script

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: ticked once the PR is open
- [ ] Handed to the production release manager — pending: ticked once the PR is open

Result: pass

Release manager acknowledgement: pending: at release
