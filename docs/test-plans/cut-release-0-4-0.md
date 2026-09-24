# Feature test plan — cut-release-0-4-0

## Header

| | |
|---|---|
| Feature | Cut release `0.4.0`: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-4-0` @ `C:\Development\Animal_Shelter_cut-release-0-4-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-25 |
| Carries a migration? | no — but the release it cuts does. See §3 |
| Tested at SHA | `69531ef` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.4.0` entry holding the five notes written by PRs #110–#118, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations, no documentation
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email **are** mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy itself, which is Lutan's go; (b) `docs/releases/2026-09-25.md`, the release record, which `docs/release-smoke-test.md` says is filled in *against `lannacare.org` after the deploy* — writing it now would be a record of checks nobody has run; (c) applying `0078`–`0082` to production, which this session cannot even measure (§3)

**Decision confirmed in chat by Lutan, 2026-09-25:** `0.4.0` with `major: true`, so admins are mailed. `0.4.0` rather than `0.3.1` follows the register's numbering rule — a major release bumps the middle number. The case for major, put to him and chosen: two of the five notes need an admin to act or will be asked about — the social links show nothing until an admin pastes them under Settings → Website, and Assistant has **disappeared from the left menu** — and the release also carries the anon-grants lockdown behind `0081` and `0082`.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git fetch` then `git rev-list --count HEAD..origin/main` returned **0**, at `69531ef`. Checked because the `0.2.2` worktree once came up five commits stale
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose. The first two are the guards `scripts/deploy.mjs` applies at lines 150–157, which refuse a production deploy outright:

- [x] Newest release version matches `package.json` — both `0.4.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 notes and the edit refused any other count
- [x] `majorReleasesSince("0.3.0")` returns exactly **`0.4.0`** — so the deploy mails admins about this release and no other
- [x] The register still parses the way `deploy.mjs` loads it — imported under Node's type stripping: `latestRelease` is `0.4.0` / `2026-09-25` / `major: true` / 5 notes
- [x] The Worker version message survives `deploy.mjs`'s sanitiser — line 202 strips anything outside `[\w .,:-]`. The title uses only letters, spaces, commas and hyphens, so it passes through intact. Checked deliberately: a title that did not survive argument parsing is what broke `deploy:prod` on `0.1.0`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR, **and not establishable from this session for the release.** See the finding below
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release before any apply
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0082`; both schema PRs applied there before merging
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **stated, and it starts with a measurement, not an apply.** Two sources on `main` disagree about where production is:
  - `docs/releases/2026-09-24.md` says production ended 2026-09-24 at **80 applied, 0 pending**.
  - `docs/test-plans/anon-view-grants-schema.md:62`, written after it, says production **sits at `0077`**, so `0078`–`0081` go together.

  They cannot both be true, and the second is explicitly a presumption — that plan says "Production was never probed from a session, so the exposure there is presumed, not measured". **Nothing in this PR resolves it**: `node scripts/apply-migrations.mjs --status --env production` was attempted from the main checkout and refused by the auto-mode classifier (`[Production Reads]`), as it was for #114's author. So the apply plan is:

  1. **Lutan runs `node scripts/apply-migrations.mjs --drift production` from the main checkout** — the check #114 added for exactly this question. It names both halves: files on `origin/main` that production has not run, and rows production has that `main` has no file for.
  2. Whatever it reports, `--dry-run`, then apply, then `node scripts/check-public-views.mjs --env production`.
  3. **Order matters for `0081`/`0082` and not in the direction it usually does.** They revoke `anon` grants, so applying them *early* is safe and applying them *late* leaves the exposure open longer. Nothing in this release's code reads a revoked object as anon, so they can go before or after the deploy — but they are the reason to do this release promptly rather than the reason to wait.

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: version `0.4.0`, `major: true`, date `2026-09-25`, 5 notes, 7 releases total, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has seven entries and cannot be empty. `unreleased` is now empty, which is its correct post-cut state and is what `/releases` and `deploy.mjs` both expect
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 5, carried across verbatim, none reworded. **Indentation**: re-indented to six spaces to match the sibling entries. **Line endings**: the file is CRLF and that was preserved, so the diff is 19 lines rather than the whole file — three earlier attempts at this edit mangled the file precisely because they assumed LF, and each was reverted with `git checkout --` rather than patched over. **`major: true`**: the one irreversible consequence in this PR, so `majorReleasesSince` was checked to return exactly one version

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed** | sees `0.4.0` at the top; receives the release mail | mail outcome recorded at deploy; page not verified on a deployed build |
| management | `/releases` | sees `0.4.0` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.4.0` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.4.0` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.4.0` at the top | not verified on a deployed build |
| signed out | redirected to login | no change from this PR | unchanged; `/releases` has redirected signed-out requests since before this release |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders, not who may see it, and no role's access differs. Recorded rather than skipped because the **release** does change anonymous access — `0081` and `0082` remove `anon`'s grants — and that is verified by `check-public-views.mjs`, which §3 puts in the apply plan
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no server-side access rule is touched by this PR. The release's own change in this area is `0081`/`0082`, which only ever *removes* anon access, and whose verification is the `check-public-views.mjs` run in §3

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release contains one — Assistant leaving the left menu — from #116's own PR and plan
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; the manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read it through `latestRelease` / `majorReleasesSince` / `unreleased`, and all three were exercised in §2. `majorReleasesSince` is the one whose result differs from `0.2.1` and `0.2.2`, because those were `major: false` and this is not
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `69531ef`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All five notes were written by the PRs that made each change. Ticking this would claim `unreleased` gained a line, and `check-test-plan.mjs` would fail it
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The version and `major` flag follow the rule already written at the top of `src/lib/releases.ts`, and the one finding worth carrying — the production migration disagreement — is in §3, where the person doing the apply will read it
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `69531ef` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **Read `deploy.mjs`'s printed SHA; do not assume it**

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Owed, and check what is on test first** — the smoke test warns test sometimes holds a deliberate integration build
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling in this PR or in any of the five notes
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. **This release changes a public page** — the social icons in the footer of every public page — and anonymous GETs are edge-cached per data centre, so the old footer can persist briefly after the deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR. The release-mail path's requirements are already live and were exercised on `0.1.0`, `0.2.0` and `0.3.0`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. **For the release**: `0081` and `0082` only revoke `anon` grants and no code in this release reads a revoked object as anon, so there is no ordering trap in either direction
- [ ] `--env production --dry-run` run and clean — deferred: Lutan. Production is his go and this session's `--env production` reads are refused by the classifier (§3)
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — deferred: Lutan. **Worth a look before applying**: `0081` and `0082` are `revoke` statements, which rewrite no rows but are not additive either, and the newest backup noted on 2026-09-24 was already three days old then
- [x] Apply plan stated — in §3, beginning with `--drift production` because where production actually stands is disputed on `main`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.3.0` build in seconds and `/api/releases/current` reverts with it. **This release is not fully reversible**, as `0.3.0` was not: `major: true` means admins are mailed once the deploy succeeds and a rollback cannot unsend that. Nor does rollback revert `0081` or `0082` — and those are the ones to think about, because unlike every additive migration behind them they **remove** grants. A Worker rolled back to `0.3.0` still runs against a database where `anon` has lost them; that is fine, since the public site never used them, but it is the first release where rolling back the code leaves the database strictly less permissive than the code was written against

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `main` contains two contradictory statements about production's migration state — `docs/releases/2026-09-24.md` says 80 applied / 0 pending, `docs/test-plans/anon-view-grants-schema.md:62` says production sits at `0077`. Either four migrations are unapplied in production or the plan's premise was wrong | **open, and deliberately not resolved in this PR.** It cannot be resolved by reasoning, only by `--drift production`, which this session is refused. Raised in §3 as the first step of the apply plan and in the PR body |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The five notes and the title, read as a shelter user would. `major: true` means these exact words are emailed to admins, so for anyone who does not open the site the notes *are* the release. The notes came from their own PRs; **the title is mine and has not been reviewed by anyone** | `src/lib/releases.ts`, the `0.4.0` entry |
| 2 | That mailing admins is intended. Chosen in chat on 2026-09-25 with the consequence stated; restated here because it is the one step a rollback cannot undo | `src/lib/releases.ts`, `major: true` |
| 3 | **Where production's schema actually is** — `node scripts/apply-migrations.mjs --drift production` from the main checkout. Needed before the deploy, and it settles defect 1 | main checkout, Lutan's terminal |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all three items are open. Item 2 was answered in chat, but items 1 and 3 need a person: nobody has read the five notes and the title as a body of text, and nobody has measured production's schema

Manual verification by: pending: Lutan to read the five notes and the title (item 1) and run `--drift production` (item 3)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the three items above outstanding

Result: pass
