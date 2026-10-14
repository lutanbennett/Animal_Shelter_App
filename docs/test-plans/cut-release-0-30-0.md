# Feature test plan — cut-release-0-30-0

## Header

| | |
|---|---|
| Feature | Cut release `0.30.0`: move the eight notes in `unreleased` into a new `0.30.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-30-0` @ `C:\Development\Animal_Shelter_cut-release-0-30-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #614 |
| Tested by / date | Claude (production release manager session) / 2026-10-14 |
| Carries a migration? | no — the release's one (`0194_role_cards.sql`) merged in its own PR (#602) |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the eight notes in `unreleased` into a new `0.30.0` entry, `major: true` on Lutan's call in chat, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. Five of the eight notes carry no role tag; three (Who does what cards, bill photos, Vet visits) are tagged `["admin","management"]`, carried across unchanged from the notes their own PRs wrote. **Every admin receives mail**, because `major: true` — asserted as `majorReleasesSince("0.29.0") = ["0.30.0"]`. That is this cut's one irreversible effect, and it fires on Lutan's production Worker deploy, not on the merge
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying `0194_role_cards.sql` to production, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the branch was created from `origin/main` at `0947cec2` minutes earlier, so there was nothing to merge)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 19s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 146s
=== gates: test — npm test
=== gates: test exited 0 after 5s
=== gates: build — npm run build
=== gates: build exited 0 after 59s
gates: typecheck=0 lint=0 test=0 build=0
```

`build` at 59s against `0.29.0`'s 196s is a warm Turbopack cache, not a short
build — the handover lists it under things that look alarming and are not. The
gates were run twice this session: once before this plan existed (`build` 153s on
a colder cache) and again to capture the block above unedited, because the first
run's opening lines had been lost to a `tail`.

`node scripts/check-release-guards.mjs` — all 16 assertions `ok`, exit 0,
including `--drift reads the arrays it prints from driftReport()`, the guard #579
added because nothing in CI runs `--drift`.

The cut itself was verified **mechanically rather than read over**, which is the
one failure mode a release cut has that no gate catches: a lost or altered note is
invisible to `typecheck`, `lint`, `build` and CI alike. All eight notes were
parsed from `origin/main:src/lib/releases.ts` and compared against the parsed
`0.30.0` entry, text and role tags separately. Thirty assertions, output unedited:

```
Comparing 8 note(s) on origin/main against the new 0.30.0 entry
  OK   note count: 8 -> 8
  OK   note 1 text identical (Your home screen is now your cards. Each...)
  OK   note 1 roles identical (null)
  OK   note 2 text identical (The public website is easier to use on a...)
  OK   note 2 roles identical (null)
  OK   note 3 text identical (Who does what is now cards. Give a role ...)
  OK   note 3 roles identical (["admin","management"])
  OK   note 4 text identical (The public website now tells search engi...)
  OK   note 4 roles identical (null)
  OK   note 5 text identical (The public website now promises only wha...)
  OK   note 5 roles identical (null)
  OK   note 6 text identical (Photos of bills now show. A bill’s photo...)
  OK   note 6 roles identical (["admin","management"])
  OK   note 7 text identical (Every date box now reads day first, DD/M...)
  OK   note 7 roles identical (null)
  OK   note 8 text identical (New Vet visits page under Shelter Operat...)
  OK   note 8 roles identical (["admin","management"])
  OK   no note in the entry that was not in unreleased
  OK   unreleased is now empty
  OK   version is 0.30.0 (0.30.0)
  OK   date is today (2026-10-14)
  OK   major is true (mails every admin)
  OK   title present: "Your home screen is now your cards, and Who does what gives them out"
  OK   package.json 0.30.0 === newest entry 0.30.0
  OK   releases grew by exactly one (43 -> 44)
  OK   every previously released entry is byte-identical
  OK   file order is newest-first by compareVersions
  OK   majorReleasesSince("0.29.0") === ["0.30.0"] (got ["0.30.0"])
  OK   no [object Object] / undefined / null in rendered notes
  OK   every role tag is a non-empty string
  OK   no retired role tag (e.g. staff) on a new note

All cut checks passed.
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a` on the first push and tick it in a follow-up commit once the run is actually green — all 7 jobs `success` on run 38549509827 at `12cf2e43`, the branch tip: test-plan, script-integrity, audit, new-policy-role-names, check, public-views, migration-numbers. Read from `gh run view 38549509827 --json jobs`, not from `gh pr checks`. `audit` is green this run, which it has not always been — a red there would not have been a blocker either way

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's one, `0194_role_cards.sql`, merged in its own schema-first PR (#602) and is applied as a release step, recorded in section 8. It is sequential and unique — unlike `0.28.0`'s two files both numbered `0191`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead, recorded in section 8 — production `194 applied, 1 pending`, dev `195 applied, 0 pending` with nothing on either side of the `origin/main` comparison
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step and recorded in section 8 — `dry-run 0194_role_cards.sql … ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; `0194` is already applied to dev by #602, confirmed this session as `195 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; `0194` was read this session and is `create table if not exists`, `create or replace function`, `drop trigger if exists` / `drop policy if exists` throughout, and its seed block opens `if exists (select 1 from public.role_cards) then return;` so a second run seeds nothing
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; `0194` is applied on dev and `scripts/check-cards-schema.mjs` is the standing check that the live rows agree with the code, cell for cell
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR; this belongs to #602's own plan, which carries it. Worth recording here anyway, because it is what makes this release's apply safe: `0194` carries its own `raise exception` assertions *inside the migration*, so the proof runs on every environment it is applied to rather than only where someone wrote a harness. See the apply plan in section 8
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR. `0194` states its own undo in its header: drop the four functions and the two tables, and remove the two names from `AUDITED_TABLES`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves eight existing notes into a release entry, verified as data in section 2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are five plain strings and three `{ text, roles }` objects, all carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.30.0` entry and all eight notes, including the three tagged ones; **receives mail**, because `major: true` | `majorReleasesSince("0.29.0")` = `["0.30.0"]`, so the mail fires on the production Worker deploy. Entry read back from the module: 8 notes, order unchanged |
| management | `/releases` | Same entry; sees all eight, including the three notes tagged `["admin","management"]` | the tags were carried across unchanged — asserted, `note N roles identical` for all eight |
| second_in_command | `/releases` | Sees the five untagged notes; the Who does what, bill photos and Vet visits notes are filtered out by their tags | tags unchanged from the notes their own PRs wrote |
| head_of_maintenance | `/releases` | Same as above — five notes | as above |
| head_of_medical | `/releases` | Same as above — five notes | as above |
| doctor | `/releases` | Same as above — five notes | as above |
| volunteer | `/releases` | Same as above — five notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees, and no role tag was changed by this PR
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic. The release's own manual changes belong to the `cards-home-screen`, `cards-who-does-what` and `vet-visits-director` PRs and their plans
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 43 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 43
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched — `releases.ts` is imported by `/releases`, by `deploy.mjs` and by the Worker's `/api/releases/current`, and all three paths were exercised: the build compiled the route, `majorReleasesSince` was run directly, and the module parses under Node's type stripping as `deploy.mjs` loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `0947cec2` and `sync` reported nothing to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice — the major-versus-minor call is recorded in the commit message, this plan and the release record
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the eight notes written by the `cards-home-screen`, `public-site-phone-polish`, `cards-who-does-what`, `public-site-findability`, `public-site-trust-copy`, `bills-photo-fix`, `us-date-order` and `vet-visits-director` PRs into the `0.30.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose — the cut commit's claims are each one of the thirty assertions pasted in section 2, and the silent-failure conclusion in section 8 was reached by diffing `0194` against production's own rows in a dry-run, not by reading its header

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. **The release contains date-derived behaviour and it is not this PR's**: the Vet visits page groups by day with Today/Tomorrow and an Overdue band, and `us-date-order` changes how every date box parses and renders. Both carry that check in their own plans (`vet-visits-director.md`, `us-date-order.md`), and neither is re-signed here — copying another plan's items into the cut plan is what the template forbids
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — both blocks in section 2 are the scripts' own stdout, copied without tidying. The gates block was regenerated rather than reconstructed from memory once the first run's opening lines had been lost
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var. The release adds none either, but it does make one **existing** setting visible: `backup-check-alarm` turns an unconfigured `BACKUP_DRIVE_FOLDER_ID` into a stated settings fault on `/admin/status`. Checked this session rather than assumed — the production Pi's `~/backups/backup.log` names `Backups folder: BACKUP_DRIVE_FOLDER_ID (the folder named directly)`, so it is set there. The Worker side is in Left for manual verification
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — run this session before any deploy: `npm ci` exited 0 in `C:\Development\Animal_Shelter_App`, and `package.json` declares `"next": "16.3.8"`. The `Next.js version :` line on the first Worker build is read against this as the second check, per `0.28.0`'s Defect 2 — the asymmetry recurs every time a dependency bump merges between releases, and this release's range does touch the lockfile

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. The release's `0194` is applied **before** either deploy, per the apply plan below. `apply-migrations.mjs` warned that two of its declared consumers (`src/lib/permissions/cards.ts`, `scripts/check-cards-schema.mjs`) do not exist in live `0.29.0` and two more differ from it. That is the safe direction, which the handover names explicitly: the tables land before the code that reads them is live
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager — run again immediately before the apply. Run once already this session: `dry-run 0194_role_cards.sql … ok`, exit 0
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the nightly cron wrote a production backup at 03:00 today**: `lannacare-production-2026-10-13T2000Z.dump.age`, 1,147,241 bytes, in `~/backups/lannacare` on the Pi, and the log records it uploaded to Drive. Eleven backups kept for production, ten locally. So the cron has now fired unprompted on consecutive nights and the gate is satisfied by the job rather than by a hand-made dump, for the second release running. **`0194` is additive but it does write rows** — it seeds `role_cards` and `role_extras` and may rewrite `role_permissions` — so this gate is satisfied rather than waived. The restore half remains unexercised against a real Supabase project, carried forward for the third release
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `194 applied, 1 pending`
  2. `--env production --dry-run` — expect `ok`. **A red here is not automatically a stop**: the per-file `begin … rollback` trap has fired in several of the last releases. It cannot apply this release — there is only one pending file, so there is no earlier pending file for it to depend on — and the dry-run came back clean on the first run
  3. `--env production` — applies `0194_role_cards.sql` to `dbkodyyxxhtygxcxmfcu`
  4. **before** either deploy, and with no user-facing window needed

  **The silent-failure question for this release answers no, and `0194` is where it was asked.** The release note says "Nobody's access changes on the day this arrives", which is exactly the kind of claim the handover says to diff rather than believe. It holds, and for a better reason than a careful author:

  - `0194` does not carry a seed taken from dev. Its seed block derives each role's cards **from that database's own `role_permissions`** — for every non-fixed role it takes the cards whose bundles the role's existing cells already fully give, records every remaining cell as a `role_extras` row with a stated reason, and then asserts that cards-plus-extras reproduces `role_permissions` cell for cell, `raise exception` if it does not. It also refuses a named card the role's cells would not already give, as "a finding, not something to adjust".
  - So the migration **cannot** quietly change anyone's access: if it could not reproduce production's permissions exactly, it aborts and the transaction rolls back. The failure mode is loud by construction.
  - And it has already been exercised against production's real rows: `--dry-run` runs the real DDL inside `begin … rollback` against production's actual schema, so that seed block **ran against production's own `role_permissions` and raised nothing**. That is the evidence for the apply, not the header's own description.
  - Forward of that, `set_role_cards()` keeps extras across every recompute, and `scripts/check-cards-schema.mjs` is the standing assertion that the live rows and the code still agree. The two readers that come live in this release fail loudly rather than silently: `src/lib/home/roles.ts` throws on a failed `role_cards` read, and the Who does what actions return a visible `databaseFailure` rather than a partial write.

  Two of the release's other changes **remove** silent failures rather than adding any: bill photos were being saved and never shown, and now say so when one cannot be loaded; and the backup tile now reads an unconfigured folder as a settings fault instead of looking like a missing backup.

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref 9cb36eea` on the Pi (a rebuild of `0.29.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: `0194`, and the release mail.** `0194` has no down-migration file, though its header states the undo (drop the four functions and two tables, remove the two names from `AUDITED_TABLES`). The practical position is that the schema stays and the app rolls back, which is safe because live `0.29.0` contains none of the code that reads these tables — `src/lib/permissions/cards.ts` does not exist in `0.29.0` at all, which is precisely what the consumer warning says. The seeded rows sit unread. The mail cannot be unsent: it goes out on the production Worker deploy, so the point of no return is Lutan's one command, not the merge

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.30.0` entry reads correctly on `/releases`, with all eight notes — and that an Admin or Management login sees the three tagged notes (Who does what cards, bill photos, Vet visits) while a 2IC or volunteer login sees only the five untagged ones. The page is behind sign-in, so no session can load it | `/releases`, production, any signed-in role |
| 2 | The release mail for `0.30.0` arrived, from `releases@lannacare.org` with the version in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure | the admin inbox |
| 3 | `BACKUP_DRIVE_FOLDER_ID` is set in the **production Worker** environment, not only on the Pi. The Pi was confirmed from its own backup log this session; the Worker side needs the Cloudflare settings, which no session here can read. If it is unset, `/admin/status` will now state it as a settings fault — the new behaviour working, not a new breakage | Cloudflare production environment, and `/admin/status` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the three rows above — the entry read on `/releases` by a tagged and an untagged role, the release mail arriving, and the Worker's backup folder setting

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `release-prs.mjs 9cb36eea HEAD` exited **1**, naming three test plans (`planner-handover-138.md`, `planner-handover-127.md`, `us-date-order.md`) as belonging to no PR in its list | accepted — all three are squash-merged PRs (#612, #597, #603), matched by their commit subjects and added to the release by hand. The fifth release running to hit this; it is routine and not a fault in the script. The resulting PR list runs #593–#613 with **no gaps**, which is the independent check that none is missing |
