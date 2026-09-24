# Feature test plan — cut-release-0-2-2

## Header

| | |
|---|---|
| Feature | Cut release `0.2.2`: move the one `unreleased` note into a new register entry, bump `package.json`, and append the release to today's record |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-2-2` @ `C:\Development\Animal_Shelter_cut-release-0-2-2` |
| Dev server | not started — `/releases` and `/manual` render from data and code already on `main`; this PR changes neither |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `a2074e1` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — three files: a `0.2.2` entry holding the one note, `package.json`'s version, and a `0.2.2` section appended to `docs/releases/2026-09-24.md`
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only), `package.json` (version field), `docs/releases/2026-09-24.md`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally**, and only in what `/releases` lists. `major: false`, so **nobody is emailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploy, which needs Lutan's go; (b) the three browser items still outstanding from earlier releases (cache `HIT`, Dev badge, sign-in paths), recorded in the release record rather than closed here; (c) versioning the release-record filename, which Lutan decided against in favour of appending

**Decisions confirmed in chat by Lutan, 2026-09-24:** `0.2.2` with `major: false`; append to today's record rather than create `2026-09-24-v0.2.2.md`. `0.2.2` rather than `0.3.0` follows the register's numbering rule — one refinement to the manual's navigation is not something to mail admins about.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — needed and done. The worktree was created at `c3c430f`, **five commits behind** `origin/main`, so cutting without syncing would have built the release on a stale tip. Synced to `a2074e1`, 0 behind, and the single `unreleased` note was confirmed still present afterwards
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`. Note `lint` now also runs `check-migration-grants.mjs`, which passes
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose — `scripts/deploy.mjs` refuses production while any is wrong:

- [x] Newest release version matches `package.json` — both `0.2.2`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 1 note and the script refused any other count
- [x] `majorReleasesSince("0.2.1")` returns **nothing** — `major: false`, so no admin mail

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Done for the release: production is at **78 applied, 0 pending**
- [ ] `--dry-run` reviewed — n/a: no migration in this PR. `0077` and `0078` were each dry-run clean before being applied on 2026-09-24
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR; dev was already current for both
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing left to apply. Both of this release's migrations are already on production

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: version `0.2.2`, `major: false`, date `2026-09-24`, 1 note, 5 releases total
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has five entries and cannot be empty
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that would reject bad register data live in `deploy.mjs` and were run in section 2
- [x] Boundary cases checked — **note count**: exactly 1, and the script refused any other. **Indentation**: re-indented from two spaces to six programmatically. **Line endings**: both files are CRLF and written back as CRLF, so the diff is 11 lines rather than the whole file. **Stale base**: caught and fixed by the sync above, which is the boundary case that actually mattered here

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.2.2` at the top; **no email** | not verified on a deployed build — see section 8 |
| management | `/releases` | sees `0.2.2` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.2.2` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.2.2` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.2.2` at the top | not verified on a deployed build |
| signed out | redirected to login | no change | unchanged by this PR — `/releases` returns 307 to login on the live build |

- [ ] Every role above tested — n/a: this PR changes data the page already renders, not who may see it. No policy, route or query changes
- [x] A role that should not have access is blocked server-side — verified against production as it stands: `/releases` signed out returns **307 to login**

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this release *contains* a change to how the manual's Contents list behaves, but that shipped in its own PR; this PR only publishes its note
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR. Worth noting the manual change this release publishes is explicitly desktop-only behaviour ("on a computer"), which its own note says
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route including `/releases`, `/manual` and the `/api/releases/current` handler
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read it via `latestRelease` / `majorReleasesSince`, both exercised in section 2
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought five commits in and all three gates pass on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. The note it publishes was written by the PR that made the change. Ticking this would claim `unreleased` gained a line, and the checker would fail it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a as a design decision, but the operational findings are written into the release record instead, where whoever runs the next release will read them: that a release with no runtime change needs no deploy (as `0077` proved), and that the dated-filename convention is now a day log by Lutan's decision
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `a2074e1` plus this branch's commit; `a2074e1` is the tip of `main`, 0 behind, CI green on it
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed by this PR. **For whoever deploys:** read `deploy.mjs`'s printed SHA and confirm it matches. This branch was itself created five commits stale, which is the same class of mistake one level up

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy from this PR. **Owed by the release**, and this release *does* need a deploy: `src/app/manual/TocScroller.tsx` is new, so unlike `0077` the Worker bundle genuinely differs from what is live
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed by this PR
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling; the date in the entry is a static string
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed by this PR. The cache check remains outstanding across four releases and is recorded as such

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR. Verified clean for the release: no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` set in this shell
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. For the release: `0078` is schema ahead of code (nothing reads `prescriptions.updated_at` or `resident_diets.updated_at`), and `0077` needed no code at all
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; run and clean for both before applying
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: both migrations were additive. Flagged anyway: the newest production backup is **2026-09-21** with 2 retained, thinner than the weekly schedule implies
- [ ] Apply plan stated — n/a: nothing left to apply

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.2.1` build in seconds and `/api/releases/current` reverts with it. `major: false` means no email is sent, so as with `0.2.1` this release is **fully reversible** on the Worker side. What rollback does **not** revert: `0077` and `0078`. `0077` is a no-op against existing grants. `0078` leaves two nullable columns and a live trigger the older build neither reads nor is broken by — but the trigger keeps firing on writes to `prescriptions` and `resident_diets` after a rollback, which is the one piece of this release that does not go away

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `worktree.mjs new` created this worktree at `c3c430f`, **five commits behind `origin/main`**, despite branching from `origin/main` by design. Cutting there would have produced a `0.2.2` built on a stale tip — the release would have claimed to contain work it did not | caught by checking the SHA against `origin/main` before editing anything, then `sync`ed to `a2074e1`. Worth watching: if it recurs it is a real bug in `new`'s fetch, but one observation is not enough to call it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The note and the title as a shelter user would read them. The note was written by the PR that made the change; the title is mine | `src/lib/releases.ts`, the `0.2.2` entry |

**Not in this list, because it is already done:** the manual's Contents list — sticky sidebar, own scroll bar, deep-link highlighting — was **verified by Lutan in a browser on 2026-09-24**, before this cut. That is the one customer-facing change in the release, it is browser-only, and no check available to this session could reach it. It is the first release whose user-visible change was checked by a person before shipping.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not mine to tick. The list is **not** empty and the template reserves this tick for the person who looked; the `pending:` signature below is the true state

Manual verification by: pending: Lutan to read the one `0.2.2` note and the title. The feature itself he has already tested, recorded above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
