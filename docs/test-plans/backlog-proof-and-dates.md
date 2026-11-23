# Feature test plan


---

## Header

| | |
|---|---|
| Feature | Backlog waiting check: shelter-day dates and proof-line report |
| Backlog item | `docs/backlog.md` → `#utcds`, `#prvln` |
| Branch / worktree | `claude/backlog-proof-and-dates` @ `C:DevelopmentAnimal_Shelter_backlog-proof-and-dates` |
| Dev server | n/a |
| PR | opened from claude/backlog-proof-and-dates |
| Tested by / date | Claude, 2026-11-23 |
| Carries a migration? | no |
| Tested at SHA | a34677710 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, their test, one decision file; no cards, admin and public unaffected; proof lines and `/plan-day` runner out of scope
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, their test, one decision file; no cards, admin and public unaffected; proof lines and `/plan-day` runner out of scope
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, their test, one decision file; no cards, admin and public unaffected; proof lines and `/plan-day` runner out of scope
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `scripts/check-backlog-waiting.mjs`, `scripts/lib/backlog-waiting.mjs`, their test, one decision file; no cards, admin and public unaffected; proof lines and `/plan-day` runner out of scope

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
- [x] `node scripts/gates.mjs` closing lines:

```
=== gates: typecheck exited 0 after 126s
=== gates: lint exited 0 after 342s
=== gates: test exited 0 after 92s
=== gates: build exited 0 after 288s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no othe — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before app — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `sch — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked aga — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `b — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is state — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Data persists — reload the page and the change is still there — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Boundary cases checked (long text, zero, negative, missing optio — n/a: no UI, no schema, no deploy: a repository check script only

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
| n/a: no page or login | | | |

- [ ] Every login above tested — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] A login that should not have access is blocked server-side (hitt — n/a: no UI, no schema, no deploy: a repository check script only

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the rig — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads corr — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Translatable strings go through the translation path, checked at — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Browser console clean — no errors or React warnings — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI, no schema, no deploy: a repository check script only

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared — n/a: no UI, no schema, no deploy: a repository check script only
- [ ] Nothing merged from `main` during `sync` was broken by this bran — n/a: no UI, no schema, no deploy: a repository check script only

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — `#utcds` ticked; `#prvln` noted as partly shipped and left open
- [x] Non-obvious design choices added — `docs/decisions/2026-11-23-backlog-proof-lines-and-shelter-dates.md`
- [ ] `README.md` still accurate — n/a: README does not mention this check
- [ ] **Release notes.** — n/a: a repository check script, nobody at a shelter or an Admin would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the date fault is shown by injected-instant tests, run under the default zone and `TZ=UTC`

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: no deploy surface, a repository script
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: no deploy surface, a repository script

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no deploy surface, a repository script
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no deploy surface, a repository script
- [x] Timezone-sensitive behaviour proved with injected instants against the real exports, both sides of 17:00Z, and the same suite under `TZ=UTC`
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [x] Boundary: assertions cover 16:59:59Z and 17:00:00Z, and future-date rejection on both sides, not only the reported 02:00 case
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no deploy surface, a repository script

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — n/a: no deploy surface, a repository script
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — n/a: no deploy surface, a repository script
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no deploy surface, a repository script

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no deploy surface, a repository script
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no deploy surface, a repository script
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. The README restore recipe **has** been exercised three times — `#q2vp7` locally, `#xa1jk` into a real Supabase project with a sign-in on 2026-10-19, `#rg7pv` into UAT's own project on 2026-11-09 — so what this line asks for is a fresh backup, not confidence in an unproven recipe. `docs/decisions/2026-11-09-restore-risk-settled.md`.) — n/a: no deploy surface, a repository script
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no deploy surface, a repository script

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: no deploy surface, a repository script

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
| 1 | Nothing: no surface a person needs to look at | n/a |

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

Automated checks by: Claude  Date: 2026-11-23

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [x] The manual list above is empty — nothing for a person to look at

Manual verification by: n/a: a repository check script, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and linked from the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy

Result: pass

Release manager acknowledgement: pending: release manager's pre-deploy pass
