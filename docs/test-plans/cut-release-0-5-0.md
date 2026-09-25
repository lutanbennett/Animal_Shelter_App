# Feature test plan — cut-release-0-5-0

## Header

| | |
|---|---|
| Feature | Cut release `0.5.0`: move the six `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-5-0` @ `C:\Development\Animal_Shelter_cut-release-0-5-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-25 |
| Carries a migration? | no — but the release it cuts does, and the ordering matters. See §3 |
| Tested at SHA | `a35d6ca` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.5.0` entry holding the six notes written by PRs #120–#131, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email **are** mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, which is Lutan's go; (b) `docs/releases/2026-09-25.md`, which already holds the `0.4.0` record and gains a `0.5.0` section **after** the deploy, not now; (c) applying `0085`/`0086` to production, which is a prerequisite of the deploy and is Lutan's to run (§3)

**Decision confirmed in chat by Lutan, 2026-09-25:** `0.5.0` with `major: true`. The case put to him and chosen: the sign-in gate closes `lannacare.org` and `test.lannacare.org` to the public, and an admin who has not been told will read that as the site being broken. Stock on hand is also a new capability. This is the clearest major case of the three releases so far.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git rev-list --count HEAD..origin/main` returned **0**, at `a35d6ca`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose. The first two are the guards `scripts/deploy.mjs` applies at lines 150–157, which refuse a production deploy outright:

- [x] Newest release version matches `package.json` — both `0.5.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 6 notes and the edit refused any other count
- [x] `majorReleasesSince("0.4.0")` returns exactly **`0.5.0`** — admins are mailed about this release and no other
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.5.0` / `2026-09-25` / `major: true` / 6 notes; 8 releases total
- [x] The Worker version message survives `deploy.mjs`'s sanitiser (line 202, strips outside `[\w .,:-]`) — the title is letters, spaces and commas only and passes through intact

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused by the auto-mode classifier (`[Production Reads]`), as they were for `0.4.0`
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release, and see the expectation set below
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0086`, reported by the owning stream as 86 applied / 0 pending and matching `origin/main`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **this release has a hard schema prerequisite, and getting it wrong opens a hole rather than leaving one closed.**

  `main` carries `0083`–`0086`; production's position is unmeasured from here. Before the deploy:

  1. `node scripts/apply-migrations.mjs --drift production` from the main checkout (Lutan — reads are refused to this session).
  2. Apply whatever is pending, then `node scripts/check-public-views.mjs --env production` and `node scripts/check-app-access-gate.mjs` (new in #128).

  **`0085` and `0086` must be applied together, and both before this release deploys.** `0085` adds the `public_viewer` role; `0086` moves six owner-rights internal views into `private` behind a staff-role gate. This release carries #123, the sign-in lock — so a production holding `0085` without `0086` has an account type that signs in past the lock and reads what `0086` has not yet closed. On dev those views answered 81 placements, 220 immunization_compliance rows and 58 translation_queue rows to a role-less login. If an apply stops between the two files, **finish it or roll it back** — "one applied, one pending" is the state that opens the hole.

- [x] The enum dry-run artefact was checked for and **does not apply here** — `0085` is `alter type app_role add value 'public_viewer'`, which is the shape that made `0076` report a false FAILED against `0075`. Checked deliberately: `0086` never references `public_viewer` by name (its own comment at line 73 says so) and gates on a positive allow-list, `current_user_role() in ('admin','management','staff','vet','volunteer')`. So there is no cross-file dependency, **a clean dry-run is the expectation, and a red one here would be a real problem rather than the known artefact.** This inverts the usual advice and is the reason to write it down

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.5.0`, `major: true`, `2026-09-25`, 6 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has eight entries and cannot be empty. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 6, carried across verbatim, none reworded. **Indentation**: six spaces, matching the sibling entries. **Line endings**: CRLF preserved, so the diff is 21 lines rather than the whole file. **`major: true`**: `majorReleasesSince` checked to return exactly one version, so admins are mailed once

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed** | sees `0.5.0` at the top; receives the release mail | mail outcome recorded at deploy; page not verified on a deployed build |
| management | `/releases` | sees `0.5.0` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.5.0` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.5.0` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.5.0` at the top | not verified on a deployed build |
| public_viewer | `/releases` | refused — no staff role | new in this release; not verified by this PR, covered by #128's plan |
| signed out | redirected to login | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders, not who may see it. Recorded rather than skipped because **the release changes role behaviour substantially** — a new `public_viewer` role, a staff-role gate on six internal views, and a sign-in lock on the public sites — all verified by #123's and #128's own plans, not by this one
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; manual changes rode with the features, including #122's screenshot fixes
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`, all read through `latestRelease` / `majorReleasesSince` / `unreleased` and all exercised in §2
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `a35d6ca`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All six notes were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The version and `major` flag follow the rule at the top of `src/lib/releases.ts`; the schema ordering constraint is in §3 where the person applying it will read it
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `a35d6ca` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **Read `deploy.mjs`'s printed SHA; do not assume it**

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Note the sign-in lock applies to test too, so a signed-out smoke test now sees the Staff testing site page rather than the public site — expected, not a break
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling in this PR or in any of the six notes
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. **This release changes what a signed-out visitor sees on every public page**, and public GETs are edge-cached per data centre

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. **Capture the deploy output this time** — the `0.4.0` record could not tick this because the text was not kept
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR, but **the release does carry an ordering dependency and it is the sharpest one yet**: #123's sign-in lock must not reach production before `0085` and `0086` are applied. Stated in full in §3
- [ ] `--env production --dry-run` run and clean — deferred: Lutan. Reads and deploys are both refused to this session
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. **Worth checking before this one**: `0086` moves six views between schemas with `alter view … set schema`, which is more than additive
- [x] Apply plan stated — §3, beginning with `--drift production`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.4.0` build in seconds. **Not fully reversible**: `major: true` means admins are mailed and that cannot be unsent. More importantly, **rollback does not revert `0085` or `0086`**, and here that asymmetry has teeth in the useful direction: a Worker rolled back to `0.4.0` runs without the sign-in lock against a database whose internal views are now staff-gated. That is safe — `0.4.0`'s code only ever read those views as staff. The dangerous combination is the opposite one, the lock deployed without the migrations, which §3 exists to prevent

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR, and worth recording here because
a release manager is the only one who looks at all of them together:

- All **11** feature branches merged since `0.4.0` have a completed plan under `docs/test-plans/`. None reports `Result: fail`; three report `pass with accepted defects`.
- The one accepted defect that was **deferred across PRs** was chased and is closed: `photo-proxy-public-schema` deferred "the photo proxy streams any known Drive file, internal attachments included, to a signed-out visitor" to its feature half. #131 closed it — its plan records signed-out requests for internal files now returning `404` with `no-store` while a public profile photo still returns `200`, and a refused file being indistinguishable from an unknown id. This is the failure mode a per-PR check cannot catch, since each half is individually complete.
- Two follow-ups are deliberately left open by their own plans: `is_known_drive_file` is still anon-callable (deferred to backlog, explicitly "after this deploys to production"), and a file that stops being public is still served from caches for up to 24h (accepted in `decisions.md`).

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The six notes **and the title**, read as a shelter user would. `major: true` means these exact words are emailed to admins. The notes came from their own PRs; **the title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.5.0` entry |
| 2 | That mailing admins is intended. Chosen in chat 2026-09-25 with the consequence stated | `src/lib/releases.ts`, `major: true` |
| 3 | **Production schema before the deploy** — `--drift production`, then apply `0085` and `0086` together. This is a prerequisite, not a follow-up | main checkout, Lutan's terminal |
| 4 | **Seven of the eleven feature plans still have `manual: pending` items**, including all four staff-page checks on #128 and four on #123. They do not block this cut, but they are the largest block of unverified surface any release has carried, and #123 changes what every visitor sees | `docs/test-plans/` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-25

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 2 was answered in chat; items 1, 3 and 4 are open and need a person

Manual verification by: pending: Lutan to read the six notes and the title (item 1), run `--drift production` and apply `0085`/`0086` (item 3), and decide what to do about the seven pending feature plans (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
