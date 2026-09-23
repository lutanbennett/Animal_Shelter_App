# Feature test plan — cut-release-0-1-0

## Header

| | |
|---|---|
| Feature | Cut release `0.1.0`: add the register entry for the ten PRs merged since `0.0.1`, and bump `package.json` to match |
| Backlog item | none — this is the release-cut step described in `src/lib/releases.ts`'s own header, not a backlog feature |
| Branch / worktree | `claude/cut-release-0-1-0` @ `C:\Development\Animal_Shelter_cut-release-0-1-0` |
| Dev server | not started — `/releases` renders from this data and was verified by the build compiling the route; the page itself is unchanged by this PR |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `f695a46` — `main` at `f3620ae` (which includes #59) plus the version bump |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — two files: a new `0.1.0` entry at the top of `releases`, and `package.json`'s version. No logic, no schema, no routes
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only), `package.json` (version field only, one-line diff, no reformatting)
- [x] Roles affected identified — **all roles equally**, and only in what `/releases` lists. `major: true` additionally means admins with a verified email are mailed on deploy; no role gains or loses access
- [x] Anything explicitly **out of scope** written down — (a) the deploy itself, which is a separate act needing the user's go; (b) the deploy of this release, which is the act that stamps it live — #59 merged on 2026-09-23 and this branch has been synced onto it; (c) release notes for the seven internal PRs, deliberately omitted per the register's rule that fixes nobody sees don't need a line

**Decisions confirmed in chat by Lutan, 2026-09-23**, recorded here because they are the substance of this PR rather than something I chose: `major: true`; release mail **enabled** (he confirmed admin addresses are set up and verified in Cloudflare Email Routing); date `2026-09-24`. Version `0.1.0` rather than `0.0.2` follows the register's own numbering rule — a major release bumps the middle number.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, twice: to `25f1b4e` (#68), then to `f3620ae` (#59). Now 0 commits behind `main`
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0). Exit codes captured to file, not read after a pipe
- [x] CI green on the PR (runs the same three) — `check` **pass** on `f695a46` in 1m27s, on a clean runner. `test-plan` was red until the manual signature below was recorded

Also run, because this PR's whole purpose is to satisfy them — `scripts/deploy.mjs` refuses production while any of these is wrong:

- [x] Newest release version matches `package.json` — both `0.1.0`
- [x] `unreleased` is empty — 0 lines, so nothing is left undescribed
- [x] `majorReleasesSince("0.0.1")` returns `0.1.0` — confirms a deploy over the currently-live `0.0.1` will mail admins about exactly this release and no other

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no database at all
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration. `0072_cashflow_forecast.sql` was applied to production on 2026-09-23 ahead of this release; production is at 72 applied, 0 pending

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded under Node's type stripping the way `scripts/deploy.mjs` loads it, and reports version `0.1.0`, title, `major: true`, date `2026-09-24`, 3 notes
- [ ] Data persists — reload the page and the change is still there — n/a: static data compiled into the build; there is nothing to persist
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` now has two entries and can never be empty
- [ ] Invalid input is rejected with a readable message — n/a: no input. The consistency rules that would reject bad data live in `deploy.mjs` and were run above
- [x] Boundary cases checked — version ordering: `compareVersions` places `0.1.0` above `0.0.1`, which is what makes `majorReleasesSince` return it; confirmed by the check in section 2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, and receives the release email | sees `0.1.0` at the top; mailed on deploy | not verified on a deployed build — see section 8 |
| management | `/releases` | sees `0.1.0` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.1.0` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.1.0` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.1.0` at the top | not verified on a deployed build |
| signed out | redirected to login | no change | unchanged by this PR — `/releases` returned 307 to login on the live `0.0.1` build |

- [ ] Every role above tested — n/a: this PR changes data the page already renders, not who may see it. `/releases`' own access rules came in with PR #62 and are unchanged here; no policy, route or query is touched
- [x] A role that should not have access is blocked server-side — verified on production as it stands: `curl https://lannacare.org/releases` signed out returns **307 to login**, not the page

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the `/releases` entry came in with #62
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual topic for release notes came in with #62 and describes the page, not its contents
- [ ] Translatable strings go through the translation path — n/a: release notes are **English only** by design (#62's decision), so these three notes are user-facing text that will deliberately not be translated
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled every route including `/releases` and the `/api/releases/current` handler
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All three read it through `latestRelease` / `majorReleasesSince`, both exercised in section 2
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought in #68 (template only); all three gates pass on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no new decision. The register's design, numbering rule and mail behaviour were all recorded by #62; this PR is the first ordinary use of it
- [x] `README.md` still accurate — no README claim is affected; it does not name a version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `f695a46` is `main` at `f3620ae` plus this version bump, 0 commits behind. This line was `n/a` while #59 was open; #59 merged 2026-09-23 and the branch was synced and re-gated, so it now genuinely holds. **Read `deploy.mjs`s printed SHA at deploy time and confirm it matches, rather than assuming.**
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed by this PR

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: `test.lannacare.org` is deliberately holding `7abc796` for the overnight UTC check; deploying over it would destroy the thing being tested
- [ ] Smoke-tested on `test.lannacare.org` — n/a: as above
- [ ] Timezone-sensitive behaviour checked on test — n/a: this PR's own change is a date string in a data file, with no clock behaviour. The timezone behaviour this release *contains* is #59's, covered by its own plan and Lutan's overnight test
- [ ] Public pages re-checked after a cache purge — n/a: `/releases` is not a public page, and no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy in this PR. Flagged for whoever deploys: `scripts/lib/env.mjs` resolves shell over `.env.deploy.production`, so a stray exported `NEXT_PUBLIC_SUPABASE_URL` silently builds production against dev
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR. Verified the release-mail path's requirements are already live: the deployed Worker reports the `RELEASE_MAIL` send-email binding, `RELEASE_MAIL_ENV: "UAT"` and `RELEASE_MAIL_FROM: releases@lannacare.org`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; `0072` was dry-run and applied on 2026-09-23
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.0.1` build in seconds, and `/api/releases/current` reverts with it. **What rollback does not undo: the release email.** `major: true` means admins are mailed once the deploy succeeds; a rollback afterwards leaves them holding notes for a release that is no longer live. Nor does it revert `0072`, which is already applied and harmless (additive, and the older code does not read it)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `unreleased` was **empty** when this release was cut, so the three notes are reconstructed from PR titles rather than written by the authors who made the changes. #60 (cashflow) and #67 (nav rework) both merged after the register existed and neither added its line. `deploy.mjs` cannot catch this — it only refuses when `unreleased` is *non-empty*, so an empty list is indistinguishable from "nothing user-visible shipped" | accepted for this release, deferred to backlog — the notes were checked against each PR's title and diff, but the fix is a checklist line asking "does this change something a user notices? is there an `unreleased` line?" |
| 2 | low | The release mail path has never run. `major: true` makes this release its first real use. Lutan confirmed in chat that admin addresses are set up and verified in Cloudflare Email Routing, which is the failure mode that would otherwise skip people silently. `deploy.mjs` prints `sent N, skipped N`, so the outcome is visible either way | accepted — read that line at deploy time; `--no-mail` is available if the send should be held back |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The three release notes, as a shelter user would read them. They are the part of this PR a person should approve rather than a machine — the register's own rule is that notes are written for a shelter user, not as a commit message, and these were reconstructed rather than authored by each PR (defect #1) | `src/lib/releases.ts`, the `0.1.0` entry |
| 2 | That `0.1.0` is the version you want. The register's rule makes a major release bump the middle number, so `0.0.1` → `0.1.0`; if you would rather this were `0.0.2`, `major` has to become `false` and the email stops | `src/lib/releases.ts` + `package.json` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — both items confirmed by Lutan in chat, 2026-09-24, and recorded at his request

Manual verification by: Lutan Bennett — the three notes were quoted to him in full before drafting and he approved the release by instructing the merge and deploy in chat; line written by Claude at his request  Date: 2026-09-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
