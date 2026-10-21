# Test plan — orphans-landing-and-my-work

## Header

| | |
|---|---|
| Feature | My tasks card; My tasks / Operations / Management tiles on card homes |
| Backlog item | `docs/backlog.md` → Menu-removal orphans 1 of 6 |
| Branch / worktree | `claude/orphans-landing-and-my-work` @ `C:\Development\Animal_Shelter_orphans-landing-and-my-work` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | a45838e4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a role whose home is built from cards also gets a My tasks tile (with the due-today-or-overdue count) if it holds `recurring.do_own`, and Operations / Management tiles if it can open a page in them; plus a `my_tasks` card Admin can give
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `src/lib/home/tiles.ts`, `src/lib/permissions/cards.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, three tests
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public: management, second_in_command, head_of_maintenance, head_of_medical and volunteer gain tiles; doctor and public unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the left-hand menu is untouched; Operations/Management are not Admin-built groups; orphan groups 2–6 not touched

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

```
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so write it `n/a: not yet — the PR does not exist at this commit` and **leave it there.** Changed 2026-10-20: ticking it in a follow-up commit used to be the rule, and that commit **invalidated its own evidence** — a new HEAD means a new run, so every PR in this repository paid two full CI cycles to transcribe a result GitHub already records permanently against the commit. A tick here attests to nothing a reader can check better by looking at the PR. **What must still happen, and is a merge step rather than a checklist line: before merging, read the run for your current HEAD (`gh run view <id> --json status,conclusion,headSha`) and confirm its `headSha` matches.** Merging on an older run's strength merges a commit whose CI never finished. **Do not pre-tick this line either** — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: `landing-tiles.test.mjs` draws one My tasks tile with the count badge for a role holding `recurring.do_own`; `check-menu-coverage.mjs` against live dev roles reaches /my, /operations and /management for all five roles (66 → 15 unexplained orphans, before/after below)
- [ ] Data persists — reload the page and the change is still there — n/a: no data written; tiles are derived from permissions
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete in this change
- [ ] Empty state renders sensibly (no rows yet) — n/a: with nothing due the tile shows no badge (withCounts, unchanged)
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the change takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input; the badge threshold (count above zero) is unchanged code

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
| admin | Settings home | unchanged | not exercised (the coverage script skips admin) |
| management | My tasks, Operations, Management | all three drawn | reached (coverage script, dev) |
| second_in_command | My tasks, Operations, Management | all three drawn | reached (coverage script, dev) |
| head_of_maintenance, head_of_medical | My tasks, Operations | drawn | reached (coverage script, dev) |
| doctor | no My tasks | not drawn | no /my tile or orphan (coverage script, dev) |
| volunteer | My tasks, Operations | drawn | 0 orphans (coverage script, dev) |
| signed out | nothing | unchanged | no home to draw |

- [x] Every role above tested (by the coverage script against dev's real role cells and cards, not by signing in)
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page guard changed; a tile is drawn only when the page's own guard (canOpen, opensAnyIn, recurring.do_own) passes, and the unit test proves a role without recurring.do_own gets no My tasks tile

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: the left-hand menu is deliberately untouched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the home paragraph and the My tasks badge sentence; read in the file, not loaded at /manual (row 3 below)
- [x] Translatable strings go through the translation path, checked at `/management/translations`: card title and description in both dictionaries; tile labels reuse the existing `nav.*` strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not driven in a browser; listed under Left for manual verification
- [ ] Browser console clean — no errors or React warnings — n/a: not driven in a browser; listed under Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven in a browser; listed under Left for manual verification

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): home tile logic through the full unit suite (224 pass), including role-groups and both photos-card tests
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: manual/en.ts only gained sentences and was not loaded in a browser; listed for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

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
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — deferred: release manager
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none found | — |

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
| 1 | Signed in as the 2IC: My tasks tile shows the same count as the menu badge and opens /my; Operations and Management tiles open their pages | localhost:3005 or test.lannacare.org |
| 2 | Signed in as a doctor: no My tasks tile | same |
| 3 | Phone width and Thai: the three tiles fit and read correctly; the new manual sentences read well at /manual | same |

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

Automated checks by: Claude  Date: 2026-10-21

### Manual verification

The items in **Left for manual verification** above. Signed by the person who
looked. Claude never signs this line on someone else's behalf, unless that person
has looked and explicitly asks in chat; the line then says so.
Three valid states:

- a name and a date — a person looked. The date is required here.
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

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looks may tick this

Manual verification by: pending: rows 1 to 3 of Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: no defects found
- [ ] Checklist pasted into the PR — n/a: the PR body links the plan file
- [ ] Handed to the production release manager — n/a: not yet — handed over at release time, not at PR time

Result: pass

Release manager acknowledgement: pending: release time

## Coverage evidence (`check-menu-coverage.mjs`, dev, 2026-10-21)

Before (at the synced base):

```
--- Summary (en) ---
┌─────────┬──────────────────────────────┬────────────┬───────┬─────────┬─────────────┐
│ (index) │ role                         │ exercised  │ total │ orphans │ unexplained │
├─────────┼──────────────────────────────┼────────────┼───────┼─────────┼─────────────┤
│ 0       │ 'doctor'                     │ 'cards'    │ 7     │ 1       │ 1           │
│ 1       │ 'dryrun_photo_viewer_d6b305' │ 'NO CARDS' │ 5     │ 0       │ 0           │
│ 2       │ 'head_of_maintenance'        │ 'cards'    │ 11    │ 6       │ 6           │
│ 3       │ 'head_of_medical'            │ 'cards'    │ 15    │ 8       │ 8           │
│ 4       │ 'management'                 │ 'cards'    │ 46    │ 36      │ 36          │
│ 5       │ 'second_in_command'          │ 'cards'    │ 23    │ 13      │ 13          │
│ 6       │ 'volunteer'                  │ 'cards'    │ 10    │ 2       │ 2           │
└─────────┴──────────────────────────────┴────────────┴───────┴─────────┴─────────────┘
Roles with no cards on dev (their result says little about card homes): dryrun_photo_viewer_d6b305

66 unexplained orphan(s): the menu cannot go yet.
```

After:

```
--- Summary (en) ---
┌─────────┬──────────────────────────────┬────────────┬───────┬─────────┬─────────────┐
│ (index) │ role                         │ exercised  │ total │ orphans │ unexplained │
├─────────┼──────────────────────────────┼────────────┼───────┼─────────┼─────────────┤
│ 0       │ 'doctor'                     │ 'cards'    │ 7     │ 1       │ 1           │
│ 1       │ 'dryrun_photo_viewer_d6b305' │ 'NO CARDS' │ 5     │ 0       │ 0           │
│ 2       │ 'head_of_maintenance'        │ 'cards'    │ 11    │ 2       │ 2           │
│ 3       │ 'head_of_medical'            │ 'cards'    │ 15    │ 3       │ 3           │
│ 4       │ 'management'                 │ 'cards'    │ 46    │ 5       │ 5           │
│ 5       │ 'second_in_command'          │ 'cards'    │ 23    │ 4       │ 4           │
│ 6       │ 'volunteer'                  │ 'cards'    │ 10    │ 0       │ 0           │
└─────────┴──────────────────────────────┴────────────┴───────┴─────────┴─────────────┘
Roles with no cards on dev (their result says little about card homes): dryrun_photo_viewer_d6b305

15 unexplained orphan(s): the menu cannot go yet.
```

The drop is 51, not 12: the 12 named rows go, and 39 more are pages the Operations and Management landings list, which the script follows once a landing is reachable. See `docs/decisions/2026-10-21-landing-and-my-tasks-tiles.md`.
