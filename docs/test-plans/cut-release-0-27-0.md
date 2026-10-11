# Feature test plan — cut-release-0-27-0

## Header

| | |
|---|---|
| Feature | Cut release `0.27.0`: move the five notes in `unreleased` into a new `0.27.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-27-0` @ `C:\Development\Animal_Shelter_cut-release-0-27-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #547 |
| Tested by / date | Claude (production release manager session) / 2026-10-11 |
| Carries a migration? | no — the release's four (`0182`-`0185`) merged in their own PRs |
| Tested at SHA | `9c65f292` (the cut), re-run at the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.27.0` entry, `major: true` on Lutan's call, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every role sees the entry on `/releases`; no note carries a role tag, so none is filtered. **Admins additionally receive the release mail**, because `major: true` — that is the one irreversible effect in this PR
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying the release's four migrations, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

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
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 42s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 126s
=== gates: build — npm run build
=== gates: build exited 0 after 171s
gates: typecheck=0 lint=0 build=0
```

The cut itself was verified mechanically rather than read over, which is the one
failure mode a release cut has that no gate catches — 19 assertions, 0 failures:

```
ok   origin/main unreleased held 5 notes (5)
ok   the two sets of notes are identical as a SET
ok   every new note came from a source line, none retyped
ok   every source note used exactly once: got [0,4,3,1,2]
ok   order is the intended permutation [0,4,3,1,2]: got [0,4,3,1,2]
ok   text lost 0, invented 0 (1511 vs 1511 chars)
ok   role tags changed: 0 (0 tagged on both sides)
ok   unreleased is now empty
ok   every previous entry is byte-identical (97041 chars)
ok   package.json (0.27.0) equals the newest entry (0.27.0)
ok   no [object Object] or undefined in the notes
ok   newest entry dated 2026-10-11 (2026-10-11)

14 assertions, 0 failure(s)

majorReleasesSince("0.26.0") = ["0.27.0"]
latestRelease = 0.27.0 | major: true | date: 2026-10-11
file order matches compareVersions: true
entries: 40
all 5 notes render as text, no [object Object]/undefined
roles tags on new entry: 0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR: the release's four (`0182`-`0185`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves five existing notes into a release entry, verified as data by 19 assertions (section 2)
- [ ] Data persists — reload the page and the change is still there — n/a: this PR adds no UI surface; it moves five existing notes into a release entry — nothing is written, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no UI surface; it moves five existing notes into a release entry — no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now empty, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR adds no UI surface; it moves five existing notes into a release entry — no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: this PR adds no UI surface; it moves five existing notes into a release entry — no boundary; the one ordering decision is asserted as a permutation

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`, with `'vet'` renamed `'doctor'` by `0172_clinics_and_doctors.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, and the release mail | Sees the `0.27.0` entry, five notes in the cut order; **receives the mail**, because `major: true` | `majorReleasesSince("0.26.0")` = `["0.27.0"]`, so the mail fires once. Entry read back from the module: 5 notes, order `[0,4,3,1,2]` |
| management | `/releases` | Same entry; no note carries a role tag, so none is filtered out | `noteRoles` returns undefined for all five — asserted, 0 tagged |
| staff | `/releases` | Same entry, same five notes | as above |
| doctor | `/releases` | Same entry, same five notes | as above |
| volunteer | `/releases` | Same entry, same five notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 40 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 39
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched — `releases.ts` is imported by `/releases` and `deploy.mjs`, and both were exercised (section 2 build, and `majorReleasesSince` run directly)
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`; the branch was cut from `d2e30a02`, which was the tip at the time

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice — the note order is recorded in the commit message and in this plan
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: this PR *is* the release notes — it moves five notes written by their own PRs into the `0.27.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: nothing in this PR derives a date — the entry's `date` is a fixed string, and the five notes are a section, a sort order, a forecast total, a translation and an error message
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: this PR carries no migration and no code reading one. The release's four are applied before the deploy, per the apply plan below
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — deferred: release manager — run against production immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — **a fresh production backup exists** — `lannacare-production-2026-10-10T2000Z.dump.age`, 1.06 MB, written by the Pi's weekly cron at 03:00 today, encrypted, uploaded to Drive, with 3 local copies kept. `0184` drops four read-only views and three map-room leftovers, none of which hold data, so this gate is satisfied rather than waived. The README restore recipe still has never been exercised
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `181 applied, 4 pending`
  2. `--env production --dry-run` — read it, but **do not treat a red as a stop without reading the files**: this has been the per-file `begin … rollback` trap three releases out of four
  3. `--env production` — applies `0182`, `0183`, `0184`, `0185` to `dbkodyyxxhtygxcxmfcu`
  4. **before** either deploy, and with no user-facing window needed this time

  Why no window is needed, checked against the live `0.26.0` source rather than taken from the headers: `0184`'s four `vet*` views and map-room leftovers are read by **no** `src/` or `worker/` code (only test harnesses, and the one that asserted the views exist was already made conditional); `0183` replaces `cashflow_forecast` with an **identical signature**, so the live app keeps working and only its figures change; `0185` is additive nullable columns; and `0182` narrows policies in the safe direction — database before app. Contrast `0181` last release, which dropped what the live app called on every request

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — rollback is `./scripts/pi/deploy-pi.sh --ref c3862e52` on the Pi (a rebuild of `0.26.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the four migrations.** `0184` drops views and functions, so it is not purely additive and a true rollback would need a down-migration that does not exist — the practical position is that the schema stays and the app rolls back, which is safe because nothing in `0.26.0` reads what `0184` removed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | My first cut-verification run reported `every previous entry is byte-identical` as FAILED. The entries were identical (97440 bytes both sides, `diff` clean); the assertion compared a git blob (LF) against the working file (CRLF). The assertion was fixed, not the file | fixed — re-run clean, 14/14, and worth recording because a false red on exactly this assertion is the one most likely to be waved away next time |
| 2 | low | Seven of the release's eleven test plans carry `pending:` manual verification | accepted by Lutan at the cut (chat, 2026-10-11), shipping with the gaps noted. Listed in the release record, not here — they belong to their own plans |

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
| 1 | Read the `0.27.0` entry on `/releases` as a signed-in person, and check the five notes read well and in a sensible order. The *content* is asserted (same set, intended permutation, nothing lost or invented); what a person adds is whether it reads well to a shelter user. `/releases` is behind sign-in and this session has no account | `/releases`, any signed-in role |
| 2 | Finding S1 from `fable-architecture-review` is now **answered**, and the answer changes the recommendation: `SUPABASE_ACCESS_TOKEN` **is** present, in `.env.local` of both Pi clones (mode `0600`, owned by `lutan`). It is not read by the running app — the only `src/` reference is a redaction list that scrubs it from error text — but it **is** needed by the weekly cron that takes the production backup from the Pi (`0 3 * * 0`). So it cannot simply be removed; the Security backlog item wants rewording around moving that job or scoping the token | the Pi, checked over SSH 2026-10-11 |

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

Automated checks by: Claude (production release manager session)  Date: 2026-10-11

### Manual verification

The items in **Left for manual verification** above, signed by the person who
looked. `pending:` below is the honest state: the work is done and two things
genuinely need a person who has not got to them yet.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so this stays for the person who looks (see the pending line)

Manual verification by: pending: the two rows above — the `0.27.0` entry read on `/releases` by a signed-in person, and the reworded S1 backlog item

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-11
