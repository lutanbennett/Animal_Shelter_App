# Feature test plan — cut-release-0-6-0

## Header

| | |
|---|---|
| Feature | Cut release `0.6.0`: move the nine `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-6-0` @ `C:\Development\Animal_Shelter_cut-release-0-6-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-26 |
| Carries a migration? | no — but the release has **five** pending on production, and the ordering is a hard prerequisite. See §3 |
| Tested at SHA | `65527e4` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.6.0` entry holding the nine notes written by PRs #133–#143, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email **are** mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, which is Lutan's go; (b) `docs/releases/2026-09-26.md`, written **after** the deploy against the live site; (c) applying `0087`–`0091`, which is a prerequisite of the deploy and Lutan's to run (§3)

**Decision confirmed in chat by Lutan, 2026-09-26:** `0.6.0` with `major: true`. The case put to him and chosen: this is the largest release so far — a redesigned public website and home page, two new features (Stocktake, My tasks) and a new account type — and **two of the nine notes are the kind that generate support questions rather than pleasure**. Signing in now lands on My tasks instead of the Residents list, and archived or role-less accounts can no longer sign in with a password at all. Those are exactly what the admin mail exists to pre-empt.

**One note was removed before this cut, deliberately.** `unreleased` held ten. #144 dropped the standard-diet backfill note because on production that backfill matched **no rows** — 0 backfilled, 0 living residents without a current diet, all 69 already carrying the `0069` seed and no intakes since 2024-01-01. It described a change no shelter user could notice. It had to go *before* the cut, because `major: true` mails these lines verbatim and that cannot be unsent.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git rev-list --count HEAD..origin/main` returned **0**, at `65527e4`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose. The first two are the guards `scripts/deploy.mjs` applies at lines 150–157, which refuse a production deploy outright:

- [x] Newest release version matches `package.json` — both `0.6.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 9 notes and the edit refused any other count
- [x] `majorReleasesSince("0.5.0")` returns exactly **`0.6.0`** — admins are mailed about this release and no other
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.6.0` / `2026-09-26` / `major: true` / 9 notes
- [x] **The dropped note is absent from the release entry** — checked by string match rather than by counting, so #144's removal actually carried through into what will be mailed
- [x] The Worker version message survives `deploy.mjs`'s sanitiser (line 202) — the title is letters, spaces and commas only

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused by the auto-mode classifier (`[Production Reads]`)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0091`; each schema PR applied there before merging
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **this is the strictest ordering this project has had, and getting it wrong breaks working pages rather than leaving a hole open.**

  `main` carries **five** migrations production does not have, assuming it is still at `0086`:

  | File | What | Read by this release's code? |
  |---|---|---|
  | `0087_standard_diet_flag.sql` | `diet_types.is_standard` | **Yes** — Management → Diets and the intake form |
  | `0088_record_stocktake.sql` | the stocktake RPC | **Yes** — the whole Stocktake feature |
  | `0089_is_known_drive_file_revoke.sql` | revokes anon EXECUTE | No — see below |
  | `0090_standard_diet_functions.sql` | standard-diet helpers | **Yes** |
  | `0091_record_stocktake_staff.sql` | staff access to the RPC | **Yes** |

  **Four of the five are read by code in this release.** Deploying before applying them breaks Management → Diets, resident intake and Stocktake — three working pages, not a latent exposure. So:

  1. `node scripts/apply-migrations.mjs --drift production` from the main checkout (Lutan — reads are refused to this session). **Confirm production is at `0086` before assuming five are pending.**
  2. `--dry-run`, then apply **all five, in order**, then `node scripts/check-public-views.mjs --env production` and `node scripts/check-app-access-gate.mjs`.
  3. **Then** deploy. Not before.

- [x] `0089` was checked specifically, because a revoke in a release is worth being sure about — it takes anon's EXECUTE on `is_known_drive_file`, which the photo proxy used to call. **Nothing calls it any more**: `grep` for `rpc("is_known_drive_file")` across `src/` and `worker/` returns nothing, because #131 replaced it with `canSeeInternalFile` asking as the caller plus `is_public_drive_file` for public files. So the revoke is safe, and it is the follow-through on the item #131's plan deferred "after this deploys to production" — a condition `0.5.0` met

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.6.0`, `major: true`, `2026-09-26`, 9 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has nine entries and cannot be empty. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 9, carried verbatim, none reworded. **The tenth**: verified absent by content, not inferred from the count. **Indentation**: six spaces, matching siblings. **Line endings**: CRLF preserved. **`major: true`**: `majorReleasesSince` returns exactly one version

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed** | sees `0.6.0` at the top; receives the release mail | mail outcome recorded at deploy |
| management / staff / vet / volunteer | `/releases` | sees `0.6.0` at the top | not verified on a deployed build |
| public_viewer | `/releases` | refused — no staff role | shipped in `0.5.0`, covered by #128 and #135 |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders. Recorded rather than skipped because **the release changes role behaviour**: a new account type, password sign-in refused for archived and role-less accounts, and a different landing page for everyone. All verified by #135's, #139's and #138's own plans
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release contains two — My tasks and Stocktake — from #138's and #143's own PRs
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`, all reading through `latestRelease` / `majorReleasesSince` / `unreleased`, all exercised in §2
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `65527e4`, which already contains #144

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All nine were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. #144 recorded the one judgement made today (dropping the backfill note); the schema ordering is in §3
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `65527e4` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **`deploy.mjs` builds the current checkout**, so if `main` moves before the deploy it ships the newer tip. Eleven PRs landed today; check `git log` before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Note the sign-in lock means a signed-out smoke test sees the Staff testing site page, which is expected
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager. **Worth a look this time**: Stocktake records counts dated "today", and My tasks buckets jobs into overdue / due today / coming up. Both are date-sensitive in a way the last two releases were not
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. **This release redesigns every public page**, and public GETs are edge-cached per data centre, so the old design can persist briefly

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. **Capture the output**: `npm.cmd run deploy:prod > deploy.log 2>&1`, and note the screen stays blank while it runs
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [ ] **Watch the release-mail line** — deferred: production release manager. `0.5.0` reported `sent 1, skipped 1`, the shelter's own admin address refused as `E_RECIPIENT_NOT_ALLOWED` because it had never been verified under Email Routing (`docs/email-sending.md` §1b). If that has since been done this should read `sent 2, skipped 0`; if it still reads `sent 1`, the fix did not take

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR, but **the release does, more sharply than any before it**: four of the five pending migrations are read by code in this release, so deploying first breaks Management → Diets, intake and Stocktake. §3 has the order
- [ ] `--env production --dry-run` run and clean — deferred: Lutan. Reads and deploys are both refused to this session
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. **Worth checking before this one**: `0089` is a revoke and `0087` writes a flag onto existing `diet_types` rows, so this is not a purely additive set
- [x] Apply plan stated — §3, beginning with `--drift production` to confirm production really is at `0086`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.5.0` build in seconds. **Not fully reversible**: `major: true` means admins are mailed and that cannot be unsent. **The asymmetry runs the safe way again**, and deliberately: rolling the Worker back to `0.5.0` leaves five applied migrations in place, and `0.5.0`'s code reads none of them — `is_standard`, `record_stocktake` and the standard-diet helpers are all new surfaces, and nothing calls the function `0089` revokes. So a rollback is clean. The unsafe direction is the one §3 prevents: code first, migrations after

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR, because a release manager is
the only one who looks at all of them together:

- All **eleven** feature branches merged since `0.5.0` have a completed plan under `docs/test-plans/`. None reports `Result: fail`; two report `pass with accepted defects` (`public-site-shell`, `public-site-home`).
- Five of the eleven were signed off manually by Lutan; four are `n/a` with a stated reason; two carry `manual: pending` items (`stocktake`, `public-viewer-login`).
- The backlog item #131 deferred — taking `is_known_drive_file` back from anon — is **closed by `0089` in this release**, and the precondition it named ("after this deploys to production") was met by `0.5.0`. Verified by grep that nothing calls the function, rather than assumed from the migration's title.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The nine notes **and the title**, read as a shelter user would. `major: true` means these exact words are emailed. The notes came from their own PRs; **the title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.6.0` entry |
| 2 | That mailing admins is intended. Chosen in chat 2026-09-26 with the consequence stated | `src/lib/releases.ts`, `major: true` |
| 3 | **Production schema before the deploy** — `--drift production`, then apply all five in order. This is a prerequisite: skipping it breaks three working pages | main checkout, Lutan's terminal |
| 4 | Whether the shelter admin address was ever verified under Email Routing. If not, this release's mail reaches one inbox again | Cloudflare → `lannacare.org` → Email Routing → Destination addresses |
| 5 | The two feature plans still carrying `manual: pending` — `stocktake` and `public-viewer-login` | `docs/test-plans/` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 2 was answered in chat; items 1, 3, 4 and 5 are open and need a person

Manual verification by: pending: Lutan to read the nine notes and the title (item 1), run `--drift production` and apply `0087`–`0091` before deploying (item 3), and check the Email Routing verification (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
