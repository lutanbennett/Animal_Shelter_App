# Test plan: fault-log-marking-pass

## Header

| | |
|---|---|
| Feature | Mark pane-artefact candidates in the card-access fault log |
| Backlog item | `docs/backlog.md` → pane marking-pass item (line 7) |
| Branch / worktree | `claude/fault-log-marking-pass` @ `C:\Development\Animal_Shelter_fault-log-marking-pass` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | c6b0aae6 |

## 1. Scope and risk

- [ ] Change is described in one sentence, and it matches what the backlog item asked for — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Anything explicitly **out of scope** written down, so the release manager is not surprised — n/a: docs-only change to an evidence log, no code, schema or UI

## 2. Automated gates

Run in the feature worktree, after `node scripts/worktree.mjs sync`, with
`node scripts/gates.mjs`. It exists because of the traps below: it runs all three
gates even when one fails, prints each one's own exit code, and refuses to start
on a half-installed `node_modules`.

**Tick these on the exit code, not on output that looks plausible.** Two ways a
gate reads green without having run: `npm run build | tail` reports the exit
status of `tail`, not of the build; and in a worktree where `npm ci` has not
finished linking `node_modules/.bin`, every script fails with "'next' is not
recognized" — which scrolls past as noise. Check each command's own status, and
wait for `worktree.mjs new` to exit before trusting the tree. A gate ticked
because nothing looked wrong is worse than one left unticked, because it is
indistinguishable from one that passed.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (one backlog.md conflict, resolved)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Evidence below.

```
=== gates: build exited 0 after 271s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: docs-only change to an evidence log, no code, schema or UI

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Data persists — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: docs-only change to an evidence log, no code, schema or UI

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. Roles are rows of the `roles` table, not an enum (`app_role`
was dropped by `0181`). The live ones are admin, management, second_in_command,
head_of_maintenance, head_of_medical, doctor, volunteer and public_viewer; `staff` is
retired (`0173`). **There is no `resident` role** — in this app a resident is an
animal — and do not re-derive this list by grepping for quoted strings; read the
`roles` table (or `/admin/who-does-what`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: docs-only change to an evidence log, no code, schema or UI

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Mobile viewport (375px) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Browser console clean — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Network clean — n/a: docs-only change to an evidence log, no code, schema or UI

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: docs-only change to an evidence log, no code, schema or UI

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** 
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [ ] `README.md` still accurate — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] **Release notes.** — n/a: a marking pass on an internal evidence log; nothing a shelter user sees.
- [x] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `li — n/a: docs-only change to an evidence log, no code, schema or UI

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Deployed SHA matches the tested SHA — n/a: docs-only change to an evidence log, no code, schema or UI

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Smoke-tested on `test.lannacare.org` — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so any — n/a: docs-only change to an evidence log, no code, schema or UI
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose ab — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: docs-only change to an evidence log, no code, schema or UI

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolv — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs-only change to an evidence log, no code, schema or UI

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the  — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns d — n/a: docs-only change to an evidence log, no code, schema or UI
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: docs-only change to an evidence log, no code, schema or UI

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./sc — n/a: docs-only change to an evidence log, no code, schema or UI

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | no defects | n/a |

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
| 1 | Lutan reads the marked log as a set (gate 3 of Card review 2); marking is not reviewing | `docs/card-access-faults.md` |

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

Automated checks by: Claude  Date: 2026-10-28

### Manual verification
- [ ] The manual list above is checked by a person — n/a: its one item is Lutan's review of the log, not a check of this change

Manual verification by: pending: Lutan reviewing the marked fault log (gate 3 of Card review 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: pasted when the PR opens
- [ ] Handed to the production release manager — n/a: docs-only, nothing to deploy

Result: pass

Release manager acknowledgement: pending: release manager
