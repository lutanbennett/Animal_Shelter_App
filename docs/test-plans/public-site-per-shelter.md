# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Public site state per shelter |
| Backlog item | `docs/backlog.md` → #wbsof |
| Branch / worktree | `claude/public-site-per-shelter` @ the `Animal_Shelter_public-site-per-shelter` folder |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | yes, 0426 |
| Tested at SHA | 4fa136c3d |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

## 2. Automated gates


- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code 0

```
=== gates: typecheck exited 0 after 92s
=== gates: lint exited 0 after 337s
=== gates: test exited 0 after 74s
=== gates: build exited 0 after 322s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: applied directly to dev (additive, re-runnable); production dry-run is section 8
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [x] Existing rows still read correctly after the change (checked against real dev data)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: asserted through the live RPC on dev (known host, unknown host, shelters list: new rows default locked, Lanna open) rather than a rollback harness; the check constraint is the only rule
- [x] Down-migration written, or the reason one is not needed is stated
- [x] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — n/a: nothing writes the column from the app yet
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no screen sets the column yet
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

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
| n/a | no page's access changed | grants nobody anything | n/a |

- [ ] Every login above tested — n/a: no page changed for any card; the change is a request-level state, tested in unit tests
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails — n/a: grants nobody anything (shelter configuration, not a card)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-visible screen
- [ ] Translatable strings go through the translation path, checked at `/management/translations — n/a: no new strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: not driven in a browser, see Left for manual verification
- [ ] Network clean — n/a: not driven in a browser, see Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven; unit tests cover signedInLandingPath in every state
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a secon — n/a: no shared nav/manual file touched; proxy.ts and page.tsx covered by typecheck, lint and build
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/li — n/a: production still owes migration 0426 before the Worker that sends the header is deployed, and nothing in the app sets a shelter's state yet, so no user would notice
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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in — n/a: no date logic
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both s — n/a: no banding or threshold; the floor ordering is asserted both directions
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 1 — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: additive column and a new function only
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Nothing in the app sets `shelters.public_site` yet; SQL only | deferred to backlog |

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

| 1 | With 0426 applied, set a second shelter to `off` and Lanna to `open`, deploy the Worker, and confirm each host shows/hides its website, robots.txt and sitemap | test Worker |

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

Automated checks by: Claude  Date: 2026-11-20

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: see the manual table, one item is pending

Manual verification by: pending: the two-shelter check on the test Worker

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: pasted when the PR is opened
- [ ] Handed to the production release manager — pending: release manager reads it before deploy

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
