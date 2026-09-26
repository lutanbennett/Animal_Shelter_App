# Feature test plan — cut-release-0-6-1

## Header

| | |
|---|---|
| Feature | Cut release `0.6.1`: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-6-1` @ `C:\Development\Animal_Shelter_cut-release-0-6-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-27 |
| Carries a migration? | no — but the release has four unapplied on production, three of them read by its own code. See §3 |
| Tested at SHA | `7ca9e24` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.6.1` entry holding the seven notes written by PRs #146–#155, and `package.json`'s version field
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: false`, so **no mail is sent to anyone**. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, which is Lutan's go; (b) `docs/releases/2026-09-27.md`, written **after** the deploy; (c) applying `0092`–`0095`, which is a prerequisite of the deploy and Lutan's to run (§3)

**Decision confirmed in chat by Lutan, 2026-09-27:** `0.6.1` with `major: false`. The case put to him and chosen: unlike the previous three releases, **nothing here changes how staff work or locks anyone out**. It is two new pages for admins and managers, extra contact channels, a redesigned resident page and polish. The notes still appear on `/releases`; what is avoided is a fourth admin email in three days for changes nobody needs warning about.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: `git rev-list --count HEAD..origin/main` returned **0**, at `7ca9e24`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose. The first two are the guards `scripts/deploy.mjs` applies at lines 150–157, which refuse a production deploy outright:

- [x] Newest release version matches `package.json` — both `0.6.1`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 notes and the edit refused any other count
- [x] **`majorReleasesSince("0.6.0")` returns `[]`** — the check that matters for a *minor* release, and the inverse of the one the last three needed. An empty list is what makes the deploy send nothing. Verified rather than assumed from `major: false`, because the flag and the function are two different things and only the function decides who is mailed
- [x] The register parses the way `deploy.mjs` loads it — `latestRelease` is `0.6.1` / `2026-09-27` / `major: false` / 7 notes
- [x] The Worker version message survives `deploy.mjs`'s sanitiser (line 202) — the title is letters, spaces and commas only

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. **Not establishable from this session**: `--env production` reads are refused by the auto-mode classifier (`[Production Reads]`)
- [ ] `--dry-run` reviewed — n/a: no migration in this PR; owed for the release
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0095`; each schema PR applied there before merging
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated for the release manager — **and this plan does not say how many are pending, on purpose.**

  `main` carries four migrations beyond `0091`. Whether production has any of them is **not stated here**, because the `0.6.0` cut asserted five were pending when one was: the schema streams apply their own migrations as they merge, so the previous release's record is a snapshot with a day of writes on top of it. The number comes from the measurement, not from arithmetic:

  1. `node scripts/apply-migrations.mjs --drift production` from the main checkout (Lutan — reads are refused to this session).
  2. `--dry-run`, then apply whatever it names, in order, then `node scripts/check-public-views.mjs --env production` and `node scripts/check-app-access-gate.mjs`.
  3. **Then** deploy.

  What *is* certain is which files this release's code reads, and that is the part that decides the order:

  | File | Read by this release's code? |
  |---|---|
  | `0092_contact_channels.sql` | **Yes — and it is the dangerous one.** See below |
  | `0093_stock_counts.sql` | **Yes** — Management → Stock between counts |
  | `0094_resident_hook_ideal_home.sql` | **Yes** — the public resident page and Edit resident |
  | `0095_recurring_jobs.sql` | **No** — four new tables, no consumer anywhere in `src/` or `worker/` |

- [x] **`0092` is the `0080` trap, exactly.** `SITE_CONTENT_COLUMNS` in `src/lib/site/content.ts:40` now selects `messenger_url, whatsapp_number, x_url`. That is the shared site-content loader, so against a database without those columns the select errors and **every public page and the admin Website page fail together** — the same failure mode `0080` would have caused in `0.4.0`. Deploying before `0092` is applied is the one ordering mistake in this release that takes the site down rather than degrading a feature
- [x] **`0095` is schema ahead of code, and its expiry date is worth writing down now.** It creates `recurring_jobs`, `recurring_job_occurrences` and two assignee tables, and nothing reads them — confirmed by grep across `src/` and `worker/`. Harmless in this release and safe to apply in any order. **The point to carry forward:** `0080` was equally harmless in `0.3.0` and became a release blocker in `0.4.0` the moment #112 built its consumer. So when the recurring-jobs feature half ships, `0095` stops being optional and its release must not deploy before it. Checking that is the next release manager's job, and this line exists so it is not rediscovered

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.6.1`, `major: false`, `2026-09-27`, 7 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has ten entries and cannot be empty. `unreleased` is now empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in §2
- [x] Boundary cases checked — **note count**: exactly 7, carried verbatim, none reworded. **Indentation**: six spaces, matching siblings. **Line endings**: CRLF preserved. **`major: false`**: the consequential check here is the *absence* of mail, so `majorReleasesSince` was run and returns an empty array rather than trusting the flag

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.6.1` at the top; **is not emailed** | no mail is sent by a `major: false` release |
| management / staff / vet / volunteer | `/releases` | sees `0.6.1` at the top | not verified on a deployed build |
| public_viewer | `/releases` | refused — no staff role | unchanged from `0.5.0` |
| signed out | the sign-in lock | unchanged by this PR | unchanged |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes data the page already renders, not who may see it. The release's own role-visible changes — System status for admins, Stock between counts for managers — were verified by #154's and #151's plans
- [x] A role that should not have access is blocked server-side — not re-verified here and not claimed as verified: no access rule is touched by this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release contains two, from #154's and #151's own PRs
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All were exercised in §2, and `majorReleasesSince` is the one whose behaviour differs from the last three releases, which is why it was checked explicitly rather than by inference
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `7ca9e24`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All seven were written by the PRs that made each change
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no design choice in this PR. The `0095` expiry-date point is in §3, where the next release manager will read it
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `7ca9e24` plus this branch's commit; the tip of `main`, 0 behind
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager. **`deploy.mjs` builds the current checkout**, and ten PRs landed since the last release, so check `git log` immediately before deploying

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager. **Check what is on test first**
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour checked on test — deferred: production release manager. **Relevant here**: Stock between counts compares two stocktakes by date, so its arithmetic depends on which day a count belongs to
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: production release manager. **This release changes the public resident page and adds footer contact channels**, and public GETs are edge-cached per data centre

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: production release manager. **Missing for two releases running.** `npm.cmd run deploy:prod > deploy.log 2>&1`, and note the screen stays blank while it runs
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR
- [x] Release mail — **nothing to watch this time.** `major: false`, and `majorReleasesSince("0.6.0")` returns empty, so the mail step never engages. The Email Routing question from `0.5.0` stays open and simply is not exercised by this release

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR, but **the release does**: `0092` is read by the shared site-content loader, and `0093`/`0094` by their own new pages. §3 has the order and names `0092` as the one that takes the site down rather than degrading a feature
- [ ] `--env production --dry-run` run and clean — deferred: Lutan. Reads and deploys are both refused to this session
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. `0092`–`0094` are additive columns and `0095` adds tables, so nothing is rewritten — but four migrations in one apply is the largest batch since the `0.4.0` era
- [x] Apply plan stated — §3, beginning with `--drift production` and deliberately not asserting a count

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.6.0` build in seconds. **This release is fully reversible in the way the last three were not**: `major: false` means no mail is sent, so there is nothing that cannot be unsent. Rollback does not revert `0092`–`0095`, but `0.6.0`'s code reads none of them — they are all new columns and tables — so a rollback over applied migrations is clean in both directions here

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | None found in this PR | — |

Checked across the release rather than in this PR:

- All **nine** feature branches merged since `0.6.0` have a completed plan under `docs/test-plans/` (ten PRs; `recurring-jobs-schema` merged twice, #152 and #155). None reports `Result: fail`; three report `pass with accepted defects`.
- Two were signed off manually by Lutan; two are reasoned `n/a`; **five still carry `manual: pending` items** — `image-magic-bytes`, `loading-animation`, `contact-channels`, `stock-usage` and `system-status`.
- **The `0.6.0` release record was missing** and was written during this release's preparation (`docs/releases/2026-09-26.md`, committed as `7ca9e24`). `0.6.0` had reached production with no record at all. Raised here because it was found by this pre-flight rather than by anything in the previous release, which is the check working late rather than not at all.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The seven notes **and the title**, read as a shelter user would. Lower stakes than the last three — `major: false`, so these words are not emailed — but they are what `/releases` shows. **The title is mine and nobody has reviewed it** | `src/lib/releases.ts`, the `0.6.1` entry |
| 2 | **Production schema before the deploy** — `--drift production`, then apply what it names. `0092` must be on before the deploy or every public page breaks | main checkout, Lutan's terminal |
| 3 | The five feature plans still carrying `manual: pending` | `docs/test-plans/` |
| 4 | Still unanswered from `0.5.0`: whether the shelter admin address was verified under Email Routing. **This release will not tell us**, because it sends no mail | Cloudflare → `lannacare.org` → Email Routing |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — all four items are open and need a person

Manual verification by: pending: Lutan to read the seven notes and the title (item 1) and run `--drift production` before deploying (item 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session, with the items above outstanding

Result: pass
