# Feature test plan — cut-release-0-3-0

## Header

| | |
|---|---|
| Feature | Cut release `0.3.0`: move the four `unreleased` notes into a new register entry, bump `package.json`, and append the release to today's record |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-3-0` @ `C:\Development\Animal_Shelter_cut-release-0-3-0` |
| Dev server | not started — this PR changes register data and documentation, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `a49abc8` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — three files: a `0.3.0` entry holding the four notes, `package.json`'s version, and a `0.3.0` section appended to `docs/releases/2026-09-24.md`
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only), `package.json` (version field), `docs/releases/2026-09-24.md`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — **all roles equally** in what `/releases` lists. `major: true`, so admins with a verified email **are** mailed on deploy. No role gains or loses access from this PR
- [x] Anything explicitly **out of scope** written down — (a) the deploy, which needs Lutan's go; (b) the two browser items still outstanding (Dev badge, sign-in paths), recorded rather than closed; (c) the social-icon footer that would consume `0080`'s columns, which is not built

**Decisions confirmed in chat by Lutan, 2026-09-24:** `0.3.0` with `major: true`, so admins are mailed. `0.3.0` rather than `0.2.3` follows the register's numbering rule — a major release bumps the middle number. The case for major, which he agreed: two of the four notes are **new public-facing capabilities**, and one of them changes what an anonymous visitor sees when they scan a kennel.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and **verified rather than assumed**: the worktree was checked against `origin/main` before any edit and was at `a49abc8`, 0 behind. This check exists because the `0.2.2` worktree came up five commits stale
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`, including `check-migration-grants.mjs`
- [x] `npm run build` — succeeds: `build=0`, in 311s
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose:

- [x] Newest release version matches `package.json` — both `0.3.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 4 notes and the script refused any other count
- [x] `majorReleasesSince("0.2.2")` returns **`0.3.0`** — so the deploy mails admins about this release and no other. Verified deliberately, since the previous two releases were `major: false` and this is the first mail since `0.2.0`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Done for the release: production is at **80 applied, 0 pending**
- [ ] `--dry-run` reviewed — n/a: no migration in this PR. `0080_social_urls.sql` was dry-run clean before being applied on 2026-09-24; `0079_public_enclosures.sql` was already in
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR; dev was already current for both
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing left to apply

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: version `0.3.0`, `major: true`, date `2026-09-24`, 4 notes, 6 releases total
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has six entries and cannot be empty
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in section 2
- [x] Boundary cases checked — **note count**: exactly 4, script refused any other. **Indentation**: re-indented two spaces to six programmatically. **Line endings**: CRLF preserved, so the diff is 14 lines not the whole file. **`major: true`**: the case that matters here, because it is the one with an irreversible consequence — checked that `majorReleasesSince` returns exactly one version, so admins are mailed once about `0.3.0` and not about the two `major: false` releases behind it

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases`, **and is emailed** | sees `0.3.0` at the top; receives the release mail | mail outcome recorded at deploy; page not verified on a deployed build |
| management | `/releases` | sees `0.3.0` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.3.0` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.3.0` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.3.0` at the top | not verified on a deployed build |
| signed out | redirected to login | no change from this PR | `/releases` returns 307 to login on the live build |

- [ ] Every role above tested — n/a: this PR changes data the page already renders, not who may see it. **The release it publishes does change anonymous access** — the public kennel page — but that shipped in #107 with its own plan, and the database side is verified below
- [x] A role that should not have access is blocked server-side — verified against production: `/releases` signed out returns **307**, and the new public surface from `0079` is read-only to `anon` — `public_enclosures` allows SELECT and refuses PATCH and DELETE, one of 28 passing checks

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change in this PR. The release contains one (Settings → Frequencies) from #108's own PR
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: this PR publishes notes; the manual changes rode with the features
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR. Note one of the notes is *about* phone layout, from #101's own work
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route, including the new public enclosure page and the Shelter Friends pages
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read it via `latestRelease` / `majorReleasesSince`, both exercised in section 2, and `majorReleasesSince` is the one whose result differs from the last two releases
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; 0 behind `a49abc8`, which CI had already passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* lines from `unreleased` rather than adding one. All four notes were written by the PRs that made each change. Ticking this would claim `unreleased` gained a line, and the checker would fail it
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a as a design decision, but one substantive finding is recorded in the release record instead, where the next release manager will read it: **why the edge cache can be working and `1102` still occur**. `worker/index.mjs` only caches GETs of public pages with no auth cookie, so every signed-in staff page bypasses the cache and renders in the Worker at 30–40 ms against a 10 ms budget. The cache is not failing and was never going to fix that; the Pi origin is
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `a49abc8` plus this branch's commit; the tip of `main`, 0 behind, CI green on it
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed by this PR. **For whoever deploys:** read `deploy.mjs`'s printed SHA and confirm it matches

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy from this PR. **Owed by the release**, and this release genuinely needs it: 47 files and ~2,990 insertions of runtime code changed since the deployed `0.2.2` build
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed by this PR
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date handling in this PR
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed by this PR. Worth noting for the release: **it does change one**, the kennel QR destination, and public GETs are edge-cached for 10 minutes per data centre, so a visitor may see the old sign-in redirect briefly after the deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy in this PR. Verified clean for the release: no `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` set in this shell
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR. The release-mail path's requirements are already live and were exercised on `0.1.0` and `0.2.0`

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. **For the release, checked specifically because it looked like a trap and was not**: four merged files reference `facebook_url`, but all read it from `shelter_friends` (from `0076`), not the `site_content` columns `0080` adds, and `SITE_CONTENT_COLUMNS` does not list them. `0080` is schema ahead of code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; run and clean for `0080` before it was applied
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: `0079` and `0080` are both additive. Flagged anyway: the newest production backup is **2026-09-21**, now three days old, with 2 retained
- [ ] Apply plan stated — n/a: nothing left to apply; production is at 80 applied, 0 pending

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.2.2` build in seconds and `/api/releases/current` reverts with it. **This release is NOT fully reversible**, unlike `0.2.1` and `0.2.2`: `major: true` means admins are mailed once the deploy succeeds, and a rollback cannot unsend that — they would hold notes for a release no longer live. Nor does rollback revert `0079` or `0080`; both are additive and the older build reads neither, but `public_enclosures` would remain a readable view with no page in front of it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The release record still described the edge cache as never verified "across four releases", which stopped being true when Lutan tested it. A record that keeps advertising a closed gap is as misleading as one that hides an open one | fixed in this PR — both cache lines are now ticked and attributed to his test, and the `0.3.0` section explains why `1102` persists anyway |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The four notes and the title as a shelter user would read them. The notes were written by their own PRs; the title is mine. Worth more than a glance this time — `major: true` means these exact words are emailed to admins, so the notes are the release for anyone who does not open the site | `src/lib/releases.ts`, the `0.3.0` entry |
| 2 | That mailing admins is intended for this release. Confirmed in chat, restated here because it is the one step a rollback cannot undo | `src/lib/releases.ts`, `major: true` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not mine to tick. The list is **not** empty and the template reserves this tick for the person who looked; the `pending:` signature below is the true state

Manual verification by: pending: Lutan to read the four `0.3.0` notes and the title, which are emailed verbatim to admins on this release, and to confirm the mail is intended

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: pending  Date: pending
