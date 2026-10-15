# Feature test plan — cut-release-0-32-0

## Header

| | |
|---|---|
| Feature | Cut release `0.32.0`: move the six notes in `unreleased` into a new `0.32.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-32-0` @ `C:\Development\Animal_Shelter_cut-release-0-32-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #639 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no — the release's two (`0198`, `0199`) merged in their own PRs (#632, #635) |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the six notes in `unreleased` into a new `0.32.0` entry, `major: true` on Lutan's call in chat, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. **Four of the six notes are untagged; two carry `["admin", "management"]`** — the facility-map room-placement note and the Settings → Website → Donate note. Both tags were written by the feature PRs and are carried across unchanged, not decided here, and both describe a Settings page only those two roles can reach, so the tag cannot hide a line from someone who could act on it. **Every admin receives mail**, because `major: true` — asserted as `majorReleasesSince("0.31.0") = ["0.32.0"]`. That is this cut's one irreversible effect, and it fires on Lutan's production Worker deploy, not on the merge
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying `0198` and `0199` to production, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Run twice: the branch was created from `origin/main` at `0d66ecc0` and had nothing to merge, then `main` moved to `6ce74e07` and the second `sync` fast-forwarded that one docs commit in. See the note below — the first gates run was red on `lint` for a fault that came in with it
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 28s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 230s
=== gates: test — npm test
=== gates: test exited 0 after 6s
=== gates: build — npm run build
=== gates: build exited 0 after 103s
gates: typecheck=0 lint=0 test=0 build=0
```

`typecheck` at 28s and `build` at 103s are a warm Turbopack cache from the first
run of this tree; `0.31.0`'s cut was a cold 179s and 142s. The exit codes are what
was read, not the timings.

**The first gates run on this branch exited 1 on `lint`, and the cause was not in
this PR.** `check-backlog-sections` reported `line 863: open item below
"## Completed", so nothing will ever read it` — the `map_rooms.map_id`/`.shape`
column-drop item, which arrived on `main` with this morning's backlog merge and
was therefore red on `main` as well as here. It was already fixed on the `backlog`
branch by another session (`6ce74e07`), which had reached `main` by the time it was
looked at; `sync` brought it in and the re-run was clean. Recorded because a red
gate on a release cut is worth being able to account for, and this one was
inherited rather than caused. `eslint` itself reported `0 errors, 43 warnings` on
both runs.

`node scripts/check-release-guards.mjs` — all 15 assertions `ok`, exit 0,
including `--drift reads the arrays it prints from driftReport()`.

The cut itself was verified **mechanically rather than read over**, which is the
one failure mode a release cut has that no gate catches: a lost or altered note is
invisible to `typecheck`, `lint`, `build` and CI alike. All six notes were parsed
from `origin/main:src/lib/releases.ts` and compared against the parsed `0.32.0`
entry, text and role tags separately. Output unedited:

```
PASS origin/main unreleased had 6 notes (had 6)
PASS new entry has the same count (6 vs 6)
PASS note 1 text identical
PASS note 1 roles identical (["admin","management"] vs ["admin","management"])
PASS note 2 text identical
PASS note 2 roles identical (null vs null)
PASS note 3 text identical
PASS note 3 roles identical (null vs null)
PASS note 4 text identical
PASS note 4 roles identical (null vs null)
PASS note 5 text identical
PASS note 5 roles identical (["admin","management"] vs ["admin","management"])
PASS note 6 text identical
PASS note 6 roles identical (null vs null)
PASS nothing invented
PASS nothing lost
PASS unreleased emptied (0)
PASS newest entry is 0.32.0 (0.32.0)
PASS newest entry is major
PASS date is today (2026-10-15)
PASS title present
PASS majorReleasesSince("0.31.0") -> ["0.32.0"]
PASS package.json 0.32.0 === newest entry 0.32.0
PASS releases array is strictly newest-first by compareVersions
PASS no [object Object] in rendered notes
PASS no 'undefined' in rendered notes
PASS every note has text
PASS 0.31.0 entry byte-identical to origin/main
PASS one entry added (45 -> 46)

all checks passed
```

The comparison reads `origin/main`'s copy of the file through
`MSYS_NO_PATHCONV=1 git show`, not the bare form — `CLAUDE.md` records that Git
Bash mangles a `<rev>:<path>` argument whose path starts with a dot, and the
failure mode is an empty result that looks exactly like "nothing to compare".

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a` on the first push and tick it in a follow-up commit once the run is actually green — all 7 jobs `success` on run **38684899210** at `89237a52`: `script-integrity`, `public-views`, `migration-numbers`, `check`, `audit`, `test-plan`, `new-policy-role-names`. Read from `gh run view 38684899210 --json jobs`, not from `gh pr checks`. `audit` is green this run, which it has not always been — a red there would not have been a blocker either way.

  **The first run was green, which the template says to expect not to be, and the reason is worth recording.** The usual first run fails on `test-plan` by construction, because the commit that creates the PR cannot yet contain the plan. Here the plan was written *before* the PR was opened and committed alongside the cut, so `test-plan` had a complete plan to read on the first push. The one cost of doing it that way is that the plan's header had to guess the PR number — it guessed #638 and the PR came out #639 — which this same commit corrects. **Ticking this line is itself a commit, so a further run follows it, and the merge waits for that one**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's two — `0198_map_room_placements.sql` (#632) and `0199_pack_sizes.sql` (#635) — merged in their own schema-first PRs and are applied as a release step, recorded in section 8. They are sequential and unique, and `node scripts/release-prs.mjs c1026407 HEAD` exited **0**, which is what says every migration in the range belongs to a PR in the list
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead — production `198 applied, 2 pending`, dev `200 applied, 0 pending` with nothing on either side of the `origin/main` comparison. Production being two behind is the "a migration merged since the last release" case the handover names as normal
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step and recorded in section 8 — both `ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; both are already applied to dev by #632 and #635, confirmed this session as `200 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; both were read this session and use `create table if not exists`, `add column if not exists`, `drop index if exists` and `drop policy if exists` throughout, and both state their own re-runnability in their headers
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this belongs to #632's and #635's own plans, which carry it
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR. Worth recording here anyway, because it is what makes this release's apply safe: `0199` ships `scripts/check-unit-conversions.mjs`, a one-transaction harness whose assertions include `FAIL C second purchase unit refused` (an item may now be bought in more than one size) and `FAIL C default not handed on` (unticking the default promotes another bought-in size), which is the pair that proves its back-compatibility trigger. See the silent-failure answer in section 8
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR; see the rollback position in section 8 for what the two do and do not leave recoverable
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves six existing notes into a release entry, verified as data in section 2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are six values carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.32.0` entry and all six notes, including the two tagged `["admin", "management"]`; **receives mail**, because `major: true` | `majorReleasesSince("0.31.0")` = `["0.32.0"]`, so the mail fires on the production Worker deploy. Entry read back from the module: 6 notes, order unchanged |
| management | `/releases` | Same entry, all six notes — both tags include `management` | asserted, note 1 and note 5 roles `["admin","management"]`, the rest `null` |
| second_in_command | `/releases` | The four untagged notes; not the facility-map room-placement note or the Settings → Website → Donate note | as tagged by the feature PRs and carried across unchanged. Both describe a Settings page this role cannot reach |
| head_of_maintenance | `/releases` | The four untagged notes | as above |
| head_of_medical | `/releases` | The four untagged notes — including the vet-visit calendar link, which is the one most likely to be theirs | untagged is why it reaches them |
| doctor | `/releases` | The four untagged notes — including the vet-visit calendar link | as above |
| volunteer | `/releases` | The four untagged notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees. The two role tags were **not** decided at the cut: they were written by the `map-rooms-build` and `donate-page-order` PRs and are asserted identical to `origin/main` in section 2
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic. The release's own manual changes belong to the `map-rooms-build` and `menu-coverage-orphans` PRs and their plans
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 45 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 45
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched — `releases.ts` is imported by `/releases`, by `deploy.mjs` and by the Worker's `/api/releases/current`, and all three paths were exercised: the build compiled the route, `majorReleasesSince` and `compareVersions` were run directly, and the module parses under Node's type stripping as `deploy.mjs` loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `0d66ecc0`; the second `sync` brought in `6ce74e07`, a one-line `docs/backlog.md` move, and the full gates re-run after it was clean

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice. This cut made no editorial judgement at all: both role tags and all six note texts were carried across unchanged from what the feature PRs wrote, and that is asserted rather than claimed
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the six notes written by the `map-rooms-build`, `donate-page-order`, `vet-visit-calendar-link`, `menu-coverage-orphans`, `small-ui-fixes-fold` and `public-site-speed-follow-ups` PRs into the `0.32.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose — the cut commit's claims are each one of the assertions pasted in section 2, and the silent-failure conclusion in section 8 was reached by diffing `0198`'s read policy against the live policy on the table beside it and by tracing every reader of `is_purchase_unit` in the tree, not by reading either migration's header. **Both headers say `-- consumer: none` and one of them is now wrong** — see the apply plan

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. **The release does contain date-derived behaviour and it is not this PR's**: the vet-visit Google Calendar link builds a start and end instant from a booked visit, and that check belongs to `vet-visit-calendar-link.md`, which carries it including a 03:00 visit and a Thai reader. It is not re-signed here — copying another plan's items into the cut plan is what the template forbids
  - *Does the logic handle the boundary?* — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — both blocks in section 2 are the scripts' own stdout, copied without tidying
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Expect this to be unanswerable**: `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate and there is no cacheable public page. **Three of this release's six notes are about the public website** — the Donate page order, the Donate error state and the image-size work — which is the most of any release so far

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither does the release
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — run this session before any deploy: `npm ci` exited 0 in `C:\Development\Animal_Shelter_App`, and `node_modules/next/package.json` reads `16.3.8` against `package.json`'s `"next": "16.3.8"`. The `Next.js version :` line on the first Worker build is read against `package.json` as the second check, per `0.28.0`'s Defect 2

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. **The release does, and the ordering matters**: `0199_pack_sizes.sql` declares `-- consumer: none`, but `src/lib/units.ts` on `main` selects `is_default_purchase` in its column list and resolves the purchase unit through it (`units.ts:160`), and that code merged in `0199`'s own PR (#635). So the header is wrong by one release and the apply must precede the deploy. The consequence of getting it the wrong way round would be **loud, not quiet** — PostgREST answers an unknown column with a `42703` error, not an empty result — but the apply plan below puts both files in before either deploy anyway
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — run this session, both `ok`, exit 0, read from the command itself rather than through a pipe:

```
Environment: production — project dbkodyyxxhtygxcxmfcu
This checkout: 198 applied, 2 pending.
dry-run 0198_map_room_placements.sql … ok
dry-run 0199_pack_sizes.sql … ok
Dry run only — nothing was applied.
```

  **No production-only guard appeared** — the eighth release running. It can only show up at the production dry-run, and it did not. The release manager re-runs this immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the nightly cron wrote a production backup at 03:00 today**: `lannacare-production-2026-10-14T2000Z.dump.age`, 1,144,560 bytes, in `~/backups/lannacare` on the Pi. **This gate is satisfied rather than waived**: `0199` drops two unique indexes and installs a trigger, which is a rewriting migration by any reading, even though every column it adds is additive and defaulted. The restore half remains unexercised against a real Supabase project, carried forward for the **sixth** release
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `198 applied, 2 pending`
  2. `--env production --dry-run` — expect two `ok`. **A red here would not automatically be a stop**: the per-file `begin … rollback` trap means a file depending on a still-pending file reports FAILED while being perfectly correct. It did **not** fire — `0198` and `0199` touch disjoint tables and neither references anything the other creates — and both came back `ok`, exit 0
  3. `--env production` — applies `0198` then `0199` to `dbkodyyxxhtygxcxmfcu`, in that order
  4. **before** either deploy, and with no user-facing window needed

  **The silent-failure question for this release has one real candidate, and it closes.** `0198` creates `map_room_placements`, and the Enclosures page reads it through an embedded select — `src/app/enclosures/page.tsx:238` — whose error is discarded: `const { data: roomRows }` with no `error`, then `roomRows ?? []`. PostgREST answers an embedded resource the caller may not read with an **empty array rather than an error**, so a policy mismatch here would empty every room off the facility map with nothing said, on a page that would otherwise look perfectly healthy.

  It closes because the two policies are the same policy, which was checked by diffing them rather than by reading `0198`'s header claim that they match:

  - `0198`'s read policy is `map_room_placements_read … using ((select private.has_app_access()))`.
  - `map_rooms`'s live read policy, as narrowed by `0170` after the 2026-10-09 finding, is `map_rooms_read … using ((select private.has_app_access()))`.

  They are character-for-character identical, and `map_rooms` is read in the *same* query as the embedded placements. So no login can be allowed the rooms and refused their placements: either both answer or neither does, and "neither" is the pre-existing behaviour of a login with no app access, not a new failure this release introduces.

  **`0199` is the one that sounds worse and is safer, and it is worth reading as the worked example.** Dropping the two unique indexes on `is_purchase_unit` removes the database's guarantee that an item has exactly one purchase unit, which is precisely the kind of change that lets old code quietly pick an arbitrary row. It does not here, for two reasons that were checked:

  - **Nothing in the app picked "the" row by that column.** The only resolver in the tree is `src/lib/units.ts:160`, and it reads `conversions.find((c) => c.isDefaultPurchase) ?? conversions.find((c) => c.isPurchase) ?? null` — default first, with the old column as a fallback. Every other hit on `is_purchase_unit` in `src/` is the Units panel listing rows or writing one.
  - **The migration keeps the old invariant true anyway**, with a trigger: the first bought-in size of an item becomes its default, unticking the default promotes another bought-in size, so `is_purchase_unit and is_default_purchase` names exactly the one row the dropped index used to name. `scripts/check-unit-conversions.mjs` asserts both halves of that in a rolled-back transaction.

  `0199`'s price decision is also deliberately inert in this release: the view `item_latest_delivery_cost` is created but the forecasts and Cashflow still read `cost_per_unit`, so nothing is re-valued by applying it.

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref c1026407` on the Pi (a rebuild of `0.31.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the two migrations, and the release mail.** Neither has a down-migration file. The practical position is better than `0.31.0`'s: **both are inert under `0.31.0`**. `0198` adds a table nothing in `0.31.0` reads and makes two `map_rooms` columns nullable while leaving them in place, which is exactly what the live `0.31.0` editor still reads and writes; `0199` adds columns and a view nothing in `0.31.0` reads, and its trigger reproduces the invariant the dropped indexes enforced, so `0.31.0`'s "the row with `is_purchase_unit`" still names one row. So unlike `0195` last release, **nothing here applies against rolled-back code**. The mail cannot be unsent: it goes out on the production Worker deploy, so the point of no return is Lutan's one command, not the merge

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.32.0` entry reads correctly on `/releases`, with all six notes, and that the two tagged `["admin", "management"]` notes appear for those roles and not for the others. The page is behind sign-in, so no session can load it | `/releases`, production, an admin and one other role |
| 2 | The release mail for `0.32.0` arrived, from `releases@lannacare.org` with the version in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure | the admin inbox |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the entry read on `/releases` with its two role-tagged notes, and the release mail arriving

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `0199_pack_sizes.sql` declares `-- consumer: none`, but `src/lib/units.ts` reads `is_default_purchase` and merged in the same PR (#635) | **accepted, recorded rather than edited.** An applied migration is never edited, and the header's only mechanical effect is the `apply-migrations.mjs` release warning, which is advisory. The ordering it would have warned about is enforced by the apply plan above, and getting it wrong would fail loudly (`42703`), not quietly |
| 2 | low | The first `gates.mjs` run on this branch exited 1 on `lint`, from a `docs/backlog.md` item below `## Completed` that arrived on `main` with the morning backlog merge | **fixed before the cut, not by this PR.** Another session had already corrected it on the `backlog` branch (`6ce74e07`); `sync` brought it in and the full re-run was clean |
