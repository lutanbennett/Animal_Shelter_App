# Feature test plan — record-0-27-0

## Header

| | |
|---|---|
| Feature | The `0.27.0` release record, appended to `docs/releases/2026-10-11.md`, and `docs/release-handover.md` rewritten for whoever runs `0.28.0` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-27-0` @ `C:\Development\Animal_Shelter_record-0-27-0` |
| Dev server | `node scripts/worktree.mjs dev` → not started; documentation only |
| PR | #548 |
| Tested by / date | Claude (production release manager session) / 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `47760a81` — the release this record describes |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — add the `0.27.0` release record to `docs/releases/2026-10-11.md` and rewrite `docs/release-handover.md` for whoever runs `0.28.0`
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/releases/2026-10-11.md` (appended — the day already held `0.26.0`) and `docs/release-handover.md` (rewritten, as it is every release), plus this plan
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — none. Nobody signed in sees either file
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the five production-only checks the record lists as owed, and the `--upto` flag the handover still names as missing

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
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — the release's own four migrations were applied before the deploy and are recorded in the record itself

## 4. Functional checks

- [ ] Happy path works end to end — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — nothing to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Empty state renders sensibly (no rows yet) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route

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
| admin | | | |
| management | | | |
| staff | | | |
| doctor | | | |
| volunteer | | | |
| signed out | | | |

- [ ] Every role above tested — n/a: no role reaches anything new — these files are read in the repository, not served by the app
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — no route added

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release record is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: repository documentation is English-only, as every release record is
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — not rendered in the app at any width
- [ ] Browser console clean — no errors or React warnings — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — nothing loaded in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — no page is near it
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched — `docs/releases/2026-10-11.md` is appended to and `docs/release-handover.md` is rewritten by design, and nothing imports either
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` cleanly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release record closes no backlog item. The S1 finding this release answered was recorded on the `backlog` branch instead (`715039b1`), which is where backlog edits belong
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no design choice — the record states what happened and the handover states what is owed
- [x] `README.md` still accurate — no README statement is about the record or the handover
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. **Do not tick while this PR's own decision file, README or backlog note records a step still outstanding before a user could see it (a deploy, a hand-edited file on the Pi, a setting).** A note promises the user it works now; a tick that only means "the code is in" sent #518's false note to every admin (decisions, 2026-10-11). Write `n/a: <the outstanding step>` and put the note in the PR that closes the step A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — n/a: a release record and a handover are repository documentation; no shelter user sees either, and `unreleased` is deliberately empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `47760a81`, the release SHA, recorded in both files and confirmed against `/api/version` on both environments
- [x] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — `deploy: production → Supabase project dbkodyyxxhtygxcxmfcu (47760a81)` was read from Lutan's `| tee` log, not assumed, and matches what both Pis serve

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` — `47760a81`, same commit as production
- [x] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — `test.lannacare.org/api/version` → `0.27.0`, sha `47760a81…`, served by the Pi, with `/api/releases/current` agreeing
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: nothing in this PR derives a date — the dates in it are fixed strings recording what happened
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — every block quoted in the record is the tool's own output — the deploy lines, both drift checks, the three edge-cache fetches, the apply lines and the delivered mail's subject
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: `PUBLIC_SITE` is `locked`, so the public pages cannot be seen as a visitor sees them — the standing gap, recorded in the record itself

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — the project-ref line read and the ref is production, `dbkodyyxxhtygxcxmfcu`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — `strip-baked-env: removed 11 env var(s)` present in Lutan's log
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — no secret or env var added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: docs-only PR: it adds the `0.27.0` release record and rewrites the handover. No code, no schema, no route — no migration and no code reading one
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — run before the apply and **clean**, all four `ok`, exit 0 — recorded in the record as the counter-example to `0.26.0`'s red one
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — a fresh encrypted production backup existed, written by the Pi's weekly cron at 03:00 the same morning. `0184`'s drops touch no data-bearing object. The restore recipe has still never been exercised, which the handover carries forward
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated and executed: `0182`–`0185` to `dbkodyyxxhtygxcxmfcu`, **before** either deploy, with no user-facing window needed

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — rollback is `./scripts/pi/deploy-pi.sh --ref c3862e52` on the Pi plus `wrangler rollback` for the Worker. **It does not cover the four migrations** — `0184` drops views and functions, so the practical position is schema stays, app rolls back, which is safe because nothing in `0.26.0` reads what `0184` removed. This PR itself is documentation and needs no rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | None in this PR. The release's own four defects are in the record's own Defects table, where they belong | n/a |

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
| 1 | Read the `0.27.0` record against the release as you remember it, and say if anything is wrong or missing. It is the durable account and I am the only witness to most of it | `docs/releases/2026-10-11.md`, the `## 0.27.0` section |
| 2 | The handover is written to be read **cold** by whoever runs `0.28.0`. Worth one read to check it makes sense without this conversation | `docs/release-handover.md` |
| 3 | **One Admin or Management login opening Contacts, Shelter friends and Clinics on production.** Not this PR's work, but it is the one thing this release genuinely left unverified: `0182` narrowed those three read policies, and a mistake there shows as an empty page rather than an error. Three pages, two minutes | `lannacare.org` |

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
looked. `pending:` below is the honest state: the record is written, and reading
it back against the release as Lutan remembers it needs a person.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so this stays for the person who looks (see the pending line)

Manual verification by: pending: the three rows above — the record read back by Lutan, the handover read cold by whoever runs `0.28.0`, and one login on production opening the three pages `0182` narrowed

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-11
