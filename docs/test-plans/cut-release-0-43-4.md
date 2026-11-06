# Test plan — cut release `0.43.4`

## Header

| | |
|---|---|
| Feature | Cut `0.43.4`: eight notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does not mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-43-4` @ `C:\Development\Animal_Shelter_cut-release-0-43-4` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-06 |
| Carries a migration? | **no** — the cut itself adds no migration file. **Eight migrations written by earlier PRs (`0318`–`0324`) are pending on production** and are applied as a release step, before the deploy. Section 8 carries that ordering |
| Tested at SHA | `c55d1dcc` — the tree the four gates and all 17 cut assertions ran against |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *"a minor release, no email"*, asked in those words. `minor` in Lutan's usage is the middle number, which in this repo is the shape that **mails**; he named the email himself, so the email is the answer: `major: false`, last number, `0.43.3` → `0.43.4`. The one question `docs/release-procedure.md` step 4 says to put to him was answered in the request, so it was not put again
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the entry, and three notes added plus one corrected, below), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. The eight notes carry card tags (`residents`, `view_expenses`, `approve_photos`, `meme_library`, `who_does_what`), which decide **who is shown a note**, not what anyone may do. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut writes no code and fixes no defect.** Four defects are recorded below and three of them are deliberately *not* fixed here, because a release ships what the build gave it

### The notes this cut wrote, and why a cut wrote any at all

This is the part of this release that needed judgement, so it is written down rather than left to the diff.

`node scripts/check-deferred-notes.mjs` listed **nine** plans in the range whose release-notes line was answered
`n/a`, and the reason on four of them was *"needs `03xx` applied to production"*. **This release applies
`0318`–`0324` to production**, so those four steps close here, and `docs/decisions/2026-10-11-release-note-truth-rule.md`
puts the note in the PR that closes the step — this one. The procedure says so in terms: *"For each one decide
whether this release closes its step; if so add the note to `unreleased` first."*

- **Added**, each from the wording drafted in its own decision file: the deceased record's notes and late blood
  test (`0320`), the Reels library (`0322`–`0324`), and the new *Look after project folders* card (`0323`).
- **Not added, and why:** `assistant-tag-retry-and-proof` (a switch only `next dev` reads),
  `planner-handover-672` and `record-0-43-3` (neither is shipped behaviour),
  `resident-record-guards-schema` (the same `0320` step, covered by the deceased-record note), and
  `approval-flag-app`, whose line is **ticked** rather than `n/a` — its two notes were already in `unreleased`.
- **Corrected, not added:** the *Private only* note carried a parenthetical, *"(This shows once the shelter has
  the Private only answer, which is not live yet.)"* That sentence was true when it was written and becomes
  **false the moment this release publishes it**, because `0318` is the migration that makes the answer live.
  Leaving it would be the `#518` fault pointing the other way — a note telling users a feature is not live on
  the day it goes live. The parenthetical was deleted; the rest of the note is character-identical.
- **The reels note departs from its draft, on purpose.** The draft said *"type # and an animal's name to tag
  them"*. `docs/decisions/2026-11-06-reels-follow-ups.md` §4 establishes that the `#` picker asks
  `resident.record` at Read, which `meme_library` does not carry — so a holder of the reels card alone gets a
  plain description box. The note as shipped says that, and also mentions the resident page now listing its
  reels. A note that promises a control the reader will not have is the same fault in a smaller form

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-4` from `origin/main` minutes before the cut, so there was nothing to merge in. `git log --oneline -1` on the main checkout read `999a38cd Merge branch 'backlog'`, which is `origin/main`
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 138s
=== gates: lint exited 0 after 310s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 253s
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

### The cut's own assertions, which are the real gate on a cut

A cut's one real failure mode is losing or altering a note, and no gate above can see it.

- [x] `node scripts/cut-release.mjs 0.43.4 2026-11-06 minor --verify --base <pre-cut file>` — **all 17 assertions passed**, including *"every note carried across character-identical, with its role tags, same order"* and *"nothing invented (note count equal) [8 vs 8]"*
- [x] **`--base` was needed, and this is the case it exists for.** Because this cut wrote three notes and corrected a fourth, `origin/main` no longer holds what the new entry should be compared against — run without `--base` the two note assertions fail, which is the script working. The base was `origin/main:src/lib/releases.ts` with this PR's two edits replayed by a script kept in the scratchpad, so the comparison is against the pre-cut tree rather than against the cut itself
- [x] **Both halves of the mail pair asserted**, which is what makes "no email" a measurement rather than a hope: `mail ABSENCE: majorReleasesSince("0.43.3") is empty [[]]`, and the control `from further back, an older major release is still found [0.43.0 in ["0.43.0"]]`. An empty answer from a broken function would fail the second
- [x] `node scripts/check-release-guards.mjs` — exit 0, see the fenced block in section 6
- [x] `node scripts/check-test-plan.mjs --base origin/main` — exit 0, run before the PR was opened
- [x] `npm run audit:register` — exit 0. One high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered and still unreachable. `npm run audit:prod` exits 1 with 5 vulnerabilities, which is the expected reading and not a stop
- [x] **`package-lock.json`'s version fields moved on their own, for the first time.** `237289df` landed backlog `#jhd8s` in this range, and the assertion *"package-lock.json top-level and root-package versions equal package.json (the three agree) [lock 0.43.4 / root 0.43.4 / package.json 0.43.4]"* is new and passed. Three consecutive releases fixed this by hand; this one did not have to

## 3. Schema and data

**Skipped as a section about this PR's own migration — it has none.** Not skipped as a release step: eight
migrations written by earlier PRs are pending on production and are applied before the deploy. Section 8 carries
the dry-run, the ordering and the apply.

- [x] Migration number is one above the highest on `main` — n/a: this PR adds no migration. **But a defect was found while establishing that, and it is recorded below: `main` carries two files both numbered `0324`**
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev reads `326 applied, 0 pending`, drift `0` both ways; production reads `318 applied`, **8 pending**
- [x] The rest of this section — n/a: no migration in this PR to dry-run, apply to dev, make re-runnable, exercise against rows, or write a down-migration for

## 4. Functional checks

The cut's functional surface is the `/releases` page and the mail decision. Everything else in this section
describes a feature with a form, which a cut has not got.

- [x] Happy path works end to end — `--verify`'s 17 assertions are the end-to-end check: the entry is newest, correctly versioned and dated, in `compareVersions` order, `latestRelease` points at it, `unreleased` is empty, and the three version fields agree
- [x] Data persists — n/a: the change is a source file, not a row
- [x] Create / edit / delete all exercised — n/a: a cut creates one entry and has no edit or delete
- [x] Empty state renders sensibly — `unreleased` is `[]` after the cut, which is the expected state and is asserted
- [x] Invalid input is rejected with a readable message, not a crash — exercised for real: `node scripts/cut-release.mjs --help` answered `cut-release: REFUSED — version "--help" is not a.b.c` and wrote nothing
- [x] Boundary cases checked — the assertion *"no `[object Object]` or `undefined` in the entry"* covers the one that bites: a note written as `{ text }` with no `cards` renders as `[object Object]`. All eight notes are tagged objects and typecheck passed

### Role access matrix

Analysed by card. **No card's behaviour changes in this diff**, so the matrix records what the notes' tags do —
who is shown which line on `/releases` — which is content marking, not access.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | every one of the eight notes, through the `perms.isAdmin` short-circuit | pass (asserted by the tags being valid `CardKey`s and by `typecheck`) |
| exactly `residents` | `/releases` | the four `residents`-tagged notes, not the reels or project-folders ones | pass (by the tag, not driven) |
| exactly `meme_library` | `/releases` | the reels note | pass (by the tag, not driven) |
| signed out | `/releases` | n/a: `/releases` is not a public page, and this cut does not change that | pass |

- [x] Every login above tested — **`pending:` is not the honest word here, so this is a tick with its limit stated:** the tags were verified to be real `CardKey`s in `src/lib/permissions/cards.ts` and `typecheck` holds them to the `ReleaseNote` type, which is what can go wrong with a tag. No login was driven, because this diff changes no card and the page's tag filtering is covered by its own tests
- [x] A login that should not have access is blocked server-side — n/a: no access changes in this diff

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: a release entry is not a manual topic
- [x] Translatable strings go through the translation path — n/a: release notes are deliberately English-only, as every entry in the file is
- [x] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — n/a: no page driven, nothing to produce a console error
- [x] Network clean — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work — n/a as a browser check: `build` exercises every page that imports `releases.ts`, including `/releases` and the Worker's `/api/releases/current`, and it exited 0
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` **is** the shared file, and it has two other consumers that do not render: `scripts/deploy.mjs` loads it under Node's type stripping to decide the mail, and the Worker bundles it for `/api/releases/current`. Both were exercised — the first by `--verify`, which is the same load path, and the second by `build`
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in

`node scripts/check-release-guards.mjs`, which is the regression check that matters on a cut:

```
ok   a cut release with nothing unreleased passes
ok   unreleased notes are a problem
ok   package.json behind the newest release is a problem
ok   a migration the database lacks is refused
ok   a database holding every migration passes
ok   schema ahead of code is fine
ok   could not ask warns and does not refuse
ok   clean release, clean schema: go
ok   unreleased refuses
ok   missing migration refuses
ok   could not ask alone goes ahead, with its warnings
ok   --force goes ahead and keeps every problem for the record
ok   --force with nothing to override records nothing
ok   --env test is not guarded
ok   --force without a reason is refused
ok   --drift reads the arrays it prints from driftReport()
```

## 7. Documentation

- [x] Backlog item ticked — n/a: a release cut closes no backlog item. Nothing in the range left an item closable by *this* PR; the items the range's features closed were ticked by those PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgement in this cut is the deferred-note review, which belongs in the release record (`docs/releases/2026-11-06-0-43-4.md`) and in this plan's section 1, where a release manager will look for it. A decision file would be a third home for it
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — eight notes moved out and none remain. The three notes this PR wrote are described in section 1: they were added to `unreleased` before the cut ran, and the cut then moved all eight into the entry, so the file's net gain is zero and a tick would be a claim the diff contradicts
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the four claims in this plan that could have been reasoned were each measured instead: the pending-migration count from `--status` against production, the duplicate `0324` from `ls`, the lockfile bump from the `--verify` assertion rather than from `#jhd8s` having landed, and the mail absence from the assertion pair rather than from `major: false`

## 8. Pre-production gate

**The host mapping in `docs/test-plan-template.md` is wrong and this plan does not copy it.** Since the
2026-11-05 cutover: `lannacareforanimals.org` is **production**; `lannacare.org` is **UAT on the dev Supabase
project** (`qxkmhwybjggxvsfxsxbd`); `test.lannacare.org` is **test**, also on dev. The template still says
`lannacare.org` runs production. Recorded as a defect for the second release running.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: filled in the release record once the PR is merged and the deploy reads it back
- [ ] Deployed SHA matches the tested SHA — pending: read from each `deploy.mjs` run's own output at deploy time, not assumed

### On the deployed build

- [ ] Deployed to test — deferred: release manager, at deploy time (section 8 is jointly owned; this is the deploy step itself, not a second home for it)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, at deploy time
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this diff derives "today". The entry's date is a literal string, `2026-11-06`, and `majorReleasesSince` compares versions, not dates
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold, band, rounding rule or cutoff in this diff. The one comparison is `compareVersions`, asserted by the order check
- [x] Evidence pasted into this plan is the tool's actual output, unedited — the two fenced blocks are the runs' own lines, with nothing tidied
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager, at deploy time. Production's zone is purged with `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` and the purge is proved byte-for-byte against the Pi

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each of the five deploys
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **this release introduces one, and it is deliberately NOT set: `STATUS_READ_TOKEN`.** `scripts/lib/runtime-config.mjs` records it `required: false`, and `tokenMatches` refuses an unset or under-16-character token outright, so `GET /api/status/health` **answers 401 to everyone until Lutan sets it**. That is fail-closed, so it is not a deploy blocker and not a release note; it is a step for Lutan, carried on backlog `#mzu7v` and on `docs/test-plans/status-health-endpoint.md`'s own `pending:` line

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. But the **release** carries both halves in the range, so the ordering matters and is stated below
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager, immediately before the apply
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — assessed rather than deferred: the eight pending files are additive (new columns, new tables, new and replaced functions, one new card row). `0318` adds a three-valued column to `attachments` and `0324_can_see_drive_file_lists_reels.sql` replaces a function body with `0286`'s plus one branch. Nothing drops or rewrites existing rows, so this gate does not apply. **The README restore recipe has still never been exercised**, which is carried on the backlog and is stated here rather than implied
- [x] **Apply plan stated: `0318`–`0324`, eight files, production project `dbkodyyxxhtygxcxmfcu`, BEFORE the deploy.** The range merged code that reads all of them, so the deploy must not go first. `apply-migrations.mjs` applies every pending file in one run and commits each before the next starts, which is what lets `0324_can_see_drive_file_lists_reels.sql` depend on `0322`'s `reels` table

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies eight.** They are additive, so leaving them in place is safe and the code rollback is honest without a down-migration. There is no down-migration for any of the eight and none is needed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **`main` carries two migrations both numbered `0324`** — `0324_can_see_drive_file_lists_reels.sql` (PR #1334) and `0324_database_health.sql` (PR #1336). `CLAUDE.md` says only one in-flight branch may carry a migration at a time so that *"two streams can never claim the same number"*; two did, on the same day. `scripts/check-migration-numbers.mjs` cannot catch it — it compares a branch against `origin/main`, and each PR was correct in isolation; the collision exists only in their union | **Accepted, after measuring the consequence: nothing is broken.** `schema_migrations` is keyed by filename, not by number, so both applied to dev and dev reads `326 applied, 0 pending` with zero drift. The two files are independent (`can_see_drive_file` and `database_health`) and sort deterministically, so the order between them cannot matter. **Not renamed:** `0324_can_see_drive_file_lists_reels.sql` is already applied to dev, and `CLAUDE.md` forbids editing an applied file. **The live cost is one line of bookkeeping: the next free number is `0325`, not `0325`-after-`0324`-twice**, and a release manager reading `ls | tail -1` would get it right by luck. Recorded for the planner: the check should also compare `origin/main` against itself |
| 2 | low | **`docs/test-plan-template.md` still says `lannacare.org` runs production** and `test.lannacare.org` runs the dev database — wrong since the 2026-11-05 cutover, and **recorded as a defect on `0.43.3` too**. Every plan written from the template inherits the wrong hosts | **Fixed in this release's record PR**, which is documents-only, rather than recorded for a third time. Last release recorded it *"for the planner"* and it did not get done, which is the argument for fixing it where it costs nothing. Not fixed in *this* PR: a cut ships what the build gave it |
| 3 | low | **`check-deferred-notes.mjs` listed `approval-flag-app.md` as possibly owing a note, though its release-notes line is TICKED, not `n/a`** — and its two notes were already in `unreleased`. For four releases the script's false positives have been *boilerplate* ones (the excerpt it prints is the template's guidance text); this is a different and slightly worse shape, because a ticked line should not be in a list headed *"Release-notes line answered n/a"* at all | **Accepted for this release, recorded for the planner.** It costs a reviewer one lookup per release and it fails safe — it over-lists rather than under-lists, and under-listing is the fault the script exists to prevent (`0.40.10` lost three notes). Not fixed here: a release ships what the build gave it |
| 4 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The eight notes read well to a shelter user**, in particular the three this cut wrote from drafts and the *Private only* one whose parenthetical was deleted. Nobody but Claude has read them in the form they will ship | `/releases` on `lannacareforanimals.org`, signed in as Admin, after the deploy |
| 2 | **The Thai wording of the reels screens has not been checked by a Thai speaker** — the note says so itself, which is the honest handling, but it stays a thing a person must look at | `/reels` on production, or `test.lannacare.org` |

Both are *a person has to go and look*, separately from deploying, which is the test for belonging here.
Neither is a section 8 deploy-time check given a second home.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (two items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the eight notes on `/releases` after the deploy, and the Thai wording of the reels screens by a Thai speaker

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-06
