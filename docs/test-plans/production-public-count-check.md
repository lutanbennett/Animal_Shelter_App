# Feature test plan — production-public-count-check




---

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | `claude/production-public-count-check` @ `C:DevelopmentAnimal_Shelter_production-public-count-check` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |
| Tested at SHA | |

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with `gates: typecheck=0 lint=0 test=0 build=0`; closing lines pasted below, as the run printed them

```
=== gates: typecheck exited 0 after 232s
=== gates: lint exited 0 after 496s
=== gates: test exited 0 after 32s
=== gates: build exited 0 after 346s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same four gates, among its other checks). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to preven — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no UI, no migration, no app code; a read-only script check
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no UI, no migration, no app code; a read-only script check
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Applied to dev (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no UI, no migration, no app code; a read-only script check
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no UI, no migration, no app code; a read-only script check

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Data persists — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI, no migration, no app code; a read-only script check

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

- [ ] Every login above tested — n/a: no UI, no migration, no app code; a read-only script check
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI, no migration, no app code; a read-only script check

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Mobile viewport (375px) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Browser console clean — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Network clean — n/a: no UI, no migration, no app code; a read-only script check

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no UI, no migration, no app code; a read-only script check
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: no UI, no migration, no app code; a read-only script check

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: a read-only script check no shelter user sees
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

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: a script-only change; nothing is deployed or migrated
- [ ] Deployed SHA matches the tested SHA — n/a: a script-only change; nothing is deployed or migrated

### On the deployed build

- [ ] Deployed to test — n/a: a script-only change; nothing is deployed or migrated
- [ ] Smoke-tested on `test.lannacare.org` — n/a: a script-only change; nothing is deployed or migrated
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: a script-only change; nothing is deployed or migrated
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: a script-only change; nothing is deployed or migrated
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — n/a: a script-only change; nothing is deployed or migrated
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: a script-only change; nothing is deployed or migrated

### Deploy safety

- [ ] `deploy — n/a: a script-only change; nothing is deployed or migrated
- [ ] `strip-baked-env — n/a: a script-only change; nothing is deployed or migrated
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: a script-only change; nothing is deployed or migrated

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: a script-only change; nothing is deployed or migrated
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: a script-only change; nothing is deployed or migrated
- [ ] For a **destructive or rewriting** migration only — n/a: a script-only change; nothing is deployed or migrated
- [ ] Apply plan stated — n/a: a script-only change; nothing is deployed or migrated

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: a script-only change; nothing is deployed or migrated

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

Automated checks by: Claude  Date: 2026-11-10

### Manual verification


A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: pending: the production reading of both checks is the planner's

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects; script-only change
- [ ] Checklist pasted into the PR — n/a: no defects; script-only change
- [ ] Handed to the production release manager — n/a: no defects; script-only change

Result: pass

Release manager acknowledgement: n/a: script-only change
