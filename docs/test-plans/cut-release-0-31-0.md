# Feature test plan — cut-release-0-31-0

## Header

| | |
|---|---|
| Feature | Cut release `0.31.0`: move the five notes in `unreleased` into a new `0.31.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-31-0` @ `C:\Development\Animal_Shelter_cut-release-0-31-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #626 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no — the release's three (`0195`, `0196`, `0197`) merged in their own PRs (#617, #620) |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.31.0` entry, `major: true` on Lutan's call in chat, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, and **all five notes are untagged**, so every role sees all five. That is a deliberate choice, not an omission: untagged reads as everyone and can never hide a line from the people it is for, and the two-roles note in particular lands on whoever is covering, not only on the Admin who hands it out. **Every admin receives mail**, because `major: true` — asserted as `majorReleasesSince("0.30.0") = ["0.31.0"]`. That is this cut's one irreversible effect, and it fires on Lutan's production Worker deploy, not on the merge
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying `0195`, `0196` and `0197` to production, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the branch was created from `origin/main` at `c179b7f8` minutes earlier, so there was nothing to merge)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 179s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 177s
=== gates: test — npm test
=== gates: test exited 0 after 5s
=== gates: build — npm run build
=== gates: build exited 0 after 142s
gates: typecheck=0 lint=0 test=0 build=0
```

A cold tree this time: `build` at 142s, against `0.30.0`'s warm-cache 59s. Both
are normal, and the exit codes are what was read, not the timings.

`node scripts/check-release-guards.mjs` — all 16 assertions `ok`, exit 0,
including `--drift reads the arrays it prints from driftReport()`.

The cut itself was verified **mechanically rather than read over**, which is the
one failure mode a release cut has that no gate catches: a lost or altered note is
invisible to `typecheck`, `lint`, `build` and CI alike. All five notes were parsed
from `origin/main:src/lib/releases.ts` and compared against the parsed `0.31.0`
entry, text and role tags separately. Output unedited:

```
Comparing 5 note(s) on origin/main against the new 0.31.0 entry
  OK   version is 0.31.0 (0.31.0)
  OK   major is true (mails every admin)
  OK   date is today (2026-10-15)
  OK   title present: "One person can now cover two roles, and the map opens the zone you tap"
  OK   note count: 5 -> 5
  OK   note 1 text identical (One person can now do two jobs for a whi...)
  OK   note 1 roles identical (null)
  OK   note 2 text identical (On the facility map, tapping a zone on t...)
  OK   note 2 roles identical (null)
  OK   note 3 text identical (The public website is friendlier to a vi...)
  OK   note 3 roles identical (null)
  OK   note 4 text identical (Admin: on Settings → Who does what the M...)
  OK   note 4 roles identical (null)
  OK   note 5 text identical (The Maintenance tile on your home screen...)
  OK   note 5 roles identical (null)
  OK   no note in the entry that was not in unreleased
  OK   unreleased is now empty
  OK   no note duplicated from an earlier release
  OK   package.json 0.31.0 === newest entry 0.31.0
  OK   releases grew by exactly one (44 -> 45)
  OK   every previously released entry is byte-identical
  OK   file order is newest-first by compareVersions
  OK   no duplicate versions
  OK   majorReleasesSince("0.30.0") === ["0.31.0"] (got ["0.31.0"])
  OK   no [object Object] / undefined in rendered notes
  OK   every note has real text
  OK   no retired role tag (e.g. staff) on a new note

All cut checks passed.
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a` on the first push and tick it in a follow-up commit once the run is actually green — all 7 jobs `success` on run 38649284366 at `39f736e8`: `migration-numbers`, `script-integrity`, `test-plan`, `new-policy-role-names`, `audit`, `public-views`, `check`. Read from `gh run view 38649284366 --json jobs`, not from `gh pr checks`. `audit` is green this run, which it has not always been — a red there would not have been a blocker either way. The first run on this branch (`6b7c75df`) failed on `test-plan` by construction, because that commit created the PR and this file did not yet exist. **Ticking this line is itself a commit, so a further run follows it, and the merge waits for that one** — the second-run rule the handover names

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's three — `0195_security_schema_fold.sql` (#617), `0196_multi_role_logins.sql` and `0197_role_row_live_search_path.sql` (#620) — merged in their own schema-first PRs and are applied as a release step, recorded in section 8. They are sequential and unique, and `node scripts/release-prs.mjs ab59e475 HEAD` exited **0**, which is what says every migration in the range belongs to a PR in the list
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead — production `195 applied, 3 pending`, dev `198 applied, 0 pending` with nothing on either side of the `origin/main` comparison. Production being three behind is the "a migration merged since the last release" case the handover names as normal
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step and recorded in section 8 — all three `ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; all three are already applied to dev by #617 and #620, confirmed this session as `198 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; the three were read this session and use `drop policy if exists` and `create or replace function` throughout, and `0197` states its own re-runnability in its header
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this belongs to #617's and #620's own plans, which carry it. `scripts/check-security-schema-fold.mjs` is the per-role rollback harness #617 wrote for exactly this
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR. Worth recording here anyway, because it is what makes this release's apply safe: `0195` ships with `scripts/check-security-schema-fold.mjs`, a one-transaction harness that measures, per role, who can read the three site tables after the policy narrows. See the silent-failure answer in section 8
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR; see the rollback position in section 8 for what the three do and do not leave recoverable
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves five existing notes into a release entry, verified as data in section 2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are five plain strings carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.31.0` entry and all five notes; **receives mail**, because `major: true` | `majorReleasesSince("0.30.0")` = `["0.31.0"]`, so the mail fires on the production Worker deploy. Entry read back from the module: 5 notes, order unchanged |
| management | `/releases` | Same entry, all five notes — none is tagged | asserted, `note N roles identical (null)` for all five |
| second_in_command | `/releases` | Same entry, all five notes | as above |
| head_of_maintenance | `/releases` | Same entry, all five — including the Maintenance tile note, which is the one most likely to be theirs | as above; untagged is why it reaches them |
| head_of_medical | `/releases` | Same entry, all five — including the two-roles note, since this is the role the note's own example describes covering with | as above |
| doctor | `/releases` | Same entry, all five notes | as above |
| volunteer | `/releases` | Same entry, all five notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees, and no note carries a role tag that could filter it
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic. The release's own manual changes belong to the `multi-role-build`, `facility-map-zone-entry` and `cards-page-refinements` PRs and their plans
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 44 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 44
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched — `releases.ts` is imported by `/releases`, by `deploy.mjs` and by the Worker's `/api/releases/current`, and all three paths were exercised: the build compiled the route, `majorReleasesSince` and `compareVersions` were run directly, and the module parses under Node's type stripping as `deploy.mjs` loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `c179b7f8` and `sync` reported nothing to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice. The one judgement in this cut — leaving all five notes untagged — is recorded in the commit message, in section 1 and in the release record, and it follows the rule `releases.ts` already states, that a wrong tag hides a line from the people it is for
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the five notes written by the `multi-role-build`, `facility-map-zone-entry`, `public-site-visitor-fold`, `cards-page-refinements` and `cards-menu-coverage` PRs into the `0.31.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose — the cut commit's claims are each one of the assertions pasted in section 2, and the silent-failure conclusion in section 8 was reached by reading `0195`'s policy against every caller of the function behind it, not by reading its header

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. **The release does contain date-derived behaviour and it is not this PR's**: `0196`'s `role_row_live()` decides whether a role cover is in force today by `shelter_date()` rather than UTC, and `0197` exists because that function could not run at all until its `search_path` was fixed. Both carry that check in `multi-role-schema.md`, and neither is re-signed here — copying another plan's items into the cut plan is what the template forbids
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — both blocks in section 2 are the scripts' own stdout, copied without tidying. The cut-check block was regenerated from the committed tree rather than reconstructed from the first run
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Expect this to be unanswerable**: `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate and there is no cacheable public page. One of this release's five notes is about the public website

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither does the release
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — run this session before any deploy: `npm ci` exited 0 in `C:\Development\Animal_Shelter_App`. The `Next.js version :` line on the first Worker build is read against `package.json` as the second check, per `0.28.0`'s Defect 2

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. The release's three are applied **before** either deploy, per the apply plan below. `apply-migrations.mjs` warned that two of `0196`'s declared consumers (`src/app/admin/security/actions.ts`, `src/app/admin/security/page.tsx`) differ from live `0.30.0`. That is the safe direction, which the handover names explicitly: the tables land before the code that reads them is live
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager — run again immediately before the apply. Run once already this session: all three `ok`, exit 0
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the nightly cron wrote a production backup at 03:00 today**: `lannacare-production-2026-10-14T2000Z.dump.age`, 1,144,560 bytes, in `~/backups/lannacare` on the Pi, and the log records it uploaded to Drive. Twelve backups kept for production, eleven locally. So the cron has fired unprompted on three consecutive nights and the gate is satisfied by the job rather than by a hand-made dump, for the third release running. **This gate is satisfied rather than waived**: `0196` restructures `user_roles` and rewrites every permission helper, which is a rewriting migration by any reading. The restore half remains unexercised against a real Supabase project, carried forward for the fifth release
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `195 applied, 3 pending`
  2. `--env production --dry-run` — expect three `ok`. **A red here would not automatically be a stop**: the per-file `begin … rollback` trap has fired in several of the last releases, and this release is exactly its shape, three pending files where a later one names an earlier one's function. It did **not** fire — `0197` is a bare `create or replace function` that does not need `0196`'s objects to exist — and all three came back `ok`, exit 0
  3. `--env production` — applies `0195`, `0196` and `0197` to `dbkodyyxxhtygxcxmfcu`, in that order
  4. **before** either deploy, and with no user-facing window needed

  **The silent-failure question for this release has one real candidate, and it is covered.** `0195` narrows read on `site_content`, `site_pages` and `site_content_photos` from `using (true)` — readable by every login since `0018` — to holders of `website.content` Read or `reports.cashflow` Read. The quiet failure that shape invites is a page going blank rather than erroring, and the code is built for it: `loadClinicVisitEstimate` in `src/lib/site/content.ts` destructures `{ data }` and discards the error, so a refused read returns `null` and the cashflow forecast would simply use no estimate.

  It holds, and for a checked reason rather than a careful author:

  - `site_content` has exactly **one** direct reader in `src/` — `src/lib/site/content.ts` — and that function has exactly **two** callers: `src/app/admin/website/page.tsx` and `src/app/management/cashflow/page.tsx`. Those are precisely the two permissions the new policy allows. The match is deliberate: `0195`'s own header names the cashflow forecast as the reason `reports.cashflow` is in the policy at all.
  - Visitors are untouched for a structural reason, not a hopeful one: the public pages read through the `public_site_*` views, which run as their owner (`0122`, `0059`) and never consult the caller.
  - `0195` ships its own evidence. `scripts/check-security-schema-fold.mjs` is a one-transaction harness, always rolled back, that walks **every live role** and measures who can read each of the three tables after the change — not a reading of the policy but a measurement of it.
  - `0197` is the counter-example that shows the loud direction works: `0196` pinned `role_row_live()`'s `search_path` to the empty string, every permission helper that called it failed outright on dev, and it was found immediately because it broke rather than went quiet. `0197` is that fix, and it is in this release with its parent.

  **`0196` can widen access, never narrow it, and only for a login that has two roles.** Its restriction helpers (`is_clinic_login`, `photos_medical_only`, `on_volunteer_floor`) now return true only when *every* live role is restricted. Until the Add-a-role panel is used, every login still has exactly one row, so the union of one role is that role — which is what the release note rests on when it says a second role is something Admin hands out deliberately.

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref ab59e475` on the Pi (a rebuild of `0.30.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the three migrations, and the release mail.** None has a down-migration file. The practical position is that the schema stays and the app rolls back, and that is safe in one direction and worth stating plainly in the other: `0196` and `0197` are inert under `0.30.0`, because nothing in it writes a second `user_roles` row, so the union of one role is that role and every helper answers as before. **`0195` is not inert** — its narrowed read policy applies whatever code is running — so a rollback to `0.30.0` would leave `site_content` readable only by `website.content` and `reports.cashflow` holders. That is the intended end state and `0.30.0` has the same two readers, so it is a deliberate consequence rather than a surprise, but it is the one part of this release a Pi rebuild does not undo. The mail cannot be unsent: it goes out on the production Worker deploy, so the point of no return is Lutan's one command, not the merge

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.31.0` entry reads correctly on `/releases`, with all five notes, and that every role sees all five — none is tagged. The page is behind sign-in, so no session can load it | `/releases`, production, any signed-in role |
| 2 | The release mail for `0.31.0` arrived, from `releases@lannacare.org` with the version in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure | the admin inbox |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the entry read on `/releases`, and the release mail arriving

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |
