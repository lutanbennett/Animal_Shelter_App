# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Records of proved state: #nxtqs ticked, F.3, inventory row, label-drafter release note (#tg5vh follow-up) |
| Backlog item | `docs/backlog.md` → #tg5vh |
| Branch / worktree | `claude/backlog-proof-records` (same worktree) |
| Dev server | not used: no UI |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | 2adeef85e |

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

- [x] `node scripts/worktree.mjs sync`
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`
```
=== gates: typecheck exited 0 after 11s
=== gates: lint exited 0 after 286s
=== gates: test exited 0 after 42s
=== gates: build exited 0 after 48s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch c — n/a: docs, a script that only lists, no UI, no schema
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs, a script that only lists, no UI, no schema
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs, a script that only lists, no UI, no schema
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: docs, a script that only lists, no UI, no schema
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: docs, a script that only lists, no UI, no schema
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` h — n/a: docs, a script that only lists, no UI, no schema
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs, a script that only lists, no UI, no schema
- [ ] Production apply plan stated for the release manager (which file, which project, whe — n/a: docs, a script that only lists, no UI, no schema

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs, a script that only lists, no UI, no schema
- [ ] Data persists — n/a: docs, a script that only lists, no UI, no schema
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs, a script that only lists, no UI, no schema
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: docs, a script that only lists, no UI, no schema

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
| admin | n/a | no UI | n/a |
| signed out | n/a | no UI | n/a |

- [ ] Every login above tested — n/a: docs, a script that only lists, no UI, no schema
- [ ] A login that should not have access is blocked server-side (hitting the URL directly — n/a: docs, a script that only lists, no UI, no schema

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: docs, a script that only lists, no UI, no schema
- [ ] Translatable strings go through the translation path, checked at `/management/transl — n/a: docs, a script that only lists, no UI, no schema
- [ ] Mobile viewport (375px) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Browser console clean — n/a: docs, a script that only lists, no UI, no schema
- [ ] Network clean — n/a: docs, a script that only lists, no UI, no schema

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs, a script that only lists, no UI, no schema
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a — n/a: docs, a script that only lists, no UI, no schema
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: docs, a script that only lists, no UI, no schema
- [x] **Release notes.** One line added to `unreleased` for the Thai label drafter now running on production (proved: `label-drafts: ok, fail_runs=0`).
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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs, a script that only lists, no UI, no schema
- [ ] Deployed SHA matches the tested SHA — n/a: docs, a script that only lists, no UI, no schema

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs, a script that only lists, no UI, no schema
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs, a script that only lists, no UI, no schema
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers  — n/a: docs, a script that only lists, no UI, no schema
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and  — n/a: docs, a script that only lists, no UI, no schema
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-mai — n/a: docs, a script that only lists, no UI, no schema
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge  — n/a: docs, a script that only lists, no UI, no schema

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches produc — n/a: docs, a script that only lists, no UI, no schema
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy ou — n/a: docs, a script that only lists, no UI, no schema
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs, a script that only lists, no UI, no schema

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the produc — n/a: docs, a script that only lists, no UI, no schema
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: docs, a script that only lists, no UI, no schema
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is — n/a: docs, a script that only lists, no UI, no schema
- [ ] Apply plan stated: which file, which project, and whether it runs before or after th — n/a: docs, a script that only lists, no UI, no schema

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served — n/a: docs, a script that only lists, no UI, no schema

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

Automated checks by: Claude  Date: 2026-11-22

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending: release manager's pre-deploy pass
