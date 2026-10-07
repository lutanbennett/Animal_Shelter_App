## Header

| | |
|---|---|
| Feature | Name card taps under the new permissions: a signed-in person never sees less than a visitor |
| Backlog item | `docs/backlog.md` → "Name card taps under the new permissions" (ticked) |
| Branch / worktree | `claude/name-card-taps` @ `C:\Development\Animal_Shelter_name-card-taps` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch; number added in the follow-up commit |
| Tested by / date | Claude (automated) / 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the commit that adds this plan; `origin/main` was already merged at sync |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a signed-in person's tap on a name card never shows less than the public card: `/r/<code>` shows the card plus where the resident lives and their own jobs when they may not open the full record, and `/residents/<id>` hands them there (items 1, 3, 4)
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/r/[code]/page.tsx`, `src/app/residents/[id]/page.tsx`, `src/lib/residents/card-landing.ts` (new), `ResidentWhoAndWhere.tsx` (deleted), both dictionaries (`residentCard`), `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`, `scripts/check-card-taps.mjs` (new), docs. No worker, no migration
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — 2IC, Heads of Medical and Maintenance, volunteer (now the card plus extras) and a vet outside their clinic (the card, not a 404); admin, management, staff, vet inside their clinic, signed out and public_viewer unchanged
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — (2), whether those roles read medical from a card, is the Director's matrix and an open question in `docs/decisions/2026-10-07-name-card-taps.md`; the scan-a-card-for-a-job landing (the unbuilt 'Pick the resident by scanning their name card' item) is not built here

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — typecheck=0 build=0 on the first run; lint failed once for a missing acceptance-matrix entry for the new manual topic, fixed, and `npm run lint` then exited 0 (closing lines below)
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this stream
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this stream
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this stream
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration on this stream
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration on this stream
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this stream
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration on this stream

## 4. Functional checks

- [x] Happy path works end to end — signed-out tap driven in the browser (public card renders); every role's landing asserted by `scripts/check-card-taps.mjs`; the rendered signed-in pages are item 1 under Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: read-only page, nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page, nothing is created, edited or deleted
- [ ] Empty state renders sensibly (no rows yet) — n/a: a resident with no placement simply omits the Lives in line; nothing to list
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input on the page; an unknown code still 404s as before, which is correct
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no free-text or numeric input; the boundaries that matter are the role and clinic edges, covered by the vet-inside / vet-outside probes in the check

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
| admin | the full resident page | The hub, with the record (landing: full) | landing asserted by `check-card-taps.mjs`: pass |
| management | the full resident page | The hub, with the record (full) | landing asserted by `check-card-taps.mjs`: pass |
| staff | the full resident page | The hub, with the record (full) | landing asserted by `check-card-taps.mjs`: pass |
| vet | the full page for a resident their clinic treats; the public card for any other | inside the clinic: full; outside: public card plus where it lives, never a 404 (public-plus) | landing asserted by `check-card-taps.mjs`: pass |
| volunteer | the public card, where it lives and job buttons (also 2IC, Heads: public-plus) | not the record: the Director's draft gives these roles no `resident.record` tick | landing asserted by `check-card-taps.mjs`: pass |
| signed out | the public card | public card (also public_viewer) | landing asserted by `check-card-taps.mjs`: pass |

- [x] Every role above tested — the landing of every row below, by `scripts/check-card-taps.mjs --verbose` (22 checks, 0 failed); the rendered pages for signed-in roles are in Left for manual verification
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the check asserts nobody lands on the full record without `resident.record` and a readable `residents` row, and every principal can read the public card (never a 404)

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added or changed
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — topic "Scanning a name card" added and its acceptance-matrix entry written (`acceptance-matrix --check` ok); how it reads at `/manual` is item 3 under Left for manual verification
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: fixed interface labels in the two dictionaries (`livesIn`, `yourJobs`), no user-entered text added
- [x] Mobile viewport (375px) — no overflow, controls reachable — `check-phone-width.mjs --roles=volunteer,staff --locales=en,th --pages=/r/R-0001`: 2 page views measured, 2 skipped because the role cannot open them, no sideways scroll; the job buttons are `min-h-12`. The card as a signed-in 2IC at 375 px is item 1 under Left for manual verification
- [x] Browser console clean — no errors or React warnings — `/r/R-0001` signed out: no console errors
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `/r/R-0001` signed out: every request 200

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — `/r/R-0001` (signed out) loaded in the browser; `/residents/<id>` and the enclosure pages read through the unchanged `who-and-where` lib and typecheck and build pass
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — `src/lib/manual/en.ts` and both dictionaries gained one block each, in place; the build prerenders and serves the manual and public pages
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in at sync (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-07-name-card-taps.md`
- [ ] `README.md` still accurate — n/a: README does not describe card taps
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a line about name card taps
- [x] Commit messages say why, not just what — commit explains what a tap showed before and why
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — the behaviours claimed (who lands where) are asserted against dev by `check-card-taps.mjs`, not reasoned; the check was shown to discriminate (vet inside → full, vet outside → public-plus)

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at deploy
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager at deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager at deploy
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager at deploy
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — deferred: release manager at deploy
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — deferred: release manager at deploy
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — deferred: release manager at deploy
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — deferred: release manager at deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — deferred: release manager at deploy
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — deferred: release manager at deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager at deploy

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: no migration on this stream
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: no migration on this stream
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration on this stream

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — deferred: release manager at deploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| – | – | none found | – |

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
at it, separately from deploying?** A vet's view of a page, a real phone, whether
wording reads well — yes. Anything the deploy itself performs — no, that is
section 8's.

| # | What to check | Where |
|---|---|---|
| 1 | On a phone at 375 px, signed in as a 2IC (or Head of Medical or volunteer), open a resident's card: public card, a "Lives in" line, and a button for each job that login holds; no medical. Then the same card as a vet whose clinic does not treat the resident: the card, not a 404 | `/r/<R-code>` |
| 2 | Signed in as Admin, Management and Staff, a card lands on the full resident page; a plain public_viewer login sees only the card | `/r/<R-code>` |
| 3 | The "Scanning a name card" topic reads correctly | `/manual` |
| 4 | A real card tapped on an iPhone and an Android phone, signed in | the printed name card |

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

Automated checks by: Claude  Date: 2026-10-07

### Manual verification

Manual verification by: pending: the four items under Left for manual verification, a real phone

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: not yet, the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet, nothing to hand over until the PR merges

Result: pass

Release manager acknowledgement: pending: at release
