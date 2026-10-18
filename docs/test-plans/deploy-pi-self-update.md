| Tested at SHA | e21a84c5 || Carries a migration? | no || Tested by / date | Claude / 2026-10-18 || PR | (see PR) || Dev server | not started — no UI surface || Branch / worktree | `claude/deploy-pi-self-update` @ `C:DevelopmentAnimal_Shelter_deploy-pi-self-update` || Backlog item | `docs/backlog.md` → **`deploy-pi.sh` updates itself mid-run** (ticked) || Feature | `deploy-pi.sh` re-execs the script it just checked out (option b) |# Feature test plan — deploy-pi-self-update

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch | claude/deploy-pi-self-update, worktree Animal_Shelter_deploy-pi-self-update |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |
| Tested at SHA | |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: no user-facing surface, an operator script
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — n/a: not yet — the PR does not exist at this commit

gates: typecheck=0 lint=0 test=0 build=0

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end (scripts/pi/check-self-update.mjs: 10 checks pass; the same harness FAILS 6 of them on the old script)
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface, a shell script
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface, a shell script
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface, a shell script
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface, a shell script
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface, a shell script

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

- [ ] Every role above tested — n/a: no UI surface, a shell script
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface, a shell script

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no UI surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) (the rest of deploy-pi.sh: refusals and guards still ordered as before; stubs exercised the full path to the end)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate (docs/pi-hosting.md and docs/release-procedure.md updated; README does not describe this)
- [ ] **Release notes.** n/a: an operator deploy script no shelter user would notice, and the fix is not seen on a real Pi until the next deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: Lutan, at the next Pi deploy
- [ ] Deployed SHA matches the tested SHA — deferred: Lutan, at the next Pi deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: Lutan, at the next Pi deploy
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, at the next Pi deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so any — deferred: Lutan, at the next Pi deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — deferred: Lutan, at the next Pi deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose ab — deferred: Lutan, at the next Pi deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: Lutan, at the next Pi deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolv — deferred: Lutan, at the next Pi deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: Lutan, at the next Pi deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: Lutan, at the next Pi deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the  — deferred: Lutan, at the next Pi deploy
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: Lutan, at the next Pi deploy
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns d — deferred: Lutan, at the next Pi deploy
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: Lutan, at the next Pi deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./sc — deferred: Lutan, at the next Pi deploy

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
| 1 | First real Pi deploy after merge shows `deploy-pi: restarting under the script from <sha>` in the log, with the service running, under `setsid nohup` (the first deploy that brings this fix in is itself run by the old script, so look on the one after) | Pi, `~/deploy-prod.log` |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is not empty — n/a: only a person at the Pi can look, so it is left pending, not ticked

Manual verification by: pending: first Pi deploy shows the restarting-under line

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: it travels with the PR

Result: pass
