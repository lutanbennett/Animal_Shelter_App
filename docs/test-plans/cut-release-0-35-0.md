# Feature test plan — cut-release-0-35-0

## Header

| | |
|---|---|
| Feature | Cut release `0.35.0`: move the five notes in `unreleased` into a new `0.35.0` entry, `major: true`, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-35-0` @ `C:\Development\Animal_Shelter_cut-release-0-35-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #692 |
| Tested by / date | Claude (production release manager session) / 2026-10-17 |
| Carries a migration? | no — the release's three (`0213`–`0215`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.35.0` entry, `major: true` on Lutan's call in chat (2026-10-17), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, filtered by tag. **One note is untagged** (the phone-width sweep, so everyone sees it); the other four carry `roles` as their feature PRs wrote them: stories `admin`+`management`, name-card scanning `admin`+`management`+`head_of_medical`, the Status alert tile `admin`, the assistant `admin`+`management`. The tagging was not decided here; the notes are carried across unchanged, asserted byte-for-byte in §2. **Every admin receives mail, because `major: true`** — asserted as `majorReleasesSince("0.34.0")` returning exactly `["0.35.0"]`. That mail is the one irreversible act in this release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — three things. (a) The wording of the five notes: written and reviewed in their own feature PRs, carried across here unaltered, and a cut must not improve them. (b) The eight `pending:` manual verifications on this release's feature plans: they belong to those plans and their signatures, and per the runbook are **not** copied here; they were put to Lutan in chat as an explicit question and he chose to ship with them recorded as a stated gap in `docs/releases/`. (c) The phone-width sweep's residual risk: 121 screens changed and four were never seen by a person, so a form that came out unusable at phone width would fail quietly rather than erroring. Named to Lutan separately from the count of eight, with the offer to look first; he accepted the risk, and it is recorded in the release record rather than as a defect of this cut

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically rather than read over. A scratch script compared this branch's new entry against `origin/main:src/lib/releases.ts` note by note:

```
PASSED:
  - all 5 notes identical, in order, byte for byte
  - unreleased is empty
  - history intact: 49 entries unchanged, +1 new
  - package.json 0.35.0 matches the newest entry
  - majorReleasesSince("0.34.0") = ["0.35.0"] — the mail carries this release only
  - file order is newest-first by compareVersions
  - every note renders, all role tags live

notes: 5 | major: true | date: 2026-10-17
title: Adoption success stories, name-card scanning, and the app on a phone
tags : 1:everyone  2:admin+management  3:admin+management+head_of_medical  4:admin  5:admin+management

VERDICT: all checks passed
```

The comparison also asserts the direction the previous editions did not: **nothing invented.** Every note in the new entry is looked up in the source set, so a note that appeared from nowhere fails as loudly as one that went missing, and all 49 previously released entries are compared whole rather than counted.

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `6efa926e`, and by the time `sync` ran **`main` had moved three commits** (`10d914e2`, `8337710e`, `050af2fe`) to `050af2fe`. All three are `backlog`-branch commits touching `docs/backlog.md` only, net one line added, confirmed with `git diff --name-only 6efa926e..050af2fe`. They merged cleanly, carry no PR and no migration, and have no bearing on the cut — but they are recorded here rather than glossed, because the branch the gates first ran against is not the branch being merged
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

**Run twice, and the second run is the evidence.** The first run (`build exited 0 after 112s`) was against the pre-`sync` tree. Because the tree changed afterwards — only by a backlog documentation line, but changed — the gates were re-run rather than assumed, on the principle that the tempting assumption is that a data-only edit cannot break a build. Output of the run against the tree being merged:

```
=== gates: build exited 0 after 34s

gates: typecheck=0 lint=0 test=0 build=0
```

The 34s against the first run's 112s is a warm Turbopack cache, not a skipped build; the exit codes are what is read, not the timings.

- [x] CI green on the PR (runs the same three). Seen green, not assumed: run `39024452998` on `2f90a89b`, `completed/success`, with all eight jobs passing and none pending — `cards-count`, `audit`, `script-integrity`, `migration-numbers`, `public-views`, `test-plan`, `new-policy-role-names`, `check`. The `headSha` was read directly from `gh run list` and matched this branch's HEAD, because the PR bar's cached reading can show an earlier run's result. This was the **first** run and it was green, which is expected rather than suspicious: the plan was written and committed before the PR was opened, so `test-plan` had a complete checklist to validate on the first push. Fourth release running. Ticking this line is itself a commit, so a second run follows and is waited on before the merge
- [x] `node scripts/check-release-guards.mjs` — all 16 guards `ok`, including `unreleased notes are a problem`, `package.json behind the newest release is a problem` and `a migration the database lacks is refused`. These are the guards that stand between a bad cut and a production deploy, so they are exercised on the branch that changes the file they read

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's three migrations (`0213_restate_hand_edited_columns.sql`, `0214_public_stories_and_refused_insert.sql`, `0215_recent_adoptions_resident_id.sql`) merged in their own PRs (#680, #683, #688), are already applied to dev, and are applied to production as a release step before any deploy. Their own test plans carry their schema checks.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration`. For the release: `origin/main` tops out at `0215`, there are no open PRs and no unmerged `claude/*` branches, so the next free number is `0216`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR` (production status was read as a release step: `213 applied, 3 pending`, and dev reports `No drift: test matches origin/main`)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`. Run against production as a release step: all three files `ok`, exit 0, so **the per-file dry-run trap did not apply** this release
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `n/a: no migration in this PR` (dev holds all 216 files with no drift in either direction)
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — `n/a: no migration`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager (which file, which project, when) — `n/a: no migration in this PR`, but stated for the release: all three files, project `dbkodyyxxhtygxcxmfcu`, in one `apply-migrations.mjs --env production` run **after this cut merges and before any deploy**, because `main` already carries the code that reads `0214` and `0215` and both deploy paths refuse a database missing a migration that is on `main`

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch: `/releases` is behind sign-in, and the only new rendering is the `0.35.0` entry, whose content is asserted byte-for-byte in §2 and whose live rendering is verified on the deployed build in §8.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.35.0` entry with five notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime; this is a source file.` Its persistence is the commit, asserted by the gates running against the committed tree
- [ ] Create / edit / delete all exercised (whichever the feature has) — `n/a: a release entry is added once by this PR; there is no create/edit/delete surface`
- [x] Empty state renders sensibly (no rows yet) — the relevant empty state is `unreleased` being empty, which is the normal state between releases and is exactly what `check-release-guards.mjs` asserts is **not** a problem (`clean release, clean schema: go`)
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards rather than the UI: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass, so a malformed cut stops the deploy with a stated reason
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the longest note (the stories one, 600 characters) carried across unchanged, measured rather than estimated; the four note objects kept every role tag, and each tag was checked against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the version comparison is asserted newest-first across all 50 entries by `compareVersions`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five notes, and receives the release mail because `major: true` | asserted via `majorReleasesSince("0.34.0") === ["0.35.0"]`; the mail itself is a deploy-time step, verified in §8 |
| management | `/releases` | sees four — the sweep, stories, name-card scanning and the assistant; not the Status alert tile note | note tags asserted byte-for-byte in §2 |
| head_of_medical | `/releases` | sees two — the sweep and name-card scanning | tags carried across unchanged |
| doctor | `/releases` | sees the untagged sweep note only | tags carried across unchanged |
| volunteer | `/releases` | sees the untagged sweep note only | tags carried across unchanged |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged by this PR; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main`. Driving six sign-ins to read a notes list whose bytes are already proven would be weaker evidence, not stronger
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — unchanged: this PR touches no route, middleware or policy. `signed out` on `/releases` is the existing behaviour and no file governing it is in the diff

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched.` No nav entry added or changed; `/releases` is already linked
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` A release cut adds no feature to document; the features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path, checked at `/management/translations` — `n/a: release notes are not translated through that path.` They are plain strings in `releases.ts`, as every previous release's notes are
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff.` The `/releases` layout is unchanged. Worth noting rather than glossing: this release's headline is a phone-width sweep, and `/releases` was one of the 121 screens it checked — but that work is in #689, not here
- [x] Browser console clean — no errors or React warnings — `n/a: not driven.` `/releases` is behind sign-in and nothing in this diff executes in the browser beyond the data it renders, which is asserted free of `[object Object]` and `undefined` in §2
- [x] Network clean — no unexpected 4xx/5xx on the feature's pages — `n/a: no request path changed.` Verified on the deployed build instead, in §8

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the two consumers of this file are checked where they actually run, not in a browser: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, 16/16 `ok`), and the Worker bundles it to answer `/api/releases/current` (exercised by the `build` gate, exit 0, and verified live in §8)
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is the one shared file touched, and it is loaded, not read: the guards script evaluates it through `deploy.mjs`'s own code path, and the build compiles the Worker that serves it. Both are runtime loads by a second consumer, which is what this line asks for
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` had nothing to merge (branch cut from `origin/main` at `6efa926e` minutes earlier) and the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item.` The features' own PRs ticked theirs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The decisions this release leans on already have their files: the build order (`2026-10-15-worker-first-then-pin-the-pis.md`), merging the release's own PRs without asking (`CLAUDE.md`), and the release-note truth rule (`2026-10-11-release-note-truth-rule.md`). The accepted phone-sweep risk is recorded in `docs/releases/`, which is where a release-level acceptance belongs
- [x] `README.md` still accurate — unchanged by this PR; it documents no version number that a cut would stale
- [ ] **Release notes.** `n/a: this PR is the release cut — it moves the five existing notes out of `unreleased` and adds none.` Ticking would be false: `unreleased` gained no line, it was emptied. The five notes it carries were each written for a user in their own feature PR, and every one is a change a shelter user will notice — which is why this release is major. **The vet calendar is deliberately absent**: Lutan confirmed on 2026-10-17 that it is configured on test only and dormant on production, so a note would promise every admin something production does not do

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; re-asserted against `main` after this PR merges, and `release-prs.mjs` re-run against the merged release SHA
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — `n/a: not yet — no deploy has run at this commit.` Carried into the release record, where all four builds are checked against the release SHA

### On the deployed build

- [ ] Deployed to test — `n/a: not yet at this commit.` The test Worker deploy is a release step after this merges
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: not yet at this commit.` `docs/release-smoke-test.md` is the per-release pass and its filled copy goes to `docs/releases/2026-10-17.md`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today".` The entry's `date` is a literal string, not a computed value
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change.` The nearest thing to a boundary is the version comparison, asserted newest-first across all 50 entries in §2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both blocks in §2 are copied from the runs as printed, including the `test=0` the template's expected line does not mention
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked, so an anonymous request gets the staff-testing gate and there is no cached public page to re-check.` The gate is served `Cache-Control: private, no-cache, no-store`, so the edge-cache check is vacuous rather than merely hard. **This matters more than usual in this release**: the adoption success stories are a public-site feature, so the thing the release exists to show strangers is in the blind spot and the deploy proves only that the code and schema shipped. Recorded as what the record cannot say

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: not yet — no deploy has run at this commit.` Read on the production deploy and recorded in the release record; the production project is `dbkodyyxxhtygxcxmfcu`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `n/a: not yet at this commit.` Checked on both Worker deploys and recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and nothing in this release needs one. The vet calendar question that stood open for two releases is now **answered** rather than carried: configured on test only, dormant on production (Lutan, 2026-10-17), so there is no env gap to record

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains no migration. For the release as a whole the ordering still matters and is stated: all three files apply **before** either Worker deploy, because `main` already carries the readers for `0214` and `0215` and both deploy paths refuse a database missing a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR.` Run as a release step: all three `ok`, exit 0, **trap did not apply**. One finding worth carrying: `0213`'s view-rebuilding block is guarded by `if v_type = 'integer'`, which is **false on dev** — so production is the first place that block has ever executed. The dry-run executed it inside a transaction and rolled it back, and its two recreated views were compared against dev's live shape directly: `authenticated` keeps `SELECT` on both, and `security_invoker` matches exactly (`on` for `immunization_next_due`, unset for `picker_immunization_types`). The only divergence is `service_role` losing write privileges on a view, which nothing can use
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **the gate applies this release.** `0213` rewrites two live column types (`immunization_types.interval_months` integer → numeric not null, `zones.internal` to nullable), which is a rewriting migration, not an additive one. The newest production backup is `lannacare-production-2026-10-16T2000Z.dump.age` (1,215,818 bytes), written at 20:00Z on 2026-10-16 — the **seventh consecutive unprompted cron night** — and it predates this release's migrations, which is the right direction for a rollback. `0213` would also have refused loudly rather than guessed if production held a vaccine type with no interval: it raises an exception in that case, and the clean dry-run is the evidence that no such row exists. The README restore recipe has still never been exercised, recorded as an outstanding item for the **tenth** release running
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0213`, `0214`, `0215`, project `dbkodyyxxhtygxcxmfcu`, one run, **before** both Worker deploys and both Pi builds

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 598c2e56` there (a rebuild to `0.34.0`); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts migrations.** `0214` and `0215` are additive or `create or replace` and safe to leave in place. `0213` is the gap: it rewrites two column types and has **no down-migration**, so a rollback to `0.34.0` code would meet a database where `immunization_types.interval_months` is `numeric not null` and `zones.internal` is nullable. Both are the shape dev has always had and the only shape the app has ever been tested against, which is the argument that it is harmless — but it is a one-way step and it is stated as one. And because this is a **major** release, the admin mail goes out at the production Worker deploy and cannot be recalled. So the honest statement is: code is reversible, schema and mail are not

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | No defect was found in this cut. The five notes carried across byte-identical, all 49 prior entries are unchanged, every cut assertion passed, and gates and all 16 release guards are green | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | Nothing. This PR moves five notes between two arrays in one source file and bumps a version string. The carry-across is asserted byte-for-byte against `origin/main`, the live rendering is verified on the deployed build as a release step, and this release's eight outstanding manual items belong to their own feature plans and their own signatures — the runbook is explicit that they must not be given a second home here | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-17

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty, so this is ticked by whoever filled the plan and the signature below says `n/a` with the reason — there is nothing for a person to look at in moving five notes between two arrays, and nothing is being signed for

Manual verification by: n/a: the manual list is empty — a data-only cut with no surface a person can look at before deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager; the release record at `docs/releases/2026-10-17.md` is the handover

Result: pass
