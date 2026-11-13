# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Drop sharp override; settle test /login 503 |
| Backlog item | `#qir2c`, `#q4m7t` |
| Branch / worktree | `claude/two-conditions-now-met` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | see PR |
| Tested by / date | Claude / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 52b9479b0 |

## 1. Scope and risk

- [x] Change: delete the sharp override from package.json (miniflare now asks for 0.35.5) and measure test /login
- [x] Files touched: package.json, docs/backlog.md, docs/decisions/, this plan. Nothing in src/ or worker/
- [ ] Cards affected — n/a: no card, page or access behaviour changes
- [x] Out of scope: why the 503 happened, any Worker change, any dependency upgrade

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

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` — all four gates exit 0; output below

```
=== gates: typecheck exited 0 after 193s
=== gates: lint exited 0 after 523s
=== gates: test exited 0 after 141s
=== gates: build exited 0 after 417s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight bran — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Existing rows still read correctly after the change (checked against real dev da — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Production apply plan stated for the release manager (which file, which project, — n/a: no UI, no migration; a dependency override removed and one read of test

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Data persists — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, date — n/a: no UI, no migration; a dependency override removed and one read of test

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


| signed out | | | |

- [ ] Every login above tested — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] A login that should not have access is blocked server-side (hitting the URL dire — n/a: no UI, no migration; a dependency override removed and one read of test

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manua — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Translatable strings go through the translation path, checked at `/management/tr — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Mobile viewport (375px) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Browser console clean — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Network clean — n/a: no UI, no migration; a dependency override removed and one read of test

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI, no migration; a dependency override removed and one read of test
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked fr — n/a: no UI, no migration; a dependency override removed and one read of test
- [x] Nothing merged from main during sync was broken by this branch (gates ran after sync’s merge base; see gates above)

## 7. Documentation

- [x] #qir2c and #q4m7t ticked in docs/backlog.md on this branch
- [x] docs/decisions/2026-11-13-two-conditions-now-met.md
- [x] README.md still accurate (does not mention the override)
- [x] README.md still accurate (does not mention the override)
- [x] Commit messages say why, not just what
- [x] Claims were measured: three sharp versions read from node_modules, npm ls, audit:register, curl headers

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
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — deferred: release manager
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. The README restore recipe **has** been exercised three times — `#q2vp7` locally, `#xa1jk` into a real Supabase project with a sign-in on 2026-10-19, `#rg7pv` into UAT's own project on 2026-11-09 — so what this line asks for is a fresh backup, not confidence in an unproven recipe. `docs/decisions/2026-11-09-restore-risk-settled.md`.) — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager

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

Automated checks by: Claude  Date: 2026-11-13

### Manual verification

<!-- guidance:start -->
The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so, e.g. `<name> —
confirmed in chat; line written by Claude at their request  Date: <yyyy-mm-dd>`.
Three valid states:

- `<name>  Date: <yyyy-mm-dd>` — a person looked. The date is required here.
- `n/a: <reason>` — there was nothing to look at.
- `pending: <what is outstanding>` — the work is done and something genuinely
  needs a person who has not got to it yet. **This does not fail the check**
  (changed 2026-09-24): it is the normal state for most of a PR's life, and a
  check that is permanently red is one people learn to filter. The checker prints
  *awaiting manual verification: <what>* and exits 0, so the outstanding item is
  on the record without drowning the signal. What still fails is a plan that is
  missing, incomplete or self-contradictory. Use `pending:` rather than reaching
  for `n/a` — green is no longer something you have to buy, and an `n/a` over a
  real outstanding item is a false assurance about the one thing you could not
  verify. **Nothing ships on a `pending:`** — the release manager's pre-deploy
  pass is what holds that line, not CI.

`n/a:` and `pending:` take **no `Date:` segment** — there is no date to record, so
write the line and stop. A trailing `Date: —` is accepted too, since existing
plans use it. A bare *name* with no date is still rejected, which is what stops an
empty signature quietly passing.
<!-- guidance:end -->

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — deferred: release manager

Manual verification by: n/a: nothing a person needs to look at; no UI surface

### Result

- [ ] Open defects are either fixed or explicitly accepted above — pending: release manager pre-deploy pass
- [ ] Checklist pasted into the PR — pending: release manager pre-deploy pass
- [ ] Handed to the production release manager — pending: release manager pre-deploy pass

Result: pass

Release manager acknowledgement: pending: release manager pre-deploy pass
