# Feature test plan — cut-release-0-2-1

## Header

| | |
|---|---|
| Feature | Cut release `0.2.1`: move the three `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-2-1` @ `C:\Development\Animal_Shelter_cut-release-0-2-1` |
| Dev server | not started — `/releases` renders this data and the build compiled the route; the page itself is unchanged |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-09-24 |
| Carries a migration? | no |
| Tested at SHA | `2c95017` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.2.1` entry at the top of `releases` holding the three notes, and `package.json`'s version
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only), `package.json` (version field only). Diff is 13 insertions / 6 deletions. No `src/app/`, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified — **all roles equally**, and only in what `/releases` lists. Unlike `0.1.0` and `0.2.0` this release is `major: false`, so **nobody is emailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploy itself, which needs Lutan's go; (b) PR #79, still open, recording the test-sync rule; (c) the `continue-on-error` question on the `test-plan` CI job, still awaiting Lutan's A/B/C decision and deliberately not bundled into a release cut

**Decisions confirmed in chat by Lutan, 2026-09-24:** version `0.2.1` with `major: false`. `0.2.1` rather than `0.3.0` follows the register's numbering rule — a major release bumps the middle number, anything else the last. The reasoning, agreed in chat: contact archiving is the only one of the three that changes a workflow, and mailing admins about two display refinements would spend the signal the mail carries.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a-adjacent but honest: the worktree was created from `origin/main` at `2c95017` immediately before this work and is 0 commits behind. No sync was needed
- [x] `npm run typecheck` — clean. Run via `node scripts/gates.mjs`, which reports each exit code: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`, in 149s
- [ ] CI green on the PR (runs the same three) — n/a: recorded at push time, before CI has reported

Also run, because satisfying them is this PR's whole purpose — `scripts/deploy.mjs` refuses production while any is wrong:

- [x] Newest release version matches `package.json` — both `0.2.1`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 3 notes and all 3 were moved, the script refusing to proceed on any other count
- [x] `majorReleasesSince("0.2.0")` returns **nothing** — `major: false`, so a deploy over the live `0.2.0` mails no one. Verified rather than assumed, since this is the first release where that matters

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. Done for the release itself: production is at 76 applied, 0 pending
- [ ] `--dry-run` reviewed — n/a: no migration in this PR. `0075` and `0076` were dry-run and applied on 2026-09-24; see Defects #1 for what the dry-run got wrong about `0076`
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: nothing left to apply. Both migrations in this release (`0075`, `0076`) are already on production, applied **before** the cut precisely because `0075`'s feature had already merged

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded under Node's type stripping the way `scripts/deploy.mjs` loads it: version `0.2.1`, `major: false`, date `2026-09-24`, 3 notes, 4 releases total
- [ ] Data persists — reload the page and the change is still there — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has four entries and cannot be empty
- [ ] Invalid input is rejected with a readable message — n/a: no input. The rules that reject bad register data live in `deploy.mjs` and were run in section 2
- [x] Boundary cases checked — **note count**: `unreleased` held 3 and the script refused any other count, so none was dropped or duplicated. **Indentation**: notes sit at two spaces inside `unreleased` and six inside a release entry, re-indented programmatically. **Line endings**: both files are CRLF and are written back as CRLF, so the diff is the change and not the whole file

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees `0.2.1` at the top; **no email**, unlike `0.2.0` | not verified on a deployed build — see section 8 |
| management | `/releases` | sees `0.2.1` at the top | not verified on a deployed build |
| staff | `/releases` | sees `0.2.1` at the top | not verified on a deployed build |
| vet | `/releases` | sees `0.2.1` at the top | not verified on a deployed build |
| volunteer | `/releases` | sees `0.2.1` at the top | not verified on a deployed build |
| signed out | redirected to login | no change | unchanged by this PR — `/releases` returns 307 to login on the live build |

- [ ] Every role above tested — n/a: this PR changes data the page already renders, not who may see it. `/releases`' access rules came in with #62 and are untouched; no policy, route or query changes
- [x] A role that should not have access is blocked server-side — verified against production as it stands: `/releases` signed out returns **307 to login**, not the page

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual's release-notes topic came in with #62 and describes the page, not its contents
- [ ] Translatable strings go through the translation path — n/a: release notes are **English only** by design (#62's decision), so these three are user-facing text that deliberately will not be translated
- [ ] Mobile viewport (375px) — n/a: no layout change. Note the release-notes accordion *is* a layout change, but it shipped in its own PR and is one of the three notes this release publishes, not something this PR does
- [ ] Browser console clean — n/a: no browser involved; the build emitted no new warnings
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route including `/releases` and the `/api/releases/current` handler
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts` has three consumers: `/releases`, `worker/release-mail.mjs` and `scripts/deploy.mjs`. All read it via `latestRelease` / `majorReleasesSince`, both exercised in section 2, and the `majorReleasesSince` result is the one that differs from previous releases
- [x] Nothing merged from `main` during `sync` was broken by this branch — no sync needed; the branch is 0 commits behind `2c95017`, which CI had already passed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut is the one PR that *removes* lines from `unreleased` rather than adding one. The three notes this PR publishes were each written by the PR that made the change — contact archiving, the enclosure open-maintenance filter and the release-notes accordion — which is exactly what the rule is for. Ticking this line would claim `unreleased` gained a line, and the checker would rightly fail it
- [ ] Non-obvious design choices appended to `docs/decisions.md`, dated — n/a: no new decision. The register's design and numbering rule were recorded by #62; this is its third ordinary use, and the first with `major: false`
- [x] `README.md` still accurate — no README claim is affected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `2c95017` plus this branch's commit; `2c95017` is the tip of `main`, 0 behind, and CI passed on it
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed by this PR. **For whoever deploys:** read `deploy.mjs`'s printed SHA and confirm it matches rather than assuming — `main` moved six times during the `0.1.0` release and again between a check and a deploy during `0.2.0`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing to deploy from this PR. **Owed by the release**: the standing rule (2026-09-24) is that a production release also goes to test from the same commit, test first
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed by this PR; belongs to the release deploy
- [ ] Timezone-sensitive behaviour checked on test — n/a: this PR changes no date handling; the date in the entry is a static string
- [ ] Public pages re-checked after a cache purge — n/a: `/releases` is not a public page and no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: no deploy in this PR. Verified clean for the release: no `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` is set in this shell, so nothing would override `.env.deploy.production`
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy in this PR
- [x] Any new secret/env var exists in the production Cloudflare environment — none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR. Worth recording for the release: `0075_contacts_archive.sql` **did** have its consumer already merged (`src/app/management/contacts/` reads `archived_at`), so deploying before applying it would have broken Management → Contacts. It was applied first
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR; run for `0075`/`0076` before applying, with the caveat in Defects #1
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: nothing left to apply; production is at 76 applied, 0 pending

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `npx wrangler rollback --env production` returns the Worker to the `0.2.0` build in seconds and `/api/releases/current` reverts with it. **This is the first release that is fully reversible**: `major: false` means no email is sent, so there is no unsendable side effect, unlike `0.1.0` and `0.2.0`. What rollback still does not revert: `0075` and `0076`, both already applied. `0075` is additive columns and harmless. `0076` creates `shelter_friends` and replaces the `translation_queue` view — also harmless to the older build, which does not read either, but note it is the first migration in a release that rewrote an existing view rather than only adding

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | `apply-migrations.mjs --dry-run` reported `0076_shelter_friends.sql` as **FAILED** — `column c.archived_at does not exist` — when the file is correct. Each file is dry-run inside its own `begin…rollback`, so `0075`'s new column was rolled back before `0076`, which builds `public_shelter_friends` with `where c.archived_at is null`, could see it. A real apply commits `0075` first and both succeeded. The trap is that the honest reading of a red dry-run is "do not apply", and here the correct action was to apply | accepted for this release — diagnosed by reading both files, then applied and verified. The repo already documents the same per-file-transaction caveat for enum migrations; this is a second instance and belongs in CLAUDE.md's migrations section. Not in this PR: a release cut should not carry a docs change to the migration rules |
| 2 | low | `0076` rewrote the existing `translation_queue` view (`create or replace view`) and revoked `anon` on the new base table. Verified after applying: `shelter_friends` refuses `anon` SELECT (401) and `public_shelter_friends` is readable but not writable, so the view is the only way in as intended | fixed / verified — `check-public-views.mjs` passes on production, including the two new rows |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The three release notes and the title, as a shelter user would read them. The notes were written by their own PRs so this is a light read; the title `"Archiving contacts, and a tidier release list"` is mine | `src/lib/releases.ts`, the `0.2.1` entry |
| 2 | That `major: false` is what you want, i.e. that **no admin email** goes out for this release. It is what you asked for in chat and I agree with it, but it is the one choice here with an irreversible consequence if wrong in the other direction — a release that should have been announced and wasn't is silent, whereas one that shouldn't have been is merely noise | `src/lib/releases.ts`, the `0.2.1` entry |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-09-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not mine to tick. The list is **not** empty and the template reserves this tick for the person who looked; the `pending:` signature below is the true state

Manual verification by: pending: Lutan to read the three `0.2.1` notes and the title, and confirm no admin email is intended

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
