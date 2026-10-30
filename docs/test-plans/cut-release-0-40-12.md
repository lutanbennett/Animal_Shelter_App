# Feature test plan — cut release `0.40.12`

## Header

| | |
|---|---|
| Feature | Cut release `0.40.12`: add the two notes this release owes, move the seven `unreleased` notes into a new entry, empty `unreleased`, bump `package.json` |
| Backlog item | `docs/backlog.md` → n/a: a release cut is a step in `docs/release-procedure.md`, not a backlog item |
| Branch / worktree | `claude/cut-release-0-40-12` @ `C:\Development\Animal_Shelter_cut-release-0-40-12`, a fresh worktree |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5.5 (production release manager session) / 2026-10-30 |
| Carries a migration? | **no**: this PR is `src/lib/releases.ts`, `package.json` and this plan. The release it cuts carries **seven**, `0282` to `0288`, which belong to their own PRs' plans and are not signed here |
| Tested at SHA | the cut commit on this branch, whose parent is `88bddbcf` (`origin/main` at the cut) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for: Lutan asked for a release and answered **no email**, so `0.40.12` with `major: false`. The question was put as *should this release email you?*, never as major or minor, because his "minor" was the word that started it and it fits both `0.41.0` with mail and `0.40.12` without
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only), `package.json` (version), this plan. No route, no component, no `worker/`, no migration
- [x] Roles affected identified: one of the two added notes is tagged by **card** (`manage_shop_page`); the other is a plain string because prescriptions reach everyone who gives or forecasts medicine, and an untagged line is never filtered out. No note uses the closed `roles:` form. Admin sees every line. **Nobody's access changes in this PR**
- [x] Anything explicitly **out of scope** written down: the seven migrations and their effect on who can record a death (section 8) are the release manager's apply step; the seven `pending:` plans in the release are Lutan's, and he chose in chat to ship with them listed open

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` at `88bddbcf` minutes before the cut and `git status -sb` read no ahead/behind
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Its closing lines, exactly as printed:

```
=== gates: typecheck exited 0 after 48s
=== gates: lint exited 0 after 116s
=== gates: test exited 0 after 17s
=== gates: build exited 0 after 117s
gates: typecheck=0 lint=0 test=0 build=0
```

  Status read from the command itself, not through a pipe.

- [ ] CI green on the PR (runs the same checks) — n/a: not yet, the PR does not exist at this commit
- [x] `node scripts/check-release-guards.mjs`: exit **0**, **16** `ok` lines, exit code read from the command
- [x] **The cut was verified mechanically rather than read over, against a base that is `origin/main` plus exactly the two added notes.** Plain `--verify` against `origin/main` fails two assertions (`every note carried across` and `nothing invented [7 vs 5]`) **because of those two notes and nothing else**, which is the honest result: they are new in this PR. So the base was built mechanically, `origin/main`'s `releases.ts` with the two lines copied out of the cut appended to `unreleased`, and `diff` against `origin/main` shows exactly those two added lines and nothing more. Unedited output of `node scripts/cut-release.mjs 0.40.12 2026-10-30 minor --verify --base <that file>`:

```
ok   new entry is the newest and has the requested version  [0.40.12]
ok   new entry has the requested date  [2026-10-30]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.40.11 -> 0.40.12]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [7 vs 7]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.40.12]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.40.0 in ["0.40.0"]]
all 16 assertions passed
```

- [x] **The mail decision is asserted in both directions**: `majorReleasesSince("0.40.11")` is empty **and** `0.40.0` is still found from further back
- [x] **`npm ci` was not re-run, and the reason was measured**: `git diff d9628a26..HEAD -- package.json package-lock.json` is **empty**, and the main checkout reports `next` `16.4.2`, matching `package.json`
- [x] **`npm run audit:prod` exits 1 with the same single advisory as the last three releases**: `GHSA-5j98-mcp5-4vw2`, `glob` CLI, 4 high, covered by `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md`. Nothing new
- [x] **All 7 deferred-note candidates were reviewed and the judgement is in the cut commit** (`cut-release.mjs --deferred-reviewed`). **Four are owed a note by this release and two notes were added for them**: the prescription schedule (`0283`, `0284`, `0288`; one combined note for three plans) and the Shop page (`0285`). `add-while-recording-retire` still owes nothing (no screen ever drew the card). The two record-a-death plans stay withheld: their step is **Manage medical being assigned**, which applying `0282` does not do
- [x] **The prescription note's claim "existing prescriptions keep the days they had" was measured on production, not taken from dev.** `0283`'s header defers the dose-count-versus-ticks back-fill to a fix list, `scripts/check-prescription-schedule-backfill.mjs`, which was retired in #1108 before ever being run against production. It was recovered from history (`7cee2ebd^`), read (one `select`, no writes) and run with `--env production`: **`OK: every current prescription's dose count matches its ticks.`**, exit 0. So no medicine leaves the medication list or forecast when `0284` switches them onto the ticks

### The ordering boundary

- [x] `0.40.12` sits above `0.40.11` and `0.40.9` under `compareVersions`, asserted by `--verify` (`version is newer than the previous release` and `releases are in compareVersions order`). **And on the rendered page**: on this cut, signed in as Admin and reached by clicking the sidebar's Release notes link, the first six version strings in document order are `0.40.12, 0.40.11, 0.40.10, 0.40.9, 0.40.8, 0.40.7`, with `requestAnimationFrame` firing, so the page was hydrated when read

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: this PR carries no migration. `0282` to `0288` are on `main`; the next free number is `0289`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: this PR carries no migration. The release's: production `282 applied, 7 pending`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: this PR carries no migration. The release's: six `ok`, and `0284` reported `FAILED … missing FROM-clause entry for table "p_prescription"`, which the runner itself attributes to `0283`'s columns being rolled back before `0284` runs. That reading was checked rather than accepted: `p_prescription` is `0284`'s row-typed parameter and `schedule_unit` is a column `0283` adds, and `0284` applied cleanly on dev after `0283`
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: this PR carries no migration. Dev reads `289` rows through `0288`, applied by their own PRs
- [ ] File is re-runnable — n/a: this PR carries no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR carries no migration; `releases.ts` is plain data
- [ ] **Constraints and defaults exercised against real rows** — n/a: this PR carries no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: this PR carries no migration. Reverting the cut is reverting one commit
- [ ] Production apply plan stated for the release manager — n/a: this PR carries no migration. The release's apply plan is in section 8

## 4. Functional checks

- [x] Happy path works end to end: the releases page on this cut, signed in as Admin through `scripts/dev-signin.mjs` and reached by clicking the sidebar link, heads with `0.40.12 · Prescriptions on a schedule, a Shop page, and the Assistant log`, 30 Oct 2026, and contains both added notes
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: a cut has no create, edit or delete surface
- [x] Empty state renders sensibly: `unreleased` is `[]` after the cut, asserted by `--verify`
- [ ] Invalid input is rejected with a readable message — n/a: no input surface. `check-release-guards.mjs` exercises the analogous refusals
- [x] Boundary cases checked: the version boundary in section 2

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the releases page | sees `0.40.12` and all seven notes; Admin is outside the card system | **as expected**: driven signed in as Admin; both added notes present, no `[object Object]` or `undefined` anywhere in the page text |
| a login holding `manage_shop_page` | the releases page | sees the Shop note | not driven: the tag is data, carried character-identical (section 2) |
| a login holding `website` | the releases page | sees the Website → Pages note | not driven: same reason |
| a login holding none of those tags | the releases page | sees the five untagged notes, and the two tagged ones under Show everything | not driven: same reason |
| **a role named anything at all** | the releases page | sees every note whose tag it cannot match, not fewer | covered by `src/lib/release-audience.ts`'s unit tests in the `test` gate |

- [ ] Every role above tested — n/a: this PR changes no access rule and no page code; tagging is data asserted character-identical, and the widen-never-narrow property is covered by unit tests. Rows are by card because a role is a transient grouping of cards

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: a cut adds no feature; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English prose by design
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [x] Browser console clean: `read_console_messages` with `onlyErrors` returned **No console logs** on the releases page
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work: the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page: `releases.ts` feeds the releases page, the release mail and `deploy.mjs`; the first through the build and `--verify`'s `latestRelease`, the mail through the absence-plus-presence pair. `/api/releases/current` is read at deploy time
- [x] No `[object Object]` or `undefined` in the entry, asserted by `--verify`
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the verify-against-a-built-base step is recorded here and in the release record; it is a method for a cut that adds owed notes, not a design choice
- [x] `README.md` still accurate: it quotes no version number
- [ ] **Release notes.** — n/a: a cut's whole purpose is to empty `unreleased`, so the checker cannot see a gained line. The two notes this PR adds were checked for truth against the release: both describe code shipping in this build, on schema applied before the deploy
- [x] Commit messages say why, not just what: the cut commit records the email answer and the deferred-note review
- [x] **Claims were measured, not reasoned**: the skipped `npm ci` by an empty diff; the prescription note by a production query; the advisory by running it; the record-a-death after-picture is a prediction stated in section 8 and checked in the release record

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header; the deployed SHA will be this PR's merge commit, recorded in the release record with a code-identity diff
- [ ] Deployed SHA matches the tested SHA — deferred: superseded by the code-identity diff, read at deploy time

### On the deployed build

- [ ] Deployed to test — deferred: the production release manager, this session, after the production deploy has reported
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing in this PR derives "today". The release's Night round suggestion from 22:00 is covered by `check-shelter-dates` in #1108's plan
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: the production release manager. The release adds a public `/shop` page, which cannot be opened signed out while `PUBLIC_SITE` is `locked`, and shows nothing until an entry is set to shown

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: read at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: the production release manager. 14 on both environments for the last three releases
- [x] Any new secret/env var exists in the production Cloudflare environment: none added by this PR

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No. The release's code that reads `0282`–`0288` is already on `main`, so all seven go **before** either deploy. `0288` is the order-critical one: it drops `prescriptions.frequency_id`, which `0.40.11`'s medication list still reads, so the window between apply and deploy shows an error on the medication list; it is minutes, and it is the reason the deploy follows the apply at once
- [x] **`0282` narrows, and the narrowing reaches people.** It deletes the `record_death` card and gives `placement.death` to `medical_records` (Manage medical). Before the apply, production's `role-cards` shows `record_death` held (today by two roles; transient context) and `medical_records` held (today by one). **Predicted after-picture**: whoever held `record_death` and not `medical_records` loses `placement.death`; whoever holds `medical_records` gains it; no other cell moves. In today's terms that is 41→40, 25→24 and 15→16 cells, the other three roles unchanged. **This is Lutan's decision of 2026-10-29** ("B, fold it into the medical card"), and the release-time consequence, that only Manage medical holders and Admin can record a death until he assigns it, is put to him in chat
- [x] `0287` deletes the `add_while_recording` card, which production's `role-cards` shows **nobody holds**, so it moves no cell
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run: see section 3
- [x] For a **destructive or rewriting** migration only: the before-picture was taken of the tables the migration writes: `role-cells` and `role-cards` from production before the apply, kept for the release record. `0288` drops columns and tables; a production backup is the nightly one
- [x] Apply plan stated: `0282` to `0288` to `dbkodyyxxhtygxcxmfcu` (production), before either deploy, after `git status -sb` reads neither ahead nor behind

### Rollback

- [x] Rollback position stated, **including what it does not cover**: production is served by the Pi, so a code rollback is a Pi rebuild at `d9628a26`. **This release is NOT safely code-reversible once applied**: `0288` drops `prescriptions.frequency_id` and the round-status views that `0.40.11`'s medication list reads, so `0.40.11`'s code against the new schema breaks the medication list. A rollback therefore means fixing forward, or reverting `0288` with a down-migration first

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | none | `audit:prod` exits 1 with `GHSA-5j98-mcp5-4vw2` (`glob` CLI), 4 high | **Accepted, unchanged**, `docs/decisions/2026-10-28-glob-cli-advisory-not-reachable.md` |
| 2 | low | **The backlog branch's last commit (`0196734d`) rewrote every line of `docs/backlog.md` with CRLF**, so the daily fold conflicted on the whole file | **Fixed** on the backlog branch (`4058b25a`, LF restored, content unchanged) before the fold |
| 3 | low | **`check-prescription-schedule-backfill.mjs` was retired before its one production run**, which `docs/decisions/2026-10-30-prescription-schedule-schema.md` asked for "before the app stream ships" | **Run here** from history against production: clean. Recorded so the next reader does not rerun it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The two notes this PR added, and the title**, read as a shelter user would. The title and both notes are mine and nobody has reviewed them | `/releases`, the `0.40.12` entry |
| 2 | **Give Manage medical to whoever should record a death, or decide not to.** After `0282` only its holders and Admin can; the record-a-death note is withheld until then | Settings → Who does what |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5.5 (production release manager session)  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, the two rows above are Lutan's and only the person who looked may tick this

Manual verification by: pending: the two rows in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass with accepted defects
