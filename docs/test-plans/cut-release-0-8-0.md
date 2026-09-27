# Feature test plan — cut-release-0-8-0

## Header

| | |
|---|---|
| Feature | Cut release `0.8.0`: move the nine `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-8-0` @ `C:\Development\Animal_Shelter_cut-release-0-8-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-27 |
| Carries a migration? | no — but seven sit between `main` and the last confirmed production state, and five are read by this release's code. See §3 |
| Tested at SHA | `3c671d5` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.8.0` entry holding the nine notes written by PRs #169–#182, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email are mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, Lutan's go; (b) `docs/releases/2026-09-27.md`, which already holds `0.7.0` and gains a `0.8.0` section **after** the deploy; (c) applying the pending migrations (§3); (d) verifying 2-step verification end to end, which needs an authenticator app and a person

**Decision confirmed in chat by Lutan, 2026-09-27:** `0.8.0` with `major: true`. The case put to him and chosen: **note 7 requires admins to set up an authenticator app before they can use Settings → Security.** An admin who has not been told will meet a 6-digit code prompt with no idea why. Vets also lose menu entries, admins start receiving alert emails, and medical photos come off the public website.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git rev-list --count HEAD..origin/main` returned **0**, at `3c671d5`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.8.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 9 notes and the edit refused any other count
- [x] `majorReleasesSince("0.7.0")` returns exactly **`0.8.0`** — admins are mailed about this release and no other
- [x] **The date was read from the system clock and compared back to it** — `date +%Y-%m-%d` gave `2026-09-27`, the entry says `2026-09-27`, and the register was re-loaded and asserted equal to today. The check exists because `0.6.1` shipped misdated; nothing in CI or `deploy.mjs` inspects `date`
- [x] The register parses the way `deploy.mjs` loads it, and the title survives its sanitiser (line 202) — letters, spaces, commas and hyphens only

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused (`[Production Reads]`)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0104`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **and there is an unusual uncertainty this time, stated rather than glossed.**

  `0096`–`0100` were applied by Lutan during the `0.7.0` release, but **that output was never captured**, so this session cannot confirm it. `0101`–`0104` are certainly new. So `--drift production` is not a formality here: it is the only thing that establishes whether five of this release's dependencies are already met.

  1. `node scripts/apply-migrations.mjs --drift production` from the main checkout (Lutan — reads are refused to this session).
  2. `--dry-run`, apply what it names in order, then `check-public-views.mjs --env production` and `check-app-access-gate.mjs`. **Append the output to `deploy.log`** — `0.7.0`'s apply output was lost and that is why this plan cannot state the starting point.
  3. **Then** deploy.

  | File | Read by this release's code? |
  |---|---|
  | `0098_status_alerts.sql` | **Yes** — #174 shipped the consumer |
  | `0099_site_pages_relocation_friends_join.sql` | **Yes** — #171 and #175 shipped `/relocation` and `/friends` |
  | `0100_user_roles_require_aal2.sql` | **Yes** — #172 shipped the 2-step UI |
  | `0101_public_photos_exclude_medical.sql` | **Yes** — #179 |
  | `0102_vet_doctors_and_vet_accounts.sql` | No — #176 was schema-only, no `src/` change at all |
  | `0103_public_profile_photo_exclude_medical.sql` | **Yes** — #179 |
  | `0104_site_pages_international_adoption.sql` | No — no route exists |

- [x] **All three expiry dates recorded in `cut-release-0-7-0` came due in this single release.** `0098` (status alerts), `0099` (the two public pages) and `0100` (2-step verification) each had their consumer shipped by #174, #171/#175 and #172. That is the third, fourth and fifth time the pattern has been caught by writing the date down at the moment schema went in ahead of code. **Two new ones are recorded here: `0102` and `0104`**
- [x] **`0101` and `0103` fix a real leak, and the urgency was measured rather than assumed.** Both say so in their own headers — `public_resident_photos` took every resident attachment whatever folder it was filed in, so operation, teeth and wound photos reached `/adopt/[id]`, and the same view is one `is_public_drive_file()` asks, so the photo proxy served them to anyone with the link. **On production today that is not anonymously reachable**, because the site is locked: `/api/photos/` is deliberately absent from `LOCKED_PUBLIC_PATH_PREFIXES` (`src/lib/public-paths.ts:48` says why), and a signed-out `GET https://lannacare.org/api/photos/<id>` returns **307 to `/login`**, verified against production. So this is not an emergency today — **and it becomes one the moment the lock comes off at go-live.** These two must be on production before `PUBLIC_SITE` stops being `locked`, independently of any deploy

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.8.0`, `major: true`, `2026-09-27`, 9 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has twelve entries. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 9, carried verbatim, none reworded. **Date**: read from the clock and asserted. **Indentation**: six spaces. **Line endings**: CRLF preserved. **`major: true`**: `majorReleasesSince` returns exactly one version

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed**; **Settings → Security now needs a 6-digit code** | sees `0.8.0`; receives the mail; must enrol an authenticator app | mail outcome recorded at deploy; enrolment not verified — needs a person and a phone |
| management / staff | `/releases` | sees `0.8.0` | not verified on a deployed build |
| vet | `/releases` | sees `0.8.0`; **loses Enclosures, Maintenance, Vets, Contacts and Projects from the menu** | from #182's own plan |
| volunteer | `/releases` | sees `0.8.0` | not verified on a deployed build |
| public_viewer | `/releases` | refused — no staff role | unchanged |
| signed out | the sign-in lock | unchanged by this PR | verified: `/api/photos/` 307s to login (§3) |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders. Recorded because **this release changes two roles' access materially** — a vet's menu shrinks and an admin needs a second factor — both verified by #182's and #172's own plans, not this one
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified for this PR. The release's own access changes are `0100` plus #178's refusal redirects, each with its own plan

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release contains several, from #182's and #171/#175's own PRs
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route, including the new `/relocation` and `/friends`
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`, all exercised in §2. `majorReleasesSince` matters again, since `0.7.0` was major and this one is too — the guard that it returns exactly one version is what stops two releases being announced at once
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `3c671d5`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All nine were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The two new expiry dates and the leak-urgency measurement are in §3
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `3c671d5` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. Fourteen PRs landed since the last release; check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. **Two new public pages ship in this release** (`/relocation`, `/friends`), though both are behind the sign-in lock until go-live
- [ ] **2-step verification end to end** — deferred: Lutan. Needs an authenticator app on a phone. **The highest-value manual check in this release**: it gates an admin-only page, and a broken enrolment would lock admins out of the page they would use to fix it

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. Use `>>`
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [ ] **The release-mail line** — deferred: production release manager. `0.7.0` settled the question: `sent 1, skipped 1`, the shelter's address refused as `E_RECIPIENT_NOT_ALLOWED`, never verified under Email Routing. **This release is the one where that bites**: note 7 is exactly the change an admin needs warning about, and the warning will not reach them. Fixing it is two steps in `docs/email-sending.md` §1b and needs someone with access to that inbox

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR, but the release depends on five. `0099` and `0100` are the sharp ones: without `0099` the two new public pages have no rows to render, and without `0100` the 2-step policies are simply absent, so Settings → Security would accept writes at `aal1` — a silent weakening rather than a visible break, which is the harder failure to notice
- [ ] `--env production --dry-run` run and clean — deferred: Lutan
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. `0101` and `0103` redefine public views and `0100` adds restrictive policies, so this batch is not purely additive
- [x] Apply plan stated — §3, beginning with `--drift production`, which this time also establishes whether `0.7.0`'s apply actually landed

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.7.0` build in seconds. **Not fully reversible**: `major: true` means admins are mailed. **Rollback over the applied migrations is mostly clean but not entirely**, and this is the first release where that is true: `0101` and `0103` *redefine existing public views*, so rolling the Worker back to `0.7.0` leaves those views still filtering Medical photos. That is harmless — `0.7.0`'s code renders whatever the view returns, and returning fewer photos is the safe direction — but it is a change the older build did not expect, unlike every previous rollback where the migrations only added unused objects

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- All **thirteen** feature branches merged since `0.7.0` have a completed plan under `docs/test-plans/`. None reports `Result: fail`; **seven** report `pass with accepted defects`, the most of any release so far.
- `0.7.0`'s apply output was not captured, so this release cannot state production's starting schema. That is a consequence of the previous release's gap, landing on this one.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The nine notes **and the title**, read as a shelter user would. `major: true` means these exact words are emailed. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.8.0` entry |
| 2 | That mailing admins is intended. Chosen in chat 2026-09-27 with the consequence stated | `src/lib/releases.ts`, `major: true` |
| 3 | **2-step verification end to end**, with a real authenticator app. The highest-value check in this release — it gates the page an admin would use to fix a problem with it | `/admin/security` on test |
| 4 | **Whether the other admin gets told about 2-step verification at all.** The mail will not reach them, and note 7 is the change that makes that concrete rather than theoretical | Cloudflare → Email Routing, then the deploy's mail line |

`--drift production` is deliberately **not** a row here: it is a deploy-time check and lives in section 8 as `deferred:`, per the template rule added on 2026-09-27.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 2 was answered in chat; items 1, 3 and 4 are open and need a person

Manual verification by: pending: Lutan to read the nine notes and the title (item 1), test 2-step verification with an authenticator app (item 3), and decide what to do about the unreachable admin address (item 4)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
