# Feature test plan — cut-release-0-32-1

## Header

| | |
|---|---|
| Feature | Cut release `0.32.1`: move the five notes in `unreleased` into a new `0.32.1` entry, `major: false`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-32-1` @ `C:\Development\Animal_Shelter_cut-release-0-32-1` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #651 |
| Tested by / date | Claude (production release manager session) / 2026-10-15 |
| Carries a migration? | no — the release's seven (`0200`–`0206`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.32.1` entry, `major: false` on Lutan's call in chat, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. **Three of the five notes are untagged; two carry `["admin", "management"]`** — the Settings → Website → Pages photo note and the Book a vet appointment button note. Both tags were written by the feature PRs and are carried across unchanged, not decided here. **No admin receives mail, because `major: false`** — asserted as `majorReleasesSince("0.32.0")` returning an empty list. This cut therefore has **no irreversible effect at all**, which is the material difference from `0.32.0`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying `0200`–`0206` to production, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

**The one risk worth naming is the version call itself.** Minor mails nobody, and these five notes do describe things a user could not do yesterday — the facility map opening to anyone with the Enclosures card, page photos, the Book a vet appointment button, items in several pack sizes. By the stated question (*can anyone do something today they could not do yesterday*) a case for major existed and was **put to Lutan in chat with that case stated**; he called it minor. Recorded here because the consequence is that admins are not told, and that should be a decision on the record rather than an omission.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` at `767d9083` (the morning's backlog merge) and had nothing to merge. `main` did not move while the cut was made
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 69s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 144s
=== gates: test — npm test
=== gates: test exited 0 after 4s
=== gates: build — npm run build
=== gates: build exited 0 after 144s
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-release-guards.mjs` — all **15** assertions `ok`, exit 0, read from the command itself:

```
ok   unreleased notes are a problem
ok   package.json behind the newest release is a problem
ok   a migration the database lacks is refused
ok   a database holding every migration passes
ok   schema ahead of code is fine
ok   could not ask warns and does not refuse
ok   clean release, clean schema: go
ok   unreleased refuses
ok   missing migration refuses
ok   could not ask alone goes ahead, with its warnings
ok   --force goes ahead and keeps every problem for the record
ok   --force with nothing to override records nothing
ok   --env test is not guarded
ok   --force without a reason is refused
ok   --drift reads the arrays it prints from driftReport()
```

The thirteenth line of that output — `--env test is not guarded` — is an asserted behaviour of the runner and is the mechanism behind Defect 1 below. It passed, because it is what the script intends.

- [x] **The cut was verified mechanically, not read over.** A lost or altered note is the one failure mode a release cut has that no gate catches: it is invisible to `typecheck`, `lint`, `build` and CI alike. All five notes were parsed from `origin/main:src/lib/releases.ts` and compared against the parsed `0.32.1` entry, text and role tags separately. Output unedited:

```
PASS:
  [ok] note count 5 matches unreleased
  [ok] every note text and role tag identical to unreleased
  [ok] unreleased is empty
  [ok] version 0.32.1 at top
  [ok] major: false — mails nobody
  [ok] date 2026-10-15
  [ok] all 46 previous entries byte-identical
  [ok] package.json 0.32.1 matches newest entry
  [ok] majorReleasesSince("0.32.0") is empty — no admin mail
  [ok] order is newest-first
  [ok] no [object Object] or undefined in any note

All cut assertions passed.
```

The notes were **moved by script, not retyped**, so there is no path by which a character could change: the `unreleased` array body was sliced out of the file verbatim and re-inserted inside the new entry. The comparison reads `origin/main`'s copy through `MSYS_NO_PATHCONV=1 git show` rather than the bare form — `CLAUDE.md` records that Git Bash mangles a `<rev>:<path>` argument whose path starts with a dot, and the failure mode is an empty result that looks exactly like "nothing to compare". `src/lib/releases.ts` does not start with a dot, so the bare form would have worked here; the safe form was used anyway rather than relying on that.

- [x] CI green on the PR (runs the same three) — **not yet true in the commit that creates the PR.** Left unticked on the first push and ticked in a follow-up commit once the run is actually green, read from `gh run view <id> --json jobs` rather than from `gh pr checks`. The plan was written *before* the PR was opened and is committed alongside the cut, so `test-plan` has a complete plan to read on the first push — which, per `0.32.0`, means the **first** run may well be green rather than red by construction. The one cost is that this plan's header has to guess the PR number, and the CI-green commit corrects it if wrong

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's seven — `0200`–`0206` — merged in their own schema-first PRs and are applied as a release step, recorded in §8. They are sequential and unique on `main`. **`node scripts/release-prs.mjs 038859fb HEAD` exited 1**, and the reconciliation is in §8: the two orphans are squash-merged PRs, both confirmed MERGED on GitHub
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead — production `200 applied, 7 pending`, dev `208 applied, 0 pending`. Production being seven behind is the "a migration merged since the last release" case the handover names as normal. **Dev is not clean**, and that is Defect 1
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step and recorded in §8 — exit **0**, with the per-file rollback trap firing on two files and the runner itself saying so
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; all seven are already applied to dev by their own PRs, confirmed this session as `0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; all seven were read this session and use `add column if not exists`, `create or replace view`, `drop column if exists`, `drop constraint if exists` and `on conflict do nothing` throughout, and each states its own re-runnability
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this belongs to the seven files' own plans, which carry it
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR; see the rollback position in §8
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in §8's apply plan instead

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves five existing notes into a release entry, verified as data in §2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are five values carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.32.1` entry and all five notes, including the two tagged `["admin", "management"]`; **receives no mail**, because `major: false` | `majorReleasesSince("0.32.0")` is empty, so no mail fires on the production Worker deploy. Entry read back from the module: 5 notes, order unchanged |
| management | `/releases` | Same entry, all five notes — both tags include `management` | asserted: notes 2 and 3 roles `["admin","management"]`, the rest `null` |
| second_in_command | `/releases` | The three untagged notes; not the page-photos note or the Book a vet appointment note | as tagged by the feature PRs and carried across unchanged. Both describe a Settings page or a booking permission this role is not given |
| head_of_maintenance | `/releases` | The three untagged notes — including the facility-map one, which is the most likely to be theirs | untagged is why it reaches them |
| head_of_medical | `/releases` | The three untagged notes | as above |
| doctor | `/releases` | The three untagged notes | as above |
| volunteer | `/releases` | The three untagged notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees. The two role tags were **not** decided at the cut: they were written by the feature PRs and are asserted identical to `origin/main` in §2
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 46 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 46
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (§2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched — `releases.ts` is imported by `/releases`, by `deploy.mjs` and by the Worker's `/api/releases/current`, and all three paths were exercised: the build compiled the route, `majorReleasesSince` and `compareVersions` were run directly, and the module parses under Node's type stripping as `deploy.mjs` loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `767d9083` and `main` did not move, so there was nothing to merge and nothing to re-run against

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item. **The release's own follow-up was raised on the `backlog` branch**, not here: the `--env test` guard gap behind Defect 1, committed as `4ff283f3` under *Deployment*
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, and deliberately so: this cut made **no editorial judgement**. Both role tags and all five note texts were carried across unchanged from what the feature PRs wrote, and that is asserted rather than claimed. The one judgement in the release — minor over major — is Lutan's and is recorded in §1 and in the release record, not as a decision file
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the five notes written by the feature PRs into the `0.32.1` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision record were measured, not reasoned.** No gate reads prose. Every claim in §2 is one of the pasted assertions; the silent-failure conclusion in §8 was reached by tracing every reader of the dropped columns in the tree and by reading the two new public views column by column against the files that add them, **not** by reading any migration's `-- consumer:` header. Last release's `0199` is why: its header said `none` while `src/lib/units.ts` read its new column

## 8. Pre-production gate

### The release's shape

**12 PRs: #638, #640–#650.** `node scripts/release-prs.mjs 038859fb HEAD` exited **1**, read from the command itself and not through a pipe. It listed 10 and named 3 files belonging to no PR in the list. Reconciled, as the handover prescribes, by matching orphans to commits and then confirming each against GitHub rather than arguing from the numbering:

| Orphan | Commit | PR | GitHub state |
|---|---|---|---|
| `docs/test-plans/public-page-photos-schema.md`, `supabase/migrations/0200_public_page_photos.sql` | `7c58b68` | **#642** `claude/public-page-photos-schema` | `MERGED`, `mergeCommit 7c58b683` |
| `docs/test-plans/planner-handover-156.md` | `7230929` | **#638** `claude/planner-handover-156` | `MERGED`, `mergeCommit 72309293` |

Both were **squash-merged**, which is why they carry no merge commit with a PR subject — the exact trap the runbook names. Both merge commits were confirmed to be in `038859fb..HEAD` with `git merge-base --is-ancestor`. **#638 is also the PR that `0.32.0`'s record describes as an explained gap**: it was open then and has merged since, so it belongs to this release. With it accounted for, the only remaining gap is **#639**, which was `0.32.0`'s own cut.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. The release contains date-derived behaviour that is not this PR's — the Book a vet appointment flow — and that check belongs to `book-vet-appointment-button.md`, which carries it. It is not re-signed here, because copying another plan's items into the cut plan is what the template forbids
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — every block in §2 and §8 is the script's own stdout, copied without tidying
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Expect this to be unanswerable**: `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate and there is no cacheable public page. The gate is served `Cache-Control: private, no-cache, no-store`, so the edge-cache check is not merely hard but vacuous — write it `n/a` with that reason. **This release puts a great deal in that blind spot**: `0200`/`0201` (page photos), `0206` (the About page) and the Thai breed/colour columns are all public-website work

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither does the release
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — run this session before any deploy: `npm ci` exited 0 in `C:\Development\Animal_Shelter_App`, and `node_modules/next/package.json` reads `16.3.8` against `package.json`'s `"next": "16.3.8"`. The `Next.js version :` line on the first Worker build is read against `package.json` as the second check, per `0.28.0`'s Defect 2

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: this PR carries no migration and no code reading one. **The release does, and the ordering matters.** The nine `-- consumer:` warnings the dry-run printed are all the **safe** direction — the tables and columns land before the code that reads them is live — but the readers for `0200`/`0201` (page photos) and `0206` (the About page) merged in PRs that are *in this release*, so the apply must precede both deploys. The apply plan below does that. Getting it the wrong way round would be **loud, not quiet**: PostgREST answers an unknown column with a `42703` error, which is exactly what the dry-run's own two expected failures show
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — exit **0**, read from the command itself. **Two files reported FAILED and that is the correct, expected result**, not a reason to stop:

```
dry-run 0200_public_page_photos.sql … ok
dry-run 0201_public_page_photos_public.sql … FAILED
Failed to run sql query: ERROR:  42703: column "donate_photo_drive_file_id" does not exist
NOT a fault in 0201_public_page_photos_public.sql: it runs cleanly after 0200_public_page_photos.sql.
dry-run 0202_map_rooms_drop_map_id_shape.sql … ok
dry-run 0203_clear_stale_ledger_row_0201_map_rooms.sql … ok
dry-run 0204_impact_baselines_since_year.sql … ok
dry-run 0205_resident_breed_colour_th.sql … ok
dry-run 0206_about_page.sql … FAILED
Failed to run sql query: ERROR:  42703: column "donate_photo_drive_file_id" does not exist
NOT a fault in 0206_about_page.sql: it runs cleanly after 0200 … 0205.
Dry run only — nothing was applied.
```

  **The per-file dry-run trap fired, and this is the release to read as its worked example.** `0201` rebuilds `public_site_content` naming the nine columns `0200` adds, and `0206` rebuilds the same view again; each file is dry-run in its own `begin … rollback`, so `0200`'s columns are gone before `0201` runs. A real apply commits each file before the next starts, so both apply. **The trap normally means "do not apply" and here the correct action is to apply** — and note the runner now detects and explains it itself and still exits 0, which `0.32.0`'s record could not say. Stating it precisely, because the handover asks for the distinction: the trap **did fire** this time, where on `0.32.0` it **did not apply at all**.
  **No production-only guard appeared** — the ninth release running. It can only show up at the production dry-run, and it did not. The release manager re-runs this immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the gate applies and is satisfied rather than waived.** `0202` **drops two columns** (`map_rooms.map_id`, `map_rooms.shape`), which is destructive by any reading. The nightly cron wrote `lannacare-production-2026-10-14T2000Z.dump.age` (1,144,560 bytes) at **03:00 today**, in `~/backups/lannacare` on the Pi, read this session over SSH. This is the **same dump** `0.32.0` and `0.31.0` cited, because all three releases fall on 2026-10-15 — worth saying plainly rather than letting it read as a third independent night. The cron has now fired unprompted on four consecutive nights. **The restore half remains unexercised against a real Supabase project, carried forward for the seventh release**
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `200 applied, 7 pending`
  2. `--env production --dry-run` — expect exit 0 with `0201` and `0206` FAILED for the reason above. **A red here is not automatically a stop; two reds are expected and named.** A *third* red, or a different file, is
  3. `--env production` — applies `0200` → `0206` to `dbkodyyxxhtygxcxmfcu` in that order, in one run. The order is not optional: `0201` and `0206` both depend on `0200`
  4. **before** either deploy, and with no user-facing window needed

  **The silent-failure answer for this release, and the candidate that mattered.** The dangerous shape here is the public-view rule, stated in `docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`: **a column is public only when the public view names it.** A column left out of `public_site_content` does not error — a signed-out visitor silently gets no photo on a page that otherwise looks healthy. It closes, and by reading the files rather than their headers:

  - `0200` adds **nine** columns (donate/foster/volunteer × drive-file-id, alt, alt_th). `0201` rebuilds `public_site_content` and names **all nine**, and teaches `is_public_drive_file` all **three** file-id columns, so the proxy will serve them to an anonymous visitor.
  - `0206` adds **three** more (about × the same shape), rebuilds the view naming all three, and adds `about_photo_drive_file_id` to `is_public_drive_file`.
  - `create or replace view` cannot drop or rename an existing column, so the one residual risk — a *new* column omitted — is the one that was checked, column by column, and there are none missing.

  **The file that sounds most dangerous is again the safe one.** `0202` drops two columns, which is the classic way old code starts reading nothing. It does not here: every `map_id` and `shape` reference in the tree was traced, and all of them are on **`map_room_placements`**, not on `map_rooms` — the admin editor's `saveRoomShape` upsert, the plan read, `src/app/admin/facility-map/page.tsx`'s nested select, the snapshot restore, and the public facility map's `map_rooms … map_room_placements(map_id, shape)` embed at `src/app/enclosures/page.tsx:235`. The snapshot restore writes only name columns to `map_rooms`. And `0202` drops **without `CASCADE`**, deliberately and with a comment saying so, so a dependent that still existed would fail the apply loudly rather than be removed quietly.

  `0204` and `0205` declare `-- consumer: none` and, unlike last release's `0199`, **the headers are true**: `grep` for `since_year`, `breed_th` and `colour_th` across `src/`, `worker/` and `scripts/` returns nothing. They are inert in this release.

  **One thing in this release has already failed quietly, and it is bookkeeping rather than behaviour** — Defect 1.

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref 038859fb` on the Pi (a rebuild of `0.32.0`), with `npx wrangler rollback --env production` for the Worker fallback.

  **What it does not cover: the seven migrations.** None has a down-migration file. **What makes this release's position unusually good: there is no mail to un-send.** `major: false`, so the one genuinely irreversible act of a release does not happen at all, and the point of no return that `0.32.0` had simply does not exist here.

  Against rolled-back `0.32.0` code, all seven are inert or near-inert: `0200`, `0204`, `0205` and `0206`'s columns are additive and read by nothing in `0.32.0`; `0201` and `0206` widen a public view, which shows a signed-out visitor nothing new because `0.32.0`'s pages do not render the photos; `0203` touches only the migration ledger. **The one that is not purely inert is `0202`**, which drops two columns `0.32.0`'s code also does not read — `0.32.0` already shipped the placements-based editor (#636 and its follow-up), which is precisely why the drop was safe to write. So **nothing in this release applies against rolled-back code**, the same conclusion `0.32.0` reached and for the same reason.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.32.1` entry reads correctly on `/releases`, with all five notes, and that the two tagged `["admin", "management"]` notes appear for those roles and not for the others. The page is behind sign-in, so no session can load it | `/releases`, production, an admin and one other role |
| 2 | That **no release mail arrived** for `0.32.1`. This is the negative of `0.32.0`'s check and is the one observable consequence of the minor call: `major: false` means the deploy should mail nobody | the admin inbox |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-15

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the entry read on `/releases` with its two role-tagged notes, and confirmation that no release mail arrived

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass with accepted defects

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **`0203` silently did not stick on dev.** Its whole job was to delete the phantom `0201_map_rooms_drop_map_id_shape.sql` ledger row. It is recorded as applied and **the row is back**: dev reads `208 applied` against 207 files and `--drift test` is red, so the runbook's "both drift checks end `No drift`" cannot be ticked for dev this release. Cause, established rather than guessed: `GUARDED` is `uat \|\| production` only (`scripts/apply-migrations.mjs:94`), so an `--env test` apply from a checkout whose `supabase/migrations/` does not match `origin/main` is permitted — and three merged-but-uncleared worktrees (`facility-map-with-enclosures`, `map-rooms-column-drop`, `mobile-44px-finish`) still hold the file under its **old** name | **deferred to backlog, release not held.** Production is unaffected (the row was never there, and production's drift shows `0` on both sides); dev's actual *schema* is correct, both columns being dropped under either filename. Raised on the `backlog` branch as `4ff283f3` under *Deployment*, with the fix split three ways: narrow the guard rather than extend it wholesale (dev is where schema-first work is applied **before** merge, so full guarding would forbid the normal path), a new migration to delete the row again, and clear the three leftovers. Stated as a gap in the release record |
| 2 | low | The `-- consumer:` headers on `0200`, `0201` and `0206` produced nine dry-run warnings saying the declared consumer "differs from release 0.32.0" | **accepted, no action.** This is the warning working as designed and in the safe direction: the schema lands before the reader is live. The readers merged in this release, and the apply plan puts all seven files in before either deploy |
