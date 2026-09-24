# Feature test plan — cut-release-0-2-0

## Header

| | |
|---|---|
| Feature | Cut release `0.2.0`: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-2-0` @ `C:\Development\Animal_Shelter_cut-release-0-2-0` |
| Dev server | not started — `/releases` renders this data and the build compiled the route; the page itself is unchanged |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `347e47c` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.2.0` entry at the top of `releases` holding the seven notes, and `package.json`'s version. No logic, no schema, no routes
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only), `package.json` (version field only). Diff is 17 insertions / 10 deletions across the two
- [x] Roles affected identified — **all roles equally**, and only in what `/releases` lists. `major: true` additionally means admins with a verified email are mailed on deploy; no role gains or loses access
- [x] Anything explicitly **out of scope** written down — (a) the deploy itself, which needs Lutan's go and is a separate act; (b) PR #79, still open, which records the test-sync rule and is not needed for this release; (c) verifying `lannacareforanimals@gmail.com` as a Cloudflare destination, which is why the last release mail skipped it and will skip it again

**Decisions confirmed in chat by Lutan, 2026-09-24:** version `0.2.0` with `major: true` and release mail enabled. `0.2.0` rather than `0.1.1` follows the register's numbering rule — a major release bumps the middle number. Lutan's stated reason for major: the seven notes include changes people act on, notably the intake capacity warning and the Cashflow CSV.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a-adjacent but honest: the worktree was created from `origin/main` at `347e47c` immediately before this work and is 0 commits behind. No sync was needed
- [x] `npm run typecheck` — clean (exit 0)
- [x] `npm run lint` — clean (exit 0)
- [x] `npm run build` — succeeds (exit 0). Exit codes captured to file, not read after a pipe
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose — `scripts/deploy.mjs` refuses production while any is wrong:

- [x] Newest release version matches `package.json` — both `0.2.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 7 notes and all 7 were moved, verified by count before and after
- [x] `majorReleasesSince("0.1.0")` returns `0.2.0` — so a deploy over the live `0.1.0` mails admins about this release and no other

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Done for the release itself: production is at 74 applied, 0 pending
- [ ] `--dry-run` reviewed — n/a: no migration in this PR. `0074_vet_doctor_name.sql` was dry-run clean and applied to production on 2026-09-24, ahead of #83's code
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing left to apply. Both migrations in this release (`0073`, `0074`) are already on production

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded under Node's type stripping the way `scripts/deploy.mjs` loads it: version `0.2.0`, `major: true`, date `2026-09-24`, 7 notes, 3 releases total
- [ ] Data persists — reload the page and the change is still there — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has three entries and cannot be empty
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in section 2
- [x] Boundary cases checked — two worth recording. **Note count**: `unreleased` held 7 and the script refused to proceed unless it found exactly 7, so none was dropped or duplicated. **Indentation**: notes sit at two spaces inside `unreleased` and six inside a release entry, and were re-indented programmatically rather than by hand

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, and is mailed on deploy | sees `0.2.0` at the top | not verified on a deployed build — see section 8 |
| management | `/releases` | sees `0.2.0` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.2.0` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.2.0` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.2.0` at the top | not verified on a deployed build |
| signed out | redirected to login | no change | unchanged by this PR — `/releases` returns 307 to login on the live build |

- [ ] Every role above tested — n/a: this PR changes data the page already renders, not who may see it. `/releases`' access rules came in with #62 and are untouched; no policy, route or query changes
- [x] A role that should not have access is blocked server-side — verified against production as it stands: `/releases` signed out returns **307 to login**, not the page

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual's release-notes topic came in with #62 and describes the page, not its contents
- [ ] Translatable strings go through the translation path — n/a: release notes are **English only** by design (#62's decision), so these seven are user-facing text that deliberately will not be translated
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled every route including `/releases` and the `/api/releases/current` handler
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read it via `latestRelease` / `majorReleasesSince`, both exercised in section 2
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; the branch is 0 commits behind `347e47c`, which CI had already passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a as a *design* choice, but one operational finding is worth recording and is not: `src/lib/releases.ts` and `package.json` are **CRLF** on disk, so string anchors using `\n` silently fail to match and a naive rewrite converts the whole file, burying the real edit in a whole-file diff. The cut script detects and preserves the existing line endings. Raised for README's Windows notes rather than decisions.md, since it is a tooling trap not a decision
- [x] `README.md` still accurate — no README claim is affected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `347e47c` plus this branch's commit; `347e47c` is the tip of `main`, 0 behind, and CI passed on it
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed by this PR. **For whoever deploys:** read `deploy.mjs`'s printed SHA and confirm it matches, rather than assuming — `main` moved six times during the `0.1.0` release

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy from this PR. **Owed by the release** though: Lutan's standing rule (2026-09-24) is that a production release also goes to test from the same commit. Test currently runs `a847206` reporting `0.1.0`; it needs this commit too
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed by this PR; this belongs to the release deploy
- [ ] Timezone-sensitive behaviour checked on test — n/a: this PR changes no date handling. The date in the entry is a static string
- [ ] Public pages re-checked after a cache purge — n/a: `/releases` is not a public page and no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy in this PR. Verified clean for the release: no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is set in the shell, so nothing would override `.env.deploy.production`
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added. The release-mail path's requirements are already live on the production Worker: `RELEASE_MAIL` binding, `RELEASE_MAIL_ENV: "UAT"`, `RELEASE_MAIL_FROM: releases@lannacare.org`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. Worth noting for the release: `0074` and its consumer #83 arrived separately and in the right order — schema applied to production first, feature merged after
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; done for `0074` before it was applied
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration in this PR. Flagged anyway: the newest production backup is **2026-09-21** with only 2 retained, so the safety net is thinner than the weekly schedule implies
- [ ] Apply plan stated — n/a: nothing left to apply; production is at 74 applied, 0 pending

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.1.0` build in seconds and `/api/releases/current` reverts with it. **What it does not undo: the release email.** `major: true` mails admins once the deploy succeeds, so a rollback afterwards leaves them holding notes for a release that is no longer live. Nor does it revert `0073` or `0074`, both already applied — harmless, since `0074` is an additive nullable column and the older build simply ignores it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `src/lib/releases.ts` and `package.json` are CRLF on disk. Two attempts to cut the release failed with "unreleased opening not found" because the anchors used `\n`, and a naive rewrite would have converted the whole file to LF — turning a 17-line diff into a whole-file one and hiding the actual change | fixed — the cut script detects the existing line endings and writes them back; the diff is 2 files / 17 insertions / 10 deletions as intended. Worth a line in README's Windows notes, which is not in this PR |
| 2 | low | `lannacareforanimals@gmail.com` is still not a verified Cloudflare destination address, so it was skipped on the `0.1.0` mail with `E_RECIPIENT_NOT_ALLOWED` and will be skipped again. It is the shelter's own account | accepted — Lutan's call in chat that it can be sorted later, as nobody is using the app yet and destination addresses are per-zone so the work likely has to be redone on `lannacareforanimals.org` at the cutover anyway |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The seven release notes as a shelter user would read them, and the title. Unlike `0.1.0` these were written by the PRs that made each change rather than reconstructed, so this is a lighter read — but the title is mine and the ordering is whatever order the notes were appended in | `src/lib/releases.ts`, the `0.2.0` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not mine to tick. The list is **not** empty and the template reserves this tick for the person who looked; the `pending:` signature below is the true state

Manual verification by: pending: Lutan to read the seven `0.2.0` notes and the title as a shelter user would

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
