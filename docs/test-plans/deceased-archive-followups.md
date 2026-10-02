# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed) or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Deceased archive follow-ups: the five gaps from #245 walked end to end in dev and closed or declined |
| Backlog item | `docs/backlog.md` → Deceased residents: confirm what happens to the archive when photos or the bio change after death (stays open: gap 4, HEIC) |
| Branch / worktree | `claude/deceased-archive-followups` @ `C:\Development\Animal_Shelter_deceased-archive-followups` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | linked from the PR itself |
| Tested by / date | Claude (deceased-archive-followups session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: no code change; the archive's follow-up behaviour was verified in dev and the outcome written into the manual and a decisions file
- [x] Files/areas touched listed: `src/lib/manual/en.ts` (deceased topic), `docs/backlog.md`, `docs/decisions/2026-10-02-deceased-archive-followups.md`, this plan. No `src/app/`, `worker/` or `supabase/` change
- [x] Roles affected identified: admin/management/staff (they see the deceased banner); no behaviour changed for any role
- [x] Out of scope: a persistent `deceased_archive_stale_at` flag (declined), debouncing the per-file refresh (declined, measured), HEIC (not verified here)

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
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 213s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: no migration

## 3. Schema and data — *skip if no migration*

Per `CLAUDE.md`, schema lands as its own PR before the feature.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: record death, then bio change, 3 photo uploads, profile change and photo removal each reflected in the Drive PDF and index.html (downloaded and read after every step)
- [x] Data persists — reload the page and the change is still there (bio read back from the DB; Drive files re-downloaded)
- [x] Create / edit / delete all exercised: photo upload, bio edit, photo removal, profile change
- [ ] Empty state renders sensibly (no rows yet) — n/a: no new surface; no role logic changed, existing banner and actions untouched
- [x] Invalid input is rejected with a readable message, not a crash: Drive refresh failing (invalid token) saved the edit and showed the out-of-date notice
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no new surface; no role logic changed, existing banner and actions untouched

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

- [ ] Every role above tested — n/a: no new surface; no role logic changed, existing banner and actions untouched
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no new surface; no role logic changed, existing banner and actions untouched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no UI change in this PR beyond manual text
- [x] Manual updated (`src/lib/manual/en.ts`) — deceased topic carries the end-to-end outcome
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI change in this PR beyond manual text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI change in this PR beyond manual text
- [x] Browser console clean — no errors seen during the walkthrough
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI change in this PR beyond manual text

## 6. Regression

- [x] The pages nearest the change still work: resident hub, edit, photos, residents list (all loaded during the walkthrough)
- [x] Any shared file touched checked from a second page: `manual/en.ts` is the only one; `/manual` still builds (gates) and the deceased topic is a plain string in an existing array
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge

## 7. Documentation

- [x] Backlog item left open on purpose with a status note naming gap 4 as the remainder (the brief: tick only if all five are closed or declined)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-02-deceased-archive-followups.md`), including the declined ones
- [x] `README.md` still accurate — nothing it describes changed
- [ ] **Release notes.** — n/a: manual wording only; no staff-visible behaviour changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Upload and refresh timings were taken from the dev server log; the HEIC claim is explicitly marked unverified

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: no migration
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — n/a: no migration

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no migration
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — n/a: no migration
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand. That is two separate claims and they need different checks: — n/a: no migration
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock: run the **real exported** function against fixed instants — both sides of 17:00Z, the 00:00 and 06:59 Thai ends of the broken window, month-end, year-end, a leap day — and then the same suite under `TZ=UTC`, which is the Workers case. Deterministic, and it does not depend on what hour you happened to be testing. Prefer this where it is available, and never re-type the logic into the test; a copy proves only that the copy works
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — during 00:00–07:00 Thai, when the two dates differ. If you cannot be there at that hour, put it in **Left for manual verification** rather than ticking it
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** A bug report names the case that was *noticed*, which is rarely the case that *discriminates*, so a test written faithfully from the report can pass while the fault survives. This is not hypothetical: `dueState()` was reported as "a job due today reads as not yet overdue", but due-today behaves identically under both clocks and does not move at all; the cases that moved were due-yesterday and the far end of the due-soon band. Applies to any threshold, rounding rule, retry window, pagination limit or permission cutoff, not only to dates — n/a: no migration
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it — n/a: no migration
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — anonymous GETs are edge-cached per data centre, so a stale page can look like a defect that isn't one, or hide one that is — n/a: no migration

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. `scripts/lib/env.mjs` resolves shell over `.env.deploy.production` over `.env.local`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev and nothing errors — n/a: no migration
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — without it the bundle still carries a snapshot of `.env.local`, shipping dev credentials as silent fallbacks — n/a: no migration
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no migration

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** If yes, the production apply must happen *before* the deploy, and that ordering is written into the apply plan below. (PR #53 shipped both together; `main` briefly carried code selecting columns production did not have.) — n/a: null
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — it executes the real DDL inside `begin…rollback` against production's actual schema, which has drifted from dev — n/a: null
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — n/a: null
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: null

### Rollback

- [ ] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations. Purely additive schema is safe to leave; anything else needs its own down-migration before "rollback available" is a true statement — n/a: no migration

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The out-of-date notice after a Drive failure is not persistent: it shows once via the archive=stale redirect and is gone on reload | accepted: decided in 2026-10-01 and re-confirmed in 2026-10-02 decisions; Refresh archive is always on the banner |
| 2 | info | After restarting the dev server following the simulated outage, every resident hub returned 404 until the server was restarted again; data and role were fine (list and DB read OK), not reproduced afterwards | accepted: dev-server state, not part of this change |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A real iPhone HEIC uploaded after death and chosen as the profile photo appears in the summary PDF (gap 4) | Dev or test: deceased resident → Photos |
| 2 | The new manual paragraph reads well to staff | /manual → Recording a death |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (deceased-archive-followups session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so this stays unticked until a person has looked

Manual verification by: pending: items 1 and 2 above need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
