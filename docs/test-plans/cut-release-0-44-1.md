# Test plan — cut release `0.44.1`

## Header

| | |
|---|---|
| Feature | Cut `0.44.1`: six notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does NOT mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-44-1` @ `C:\Development\Animal_Shelter_cut-release-0-44-1`, port `3008` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-10 |
| Carries a migration? | **no** — the cut adds no migration file. **Two migrations written by earlier PRs (`0348`, `0349`) are pending on production** and are applied as a release step, before the deploy. **UAT is three behind (`0347`–`0349`)**, read from `--status`, not assumed. `0347` is already applied on production, which is what closed one deferred note (section 1) |
| Tested at SHA | `01139804`. The four gates ran against that commit's tree **except for this markdown file**, which was written while `build` was running and committed with the cut: no code, data or config differs between the tested tree and the commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan: *"lets do a minor release, no email and any gaps in testing noted"*. **The email is the answer the procedure asks for**, given in words and unprompted, so `major: false`; `major` in this repo means *worth an email*, and a non-mailing release bumps the **last** number, so `0.44.0` → `0.44.1`. The words "major or minor" were never offered as a question, which step 4 forbids. The same sentence pre-answered the `pending:` test-plan decision (*any gaps in testing noted*), so section 3 of the runbook cost no round trip
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry **and one added note**), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. One of the six notes is `admin: true`, which decides **who is shown a note**, not what anyone may do; the other five are plain strings shown to everyone. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut fixes no defect and writes no code.** Defects are recorded below and none is fixed here, because a release ships what the build gave it (`docs/release-procedure.md`, "A release cuts what the build gave it"). The one thing it *does* write is a release note it owed, which step 4 requires of a cut

### What is in the release

`node scripts/release-prs.mjs f7618c2f HEAD` exits **0** with **17 PRs**, #1438–#1455, and checks
**20** added migration and test-plan files against that list. Two were resolved from GitHub
(squash/rebase, no merge commit in git); the rest from git.

**The range starts at production's deployed SHA, `f7618c2f`, not at the production Worker's
`15a41ab8`.** `0.44.0` deployed from four commits, so "the previous deployed SHA" is a choice rather
than a fact: `f7618c2f` is what the Pi serves and so what a user is running, and it is the earlier of
the two, so the range is the inclusive one. The cost is that #1438 and #1440 — a planner handover and
`0.44.0`'s own record, both documents — appear in this release's list although their content was on
the production Worker already. Nothing is missed in the other direction, which is the failure that
matters.

### The deferred-note review: one note was owed, and it was added

`cut-release.mjs` runs `check-deferred-notes.mjs` before it will write a byte and refuses while a
candidate has no answer. **Six** candidates were listed. Answering them is the cut's one piece of
judgement, so it is written here rather than left only in a flag string:

- **`public-cards-gate` — OWED, and added.** Its reason was *"0347 is not applied to production yet,
  so a note would promise users something not live"*. **`0347` is applied on production** — read from
  `--status` (349 applied, and `0347` is not among the two pending), and confirmed from the other end
  by `check-production.mjs appeal-override`, which prints *"0347 is APPLIED here, so the running rule
  is live"*. The migration carries the whole behaviour: `git diff f7618c2f..HEAD` over all five of its
  declared consumer files is **empty**, so there is no code half still to ship. The step is therefore
  closed, and the note went into `unreleased` **before** the cut ran, which is the order step 4
  prescribes.
- **`receipt-attach-phone` — STILL OPEN, and left.** Its reason is *"the phone check is still
  outstanding, so the note would promise something nobody has seen working"*. Its own Sign-off still
  reads `pending: the Director's own phone — navigator.share cannot be driven from the pane`, so the
  step is not closed by this release and the note stays with the PR that closes it.
- **`card-names-on-screen` — nothing owed; the script mislabelled it.** Its release-notes line is
  **ticked**, not `n/a`, and its note (*Settings → Recent changes now names a card by its title*) is
  in `unreleased` and ships in this entry.
- **Two more were the script printing the template's own guidance text instead of the plan's reason** —
  `planner-handover-736` (*a planner handover is read by one planning chat … no shelter user sees it*)
  and `record-0-44-0` (a release record; nothing served, imported or rendered). Neither owes a note.
- **`suppliers-cleanup` — nothing owed, although its named step DOES close here.** Its reason has two
  clauses — *"nobody at the shelter would notice; Contacts has hidden Vendor rows since 0338, and the
  production apply is still outstanding"* — and this release applies `0348`. **The first clause is the
  one that decides it:** the user-visible change (Vendor rows gone from Contacts) shipped with `0338`
  in an earlier release, and `0348` only drops the columns and archives the rows behind it. There is
  nothing new for a user to be told.

Recorded as a defect below: four of six candidates were the guidance-text misprint, and the script
again ignored the range it was given, re-reading 17 plans from `75daad3f` rather than `f7618c2f`.

### `main` did not move under this cut

`gh pr list --state open` returned **nothing** — no open PR at all. `main` and `origin/main` agreed at
`01139804` immediately before the worktree was created, and the worktree branched from that. The
backlog branch had nothing outstanding in either direction (`git log --oneline main..backlog` empty,
`git -C ../Animal_Shelter_Backlog merge --ff-only main` *"Already up to date"*).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-44-1` from `origin/main` minutes before the cut, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`. **All four numbers read, not three**, and the script's own status read separately from the shell's:

```
=== gates: typecheck exited 0 after 56s
=== gates: lint exited 0 after 160s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 177s
gates: typecheck=0 lint=0 test=0 build=0
GATES EXIT=0
```

**`lint` reports 88 warnings and 0 errors**, which is the standing state of this repository and does not fail the gate; the exit code is what was read
- [x] **All 17 cut assertions pass, and they were run against the INTENDED BASE** — `--verify` compares against `origin/main:src/lib/releases.ts`, which is no longer the pre-cut state once a cut **adds** a note, so the two assertions that matter most would have failed on a count of `[6 vs 5]`. The base was built explicitly, which the `0.44.0` handover says to treat as the default rather than the exception:

```
cp src/lib/releases.ts <scratchpad>/base.ts      # after the owed note was inserted into unreleased[]
node scripts/cut-release.mjs 0.44.1 2026-11-10 minor --verify --base <scratchpad>/base.ts
```

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [6 vs 6]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.44.0 in ["0.44.0"]]

all 17 assertions passed
```

- [x] **The absence of mail is asserted with a presence control, not read off the flag.** An always-empty `majorReleasesSince` would satisfy the absence check on its own; the pair above is what distinguishes "this release does not mail" from "the function is broken". This is the exact check `0.38.1` established and the one a minor release most easily fakes
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **32** assertions, counted with `grep -c "^ok"` rather than read off the screen
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**, *"the plan is complete and correct"*, with 8 items reported as awaiting a person and 5 pre-production gates as deferred to the release. Both of those states pass on purpose since 2026-11-05 (`docs/decisions/2026-11-05-test-plan-pending-and-unfinished.md`)
- [x] `npm run audit:prod` exits **1** with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered with a dated reason and still unreachable. **The cut bumps `package.json`, so CI's `audit` job runs for real on this PR rather than showing `skipped`** — and skipped is not a pass
- [x] `node scripts/guarded-install.mjs` (`npm ci`) in the main checkout — exit **0**, and justified from the other end too: installed `next` reads **16.4.2**, equal to `package.json`. The asymmetry that made this a step (the Pi clones run their own `npm ci`, the laptop does not) is unchanged

## 3. Schema and data

The cut carries no migration. Two are pending on production and three on UAT, and all three belong to
this release's range.

| File | What it does | Rewrites or drops? |
|---|---|---|
| `0347_public_website_gate.sql` | `private.appeal_running(published, status)` becomes the one definition of "running" (published, and `live` or `funded`). `public_appeals` and `public_appeal_photos` ask it instead of `status <> 'draft'`; `public_enclosures` lists only residents who are adoption-ready or under a running, text-approved appeal. `public_resident_cards` is deliberately unchanged, so the kennel card still answers for every resident | Re-creates three views. **Already applied on production**; pending on UAT |
| `0348_suppliers_cleanup.sql` | Drops `stock_receipts.supplier_contact_id`, `stock_deliveries.supplier_contact_id`, `suppliers.source_contact_id` and the `stock_vendors` view; rewrites two `0337` stamp functions first so their plpgsql bodies stop naming the dropped columns; then **archives** the Vendor contact rows | **YES — this is the destructive one.** Its own header says *"NOT reversible once applied to a database that held the old columns"*. The rows are archived, not deleted, so their history stays |
| `0349_refusal_keys_photos.sql` | `set_resident_profile_photo` and `delete_resident_photo` raise refusal **keys** instead of English text, seven raises in two bodies otherwise unchanged from `0319` | Replaces two function bodies |

- [x] `--status` reviewed on all three databases: production **349 applied, 2 pending**; UAT **348 applied, 3 pending**; test **351 applied, 0 pending**. Drift clean in both directions on each
- [x] `--dry-run` reviewed on production: **both `ok`**, with no expected-failure case this time, because neither pending file depends on the other. Two `-- consumer:` **warnings** on `0349` (`src/lib/residents/profile-photo.ts` and `src/app/residents/[id]/photos/actions.ts` differ from release `0.44.0`), which is the **safe** direction — the schema lands before the reader is live, and the apply is before the deploy
- [x] **The warnings that did NOT appear were checked rather than assumed.** `0348` declares `-- consumer: none` and printed nothing, which is correct; `0349`'s other two declared consumers (`src/app/photos/approve/actions.ts`, `src/app/residents/[id]/adoption-updates/actions.ts`) are unchanged since `0.44.0`, so their readers were already live and the schema lands under code that already reads it — the safest order there is
- [x] File is re-runnable — each of the three says so in its own header (`create or replace`, guarded `do` blocks, `if exists`)
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: not this PR's migrations. Dev holds all 351 already; `--drift test` is read at verification
- [ ] Down-migration — n/a: none of the three is this PR's. `0347` states its undo in its header (re-run `0343`'s three view definitions); `0348` states plainly that it has none; `0349` can be undone by re-running `0319`
- [x] **Production apply plan stated: `0348` and `0349`, project `dbkodyyxxhtygxcxmfcu`, BEFORE the deploy. UAT apply plan stated: `0347`–`0349`, project `fsjagxmxjosauwmxwype`, before UAT's deploy.** Run **bare** — no `cd` prefix and no pipe — because the allow rule is an exact match

### The before-picture, chosen by reading the migrations rather than copied from the last release

`role-cards` / `role-cells` would have measured **nothing** here: none of the three touches a role's
cards or cells. What these three write is **what an anonymous visitor can see**, **the policy set** and
**two function bodies**, so those are what was read before the apply:

- `node scripts/check-production.mjs table-policy-commands` — **77 lines**, saved in full. `0348` drops
  a view and three columns, so a table losing its last live policy for a command is the shape to watch.
- `node scripts/check-public-views.mjs --env production` — **477 `ok`, 1 `skip`, 0 failures**, saved in
  full for a line-by-line diff. This is the check that covers both the dropped view and `0349`'s two
  replaced functions, since it reads the `anon` EXECUTE and SELECT surface.
- `node scripts/check-production.mjs appeal-override` — **0 running, text-approved appeals, and 0 of
  them for an animal not ticked Ready for adoption.** *"No animal is public through an appeal alone."*
- `node scripts/check-production.mjs not-listed-publicly` — **281 residents in an enclosure are not
  listed publicly**, being neither adoption-ready nor under a running appeal. See the finding below.

**What the before-picture cannot cover, stated rather than glossed:** `0348` archives the Vendor
contact rows, and **no read-only check in this repository counts them**, so there is no before-and-after
figure for the rows it moves. What stands in its place is the migration's own `do $guard$` block, which
**refuses rather than lose a link** if any history still names a contact but not its supplier — and the
dry-run exercised that guard and came back `ok`. That is a guard, not a measurement, and it is recorded
as a gap below rather than presented as one.

### The two production readings that two plans left for the release manager — both taken

`public-cards-gate` signed off `pending: the planner runs the production before/after count` and
`production-public-count-check` `pending: the production reading of both checks is the planner's`. Both
were answered here by running them, which closes two of the release's eight outstanding items:

- **`appeal-override`: nothing.** `0.44.0`'s record left the closed appeal `"Treatment"` open as an
  animal that `0343`'s override made public on its own. `0347` narrowed "running" to `live` or
  `funded`, so a closed appeal no longer counts, and the check now reads **0 and 0**. That item is
  closed by measurement rather than by argument.
- **`not-listed-publicly`: 281 residents.** That is the size of what `0347` does on production, and it
  is a reading of Lutan's own ruling of 2026-11-09, not a fault — an animal that is not ticked Ready
  for adoption and has no running appeal does not appear on the website. `PUBLIC_SITE` is `locked`, so
  no anonymous visitor reaches those pages today. **Named to him in this release rather than left in a
  file**, because a three-figure count is worth his eyes even when it is the intended design.

## 4. Functional checks

- [ ] All items — n/a: a cut has no functional surface of its own. It moves data in one file. What it changes for a user is the content of `/releases`, which is section 8's deploy-time check

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login | `/releases` | sees the five plain notes | pending: read on the deployed build, section 8 |
| Admin | `/releases` | sees all six, including the `admin: true` one | pending: read on the deployed build, section 8 |
| the signed-out public | `/releases` | not a public page; unchanged by this diff | n/a: no public surface in this diff |

- [x] A login that should not have access is blocked server-side — n/a: this diff adds no action, route or policy. Note filtering is display, not access, and is unchanged

## 5. Cross-cutting

- [x] Thai — n/a for the diff itself. **None of the six notes claims its Thai has been checked**, and the two Thai-wording items this release carries (`refusal-keys-photos`, and the Thai manual rebuild on the Pi) are listed for manual verification rather than ticked
- [x] Timezone — n/a: nothing in this diff derives "today". The entry's date is the literal string `2026-11-10`, and `majorReleasesSince` compares versions, not dates
- [x] Money and rounding — n/a: none in this diff

## 6. Regression

- [x] Nearest pages still work — `/releases` is the only page that reads this file, plus `/api/releases/current` in the Worker; both read the same array and are covered by the order and `latestRelease` assertions
- [x] Shared file touched — `src/lib/releases.ts` is read by the app, the Worker and `deploy.mjs`. The `[object Object]` / `undefined` assertion is what covers the render, and `deploy.mjs`'s own refusal covers the mismatch case

## 7. Documentation

- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The items this range's features closed were ticked by those PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the three judgements in this cut are the deferred-note review, the choice of `f7618c2f` as the range start and the `--base` verification. All three belong in this plan's sections 1 and 2 and in the release record, where a release manager will look for them. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — six notes moved out and none remain. The one note this cut added is counted in the same breath as the five it emptied, so the file's net gain is zero and a tick would be a claim the diff contradicts
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the pending counts from `--status` on all three databases; the mail **absence** from the assertion pair rather than from `major: false`; the note count from the `[6 vs 6]` assertion against an explicitly built base; the lockfile bump from the `--verify` assertion; the `npm ci` justification from the installed `next` version; that `0347` is live on production from `--status` **and** from `appeal-override` saying so itself; that `public-cards-gate` has no code half from an empty `git diff` over all five declared consumer files; the deferred-note answers from reading each plan's own line rather than the script's printed "reason"; the two public readings from production itself; and that `main` did not move from `gh pr list` plus `git status -sb`

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` is **production**; `test.lannacare.org` is **test** on the
dev Supabase project (`qxkmhwybjggxvsfxsxbd`); `uat.lannacare.org` is **UAT** on its own project
(`fsjagxmxjosauwmxwype`). All three ran `0.44.0` before this release, read from `/api/version` rather
than assumed — production and test both from `f7618c2f`, UAT from `15a41ab8`, which is the same code.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: filled in the release record once the PR is merged and the deploy reads it back
- [ ] Deployed SHA matches the tested SHA — pending: read from each `deploy.mjs` run's own output at deploy time, not assumed. **The code-identity diff is the assertion, not SHA equality** (`docs/decisions/2026-11-04-release-check-false-positives.md`)

### On the deployed build

- [ ] Deployed to test — deferred: release manager, at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, at deploy time
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold, band, rounding rule or cutoff in this diff. The one comparison is `compareVersions`, asserted by the order check
- [x] Evidence pasted into this plan is the tool's actual output, unedited — every fenced block is the run's own lines, with nothing tidied
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager, at deploy time. The purge is proved by a re-fetch, not by the API's own "success"

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time. **And the deploy's own exit code read, not the pipeline's** — `0.44.0`'s first test deploy failed with exit 1 inside a pipeline that exited 0
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each deploy. **Not piped through `tail`**
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **none is introduced by this release.** `STATUS_READ_TOKEN` is still deliberately unset and still fail-closed (`#mzu7v`)
- [x] **No `scripts/pi/` change ships in this release**, so the one-deploy-late caveat does not bite — `git diff --name-only f7618c2f..HEAD -- scripts/pi/` is empty. The Pi log's `deploy-pi: restarting under the script from <sha>` line is still read on every clone, because an absent line means the release's guards did not run
- [x] **This release does NOT mail.** `major: false`, asserted with its control above. UAT is still deployed with `--no-mail` written in words, because UAT's database holds production's real people and belt-and-braces is the right shape when the failure is "real people were emailed"

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. The **release** carries both halves in the range, so the ordering matters and is stated above
- [x] `--dry-run` run and understood — see section 3
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — **`0348` IS destructive and irreversible**, so this line is not `n/a`. It drops three columns and a view and archives the Vendor contact rows, and its header says *"NOT reversible once applied to a database that held the old columns"*. What stands behind it: the rows are **archived, not deleted**, so no history is lost; nothing in `src/` or `worker/` reads any of the dropped columns (the migration's own header states it, and `0338` moved the app off them a release ago); the two stamp functions that still named them are rewritten in the same file, first, so the failure mode the author names — a plpgsql body passing the dry-run and failing on the first delivery saved — cannot happen; and its `do $guard$` block refuses rather than lose a link, which the dry-run exercised. **The restore drill is exercised and the remaining production risk was ruled negligible by Lutan** (`#rg7pv`, `docs/decisions/2026-11-09-restore-risk-settled.md`), so this is recorded as assessed rather than as a fresh backup taken today — pending: the one line a person must still accept is that `0348` cannot be undone

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies two to production and three to UAT.** Under the old build: `0349` is safe — the two functions raise a key instead of an English string, and `0.44.0`'s UI already handles keys for the other refusals in its range, with the worst case a refusal shown as its key; `0348` is safe for the app, because nothing in `0.44.0` reads the dropped columns either, **but it cannot be undone**; `0347` is already live on production and needs no rollback thought there. There is no down-migration for any of the three
- [x] **Nothing is mailed, so there is no unsendable consequence.** The lever that cannot be taken back on a mailing release is absent here by Lutan's instruction

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`check-deferred-notes.mjs` printed the template's own guidance text as the "reason" for four of six candidates** (`card-names-on-screen`, `planner-handover-736`, `public-cards-gate`, `receipt-attach-phone`), and again ignored the commit range it was given, re-reading 17 plans from `75daad3f` rather than `f7618c2f`. Recorded as a defect on `0.43.4`, `0.43.5`, `0.43.6` and `0.44.0`, promoted into `docs/release-procedure.md` on 2026-11-08, and still unfixed at source | **Accepted, carried for the planner.** It over-lists rather than under-lists, and under-listing is the fault it exists to prevent (`0.40.10` lost three notes). Cost here: one lookup per candidate, six times — and one of the six, `public-cards-gate`, was a real owed note, so the over-listing earned its keep. Not fixed here: a release ships what the build gave it |
| 2 | low | **`0348` archives the Vendor contact rows and no read-only check counts them**, so this release has no before-and-after figure for the rows a destructive migration moves — only the migration's own refusing guard, exercised by the dry-run | **Accepted and recorded as a gap**, per Lutan's instruction to note gaps. Worth a backlog item: a `check-production.mjs` reading for supplier/Vendor contact rows would have made `0348` measurable the way `0344` was |
| 3 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |
| 4 | none | **`0.44.0` deployed from four commits, so "the previous deployed SHA" was a choice** rather than a fact when setting this release's range | **Accepted, stated in section 1.** The inclusive end was taken (`f7618c2f`, what the Pi serves), which adds two documents PRs to the list rather than risking a missed one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The six notes read well to a shelter user.** Nobody but Claude has read them in the form they will ship, and `0.44.0`'s fourteen have not been read by a person either | `/releases` signed in as Admin |
| 2 | **281 residents stop appearing on the public website's enclosure pages** under `0347` — the intended effect of Lutan's ruling of 2026-11-09, at a scale worth seeing. `PUBLIC_SITE` is `locked`, so nothing is visible to an anonymous visitor yet | an enclosure page, once the public site is unlocked |
| 3 | **`0348` cannot be undone.** Three columns and a view are dropped from production; the Vendor contact rows are archived, not deleted | the apply is this session's; the acceptance is his |
| 4 | **The eight outstanding test-plan items this release ships with**, on Lutan's instruction of 2026-11-10 (*any gaps in testing noted*) | listed in the release record |
| 5 | **The Thai wording of the photo refusals `0349` converts to keys**, and of the Thai manual the UAT Pi rebuilds. No Thai speaker has read either | production or `test.lannacare.org`, in Thai |
| 6 | **The two new cards from `0.44.0` are still held by nobody** — `approve_text` and `diet_settings` — so public text saved since that release is waiting with no one able to approve it. Not caused by this release, and the one thing worth doing soon | Settings → Who does what |

All six are *a person has to go and look*, separately from deploying, which is the test for belonging
here. None is a section 8 deploy-time check given a second home, and none of the other plans'
outstanding items is copied in — they belong to their plans and their signatures.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (six items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the six notes on `/releases`, to accept that `0348` is irreversible, and to see the 281-resident effect of `0347` once the public site is unlocked; the Thai wording by a Thai speaker; the eight carried items recorded as a stated gap on his instruction of 2026-11-10

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-10
