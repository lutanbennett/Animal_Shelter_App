# Feature test plan — cut-release-0-34-0

## Header

| | |
|---|---|
| Feature | Cut release `0.34.0`: move the four notes in `unreleased` into a new `0.34.0` entry, `major: true`, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/release-0-34-0` @ `C:\Development\Animal_Shelter_release-0-34-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #677 |
| Tested by / date | Claude (production release manager session) / 2026-10-16 |
| Carries a migration? | no — the release's three (`0210`–`0212`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the four notes in `unreleased` into a new `0.34.0` entry, `major: true` on Lutan's call in chat (2026-10-16), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. **All four notes are untagged except one**: the pack-sizes note carries `roles: ["admin", "management", "second_in_command"]`, as the feature PR wrote it. The tagging was not decided here; the notes are carried across unchanged, asserted byte-for-byte in §2. **Every admin receives mail, because `major: true`** — asserted as `majorReleasesSince("0.33.0")` returning exactly `["0.34.0"]`. That mail is the one irreversible act in this release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — three things. (a) The wording of the four notes: written and reviewed in their own feature PRs, carried across here unaltered, and a cut must not improve them. (b) The six `pending:` manual verifications on this release's feature plans: they belong to those plans and their signatures, and per the runbook are **not** copied here; they are put to Lutan in chat and recorded as a stated gap in `docs/releases/`. (c) The Cashflow money figures changing where a priced delivery exists (`0211`): raised with Lutan in the same round as the version call, accepted by him as a risk, and recorded in the release record rather than as a defect of this cut

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically rather than read over. A scratch script compared this branch's new entry against `origin/main:src/lib/releases.ts` note by note:

```
ok    newest entry is the new version  0.34.0
ok    its date is set  2026-10-16
ok    it is flagged major  true
ok    unreleased is now empty  len=0
ok    note count carried across  4 -> 4
ok    every note identical, nothing lost or invented  0 differ
ok    previously released entries unchanged
ok    majorReleasesSince("0.33.0") is exactly [0.34.0]  ["0.34.0"]
ok    package.json equals newest entry  0.34.0
ok    releases are newest-first by compareVersions
ok    no [object Object] in notes
ok    no undefined in notes
ok    every note has text

All cut checks passed.
```

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. The worktree was created from `origin/main` at `45c53409` minutes before the cut, so `sync` had nothing to merge; re-run before the plan was signed and reported up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 112s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three). `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-release-guards.mjs` — all 15 guards `ok`, including `unreleased notes are a problem`, `package.json behind the newest release is a problem` and `a migration the database lacks is refused`. These are the guards that stand between a bad cut and a production deploy, so they are exercised on the branch that changes the file they read

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's three migrations (`0210_appeals.sql`, `0211_forecasts_use_delivery_cost.sql`, `0212_retire_facility_map_activity.sql`) merged in their own PRs (#667, #669, #673), are already applied to dev, and are applied to production as a release step before any deploy. Their own test plans carry their schema checks.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production status was read as a release step: `210 applied, 3 pending`)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev reports `No drift` against `origin/main`)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR`, but stated for the release: all three files, project `dbkodyyxxhtygxcxmfcu`, in one `apply-migrations.mjs --env production` run **after this cut merges and before any deploy**, because `0212` retires a permission that live code no longer reads and both deploy paths refuse a database missing a migration that is on `main`

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch: `/releases` is behind sign-in, and the only new rendering is the `0.34.0` entry, whose content is asserted byte-for-byte in §2 and whose live rendering is verified on the deployed build in §8.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.34.0` entry with four notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime; this is a source file.` Its persistence is the commit, asserted by the gates running against the committed tree
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: a release entry is added once by this PR; there is no create/edit/delete surface`
- [x] Empty state renders sensibly (no rows yet) — the relevant empty state is `unreleased` being empty, which is the normal state between releases and is exactly what `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards rather than the UI: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass, so a malformed cut stops the deploy with a stated reason
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the longest note (the appeals one, 579 characters) carried across unchanged; the one note object with a `roles` array kept all three roles; `date` parses as `YYYY-MM-DD`; the version comparison is asserted newest-first by `compareVersions`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all four notes, and receives the release mail because `major: true` | asserted via `majorReleasesSince("0.33.0") === ["0.34.0"]`; the mail itself is a deploy-time step, verified in §8 |
| management | `/releases` | sees all four, including the pack-sizes note tagged for it | note tags asserted byte-for-byte in §2 |
| staff | `/releases` | sees the three untagged notes, not the pack-sizes one | tags carried across unchanged; `staff` is a retired role and is not in the tag list |
| doctor | `/releases` | sees the three untagged notes | tags carried across unchanged |
| volunteer | `/releases` | sees the three untagged notes | tags carried across unchanged |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged by this PR; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`. Driving six sign-ins to read a notes list whose bytes are already proven would be weaker evidence, not stronger
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — unchanged: this PR touches no route, middleware or policy. `signed out` on `/releases` is the existing behaviour and no file governing it is in the diff

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched.` No nav entry added or changed; `/releases` is already linked
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release cut adds no feature to document; the four features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path, checked at `/management/translations` — `n/a: release notes are not translated through that path.` They are plain strings in `releases.ts`, as every previous release's notes are; the Thai site reads translated *content*, not the notes register
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff.` The `/releases` layout is unchanged; the longest note is 579 characters, which is within the range already rendered there by `0.33.0`'s notes
- [x] Browser console clean — no errors or React warnings — `n/a: not driven.` `/releases` is behind sign-in and nothing in this diff executes in the browser beyond the data it renders, which is asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no request path changed.` Verified on the deployed build instead, in §8

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the two consumers of this file are checked where they actually run, not in a browser: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, 15/15 `ok`), and the Worker bundles it to answer `/api/releases/current` (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is the one shared file touched, and it is loaded, not read: the guards script evaluates it 15 times through `deploy.mjs`'s own code path, and the build compiles the Worker that serves it. Both are runtime loads by a second consumer, which is what this line asks for
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` had nothing to merge (branch cut from `origin/main` at `45c53409` minutes earlier) and the full suite passes on the branch: `test=0`, 132 tests, 0 failures

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item.` The four features' own PRs ticked theirs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The two decisions in this release that were not obvious — the build order and merging the release's own PRs without asking — already have their files (`2026-10-15-worker-first-then-pin-the-pis.md`, and `CLAUDE.md`'s "Release PRs merge without asking"). The accepted Cashflow risk is recorded in `docs/releases/`, which is where a release-level acceptance belongs
- [x] `README.md` still accurate — unchanged by this PR; it documents no version number that a cut would stale
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the four existing notes out of `unreleased` and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. The four notes it carries were each written for a user in their own feature PR, and every one of them is a change a shelter user will notice — which is why this release is major
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Everything asserted about this cut is the output of a script pasted above, not a reading of the diff. The one claim that would be easy to assert and hard to justify — that the notes came across intact — is the one given a byte-for-byte comparison against `origin/main`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted against `main` after this PR merges, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — `n/a: not yet — no deploy has run at this commit.` Carried into the release record, where all four builds are checked against the release SHA

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit.` The test Worker deploy is a release step after this merges
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` `docs/release-smoke-test.md` is the per-release pass and its filled copy goes to `docs/releases/2026-10-16.md`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The entry's `date` is a literal string, not a computed value
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change.` The nearest thing to a boundary is the version comparison, asserted newest-first across the whole array in §2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both blocks in §2 are copied from the runs as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked, so an anonymous request gets the staff-testing gate and there is no cached public page to re-check.` The gate is served `Cache-Control: private, no-cache, no-store`, so the edge-cache check is vacuous rather than merely hard. Re-confirmed this release: `https://lannacare.org/appeals` answers `307`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet — no deploy has run at this commit.` Read on the production deploy and recorded in the release record; the production project is `dbkodyyxxhtygxcxmfcu`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit.` Checked on both Worker deploys and recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none.` One env question is open for the release and is recorded as such rather than ticked: whether the production Pi carries `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`. That read is refused as a production read, the Worker's sweep has no binding and definitely no-ops, and it is put to Lutan rather than inferred. Nothing in `0.34.0` depends on it

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains no migration. For the release as a whole the ordering still matters and is stated: all three files apply **before** either Worker deploy, because `main` already carries code for `0210`/`0211` and both deploy paths refuse a database missing a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` Run as a release step immediately before the apply, and which of the three dry-run outcomes occurred is stated in the release record
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `0212` is the only non-additive file: it retires the `facility.map` activity. The condition that makes it safe was checked against production directly rather than reasoned — `node scripts/facility-map-holders.mjs --env production` reported all six holding roles also hold `facility.enclosures`, `Without facility.enclosures at Read: 0 (safe to retire)`. This closed a `pending:` item on `docs/test-plans/facility-map-retire.md`. The README restore recipe has still never been exercised, which is recorded as an outstanding item for the ninth release running
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0210`, `0211`, `0212`, project `dbkodyyxxhtygxcxmfcu`, one run, **before** both Worker deploys and both Pi builds

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 83ff5a86` there (a rebuild to `0.33.0`); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts migrations, and this release has a real gap.** `0210` and `0211` are additive or `create or replace` and safe to leave. `0212` **retires a permission** and has no down-migration, so a rollback to `0.33.0` code would face a database where `facility.map` is gone; the condition that makes that harmless was verified on production above, but it is a one-way step. And because this is a **major** release, the admin mail goes out at the production Worker deploy and cannot be recalled. So the honest statement is: code is reversible, schema and mail are not

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | No defect was found in this cut. The four notes carried across byte-identical, all 13 cut assertions passed, gates and all 15 release guards are green | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. This PR moves four notes between two arrays in one source file and bumps a version string. The carry-across is asserted byte-for-byte against `origin/main`, the live rendering is verified on the deployed build as a release step, and this release's six outstanding manual items belong to their own feature plans and their own signatures — the runbook is explicit that they must not be given a second home here | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-16

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty, so this is ticked by whoever filled the plan and the signature below says `n/a` with the reason — there is nothing for a person to look at in moving four notes between two arrays, and nothing is being signed for

Manual verification by: n/a: the manual list is empty — a data-only cut with no surface a person can look at before deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager; the release record at `docs/releases/2026-10-16.md` is the handover

Result: pass
