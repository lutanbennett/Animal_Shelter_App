# Feature test plan



---

## Header

| | |
|---|---|
| Feature | Rate limit for the public report-an-animal form (recommendation) |
|---|---|
| Backlog item | `docs/backlog.md` → #8t3rk |
| Branch / worktree | `claude/report-form-rate-limit` @ `C:DevelopmentAnimal_Shelter_report-form-rate-limit` |
| Dev server | n/a, nothing rendered changed |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-11-15 |
| Carries a migration? | no |
| Tested at SHA | 14d17eb6d |

## 1. Scope and risk

- [x] Change: a written recommendation (one Cloudflare setting) plus a retitled backlog item, no code
- [x] Files: docs/decisions/2026-11-15-report-form-rate-limit.md, docs/backlog.md, this plan
- [x] Cards affected: none; no card involved by design (decision file says why); admin and signed-out public unchanged until the setting is applied
- [x] Out of scope: any code, Lutan's Cloudflare account, the merch order form's limits, production migration 0377

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

- [x] `node scripts/worktree.mjs sync` — origin/main merged cleanly
- [x] `node scripts/gates.mjs` run, all four exit codes 0:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 100s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 227s
=== gates: test — npm test
=== gates: test exited 0 after 60s
=== gates: build — npm run build
=== gates: build exited 0 after 257s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-f — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_mi — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exist — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against r — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin;  — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, whic — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Data persists — reload the page and the change is still there — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Boundary cases checked (long text, zero, negative, missing optional fi — n/a: no UI, route or code changed; the only artefacts are documents

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

- [ ] Every login above tested — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] A login that should not have access is blocked server-side (hitting th — n/a: no UI, route or code changed; the only artefacts are documents

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right car — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly  — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Translatable strings go through the translation path, checked at `/man — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Browser console clean — no errors or React warnings — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI, route or code changed; the only artefacts are documents

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs)  — n/a: no UI, route or code changed; the only artefacts are documents
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no UI, route or code changed; the only artefacts are documents

## 7. Documentation

- [ ] Backlog item ticked in docs/backlog.md — n/a: not ticked on purpose: the gap closes only when Lutan applies the setting; title rewritten instead
- [x] Decision file added: docs/decisions/2026-11-15-report-form-rate-limit.md
- [x] README unaffected, still accurate
- [x] README unaffected, still accurate
- [x] Commit messages say why
- [x] Claims were read from Cloudflare's own pages and the code; the fail-open behaviour is reasoned, and the decision file says so

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Work — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band  — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache pu — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches pr — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deplo — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the pr — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — i — deferred: release manager
- [x] README unaffected, still accurate
- [ ] Apply plan stated: which file, which project, and whether it runs before or afte — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is se — deferred: release manager

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

Automated checks by: Claude  Date: 2026-11-15

### Manual verification



A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above was checked by a person — pending: Lutan applies the setting and tests it

Manual verification by: pending: Lutan applies the Cloudflare rule from the decision file and tests it

### Result

- [x] Open defects are accepted above (burst-only limit)
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — pending: at release

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
