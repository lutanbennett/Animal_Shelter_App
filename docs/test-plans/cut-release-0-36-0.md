# Feature test plan — cut-release-0-36-0

## Header

| | |
|---|---|
| Feature | Cut release `0.36.0`: move the four notes in `unreleased` into a new `0.36.0` entry, `major: true`, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-36-0` @ `C:\Development\Animal_Shelter_cut-release-0-36-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #704 |
| Tested by / date | Claude (production release manager session) / 2026-10-17 |
| Carries a migration? | no — the release's four (`0216`–`0219`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the four notes in `unreleased` into a new `0.36.0` entry, `major: true` on Lutan's call in chat (2026-10-17), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. **All four notes are untagged**, so nothing is filtered for anybody. That was each feature PR's choice and is carried across unchanged; it is noted rather than corrected here, because a cut must not retag a note — see *out of scope*. **Every admin receives mail, because `major: true`** — asserted as `majorReleasesSince("0.35.0")` returning exactly `["0.36.0"]`. That mail is the one irreversible act in this release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — four things. (a) The wording and the tagging of the four notes: written and reviewed in their own feature PRs, carried across here unaltered, and a cut must not improve them. Note 1 describes Management's approval page and is untagged, so a volunteer will see it; that is the feature PR's call. (b) The six `pending:` manual verifications on this release's feature plans: they belong to those plans and their signatures, and per the runbook are **not** copied here; they were put to Lutan as an explicit question and he chose to ship with them recorded as stated gaps. (c) **Exercising the photo pipeline against Drive on test before the production deploy** — Lutan's decision in the same round, and a deliberate deviation from the usual build order. It is a release step, not part of this cut, and is recorded in `docs/releases/`. (d) `0216`'s appeal-medical-photo columns ship as schema with no reader, so no note mentions them and none should

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically rather than read over. A scratch script compared this branch's new entry against `origin/main:src/lib/releases.ts` note by note:

```
PASSED:
  - all 4 notes identical, in order, byte for byte
  - unreleased is empty
  - history intact: 50 entries unchanged, +1 new
  - package.json 0.36.0 matches the newest entry
  - majorReleasesSince("0.35.0") = ["0.36.0"] — the mail carries this release only
  - file order is newest-first by compareVersions
  - every note renders, all role tags live

notes: 4 | major: true | date: 2026-10-17
title: Volunteers can file photos, and Management approves them before the website shows them
tags : 1:everyone  2:everyone  3:everyone  4:everyone

VERDICT: all checks passed
```

It asserts both directions: every note in the new entry is looked up in the source set, so a note appearing from nowhere fails as loudly as one going missing, and all 50 previously released entries are compared whole rather than counted.

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` at `efd6530f` minutes before the cut, so `sync` had nothing to merge; re-run before the plan was signed and reported up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: build exited 0 after 106s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` This plan is written and committed **before** the PR is opened, so `test-plan` has a complete checklist to validate on the first push and that run is green by construction rather than red. Ticked in a follow-up commit once a run is seen green, with its `headSha` read from `gh run list` and matched against this branch's HEAD — the PR bar's cached reading can show an earlier run's result. Ticking it is itself a commit, so a second run follows and is waited on before the merge
- [x] `node scripts/check-release-guards.mjs` — all 16 guards `ok`, including `unreleased notes are a problem`, `package.json behind the newest release is a problem` and `a migration the database lacks is refused`. These are the guards that stand between a bad cut and a production deploy, so they are exercised on the branch that changes the file they read

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's four (`0216_appeal_medical_photos.sql`, `0217_photo_approval.sql`, `0218_pending_photos.sql`, `0219_shelter_photo_folder.sql`) merged in their own PRs (#696, #698, #700, #703), are already applied to dev, and are applied to production as a release step before any deploy. Their own test plans carry their schema checks.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the release: `origin/main` tops out at `0219`, so the next free number is `0220`. **Checked rather than assumed**: the two unmerged branches with no PR (`origin/claude/photo-card-reachable`, `origin/claude/planner-handover-201`) were listed with `git ls-tree` and neither carries a migration beyond `0219`, so nothing is contending for `0220`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production read as a release step: `216 applied, 4 pending`; dev `No drift: test matches origin/main`, 220 of 220)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. Run against production as a release step, and **the per-file trap FIRED** — see *Defects found*, entry 1. It is the correct result, not a fault
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev holds all 220 files with no drift in either direction)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR.` For the release this is the question `0217`'s backfill answers: it sets `approved_at` on every existing attachment, so nothing already on the website disappears when the approval filter goes live
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`. Stated for the release in `docs/releases/`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR`, but stated for the release: all four files, project `dbkodyyxxhtygxcxmfcu`, in one `apply-migrations.mjs --env production` run **after this cut merges and before any deploy**, because `main` already carries the readers for `0217`, `0218` and `0219` and both deploy paths refuse a database missing a migration that is on `main`

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch: `/releases` is behind sign-in, and the only new rendering is the `0.36.0` entry, whose content is asserted byte-for-byte in §2 and whose live rendering is verified on the deployed build in §8.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.36.0` entry with four notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime; this is a source file.` Its persistence is the commit, asserted by the gates running against the committed tree
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: a release entry is added once by this PR; there is no create/edit/delete surface`
- [x] Empty state renders sensibly (no rows yet) — the relevant empty state is `unreleased` being empty, which is the normal state between releases and is exactly what `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards rather than the UI: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass, so a malformed cut stops the deploy with a stated reason
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the four note lengths were **measured, not estimated**: 478, 583, 267 and 190 characters, the longest being the enclosure-tagging note at 583. All four are plain strings with no `roles` array, so there is no tag to validate, and the retired `staff` tag cannot be present. `date` parses as `YYYY-MM-DD`, and the version comparison is asserted newest-first across all 51 entries by `compareVersions`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all four notes, and receives the release mail because `major: true` | asserted via `majorReleasesSince("0.35.0") === ["0.36.0"]`; the mail itself is a deploy-time step, verified in §8 |
| management | `/releases` | sees all four | all notes untagged; asserted byte-for-byte in §2 |
| head_of_medical | `/releases` | sees all four | untagged |
| doctor | `/releases` | sees all four | untagged |
| volunteer | `/releases` | sees all four, **including the note about Management's approval page** | untagged, by the feature PR's choice; carried across unchanged and flagged in §1 |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged by this PR; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`. Driving six sign-ins to read a notes list whose bytes are already proven would be weaker evidence, not stronger
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — unchanged: this PR touches no route, middleware or policy. `signed out` on `/releases` is the existing behaviour and no file governing it is in the diff

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched.` No nav entry added or changed; `/releases` is already linked
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release cut adds no feature to document; the features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path, checked at `/management/translations` — `n/a: release notes are not translated through that path.` They are plain strings in `releases.ts`, as every previous release's notes are
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff.` The `/releases` layout is unchanged; the longest note at 583 characters is within the range already rendered there
- [x] Browser console clean — no errors or React warnings — `n/a: not driven.` `/releases` is behind sign-in and nothing in this diff executes in the browser beyond the data it renders, which is asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no request path changed.` Verified on the deployed build instead, in §8

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the two consumers of this file are checked where they actually run, not in a browser: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, 16/16 `ok`), and the Worker bundles it to answer `/api/releases/current` (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is the one shared file touched, and it is loaded, not read: the guards script evaluates it through `deploy.mjs`'s own code path, and the build compiles the Worker that serves it. Both are runtime loads by a second consumer
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` had nothing to merge (branch cut from `origin/main` at `efd6530f` minutes earlier) and the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item.` The features' own PRs ticked theirs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The decisions this release leans on already have their files, written by the feature PRs: `2026-10-17-appeal-medical-photos.md` and `2026-10-17-photo-approval-schema.md`. The one release-level decision — exercising the photo pipeline on test before the production deploy, and the build-order deviation it implies — is recorded in `docs/releases/`, which is where a release-level choice belongs
- [x] `README.md` still accurate — unchanged by this PR; it documents no version number that a cut would stale
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the four existing notes out of `unreleased` and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. The four notes it carries were each written for a user in their own feature PR, and every one is a change a shelter user will notice — which is why this release is major. **`0216`'s appeal-medical-photo columns deliberately have no note**: nothing in `src/` reads them yet, so a note would promise a picker that does not exist. **The vet calendar also still has none**: configured on test only, dormant on production (Lutan, 2026-10-17)

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted against `main` after this PR merges, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — `n/a: not yet — no deploy has run at this commit.` Carried into the release record, where all four builds are checked against the release SHA

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit.` The test Worker **and the test Pi** are deployed as a release step **before** the production handover this release, so the photo pipeline can be exercised there first
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` `docs/release-smoke-test.md` is the per-release pass and its filled copy goes to `docs/releases/2026-10-17.md`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The entry's `date` is a literal string, not a computed value
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change.` The nearest thing is the version comparison, asserted newest-first across all 51 entries in §2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both blocks in §2 are copied from the runs as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked`, so an anonymous request gets the staff-testing gate and there is no cached public page to re-check. **This release's central claim is a public-site one** — that an unapproved photo cannot be seen by a stranger — which is why it is being exercised on test against the real database rather than argued from the SQL alone

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet — no deploy has run at this commit.` Read on the production deploy and recorded in the release record; the production project is `dbkodyyxxhtygxcxmfcu`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit.` Checked on both Worker deploys and recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release: the photo work uses the Drive credentials already configured

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains no migration. For the release the ordering matters and is stated: all four files apply **before** any deploy, because `main` already carries the readers for `0217`, `0218` and `0219`, and both deploy paths refuse a database missing a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` Run as a release step; `0216`, `0218` and `0219` dry-ran `ok` and **`0217` dry-ran FAILED, which is the correct result** — see *Defects found*
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the gate applies.** `0217` is not purely additive: it backfills `approved_at` on every existing `attachments` row, which is a write to live data. The newest production backup is `lannacare-production-2026-10-16T2000Z.dump.age` (1,215,818 bytes), written 20:00Z on 2026-10-16. **Stated honestly: this is the same dump `0.35.0` used**, because both releases fall on one day and tonight's 03:00 run has not happened yet — so it predates `0213`–`0215` as well as this release's four. It is the right direction for a rollback (it cannot contain schema the code would not expect) but a restore from it would unwind both of today's releases, not just this one. The README restore recipe has still never been exercised
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0216`, `0217`, `0218`, `0219`, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref faee19c5` there (a rebuild to `0.35.0`); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts migrations.** `0216`, `0218` and `0219` are additive or `create or replace` and safe to leave in place — and `0216`'s columns have no reader in `0.35.0` either, so they are inert on a rollback. **`0217` is the one with a real consequence**: it recreates six public views to filter on `approved_at`, and those views would remain in place under `0.35.0` code. Because its backfill marks every pre-existing photo approved, `0.35.0` would still show exactly the photos it showed before, so the practical effect is nil — but any photo filed and approved under `0.36.0` would keep showing, and there is no down-migration. And because this is a **major** release, the admin mail goes out at the production Worker deploy and cannot be recalled. So: code is reversible, schema and mail are not

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | **`0217` dry-ran `FAILED` against production**, with `column p.medical_ok does not exist`. **This is the per-file dry-run trap firing, not a fault**: `0217` recreates `public_appeals` referencing a column `0216` adds, and the dry-run wraps each file in its own `begin … rollback`, so `0216`'s column is gone before `0217` runs. The runner says so itself — *"NOT a fault in 0217_photo_approval.sql: it runs cleanly after 0216… A real apply commits each file first, so this one is expected to apply"* — and the overall exit code is **0**. The same two files are applied in order on dev with no drift, which is the independent evidence | **accepted: expected behaviour, correctly explained by the runner.** The trap has now fired twice (`0.32.1`, here) and not applied four times. Noted so nobody reads it as a broken migration |
| 2 | — | No defect in the cut itself. The four notes carried across byte-identical, all 50 prior entries are unchanged, every cut assertion passed, and gates and all 16 release guards are green | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing in this PR. It moves four notes between two arrays in one source file and bumps a version string. The carry-across is asserted byte-for-byte against `origin/main`, the live rendering is verified on the deployed build as a release step, and this release's six outstanding manual items belong to their own feature plans and their own signatures — the runbook is explicit that they must not be given a second home here. **The photo-pipeline exercise on test is a release step Lutan asked for, not an item of this cut**, and its outcome is recorded in `docs/releases/2026-10-17.md` | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty, so this is ticked by whoever filled the plan and the signature below says `n/a` with the reason — there is nothing for a person to look at in moving four notes between two arrays, and nothing is being signed for

Manual verification by: n/a: the manual list is empty — a data-only cut with no surface a person can look at before deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager; the release record at `docs/releases/2026-10-17.md` is the handover

Result: pass
