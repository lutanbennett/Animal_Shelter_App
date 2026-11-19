# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Canary nightly runs trusted and untrusted passes |
| Backlog item | `docs/backlog.md` → #cnutr |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-19 |
| Carries a migration? | no |
| Tested at SHA | 27a5eef4b |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and t
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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ran, all four gates 0:

```
=== gates: typecheck exited 0 after 65s
=== gates: lint exited 0 after 186s
=== gates: test exited 0 after 57s
=== gates: build exited 0 after 189s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the  — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$  — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: a developer instrument, no UI, no migration, no deploy surface

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Data persists — reload the page and the change is still there — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: a developer instrument, no UI, no migration, no deploy surface

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

- [ ] Every login above tested — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: a developer instrument, no UI, no migration, no deploy surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Browser console clean — no errors or React warnings — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: a developer instrument, no UI, no migration, no deploy surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated p — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: a developer instrument, no UI, no migration, no deploy surface

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` — n/a: a nightly developer check, no shelter user can see it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` a

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; rea — n/a: a developer instrument, no UI, no migration, no deploy surface

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `nex — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever  — n/a: a developer instrument, no UI, no migration, no deploy surface
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the bo — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of res — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait  — n/a: a developer instrument, no UI, no migration, no deploy surface

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it th — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: a developer instrument, no UI, no migration, no deploy surface

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happ — n/a: a developer instrument, no UI, no migration, no deploy surface
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL  — n/a: a developer instrument, no UI, no migration, no deploy surface
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need thi
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: a developer instrument, no UI, no migration, no deploy surface

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the r — n/a: a developer instrument, no UI, no migration, no deploy surface

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

Automated checks by: Claude  Date: 2026-11-19

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick 

Manual verification by: n/a: a developer instrument, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted into the PR body at creation
- [ ] Handed to the production release manager — pending: release manager pre-deploy pass

Result: pass

Release manager acknowledgement: pending: release manager pre-deploy pass
