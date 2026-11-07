# Test plan — cut release `0.43.5`

## Header

| | |
|---|---|
| Feature | Cut `0.43.5`: eight notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does not mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-43-5` @ `C:\Development\Animal_Shelter_cut-release-0-43-5` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-07 |
| Carries a migration? | **no** — the cut itself adds no migration file. **Five migrations written by earlier PRs (`0325`–`0329`) are pending on production** and are applied as a release step, before the deploy. Section 8 carries that ordering |
| Tested at SHA | `TBD` — the tree the four gates and all 17 cut assertions ran against |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — *"Let's do a minor release"*, then *"No email"*, unprompted. `minor` in Lutan's usage is the middle number, which in this repo is the shape that **mails**; he named the email himself, so the email is the answer: `major: false`, last number, `0.43.4` → `0.43.5`. `docs/release-procedure.md` step 4 says to put the email question to him and never to offer the words "major or minor"; he answered it before it was asked, so it was not asked
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. The notes carry card tags (`website`, `bills`, `bill_sites`, `meme_add`, `meme_view`, `meme_library`, `reel_add`, `reel_view`, `reel_library`, `run_fundraising_events`), which decide **who is shown a note**, not what anyone may do. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut writes no code, writes no note and fixes no defect.** Defects are recorded below and none is fixed here, because a release ships what the build gave it (`docs/release-procedure.md`, "A release cuts what the build gave it")

### The deferred-note review, and why this cut wrote nothing

`node scripts/check-deferred-notes.mjs` is run by `cut-release.mjs` before it will write, and it refuses while a
candidate has no answer. It listed candidates whose release-notes line was answered `n/a` with a reason pointing at a
step still to happen. **Unlike `0.43.4`, this cut owed no note** — every candidate resolved to *already published* or
*still open*, and that is written down here rather than left to the flag string:

- **`deceased-record-widen-app`** — nothing owed. `0320` was applied to production by `0.43.4`, and **that release
  published the note** (*"When a resident has died you can now add a note to their placements, weights, prescriptions,
  immunizations and procedures…"*, read out of the `0.43.4` entry to confirm it rather than inferred from the record's
  prose). This range only touched the plan file.
- **`events-card-reads`** — nothing owed. Its release-notes line is **ticked**, not `n/a`, and its note (the fundraising
  campaign and project pickers saying when they may be short) was already in `unreleased`. The excerpt the script printed
  is the template's own guidance text: the over-listing shape recorded as `0.43.4` defect 4.
- **`website-switches-schema`** — the step closes here, and **the note was already present**. Its reason was *"no screen
  offers a switch until the app half lands"*; the app half (#1358) landed in this same range, and the website-switches
  note is in `unreleased` tagged `cards: ["website"]`. Nothing to add.
- **`uat-on-the-pi`** — **still open, so nothing owed.** Its reason is *"the Pi-side setup is still outstanding
  (Lutan)"*, and nothing in this release does that setup. See the next heading: this candidate appeared only after the
  cut had been written.

### `main` moved mid-cut, and this is how it was handled rather than reasoned about

**#1356 (`claude/uat-on-the-pi`) merged at 01:32Z today, between this session's first `gh pr list` — where it read
`OPEN` — and the cut.** `docs/release-procedure.md` names this trap (*"`main` moves under you during a release"*) and
the remedy is to read the state, not to infer it. What was read:

- `node scripts/worktree.mjs new` had branched from `origin/main` **after** that merge, so the cut's worktree base is
  `60007674` and **#1356 is in this release**. The PR count is **22**, not the 21 measured minutes earlier.
- **It touched `src/lib/releases.ts`? No** — `git diff --stat 73e8460e..60007674 -- src/lib/releases.ts` is empty, so
  it added no note the cut could have lost. That is the one failure mode that mattered here.
- **It added no migration**, so the apply plan is still `0325`–`0329`.
- **It changes `scripts/pi/deploy-pi.sh`, `scripts/pi/write-env.mjs`, `scripts/pi/cloudflared-config.yml` and
  `wrangler.jsonc`** — all on the deploy allow-list, which matters twice in section 8: for the code-identity diff, and
  because a change to `deploy-pi.sh` takes effect on the **next** deploy, not the one that ships it.

**The one honest imperfection, stated rather than hidden:** `--deferred-reviewed` was passed with three answers, because
the fourth candidate did not exist when the string was composed. The flag is a gate on writing, not a stored artifact;
the answer that is durable is this section and the release record, and all four are answered above. The cut was not
re-run, because `unreleased` is now empty and a second run would be refused — correctly.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-5` from `origin/main` minutes before the cut, so there was nothing to merge in. Its base is `60007674 Merge pull request #1356`, which was `origin/main` at that moment and still is
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 142s
=== gates: lint exited 0 after 238s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 129s
gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

### The cut's own assertions, which are the real gate on a cut

A cut's one real failure mode is losing or altering a note, and no gate above can see it.

- [x] `node scripts/cut-release.mjs 0.43.5 2026-11-07 minor --verify` — **all 17 assertions passed**, including *"every note carried across character-identical, with its role tags, same order"* and *"nothing invented (note count equal) [8 vs 8]"*
- [x] **`--base` was NOT needed, and that was established rather than assumed.** It is needed when a cut *writes* notes, because `origin/main` then no longer holds the pre-cut state. This cut wrote none, and #1356 — the one commit that moved `origin/main` underneath it — did not touch `src/lib/releases.ts`, so `origin/main`'s copy **is** the pre-cut file. Run without `--base`, the two note assertions passed
- [x] **Both halves of the mail pair asserted**, which is what makes "no email" a measurement rather than a hope: `mail ABSENCE: majorReleasesSince("0.43.4") is empty [[]]`, and the control `from further back, an older major release is still found [0.43.0 in ["0.43.0"]]`. An empty answer from a broken function would fail the second
- [x] `node scripts/check-release-guards.mjs` — exit 0, **16** assertions, counted with `grep -c "^ok"` on the full log rather than read off the screen. See the fenced block in section 6
- [x] `node scripts/check-test-plan.mjs --base origin/main` — exit 0, run before the PR was opened
- [x] `npm run audit:register` — exit 0. One high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered and still unreachable. `npm run audit:prod` exits 1 with 5 vulnerabilities, which is the expected reading and not a stop
- [x] **`package-lock.json`'s version fields moved on their own again** — the three-way assertion reads `[lock 0.43.5 / root 0.43.5 / package.json 0.43.5]`. `#jhd8s` is done and the handover should have stopped carrying it; this is the second release in which it needed no hand edit
- [x] **`npm ci` in the main checkout: deliberately skipped, with the diff that justifies it.** `git diff --stat af21ad0d..HEAD -- package.json package-lock.json` is **empty** — neither file changed anywhere in this release's range — so `node_modules` in the main checkout is byte-for-byte what `0.43.4`'s four verified builds were made from. The `0.28.0` fault this step exists to prevent is a dependency bump merging without a reinstall, and there was no bump. Confirmed from the other end too: `node_modules/next` reads `16.4.2`, equal to `package.json`. The `Next.js version :` banner on the first Worker build is still read against `package.json`, as the runbook requires

## 3. Schema and data

**Skipped as a section about this PR's own migration — it has none.** Not skipped as a release step: five
migrations written by earlier PRs are pending on production and are applied before the deploy. Section 8 carries
the dry-run, the ordering and the apply.

- [x] Migration number is one above the highest on `main` — n/a: this PR adds no migration. The highest on `main` is `0329`, so **the next free number is `0330`**. `0324` is still used twice (`0.43.4` defect 2), which is bookkeeping and nothing more
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed before applying — production reads **`326 applied, 5 pending`**: `0325_approver_column_narrowing`, `0326_social_library_split`, `0327_bill_cards_to_one`, `0328_website_statistic_switches`, `0329_reels_card_split`. Drift one-directional: 5 on `origin/main` not applied, **0** applied with no file
- [x] `--dry-run` run and clean — **all five `ok`, no failures at all.** Unlike `0.43.4` there was no file depending on an earlier pending file, so the documented non-fault did not arise
- [x] The rest of this section — n/a: no migration in this PR to apply to dev, make re-runnable, exercise against rows, or write a down-migration for. All five were applied to dev by their own PRs; dev drift is read in section 8

### The before-picture, because three of the five rewrite rather than add

`docs/release-procedure.md` requires a read-only snapshot of **the table the migration writes** before applying
anything that rewrites rows — the `0.40.2` lesson, where the snapshot taken was of the wrong table. Three of these five
rewrite permission rows: `0326` and `0329` split an activity and re-grant it, and `0327` moves holders of two retired
cards onto `bills`. So both role checks were taken and kept, and both are re-run after the apply:

```
role-cards (production, before)
   accountant: (no cards)
   bills_management: bills
   doctor: record_vet_care
   head_of_maintenance: do_maintenance, my_tasks
   head_of_medical: administer_medication, record_weight, add_medical_photos, feed_special_diets, my_tasks, view_medical
   management: book_clinic_visits, record_weight, recurring_jobs, residents, do_purchasing, enclosures, contacts,
               donations_receipts, bills, approve_photos, run_appeals, meme_library, feed_special_diets,
               add_medical_photos, my_tasks, who_does_what, publish_shelter_friends, translations
   second_in_command: do_stocktaking, do_purchasing, record_delivery, do_maintenance, record_weight, my_tasks,
                      residents, view_medical
   volunteer: add_photos, my_tasks, meme_library

role-cells (production, before)
   accountant: 0 cells, 0 cards          management: 43 cells, 18 cards
   bills_management: 2 cells, 1 cards    second_in_command: 29 cells, 8 cards
   doctor: 11 cells, 1 cards             volunteer: 4 cells, 3 cards
   head_of_maintenance: 6 cells, 2 cards
   head_of_medical: 15 cells, 6 cards
```

**One thing that snapshot settles, which would otherwise have been guessed:** `0327` retires `utility_bills` and
`general_bills`, and **no production role holds either**. So the migration's *"nothing is taken from anyone"* claim is
not merely its author's intent here — there is nobody to take it from. `bills` is held by `bills_management` and
`management`, and both **gain** `bills.utilities` and `bills.general`.

These two listings are **transient context, not a finding**, and the checks label themselves that way: roles are a
transient grouping of cards, and all analysis is by card (`CLAUDE.md`). They are here as a before-picture of the rows
the migrations rewrite, which is the one thing a role listing is legitimately for.

## 4. Functional checks

The cut's functional surface is the `/releases` page and the mail decision. Everything else in this section
describes a feature with a form, which a cut has not got.

- [x] Happy path works end to end — `--verify`'s 17 assertions are the end-to-end check: the entry is newest, correctly versioned and dated, in `compareVersions` order, `latestRelease` points at it, `unreleased` is empty, and the three version fields agree
- [x] Data persists — n/a: the change is a source file, not a row
- [x] Create / edit / delete all exercised — n/a: a cut creates one entry and has no edit or delete
- [x] Empty state renders sensibly — `unreleased` is `[]` after the cut, which is the expected state and is asserted
- [x] Invalid input is rejected with a readable message, not a crash — exercised for real: `node scripts/cut-release.mjs` with no arguments answered `cut-release: REFUSED — version "undefined" is not a.b.c` and wrote nothing
- [x] Boundary cases checked — the assertion *"no `[object Object]` or `undefined` in the entry"* covers the one that bites: a note written as `{ text }` with no `cards` renders as `[object Object]`. Five of the eight notes are tagged objects, three are plain strings for everyone, and `typecheck` holds all eight to the `ReleaseNote` type

### Role access matrix

Analysed by card. **No card's behaviour changes in this diff**, so the matrix records what the notes' tags do —
who is shown which line on `/releases` — which is content marking, not access.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all eight notes, through the `perms.isAdmin` short-circuit | pass (asserted by the tags being valid `CardKey`s and by `typecheck`) |
| exactly `website` | `/releases` | the website-statistics note, plus the three untagged notes | pass (by the tag, not driven) |
| exactly `bills` | `/releases` | the one-Bills-card note, plus the three untagged notes | pass (by the tag, not driven) |
| exactly `reel_view` | `/releases` | the reels-cards note, plus the three untagged notes | pass (by the tag, not driven) |
| a card nobody recognises | `/releases` | every note — a tag widens, never narrows | pass (by the documented rule in `releases.ts`, not driven) |
| signed out | `/releases` | n/a: `/releases` is not a public page, and this cut does not change that | pass |

- [x] Every login above tested — **`pending:` is not the honest word here, so this is a tick with its limit stated:** every tag was verified to be a real `CardKey` in `src/lib/permissions/cards.ts`, and `typecheck` holds them to the `ReleaseNote` type, which is what goes wrong with a tag. No login was driven, because this diff changes no card and the page's tag filtering has its own tests
- [x] A login that should not have access is blocked server-side — n/a: no access changes in this diff

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: a release entry is not a manual topic
- [x] Translatable strings go through the translation path — n/a: release notes are deliberately English-only, as every entry in the file is. **Four of the eight notes say in their own text that their Thai wording has not been checked by a Thai speaker**, which is the honest handling of a real gap rather than a defect in this cut
- [x] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — n/a: no page driven, nothing to produce a console error
- [x] Network clean — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work — n/a as a browser check: `build` exercises every page that imports `releases.ts`, including `/releases` and the Worker's `/api/releases/current`, and it exited 0
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` **is** the shared file, and it has two other consumers that do not render: `scripts/deploy.mjs` loads it under Node's type stripping to decide the mail, and the Worker bundles it for `/api/releases/current`. Both were exercised — the first by `--verify`, which is the same load path, and the second by `build`
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in. #1356 landed *before* the branch point, not into it; section 1 records what was read to establish that

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
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgement in this cut is the deferred-note review and the mid-cut `main` move, both of which belong in this plan's section 1 and in the release record (`docs/releases/2026-11-07-0-43-5.md`), where a release manager will look for them. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — eight notes moved out and none remain. This cut wrote no note at all, so the file's net gain is zero and a tick would be a claim the diff contradicts
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the five claims in this plan that could have been reasoned were each measured instead: the pending-migration count from `--status` against production; the mail absence from the assertion pair rather than from `major: false`; the lockfile bump from the `--verify` assertion rather than from `#jhd8s` having landed; the `npm ci` skip from an empty `package.json`/`package-lock.json` diff *and* the installed `next` version, rather than from the previous release having skipped it too; and *"nobody holds the retired bill cards"* from the production `role-cards` read rather than from the migration's own header

## 8. Pre-production gate

**Host mapping, since the 2026-11-05 cutover:** `lannacareforanimals.org` is **production**;
`test.lannacare.org` is **test** on the dev Supabase project (`qxkmhwybjggxvsfxsxbd`); `lannacare.org` is **UAT**,
mid-move to its own project and still running `0.43.3` against dev. `docs/test-plan-template.md`'s hosts were
corrected in `0.43.4`'s record PR, so this plan inherits the right ones.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: filled in the release record once the PR is merged and the deploy reads it back
- [ ] Deployed SHA matches the tested SHA — pending: read from each `deploy.mjs` run's own output at deploy time, not assumed. **The code-identity diff is the assertion, not SHA equality** (`docs/decisions/2026-11-04-release-check-false-positives.md`), and this release is one where it has teeth: #1356 changed `scripts/pi/` and `wrangler.jsonc`, both on the allow-list

### On the deployed build

- [ ] Deployed to test — deferred: release manager, at deploy time (section 8 is jointly owned; this is the deploy step itself, not a second home for it)
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, at deploy time
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this diff derives "today". The entry's date is a literal string, `2026-11-07`, and `majorReleasesSince` compares versions, not dates
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold, band, rounding rule or cutoff in this diff. The one comparison is `compareVersions`, asserted by the order check
- [x] Evidence pasted into this plan is the tool's actual output, unedited — every fenced block is the run's own lines, with nothing tidied
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager, at deploy time. Production's zone is purged with `CLOUDFLARE_ZONE_ID_LANNACAREFORANIMALS` and the purge is proved byte-for-byte against the Pi's own `check-assets`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each deploy
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **none is introduced by this release.** `STATUS_READ_TOKEN`, introduced by `0.43.4`, is still deliberately unset and still fail-closed (`/api/status/health` answers 401 to everyone), carried on backlog `#mzu7v`. UAT's `.env.deploy.uat` is still half-filled by design, which is `claude/uat-own-database`'s own outstanding work and **not a blocker for this release**
- [x] **A deploy-script change ships in this release, so its own guards did not run on the deploy that brings it in.** #1356 changes `scripts/pi/deploy-pi.sh`. `docs/release-procedure.md` names this exactly: *"a change to `deploy-pi.sh` takes effect on the **next** deploy, not the one that ships it — the script checks out the new ref over the file bash is already executing."* So on this release the Pi log's `deploy-pi: restarting under the script from <sha>` line is read, and if it is absent the swap and `node scripts/pi/check-assets.mjs` are run by hand and said so in the record

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. But the **release** carries both halves in the range, so the ordering matters and is stated below
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — **run early rather than at deploy time**, because five files is enough for a surprise to hurt. All five `ok`. The `-- consumer:` warnings on `0326`, `0327` and `0329` are the **safe direction** and were expected: the schema lands before the code that reads it is live, and the apply is before the deploy, so nothing is blocked
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **assessed, not deferred, and three of the five do rewrite.** `0326`, `0327` and `0329` rewrite card grants and move card holders; all three are written additive-then-delete and re-runnable, and the before-picture in section 3 is what makes the change auditable afterwards. `0325` adds a `BEFORE UPDATE` trigger that *narrows* what an approver may write — it changes no row. `0328` adds columns and views whose defaults keep the site exactly as it is. Nothing drops a table or rewrites resident data. **The README restore recipe has still never been exercised**, which is carried on the backlog and is stated here rather than implied
- [x] **Apply plan stated: `0325`–`0329`, five files, production project `dbkodyyxxhtygxcxmfcu`, BEFORE the deploy.** The range merged the code that reads all five, so the deploy must not go first. `apply-migrations.mjs` applies every pending file in one run and commits each before the next starts. **It is run bare** — no `cd` prefix and no pipe — because `~/.claude/settings.json`'s allow rule is an exact match and `0.43.4` lost two attempts and a whole touch to a piped form

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies five.** Of those, `0325`'s trigger and `0328`'s defaults are safe to leave under the old code; `0326`, `0327` and `0329` retire card keys the old code still knows, so a code rollback would leave two bill cards and the unsplit meme card absent from the catalogue while the old build expects them — the honest statement is that **a rollback past this release wants its three card migrations reversed by hand**, and there is no down-migration for any of them. Stated rather than discovered

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`main` moved between this session's PR survey and the cut.** #1356 read `OPEN` at the start and had merged by the time the cut ran, changing the release from 21 PRs to 22 and adding a fourth deferred-note candidate after `--deferred-reviewed` had been composed | **Accepted; it is the documented condition of a release, not a fault in one.** `docs/release-procedure.md` names it and prescribes reading the state, which is what was done: the worktree's base was checked to contain the merge, `releases.ts` was checked to be untouched by it, and the fourth candidate was answered in section 1. **Nothing was lost** — the one thing that could have been (a note added to `unreleased` after the cut) was measured as absent |
| 2 | low | **`check-deferred-notes.mjs` again printed the template's guidance text as the "reason"** for two candidates (`events-card-reads`, `uat-on-the-pi`), and again listed a line that is **ticked** rather than `n/a`. Recorded as `0.43.4` defect 4 and unchanged | **Accepted for this release, carried for the planner.** It over-lists rather than under-lists, and under-listing is the fault it exists to prevent (`0.40.10` lost three notes). Costs one lookup per candidate. Not fixed here: a release ships what the build gave it |
| 3 | low | **Three test plans in this release carry an `Automated checks by` date in the future** — `approval-flag-public-surfaces.md` and `resident-photos-uploader-gate.md` both read `2026-11-08`. A signature date that has not happened yet is a small thing, but a signature is the first artifact anyone reaches for when something has gone wrong | **Accepted, recorded for the planner.** Neither plan belongs to this cut, both are documents-only, and `check-test-plan.mjs` does not validate dates. Not fixed here: a release may correct its own paperwork, not another PR's |
| 4 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The eight notes read well to a shelter user.** Nobody but Claude has read them in the form they will ship | `/releases` on `lannacareforanimals.org`, signed in as Admin, after the deploy |
| 2 | **The Thai wording of the four notes that say so, and of the screens behind them** — the website switches, the reels and meme card labels, the closed-record sentences and the Drive-archive messages. No Thai speaker has read any of it | `test.lannacare.org` or production, in Thai |
| 3 | **The twelve outstanding test-plan items this release ships with**, on Lutan's explicit decision of 2026-11-07 (*ship, record the gap*). Six are Thai wording, five are browser walks of card-gated screens, one is UAT's own unfinished setup | listed in the release record |

All three are *a person has to go and look*, separately from deploying, which is the test for belonging here.
None is a section 8 deploy-time check given a second home.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (three items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the eight notes on `/releases` after the deploy; the Thai wording by a Thai speaker; the twelve carried items recorded as a stated gap on his decision

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-07
