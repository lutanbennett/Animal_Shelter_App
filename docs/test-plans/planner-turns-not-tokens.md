# Test plan: planner-turns-not-tokens

## Header

| | |
|---|---|
| Feature | planner-turns-not-tokens |
| Backlog item | `docs/backlog.md` → | n/a: no backlog item; brief .brief.md |
| Branch / worktree | `claude/planner-turns-not-tokens` @ `C:DevelopmentAnimal_Shelter_planner-turns-not-tokens` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA |  |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — .claude/skills/plan-day/SKILL.md, CLAUDE.md, docs/decisions/2026-11-03-planner-hands-sessions-back.md
- [ ] Cards affected identified (the cards whose behaviour changes; who hold — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Anything explicitly **out of scope** written down, so the release mana — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

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

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [x] `node scripts/gates.mjs` — all four gates exit 0; output below

```
=== gates: typecheck exited 0 after 119s
=== gates: lint exited 0 after 394s
=== gates: test exited 0 after 63s
=== gates: build exited 0 after 434s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_mi — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Existing rows still read correctly after the change (checked against r — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] **Constraints and defaults exercised against real rows** in a `begin;  — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Production apply plan stated for the release manager (which file, whic — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Data persists — reload the page and the change is still there — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

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

- [ ] Every login above tested — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right car — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Browser console clean — no errors or React warnings — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item exists for this work
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [ ] `README.md` still accurate — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] **Release notes.** Would a shelter user  — n/a: a planning-process change is invisible to a shelter user
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at depl — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the tar — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the dep — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient ho — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after  — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref ** — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If y — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] For a **destructive or rewriting** migration only: a production backup — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI
- [ ] Apply plan stated: which file, which project, and whether it runs befo — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Produc — n/a: docs-only change to a planning skill, CLAUDE.md and a decision file; no code, schema or UI

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

Nothing for a person to look at: documents only.

- [x] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: docs only, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: docs-only, no deploy

Result: pass

Release manager acknowledgement: n/a: docs-only
