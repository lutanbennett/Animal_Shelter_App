# Feature test plan

Copy this file to the feature branch as `docs/test-plans/<feature>.md`, fill the
header, and tick as you go.

Every line must end up in one of three states, and CI checks this:

- `- [x]` — the check was actually run and passed.
- `- [ ] … — n/a: <reason>` — the check did not apply, and the reason says why.
- `- [ ] … — deferred: <owner>` — **section 8 only.** The check cannot be true
  yet, and this names who picks it up.

That third state exists because the deploy gates in section 8 cannot be true at
PR time: there is no deployed build to check and no production apply to have run.
Writing them `n/a` is a lie in a box labelled "did not apply", and once that habit
forms people write `n/a` for things they simply did not do. `deferred:` says the
truthful thing and passes, because a PR cannot be held open waiting for a deploy
it precedes. It is confined to section 8 deliberately — anywhere else it would be
a general-purpose escape hatch, which is the one thing this check exists to
prevent — and the checker rejects it elsewhere.

**The reason must follow `n/a:` immediately.** `n/a: no UI surface` passes;
`n/a as a deploy check, because …` reads fine to a human but fails, and that
strictness is deliberate — it is what makes every reason greppable in one pass
across every checklist in the repo. Put any qualifying words after the colon,
not before it.

Never tick something you did not do, and never leave a line untouched. Anything
that failed goes under **Defects**.

**No merge without a signed-off checklist. No exceptions.** CI enforces it: a PR
with no completed `docs/test-plans/<feature>.md` fails. Small changes are not
exempt — they are simply fast, because most lines are honestly `n/a`. Writing the
`n/a` reason *is* the check; that is what says someone looked at everything rather
than at the happy path.

Run `node scripts/check-test-plan.mjs` locally before pushing to see what CI will say.

The `test-plan` CI job currently reports **red without blocking the merge** — it is
a deliberate soft gate while the process beds in, not an oversight. Treat a red
`test-plan` as a stop anyway; it becomes a required check once we know the
checklist is working.
The completed checklist is also pasted into the PR and read by the production
release manager before `npm run deploy:prod`.

---

## Header

| | |
|---|---|
| Feature | |
| Backlog item | `docs/backlog.md` → |
| Branch / worktree | `claude/<feature>` @ `C:\Development\Animal_Shelter_<feature>` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:<.port>` |
| PR | |
| Tested by / date | |
| Carries a migration? | yes / no |
| Tested at SHA | |

## 1. Scope and risk

- [ ] Change is described in one sentence, and it matches what the backlog item asked for
- [ ] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public
- [ ] Anything explicitly **out of scope** written down, so the release manager is not surprised

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

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`)
- [ ] Existing rows still read correctly after the change (checked against real dev data)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen
- [ ] Down-migration written, or the reason one is not needed is stated
- [ ] Production apply plan stated for the release manager (which file, which project, when)

## 4. Functional checks

- [ ] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there
- [ ] Create / edit / delete all exercised (whichever the feature has)
- [ ] Empty state renders sensibly (no rows yet)
- [ ] Invalid input is rejected with a readable message, not a crash
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

### Role access matrix

Sign in as each role that matters and record what they see. Unauthorised access
must be refused by the server, not merely hidden in the UI — hit the URL
directly rather than checking whether the nav entry is hidden. That distinction
is what found the cashflow money bug: the page redirected correctly, and the RPC
behind it did not.

These are all of them. `app_role` is `('admin', 'staff', 'vet', 'volunteer')`
from `0001_initial_schema.sql`, plus `'management'` added by
`0038_management_role.sql`. **There is no `resident` role** — in this app a
resident is an animal — and do not re-derive this list by grepping for quoted
strings, which is how `resident` got into this template and `management` got left
out of it for a day.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | | | |
| management | | | |
| staff | | | |
| vet | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`
- [ ] Translatable strings go through the translation path, checked at `/management/translations`
- [ ] Mobile viewport (375px) — no overflow, controls reachable
- [ ] Browser console clean — no errors or React warnings
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one
- [ ] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated
- [ ] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is
- [ ] Commit messages say why, not just what
- [ ] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test`
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks:
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks
- [ ] Any new secret/env var exists in the production Cloudflare environment

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.)
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. `npx wrangler rollback --env production` reverts the Worker in seconds; it does **not** revert migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

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

- [ ] Everything in this checklist that could be verified without human eyes was run, not assumed
- [ ] Nothing is ticked that was not actually executed

Automated checks by: <name>  Date: <yyyy-mm-dd>

### Manual verification

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

A red `test-plan` that says what it is waiting for is a red people act on. An
illegible one is a red people learn to ignore.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it

Manual verification by: <name>  Date: <yyyy-mm-dd>

### Result

- [ ] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result: <pass | pass with accepted defects | fail>

Release manager acknowledgement: <name>  Date: <yyyy-mm-dd>
