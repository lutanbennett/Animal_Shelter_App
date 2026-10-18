# Test plan: pi-deploy-safety

## Header

| | |
|---|---|
| Feature | Pi deploy safety: swap precondition, swapfile, asset check, keep last good build |
| Backlog item | `docs/backlog.md` → Pi build OOM (partly closed); cache poisoning (on `backlog` branch) |
| Branch / worktree | `claude/pi-deploy-safety` @ `C:DevelopmentAnimal_Shelter_pi-deploy-safety` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (not used) |
| PR | pending |
| Tested by / date | Claude / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | e2c147ec |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — n/a: no screen changes; the Pi deploy scripts are run by Lutan over SSH, no app role is affected
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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

Shell checks run here: `bash -n` on both scripts; `check-assets.mjs` against a local server (pass exit 0, wrong bytes exit 1); the swap check block against fake meminfo files (2 GB refused exit 2, 6 GB passed, `--force` warns). Never run on a real Pi: the `.next.prev` copy/restore, the ref-on-main refusal, setup.sh step 2b, the full deploy.. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; scripts and docs only
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; scripts and docs only
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration; scripts and docs only
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration; scripts and docs only
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration; scripts and docs only
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; scripts and docs only
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration; scripts and docs only
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; scripts and docs only
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration; scripts and docs only

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] Data persists — reload the page and the change is still there — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no UI surface or data; shell and Node scripts for the Pi deploy

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
| all roles | n/a | no app surface | n/a: no UI or server route changed |

- [ ] Every role above tested — n/a: no UI surface or data; shell and Node scripts for the Pi deploy
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no UI surface or data; shell and Node scripts for the Pi deploy

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no UI surface
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no UI surface
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI surface
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no UI surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: no shared app file touched
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no shelter user would notice: it changes how the Pi builds and deploys, and the decision file records manual steps still outstanding
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: not a release cut; SHA is in the header
- — deferred: Lutan, first Pi deploy after merge Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it

### On the deployed build

- — deferred: Lutan, first Pi deploy after merge Deployed to test: `npm run deploy:test`
- — deferred: Lutan, first Pi deploy after merge Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: not applicable to a Pi-script-only change with no app or migration change
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: not applicable to a Pi-script-only change with no app or migration change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: not applicable to a Pi-script-only change with no app or migration change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — n/a: not applicable to a Pi-script-only change with no app or migration change
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — n/a: not applicable to a Pi-script-only change with no app or migration change
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: not applicable to a Pi-script-only change with no app or migration change

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: not applicable to a Pi-script-only change with no app or migration change
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: not applicable to a Pi-script-only change with no app or migration change
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: not applicable to a Pi-script-only change with no app or migration change
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: not applicable to a Pi-script-only change with no app or migration change

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | note | True atomic `.next.new` swap not built: needs a `distDir` switch in `next.config.ts` (out of scope). The 404 window during a build remains; the check catches the result | deferred to Lutan, see decision file |

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
| 1 | pending: run the first production Pi deploy and watch for the swap refusal, the .next.prev copy (disk, time) and the asset check | Pi |
| 2 | pending: purge Cloudflare cache by hand after it (Caching, Configuration, Purge Everything) | Cloudflare dashboard |
| 3 | pending: take the peak-memory measurement (/usr/bin/time -v npm run build) | Pi |
| 4 | pending: rule on the purge API token and on a distDir switch | decision file |
| 5 | pending: confirm /swapfile2 is in /etc/fstab on the live Pi (setup.sh step 2b was never run there) | Pi |

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

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty; only Lutan can sign for the Pi runs

Manual verification by: pending: first Pi deploy, purge and peak-memory measurement are Lutan's

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet reviewed
