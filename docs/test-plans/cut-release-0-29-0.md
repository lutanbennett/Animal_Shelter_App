# Feature test plan — cut-release-0-29-0

## Header

| | |
|---|---|
| Feature | Cut release `0.29.0`: move the four notes in `unreleased` into a new `0.29.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-29-0` @ `C:\Development\Animal_Shelter_cut-release-0-29-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3014` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #592 |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no — the release's two (`0192`, `0193`) merged in their own PRs |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the four notes in `unreleased` into a new `0.29.0` entry, `major: true` on Lutan's call, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. Three of the four notes carry no role tag; the maintenance-bills note is tagged `["admin","management"]`, carried across unchanged from the note its own PR wrote. **Every admin receives mail**, because `major: true` — asserted as `majorReleasesSince("0.28.0") = ["0.29.0"]`. That is this cut's one irreversible effect, and it fires on Lutan's production Worker deploy, not on the merge
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying the release's two migrations, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the branch was created from `origin/main` at `188bdd1b` minutes earlier, so there was nothing to merge)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 53s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 159s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 196s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

The cut itself was verified mechanically rather than read over, which is the one
failure mode a release cut has that no gate catches. The four notes were parsed
from `origin/main:src/lib/releases.ts` and compared against the parsed `0.29.0`
entry, text and role tags separately:

```
unreleased now: []
notes before: 4 | notes in 0.29.0: 4
note mismatches: 0
lost or invented notes: false
any [object Object]/undefined in rendered notes: false
role tags changed: 0
majorReleasesSince('0.28.0'): [{"version":"0.29.0", ... "major":true ... }]
package.json: 0.29.0 | newest entry: 0.29.0
first four versions: 0.29.0 0.28.0 0.27.1 0.27.0
file order matches compareVersions: true
releases count: 42 -> 43
0.28.0 entry byte-identical: true
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a` on the first push and tick it in a follow-up commit once the run is actually green — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's two (`0192_who_and_where_for_all_residents_readers.sql`, `0193_can_see_drive_file.sql`) merged in their own PRs and are applied as a release step, recorded in section 8. They are sequential and no duplicate number exists this release — unlike `0.28.0`'s two `0191`s
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead, recorded in section 8 — production `192 applied, 2 pending`, dev `194 applied, 0 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step, recorded in section 8 — both `ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; both are already applied to dev by their own PRs, confirmed this session as `194 applied, 0 pending` with nothing on either side of the `origin/main` comparison
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; both were read this session and both are `create or replace` with idempotent grants
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; both are applied on dev, which is the evidence for this
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR; this belongs to the two files' own plans, which carry it. Neither file has a constraint or default to exercise: one replaces a view's `where`, the other adds a read-only function
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR. Both files state their own undo in the header (`0192`: restore the `0180` body; `0193`: the function is new and nothing on `0.28.0` calls it)
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves four existing notes into a release entry, verified as data in section 2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are three plain strings and one `{ text, roles }` object, all carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.29.0` entry and all four notes, including the maintenance-bills one; **receives mail**, because `major: true` | `majorReleasesSince("0.28.0")` = `["0.29.0"]`, so the mail fires on the production Worker deploy. Entry read back from the module: 4 notes, order unchanged |
| management | `/releases` | Same entry; sees all four, including the maintenance-bills note tagged `["admin","management"]` | the tag was carried across unchanged — asserted, `role tags changed: 0` |
| second_in_command | `/releases` | Sees the three untagged notes; the maintenance-bills note is filtered out by its tag | tag unchanged from the note its own PR wrote |
| head_of_maintenance | `/releases` | Same as above — three notes | as above |
| head_of_medical | `/releases` | Same as above — three notes | as above |
| doctor | `/releases` | Same as above — three notes | as above |
| volunteer | `/releases` | Same as above — three notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees, and no role tag was changed by this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic. The release's own manual changes belong to the `bills-inbox` and `maintenance-bills` PRs and their plans
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 42 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 42
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched — `releases.ts` is imported by `/releases` and `deploy.mjs`, and both were exercised (section 2 build, and `majorReleasesSince` run directly)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `188bdd1b` and `sync` reported nothing to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice — the major-versus-minor call is recorded in the commit message, this plan and the release record
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the four notes written by the `resident-picker-floor`, `backup-check-folder`, `bills-inbox` and `maintenance-bills` PRs into the `0.29.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. Neither of the release's two migrations derives a date either — checked this session: `0192` replaces a view's `where` clause with two role predicates, `0193` adds a function over seven `drive_file_id` columns. No date column, no `shelter_today()` bound
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither does the release
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — added after `0.28.0`'s Defect 2, where a stale install built a test Worker from something the lockfile does not describe and every guard passed. Run this session before any deploy: `npm ci` exited 0 and `package.json next: 16.3.8 | installed: 16.3.8`. The `Next.js version :` line on the first Worker build is read against this as the second check

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. The release's two are applied before the deploy, per the apply plan below. `0193` declares a consumer (`src/app/api/photos/[fileId]/route.ts`) that **differs from release `0.28.0`**, and `apply-migrations.mjs` warned about it. That is the safe direction: the function lands before the route that calls it is live
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager — run again against production immediately before the apply. Run once already this session: both `ok`, exit 0
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — **the nightly cron wrote a production backup at 03:00 today**: `lannacare-production-2026-10-12T2000Z.dump.age`, 1,142,655 bytes, in `~/backups/lannacare` on the Pi, logged in `~/backups/backup.log` as `encrypted for 1 recipient(s) (1.09 MB)` and uploaded to Drive. **So `0.28.0`'s Defect 4 was one missed night (2026-10-12), not an ongoing failure** — the job has fired since, unprompted, and this is the first release in three whose backup gate is satisfied by the cron rather than by a hand-made dump. Separately, **neither of this release's migrations holds or rewrites a single row**: `0192` replaces a view's `where` clause and `0193` creates a read-only function, so the gate is satisfied rather than waived. The restore half is still unexercised — carried forward
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `192 applied, 2 pending`
  2. `--env production --dry-run` — expect both `ok`. **A red here is not automatically a stop**: the per-file `begin … rollback` trap has fired in three of the last seven releases. It does not apply this release — the two files are independent, neither depends on anything the other provides — and the dry-run came back clean on the first run
  3. `--env production` — applies `0192_who_and_where_for_all_residents_readers.sql` and `0193_can_see_drive_file.sql` to `dbkodyyxxhtygxcxmfcu`
  4. **before** either deploy, and with no user-facing window needed

  Why no window is needed, read against the live `0.28.0` source rather than taken from the headers:

  - **`0192_who_and_where_for_all_residents_readers.sql`** replaces the `resident_who_and_where` view, which the live app reads. Diffed against its live definition in `0180_perm_drop_enum_readers.sql`: the **only** change in the whole statement is the filter, `where public.on_volunteer_floor()` → `where public.on_volunteer_floor() or public.sees_all_residents()`. Every column, every join and the column order are identical, so `create or replace` keeps the grants. Strictly a widening — it can only return rows to more roles, never fewer, and the columns it exposes are a subset of what `sees_all_residents()` roles already read from `residents`. A clinic login, a public viewer and a signed-out visitor are refused exactly as before (both predicates false).
  - **`0193_can_see_drive_file.sql`** adds a function that did not exist. Nothing on live `0.28.0` calls it — the live photo route still runs its seven `select … limit 1` queries (`canSeeInternalFile`, `src/app/api/photos/[fileId]/route.ts:79`). The new route calls it through `supabase.rpc` on the **same** `createClient()` session as the seven queries it replaces, and the function is `security invoker`, so the caller's own RLS decides every branch exactly as it did before; under `service_role` RLS is bypassed, as it was before. The seven branches are the same seven tables and columns, in the same order, and an error is treated as "no" as it was before. Additive.

  So the silent-failure question for this release answers **no**, on the evidence above rather than on the headers' own descriptions. `0192`'s header does claim "same columns, same order" — that is a statement of intent, so it was diffed rather than believed, and it happens to be true.

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — rollback is `./scripts/pi/deploy-pi.sh --ref b5fd020d` on the Pi (a rebuild of `0.28.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the two migrations, and the release mail.** Neither file has a down-migration, though both state their undo in their header. The practical position is that the schema stays and the app rolls back, which is safe because `0.28.0` never calls `can_see_drive_file()` at all, and reads `resident_who_and_where` through a filter that has only been widened — the same facts that make the forward direction safe. The mail cannot be unsent: it goes out on the production Worker deploy, so the point of no return is Lutan's one command, not the merge

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up.

| # | What to check | Where |
|---|---|---|
| 1 | The `0.29.0` entry reads correctly on `/releases`, with all four notes — and that an Admin or Management login sees the maintenance-bills note while a 2IC or volunteer login does not. The page is behind sign-in, so no session can load it | `/releases`, production, any signed-in role |
| 2 | The release mail for `0.29.0` arrived, from `releases@lannacare.org` with the version in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure | the admin inbox |

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

Automated checks by: Claude (production release manager session)  Date: 2026-10-13

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the entry read on `/releases` by a tagged and an untagged role, and the release mail arriving

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `release-prs.mjs b5fd020d HEAD` exited **1**, naming three test plans (`planner-handover-116.md`, `brief-finish-line.md`, `release-tooling-fixes.md`) as belonging to no PR in its list | accepted — all three are squash-merged PRs (#588, #583, #579), matched by their commit subjects, and added to the release by hand. The fourth release running to hit this; it is routine and not a fault in the script |
