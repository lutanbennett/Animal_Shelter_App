# Test plan — cut release `0.43.6`

## Header

| | |
|---|---|
| Feature | Cut `0.43.6`: eleven notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does not mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-43-6` @ `C:\Development\Animal_Shelter_cut-release-0-43-6`, port `3010` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-08 |
| Carries a migration? | **no** — the cut itself adds no migration file. **Eight migrations written by earlier PRs (`0330`–`0337`) are pending on production** and are applied as a release step, before the deploy. Section 8 carries that ordering |
| Tested at SHA | `fe699667` — the tree the four gates and all 17 cut assertions ran against. The commit that adds this plan is the only thing after it, so the tested tree and the PR head differ by one markdown file and nothing else |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — *"Let's do a minor release"*, then *"No email"*, **unprompted and before the question was put**. `minor` in Lutan's usage is the middle number, which in this repo is the shape that **mails**; he named the email himself, so the email is the answer: `major: false`, last number, `0.43.5` → `0.43.6`. `docs/release-procedure.md` step 4 requires the email question and forbids offering the words "major or minor"; he answered it first, so it was not asked
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry **and one added note**), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. The notes carry card tags (`add_photos`, `approve_photos`, `contacts`, `publish_shelter_friends`, `meme_library`, `meme_add`, `website`, `website_photos`, `reel_view`, `reel_add`, `bills`), which decide **who is shown a note**, not what anyone may do. One note is `admin: true`. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut fixes no defect and writes no code.** Defects are recorded below and none is fixed here, because a release ships what the build gave it (`docs/release-procedure.md`, "A release cuts what the build gave it"). The one thing it *does* write is a release note it owed, which step 4 requires of a cut

### The deferred-note review: one note was owed, and it was added

`cut-release.mjs` runs `check-deferred-notes.mjs` before it will write a byte, and refuses while a
candidate has no answer. **Thirteen** candidates were listed — every PR in the range whose
release-notes line said `n/a` with a reason pointing at a step still to happen. Answering them is the
cut's one piece of judgement, so it is written here rather than left in a flag string:

- **`reels-readonly-drive` — OWED, and added.** Its reason was *"reels are not on production
  (`0325`–`0329` are pending there), so no user could notice; the link fix is for a login that cannot
  reach production reels yet"*. **`0.43.5` applied all five**, so reels are live on production and a
  login holding a reel card can now actually meet the dead *Meme library* link that #1364 fixed. The
  note went into `unreleased` **before** the cut ran, which is the order step 4 prescribes.
- **2 closed in an earlier release, note already published** — `deceased-record-widen-app` (`0320`
  reached production in `0.43.4`) and `website-switches-schema`. **Confirmed by reading the published
  entry in `releases.ts`**, not inferred from a record's prose.
- **2 carry their note in this very cut** — `events-card-reads` (the fundraising event's name) and
  `general-bills-screen` (the Other bills page).
- **4 still genuinely open** — `suppliers-schema` (the app half has not landed), `uat-colour`,
  `uat-finalise`, `uat-on-the-pi` (UAT is not deployed, so nothing is live for anyone to see).
- **4 owe nothing at all** — `page-level-required` (compile-time only) and `assistant-tag-retry`,
  `expenses-gap-wording`, `planner-handover-690` (documents; nothing served, imported or rendered).

**Six of the thirteen were the script printing the template's own guidance text instead of the plan's
reason** — `assistant-tag-retry`, `events-card-reads`, `expenses-gap-wording`, `general-bills-screen`,
`planner-handover-690`, `uat-on-the-pi`. Recorded as a defect on each of the last three releases and
still unfixed. It over-lists rather than under-lists, which is the right way round, and it costs one
lookup per candidate.

### `main` did not move under this cut, and that was read rather than assumed

`0.43.5` lost time to #1356 merging mid-cut. This time `gh pr list --state open` was **empty** before
the cut, `main` and `origin/main` agreed at `d4e67429` immediately before the worktree was created, and
the worktree branched from that. The backlog branch's one outstanding commit (`d4e67429`) was folded
into `main` **before** the branch point, so it is in this release rather than arriving underneath it.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-6` from `origin/main` minutes before the cut, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`:

```
=== gates: typecheck exited 0 after 114s
=== gates: lint exited 0 after 195s
=== gates: test exited 0 after 29s
=== gates: build exited 0 after 153s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers read, not three: `lint` ends `0 errors, 84 warnings`, and warnings do not fail it.

- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

### The cut's own assertions, which are the real gate on a cut

A cut's one real failure mode is losing or altering a note, and no gate above can see it.

- [x] `node scripts/cut-release.mjs 0.43.6 2026-11-08 minor --verify --base <intended base>` — **all 17 assertions passed**, including *"every note carried across character-identical, with its role tags, same order"* and *"nothing invented (note count equal) [11 vs 11]"*
- [x] **`--base` WAS needed here, and why is recorded rather than worked around.** This cut **adds a note**, so `origin/main`'s `unreleased` is no longer the pre-cut state: run plainly, the two note assertions fail with `[11 vs 10]` and 15 of 17 pass. Waving them past would discard the only check that can catch a lost or altered note, so the intended base was built explicitly — `git show origin/main:src/lib/releases.ts` with the one added note inserted into its `unreleased` — and the cut verified against that file. The property asserted is then the real one: of the eleven notes that belong in the entry, each is character-identical and in order, and nothing was invented
- [x] **Both halves of the mail pair asserted**, which is what makes "no email" a measurement rather than a hope: `mail ABSENCE: majorReleasesSince(previous) is empty [[]]`, and the control `from further back, an older major release is still found [0.43.0 in ["0.43.0"]]`. An empty answer from a broken function would fail the second
- [x] `node scripts/check-release-guards.mjs` — exit 0. It also runs inside `npm run lint`, so the `lint` gate above covers it a second time. See the fenced block in section 6
- [x] `node scripts/check-test-plan.mjs --base origin/main` — see section 7; run the way CI runs it, before the PR was opened
- [x] `npm run audit:register` — **exit 0**. One high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered with a dated reason and a decision file, and still unreachable. `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high), which is the expected reading and not a stop
- [x] **This PR's own diff makes CI's `audit` job run for real.** `check-docs-only.mjs` appends `deps-changed=` and the cut bumps `package.json` and `package-lock.json`, so `audit` is **not** skipped here. On a docs-only PR it shows `skipped`, which is not a pass
- [x] **`package-lock.json`'s version fields moved on their own** — the three-way assertion reads `[lock 0.43.6 / root 0.43.6 / package.json 0.43.6]`. Third release running with no hand edit; `#jhd8s` is done
- [x] **`npm ci` in the main checkout: run, exit 0 — and separately justified.** `git diff --stat 9fd7ee3e..HEAD -- package.json package-lock.json` is **empty**, so no dependency moved anywhere in this release's range, and `node_modules/next` reads `16.4.2`, equal to `package.json`. The `0.28.0` fault this step exists to prevent (a bump merging with no reinstall) could not have occurred; it was run anyway rather than reasoned away. The `Next.js version :` banner is still read against `package.json` on the first Worker build

## 3. Schema and data

**Skipped as a section about this PR's own migration — it has none.** Not skipped as a release step:
eight migrations written by earlier PRs are pending on production and are applied before the deploy.

- [x] Migration number is one above the highest on `main` — n/a: this PR adds no migration. The highest on `main` is `0337`, so **the next free number is `0338`**
- [x] `node scripts/apply-migrations.mjs --env production --status` reviewed before applying — production reads **`331 applied, 8 pending`**: `0330_reel_resident_tags`, `0331_baseline_stamp_number_only`, `0332_pending_photos_enclosure_nullable`, `0333_contact_type_partner`, `0334_waiting_event_titles`, `0335_suppliers`, `0336_shelter_friends_supplier_subject`, `0337_supplier_history_rekey`. Drift one-directional: 8 on `origin/main` not applied, **0** applied with no file
- [x] `--dry-run` run, and its two failures are the documented non-fault — six `ok`; `0336` and `0337` returned `FAILED: relation "suppliers" does not exist`, because `0335` creates that table in the same pending run and the dry-run rolls each file back before the next starts. `CLAUDE.md` names this, and **the trap is that a red dry-run normally means "do not apply" while here the correct action is to apply.** The script printed the reasoning itself, naming the six files each one runs cleanly after
- [x] The rest of this section — n/a: no migration in this PR to apply to dev, make re-runnable, exercise against rows, or write a down-migration for. All eight were applied to dev by their own PRs; dev drift is read in section 8

### The before-picture, and why it is a different picture from `0.43.5`'s

`docs/release-procedure.md` requires a read-only snapshot of **the table the migration writes** before
applying anything that rewrites rather than adds. `0.43.5` needed `role-cards` and `role-cells` because
three of its five migrations rewrote card grants. **None of these eight does**, and that was established
by reading each file rather than by assuming the pattern repeats:

| File | What it does to existing rows |
|---|---|
| `0330_reel_resident_tags` | adds a view and a function. Nothing |
| `0331_baseline_stamp_number_only` | `create or replace` on one trigger function. Nothing |
| `0332_pending_photos_enclosure_nullable` | drops one `not null`. Nothing |
| `0333_contact_type_partner` | adds one enum value. Nothing |
| `0334_waiting_event_titles` | adds one `security definer` function. Nothing |
| `0335_suppliers` | creates `suppliers` and fills it once from Vendor contacts. Adds rows to a new table; changes none |
| `0336_shelter_friends_supplier_subject` | makes `contact_id` nullable, adds `supplier_id` beside it. Existing rows keep `contact_id` and are untouched |
| `0337_supplier_history_rekey` | adds `supplier_id` to two stock tables and fills it from the `supplier_contact_id` already there. **Additive back-fill into a new column**; the old columns stay and keep working |

**Nothing is dropped and no existing row is rewritten.** So the picture worth taking is of what these
files *do* touch — **policies and the activity catalogue** — because `0335` and `0336` create tables
with their own policies, and `0335`'s header makes a checkable claim: *"NO NEW ACTIVITY AND NO NEW CARD,
on purpose."*

```
schema-version (production, before)
   331 migrations applied; the latest is 0329_reels_card_split.sql.

card-grants-applied (production, before)
   Every held card is fully applied wherever it is held.

activities-grantable (production, before) — exit 1, ten activities, each
   "no card grants it, so only Admin can ever do it":
   appeal.medical_photo, maintenance.delete, photos.resident_publish,
   placement.death_withdraw, projects.photos, projects.publish,
   reference.types, stock.correct, stock.usage, system.status

table-policy-commands (production, before)
   72 table/command pairs with no live policy (the service-role and Admin-only tables)
```

These are **the state production was already in**, taken so that the same four checks after the apply
say whether this release moved any of them. The card checks are the card-shaped form the project
requires: `card-grants-applied` asks *does any card grant nothing wherever it is held*, which is the
invariant, and it reads clean.

**One thing the before-picture cannot be: a row count of what `0335` back-fills.** No read-only check
covers `contacts`, `suppliers`, `shelter_friends`, `stock_receipts` or `stock_deliveries`, and ad-hoc
production SQL is refused. So the back-fill's **size** is unmeasured in both directions — stated here
rather than estimated. What *is* measured is that it applied, that drift is clean afterwards, and that
the new tables' policies answer for somebody (section 8).

## 4. Functional checks

The cut's functional surface is the `/releases` page and the mail decision.

- [x] Happy path works end to end — `--verify`'s 17 assertions are the end-to-end check: the entry is newest, correctly versioned and dated, in `compareVersions` order, `latestRelease` points at it, `unreleased` is empty, and the three version fields agree
- [x] Data persists — n/a: the change is a source file, not a row
- [x] Create / edit / delete all exercised — n/a: a cut creates one entry and has no edit or delete
- [x] Empty state renders sensibly — `unreleased` is `[]` after the cut, which is the expected state and is asserted
- [x] Invalid input is rejected with a readable message, not a crash — exercised for real: `node scripts/cut-release.mjs` with no arguments answered `cut-release: REFUSED — version "undefined" is not a.b.c` and wrote nothing
- [x] Boundary cases checked — the assertion *"no `[object Object]` or `undefined` in the entry"* covers the one that bites: a note written as `{ text }` with no `cards` renders as `[object Object]`. Ten of the eleven notes are tagged objects (nine by card, one `admin: true`), one is a plain string for everyone, and `typecheck` holds all eleven to the `ReleaseNote` type

### Release-note access matrix

Analysed by card. **No card's behaviour changes in this diff**, so this records what the notes' tags do —
who is shown which line on `/releases` — which is content marking, not access.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all eleven notes, through the `perms.isAdmin` short-circuit, including the `admin: true` Recent-changes note | pass (asserted by the tags being valid `CardKey`s and by `typecheck`) |
| exactly `add_photos` | `/releases` | the two Add-photos notes, plus any untagged note | pass (by the tag, not driven) |
| exactly `bills` | `/releases` | the Other-bills note, plus any untagged note | pass (by the tag, not driven) |
| exactly `reel_view` | `/releases` | the two reels notes — the tag count and the Meme library link | pass (by the tag, not driven) |
| a login with no `admin` card | `/releases` | **not** shown the `admin: true` Recent-changes note. Admin holds no card, so no card tag could express it | pass (by the documented `admin: true` rule, not driven) |
| a card nobody recognises | `/releases` | every note — a tag widens, never narrows | pass (by the documented rule in `releases.ts`, not driven) |
| signed out | `/releases` | n/a: `/releases` is not a public page, and this cut does not change that | pass |

- [x] Every login above tested — **`pending:` is not the honest word here, so this is a tick with its limit stated:** every tag was verified to be a real `CardKey`, and `typecheck` holds them to the `ReleaseNote` type, which is what goes wrong with a tag. No login was driven, because this diff changes no card and the page's tag filtering has its own tests
- [x] A login that should not have access is blocked server-side — n/a: no access changes in this diff

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: a release entry is not a manual topic
- [x] Translatable strings go through the translation path — n/a: release notes are deliberately English-only, as every entry in the file is. **One of the eleven notes says in its own text that its Thai wording has not been checked by a Thai speaker**, which is the honest handling of a real gap rather than a defect in this cut
- [x] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — n/a: no page driven, nothing to produce a console error
- [x] Network clean — n/a: as above

## 6. Regression

- [x] The pages nearest the change still work — n/a as a browser check: `build` exercises every page that imports `releases.ts`, including `/releases` and the Worker's `/api/releases/current`, and it exited 0
- [x] Any shared file touched checked from a second, unrelated page — `src/lib/releases.ts` **is** the shared file, and it has two consumers that do not render: `scripts/deploy.mjs` loads it under Node's type stripping to decide the mail, and the Worker bundles it for `/api/releases/current`. Both were exercised — the first by `--verify`, which is the same load path, and the second by `build`
- [x] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged in; section 1 records what was read to establish that `main` did not move

`node scripts/check-release-guards.mjs`, the regression check that matters on a cut:

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

Exit 0, **16** assertions, counted with `grep -c "^ok"` on the full log rather than read off the screen.
The seventh — *could not ask warns and does not refuse* — is the one that matters most on this release:
it is the hole the Pi's `guard-release` falls through, which is why the migrations are applied from this
machine and read back clean **before** either Pi build starts, rather than trusted to the Pi's guard.

## 7. Documentation

- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The items this range's features closed were ticked by those PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the two judgements in this cut are the deferred-note review and the `--base` verification, both of which belong in this plan's sections 1 and 2 and in the release record, where a release manager will look for them. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — eleven notes moved out and none remain. The one note this cut added is counted in the same breath as the ten it emptied, so the file's net gain is zero and a tick would be a claim the diff contradicts
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the claims in this plan that could have been reasoned were measured instead: the pending-migration count from `--status` against production; the mail absence from the assertion pair rather than from `major: false`; the lockfile bump from the `--verify` assertion; the `npm ci` justification from an empty dependency diff *and* the installed `next` version; the deferred-note answers from reading the published entry in `releases.ts` rather than a record's prose; that `main` did not move from `gh pr list` plus `git status -sb`; and that none of the eight migrations rewrites a row from reading all eight headers

## 8. Pre-production gate

**Host mapping, since the 2026-11-05 cutover:** `lannacareforanimals.org` is **production**;
`test.lannacare.org` is **test** on the dev Supabase project (`qxkmhwybjggxvsfxsxbd`); UAT has moved to
`uat.lannacare.org` (#1387) on its own project and still refuses a deploy until `.env.deploy.uat` is
filled. It runs `0.43.3`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: filled in the release record once the PR is merged and the deploy reads it back
- [ ] Deployed SHA matches the tested SHA — pending: read from each `deploy.mjs` run's own output at deploy time, not assumed. **The code-identity diff is the assertion, not SHA equality** (`docs/decisions/2026-11-04-release-check-false-positives.md`). Its other side was read for this release: of the files changed in the range that the allow-list *excludes*, all are CI checks, dev tools, backlog-page assets, SQL harnesses or `sync-home-icons.mjs`, and **none is imported by the build or run during a deploy** — so the allow-list needs no addition here

### On the deployed build

- [ ] Deployed to test — deferred: release manager, at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, at deploy time
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: nothing in this diff derives "today". The entry's date is a literal string, `2026-11-08`, and `majorReleasesSince` compares versions, not dates
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold, band, rounding rule or cutoff in this diff. The one comparison is `compareVersions`, asserted by the order check
- [x] Evidence pasted into this plan is the tool's actual output, unedited — every fenced block is the run's own lines, with nothing tidied
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager, at deploy time. The purge is proved byte-for-byte against the Pi's own `check-assets`, not against the API's "success"

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each deploy. **Not piped through `tail` this time**: `0.43.5` lost test's line that way and `0.38.2` lost it before that
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **none is introduced by this release.** `STATUS_READ_TOKEN` is still deliberately unset and still fail-closed, carried on `#mzu7v`. UAT's `.env.deploy.uat` is still half-filled by design, which is that stream's own outstanding work and **not a blocker for this release**
- [x] **No deploy-script change ships in this release**, so the "a change to `deploy-pi.sh` takes effect on the next deploy" caveat does not bite. `git diff --name-only 9fd7ee3e..HEAD -- scripts/pi/` is empty. The Pi log's `deploy-pi: restarting under the script from <sha>` line is still read, because its absence would mean the re-exec itself had regressed

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. The **release** carries both halves in the range, so the ordering matters and is stated below
- [x] `--dry-run` run and understood — see section 3. Six `ok`, two expected failures with the reason printed by the script
- [x] **The `-- consumer:` warnings are the safe direction and were expected.** `0332`, `0333` and `0334` declare consumer files that differ from release `0.43.5`, meaning their readers ship **in this release**: the schema lands before the code that reads it is live, and the apply is before the deploy, so nothing is blocked. `0330`, `0335`, `0336` and `0337` declare `consumer: none` — their readers are the app halves, which have not landed
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **assessed, not deferred, and the answer is that none of the eight is destructive or rewriting.** The table in section 3 reads each file: one view, one trigger replacement, one dropped `not null`, one enum value, one function, one new table with a one-time fill, one nullable column with a sibling added, and one additive back-fill into two new columns whose old columns stay. **Nothing drops a table, deletes a row or rewrites resident data.** `0336` is the only one that relaxes a constraint on an existing table, and it replaces it with a check that exactly one subject is set. **The README restore recipe has still never been exercised**, which is carried on the backlog and is stated here rather than implied
- [x] **Apply plan stated: `0330`–`0337`, eight files, production project `dbkodyyxxhtygxcxmfcu`, BEFORE the deploy.** The range merged the code that reads `0332`, `0333` and `0334`, so the deploy must not go first. `apply-migrations.mjs` applies every pending file in one run and commits each before the next starts, which is also what makes `0336` and `0337` apply where the dry-run could not. **It is run bare** — no `cd` prefix and no pipe — because the allow rule is an exact match

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies eight.** All eight are safe to leave under the old code, and that is a stronger position than `0.43.5` had: nothing retires a card key the old build expects, nothing narrows a policy the old build relies on, and every new column is nullable or filled from a column that stays. The honest statement is that **a rollback past this release needs no migration reversed** — `0333`'s enum value and `0335`'s table would simply go unread. There is still no down-migration for any of them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`check-deferred-notes.mjs` printed the template's own guidance text as the "reason" for six of thirteen candidates**, and ignored the commit range it was given, re-reading 58 plans instead of this release's 32. Recorded as a defect on `0.43.4` and `0.43.5` and unchanged | **Accepted, carried for the planner.** It over-lists rather than under-lists, and under-listing is the fault it exists to prevent (`0.40.10` lost three notes). Cost here: one lookup per candidate, thirteen times. Not fixed here — a release ships what the build gave it |
| 2 | low | **`activities-grantable` exits 1 on production listing ten activities "only Admin can ever do", and at least one is there on purpose.** `maintenance.delete` is Admin-only by Lutan's ruling of 2026-10-28, and `fault-maintenance-delete` exists to assert that **no** card grants it. So two checks disagree about the same row by design, and this one's exit 1 cannot be read as a fault list without checking every line | **Accepted, recorded for the planner.** Pre-existing: it is the state production was already in before this release, and nothing in these eight migrations touches the card catalogue. Not fixed here |
| 3 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The eleven notes read well to a shelter user.** Nobody but Claude has read them in the form they will ship | `/releases` on `lannacareforanimals.org`, signed in as Admin, after the deploy |
| 2 | **The Thai wording of the Other bills screen, which says so in its own note**, and of the Partner wording on Contacts. No Thai speaker has read either | `test.lannacare.org` or production, in Thai |
| 3 | **The thirteen outstanding test-plan items this release ships with**, on Lutan's explicit decision of 2026-11-08 (*ship, record the gap*). Six are browser walks of card-gated screens, two are Thai wording, four are looks he said he would take himself, one only shows on the next `/plan-day` run | listed in the release record |

All three are *a person has to go and look*, separately from deploying, which is the test for belonging
here. None is a section 8 deploy-time check given a second home.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (three items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the eleven notes on `/releases` after the deploy; the Thai wording by a Thai speaker; the thirteen carried items recorded as a stated gap on his decision of 2026-11-08

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-08
