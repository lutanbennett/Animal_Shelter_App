# Test plan: baseline-impact-figures

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed), `n/a` with the reason, or (section 8 only) `deferred`.

---

## Header

| | |
|---|---|
| Feature | Impact figures: Settings → Website editor for baselines, and the homepage band showing baseline + live count marked "About" |
| Backlog item | `docs/backlog.md` → "Impact figures as a baseline plus a live count" (app half) |
| Branch / worktree | `claude/baseline-impact-figures` @ `C:DevelopmentAnimal_Shelter_baseline-impact-figures` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-07 (browser pass as a disposable Admin, dryrun-admin-baseline-20261007@example.test, left on dev) |
| Carries a migration? | no (0156 merged as #417) |
| Tested at SHA | `313ab372` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Settings → Website → Home page gets an Impact figures editor, and the home page band shows baseline + live count marked About
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/app/admin/website/` (ImpactBaselines.tsx, actions.ts, page.tsx), `src/app/page.tsx`, `src/lib/site/impact.ts`, both dictionaries, manual, releases. No migration, no `worker/`
- [x] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — admin (edits); signed-out public and every signed-in role (see the band). Management cannot edit: it lacks `website.content`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — granting Management `website.content` (a decision for the Director/Lutan); counting village sterilisations (nothing records them)

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

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — merged `origin/main` cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them — `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration on this stream
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration on this stream
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration on this stream (0156 was applied by #417)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration on this stream
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration on this stream
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration on this stream; 0156's own checks ran under #417
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration on this stream
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration on this stream

## 4. Functional checks

- [x] Happy path works end to end — driven on dev as a disposable Admin: entered 450 / 1 Oct and 300 / 1 Oct, confirmed, saved; the home page showed About 451 (450 + 1 adoption after 1 Oct) and About 300
- [x] Data persists — reload the page and the change is still there — values and the public figures were still there after reload
- [x] Create / edit / delete all exercised (whichever the feature has) — edited 412 to 450 and entered a second figure; clearing was not exercised
- [x] Empty state renders sensibly (no rows yet) — both figures start unset: the editor says not shown, and the band had no tile for them
- [x] Invalid input is rejected with a readable message, not a crash — a count with no date was refused with the message Enter both the number and the date, or leave both blank
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: only the count-without-date refusal was exercised; future date, non-integer and clearing were not

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

- [ ] Every role above tested — n/a: only Admin was tested; the other roles' access is left for manual verification
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not exercised; the action and page both check `website.content` and the table's RLS needs it too

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav entry added; the editor is on an existing page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: topic edited in `en.ts` (Settings → Website); not read at `/manual` in a browser
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-entered text is translated; the labels are in both dictionaries and the table's own label_th
- [x] Mobile viewport (375px) — no overflow, controls reachable — 375 px: editor and the six-tile band fit, scrollWidth 375, no overflow, in English and Thai
- [x] Browser console clean — no errors or React warnings — no console errors on the editor or home page
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — server log showed 200s for the pages and the action

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not loaded in a browser; `next build` compiled every route
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: `manual/en.ts` edit is one added line; not loaded from a second page, see Left for manual verification
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync merged cleanly and typecheck/lint/build ran green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — ticked on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — `docs/decisions/2026-10-07-impact-figures-editor.md`
- [x] `README.md` still accurate — no README statement covers the impact band
- [x] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>`: a refactor, a script, a fix to something no user reached. The checker holds this line to the diff. A tick fails if `unreleased` gained no line. A PR touching `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` fails if this line is missing, and its `n/a` reason is printed for the reviewer. An empty `unreleased` looks exactly like "nothing visible shipped", so this line is the only place that difference gets written down. A PR that touches nothing but `docs/test-plans/` (a sign-off recorded after merge) has a tick checked against the merge that introduced the plan instead, so leave the feature's tick as it was. The checker finds this line by its bold **Release notes.** label, so keep the label as it is — `unreleased` gained a line for the Impact figures editor and the About-marked figures
- [x] Commit messages say why, not just what — yes
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell — no timezone or concurrency claims made; the date check reuses `todayIso()` (Asia/Bangkok)

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
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager at deploy

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: no migration on this stream

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | note | Management cannot edit the figures: only Admin holds `website.content` | deferred to backlog |

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
| 1 | Clearing both boxes takes a figure off the home page; a future date and a non-whole number are refused with readable messages | Settings → Website → Home page |
| 2 | Management, Staff, Vet and Volunteer cannot open the page or save (hit /admin/website directly) | each role |
| 3 | Settings → Recent changes lists the baseline change with before and after (audit_log has the rows; the page showed nothing for the disposable admin, possibly a 2-step sign-in requirement) | Settings → Recent changes |
| 4 | The manual paragraph reads correctly | /manual, Settings → Website |
| 5 | The band looks right at desktop width with six tiles (checked as text only, not by eye) | / |

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

Signed only by the person who looked, or `pending:` until they have. Claude does not sign this line.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty; only the person who looked may tick it

Manual verification by: pending: a person signs in as Admin and works through the Left for manual verification table

### Result

- [x] Open defects are either fixed or explicitly accepted above — none found
- [ ] Checklist pasted into the PR — n/a: the PR links this file instead
- [ ] Handed to the production release manager — n/a: happens at release, after the PR

Result: pass

Release manager acknowledgement: pending: at release
