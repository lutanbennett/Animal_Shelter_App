# Feature test plan


---

## Header

| | |
|---|---|
| Feature | meme-tag-reads-who-and-where |
| Backlog item | `docs/backlog.md` → #t3n9r |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | pending |
| Tested by / date | Claude, 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | 99033e29 |

## 1. Scope and risk

- [x] Change is described: meme tags are read back through `resident_who_and_where` instead of `residents`, which is what backlog `#t3n9r` asked for
- [x] Files touched: `src/lib/memes/queries.ts`, `src/lib/medical/residents.ts` (comment only), `src/lib/releases.ts`, one decision file; no migration, no worker
- [x] Cards affected: `meme_add` and `meme_library` (both grant `resident.who_and_where`); Admin unaffected and still sees every resident through the view; signed-out public not involved
- [x] Out of scope: any card or view change; the `/memes/make` and `/memes/new` save-and-read-back drives (see manual list)

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

- [ ] `node scripts/worktree.mjs sync` — n/a: not run; the branch was cut from current `main` this session and sync is done at merge time
- [x] `node scripts/gates.mjs` ran on this branch (the release-note commit landed while typecheck and lint were already running; test and build ran after it):

```
=== gates: typecheck exited 0 after 251s
=== gates: lint exited 0 after 449s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 352s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration, the view is unchanged
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration, the view is unchanged
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration, the view is unchanged
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration, the view is unchanged
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration, the view is unchanged
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, the view is unchanged
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration, the view is unchanged
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration, the view is unchanged
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration, the view is unchanged

## 4. Functional checks

- [x] Happy path: with a login holding only `meme_add`, the meme detail page names the tagged resident "Test 1" (it read as none before the fix per the backlog item; not re-measured by me)
- [x] Data persists: the existing tag saved earlier reads back on reload of the detail page and on the edit page
- [ ] Create / edit / delete — pending: saving a new tag on `/memes/make`, `/memes/new` and an edit was not driven (the pane stopped registering clicks)
- [ ] Empty state — n/a: no empty-state change; a meme with no links still shows none
- [ ] Invalid input — n/a: no input handling changed, this is a read
- [ ] Boundary cases — n/a: read-only change; a link whose resident is missing from the view is skipped as before

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
| admin | not driven | n/a | n/a |
| exactly `meme_add` | /memes, /memes/[id], /memes/[id]/edit | Test 1 named | pass |
| exactly `meme_library` | not driven | n/a | n/a |
| signed out | not driven | n/a | n/a |

- [ ] Every login above tested — pending: only `meme_add` was driven; admin and signed-out were not
- [ ] A login that should not have access is blocked — n/a: no access rule changed, the view gate is untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no navigation change
- [ ] Manual updated — n/a: no behaviour a manual topic describes changed
- [ ] Translatable strings — n/a: no new string
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console — n/a: not inspected
- [ ] Network clean — n/a: not inspected

## 6. Regression

- [x] Pages checked: `/memes`, `/memes/[id]`, `/memes/[id]/edit`, all loaded by clicking through
- [x] `releases.ts` and `residents.ts` touched; both only add a note / change a comment, and the build passed
- [ ] Nothing merged from `main` during sync — n/a: no sync run yet

## 7. Documentation

- [ ] Backlog item ticked — n/a: not ticked on purpose, only three of five route proofs were driven; the planner decides
- [x] Decision file `docs/decisions/2026-11-10-meme-tag-reads-who-and-where.md`
- [ ] `README.md` — n/a: nothing in it describes this
- [x] **Release notes.** `unreleased` gained a line for a shelter user: tagged residents are named on the meme again
- [x] Commit messages say why
- [x] **Claims in commit messages and decisions were measured, not reasoned:** the view's gate was read from migrations 0134, 0192, 0263 and 0265

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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy time

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy time
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy time
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy time
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager at deploy time
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy time
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy time

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration, the view is unchanged
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager at deploy time
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. The README restore recipe **has** been exercised three times — `#q2vp7` locally, `#xa1jk` into a real Supabase project with a sign-in on 2026-10-19, `#rg7pv` into UAT's own project on 2026-11-09 — so what this line asks for is a fresh backup, not confidence in an unproven recipe. `docs/decisions/2026-11-09-restore-risk-settled.md`.) — deferred: release manager at deploy time
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy time

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager at deploy time

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `/memes/make` and `/memes/new` save-and-read-back not driven | deferred to backlog |

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
| 1 | As a `meme_add`-only login, tag a resident on `/memes/make` and `/memes/new`, save, and read the name on the meme | dev |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not executed

Automated checks by: Claude  Date: 2026-11-10

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above — pending: the `/memes/make` and `/memes/new` drives

Manual verification by: pending: the two untried routes

### Result

- [x] Open defects are fixed or accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: at release time

Result: pass with accepted defects

Release manager acknowledgement: pending: at release time
