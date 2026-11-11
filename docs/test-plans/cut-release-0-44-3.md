# Test plan — cut release `0.44.3`

## Header

| | |
|---|---|
| Feature | Cut `0.44.3`: six notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does NOT mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-44-3` @ `C:\Development\Animal_Shelter_cut-release-0-44-3`, port `3001` |
| Dev server | n/a: not started. A cut changes one data file and two version fields |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-11 |
| Carries a migration? | **no** — the cut adds none. **Six migrations written by earlier PRs (`0353`–`0358`) are pending on production AND on UAT** — the same six on both — and are applied as a release step, before the deploy |
| Tested at SHA | `fb3c81c9`. The four gates ran against that commit's tree **except for this markdown file**, written while `build` was running and committed with the cut: no code, data or config differs |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan: *"Lets do a minor release no email and note gaps in test plans"*. **The email is the answer the procedure asks for**, given in words and unprompted, so `major: false`; a non-mailing release moves the **last** number, so `0.44.2` → `0.44.3`. The words "major or minor" were never offered. The same sentence pre-answered the `pending:` test-plan decision — **the third release running where his opening message answered both**
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry **and one added note**), `package.json`, `package-lock.json`
- [x] Cards affected identified — **none by this diff.** Two of the six notes are card-tagged (`bills` ×2), which decides **who is shown a note**, not what anyone may do. **But the release carries a real card change in `0355`**, recorded in section 3: the Bills card loses `maintenance.jobs` at read and gains `maintenance.job_picker`. Admin is unaffected (`perms.isAdmin`). `/releases` is not a public page
- [x] Anything explicitly out of scope written down — this cut fixes no defect and writes no code. The one thing it writes is a release note it owed (below)
- [x] **One PR was open at the cut and is NOT mine to merge** — #1503, the planner's handover 740. It is documents-only, it is not in this release, and if it merges mid-release `main` moves under the deploy, which the runbook says to expect and to read rather than chase

### What is in the release

`node scripts/release-prs.mjs 7b1d9f03 HEAD` exits **0** with **33 PRs**, and checks **39** added
migration and test-plan files against that list. Seven were resolved from GitHub (squash/rebase, no
merge commit in git).

**The range start is unambiguous**, for the second release running: all three hosts ran `0.44.2` from
the single commit `7b1d9f03`, read from `/api/version` before the cut.

**My own first reading of this release was wrong and is recorded rather than quietly corrected.** I
opened by saying only the `setup.sh` PR and some backlog commits had landed since `0.44.2`, and that
`unreleased` might therefore be empty. In fact **33 PRs had merged** and `unreleased` held five notes.
The lesson is the runbook's own: measure before concluding, including when the conclusion is "there is
nothing to do".

### The deferred-note review: one note was owed and added

`check-deferred-notes.mjs` listed **21** candidates, of which **eleven are in this release's range** —
it again ignored the range it was given and re-read 66 plans from `75daad3f`. The ten strays belong to
earlier releases and were each answered in their own cut.

- **`bills-job-link` — OWED, AND ADDED.** Its reason was *"0355 is pending on production behind
  earlier files, so the change is inert there until they apply"*. **This release applies `0353`–`0358`**,
  so the step closes, and **nothing already in `unreleased` covered it** — checked note by note. A
  `bills`-tagged note went in **before** the cut ran, which is the order step 4 prescribes.
- **`meme-photo-list-view` — its step ALSO closes, and nothing is owed.** Its reason was that `0354`
  was pending. `0354` applies here — but `control-drive-pane` had already put the user-facing fact in
  `unreleased` (*"Make a meme now works for someone who holds only the meme card"*), confirmed with
  `git log -S` against `src/lib/releases.ts`. A second note would re-announce it. **Two candidates
  whose steps closed, one note owed: the step closing is not the test.**
- **`hsts-one-year` — nothing owed, on the first of two clauses.** *"No shelter user would notice a
  longer HSTS max-age, and it does not take effect until a release cut and the production Worker
  deploy"*. This release is both of those, so the second clause closes — and the first still decides it.
- **`th-path-links-and-toggle` — STILL OPEN.** The `/th/` toggle only matters on addresses nothing links
  to from outside yet, and `th-path-alternates` still carries `pending:` on its Worker-cache check.
- **`control-drive-fixtures`** (`n/a`: the sentence only stops showing to logins that could not act on
  it), **`pi-build-lock`**, **`photo-dropdown-why-fixed`**, **`brief-blocks-stop-rule`**,
  **`planner-handover-738`** and **`record-0-44-2`** — developer tooling, planner documents and a
  release record. Each line read individually; nothing owed.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created from `origin/main` minutes before the cut
- [x] `node scripts/gates.mjs` — four numbers read, and the script's own status separately from the shell's:

```
=== gates: typecheck exited 0 after 89s
=== gates: lint exited 0 after 171s
=== gates: test exited 0 after 41s
=== gates: build exited 0 after 167s
gates: typecheck=0 lint=0 test=0 build=0
GATES EXIT=0
```

- [x] **All 17 cut assertions pass, against an explicitly built base** — `--verify` compares with `origin/main:src/lib/releases.ts`, which stops being the pre-cut state once a cut **adds** a note, so two assertions would have failed on `[6 vs 5]`:

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [6 vs 6]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.44.0 in ["0.44.0"]]

all 17 assertions passed
```

- [x] **The absence of mail is asserted with a presence control.** An always-empty `majorReleasesSince` would satisfy the absence check alone; on a minor release this is the single easiest check to fake
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **32** assertions, counted with `grep -c "^ok"`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] `npm run audit:prod` exits **1** with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2`, registered and still unreachable. **The cut bumps `package.json`, so CI's `audit` runs for real** — and `skipped` is not a pass
- [x] `node scripts/guarded-install.mjs` in the main checkout — exit **0**; installed `next` reads **16.4.2**, equal to `package.json`

## 3. Schema and data

Six migrations pending on production **and the same six on UAT**, all from this release's range.

| File | What it does | Shape |
|---|---|---|
| `0353_refusal_keys_recurring_jobs.sql` | recurring-job functions raise refusal **keys** instead of English | replaces function bodies |
| `0354_resident_photo_list_view.sql` | a view listing a resident's photos that a who-and-where card can read | adds a view |
| `0355_maintenance_job_picker_view.sql` | a narrow view of maintenance jobs plus its own activity, so a Bills login attaches a bill to a job **without reading the job board**. Lutan, 2026-11-11: *"bills should be able to associate a bill with a job but not access the job board."* | adds a view and an activity; **changes what the Bills card grants** |
| `0356_refusal_keys_stock.sql` | stocktake and stock-correction functions raise keys | replaces function bodies |
| `0357_adopter_resident_scope.sql` | adopter-to-resident scope functions, harness and specification (`#l5gxn` schema half) | adds functions |
| `0358_refusal_keys_intake_date.sql` | `correct_intake_date` raises keys | replaces a function body |

- [x] `--status` on all three: production **354 applied, 6 pending**; UAT **354, the same six**; test **360, 0 pending**. Drift clean both ways on each. **UAT is level with production**, as on `0.44.2`
- [x] `--dry-run` on production: **all six `ok`**, no expected-failure case. **Ten `-- consumer:` warnings** across `0353`, `0354`, `0355`, `0356`, `0358` — the **safe** direction, schema before the reader is live. `0357` printed none, which was read rather than skipped: its declared consumers are unchanged since `0.44.2`
- [x] **Run from the MAIN checkout.** My first dry-run was run from the cut's worktree and exited 2 with *".env.deploy.production is missing or empty"* — `worktree.mjs` does not copy that file (and since #1490 copies only an allow-list). The runbook says this for the UAT deploy; it is equally true of every migration command. **Recorded as my own slip**
- [x] File is re-runnable — each says so in its own header
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: not this PR's migrations. Dev holds all 360; `--drift test` is read at verification
- [ ] Down-migration — n/a: none is this PR's. The refusal-key files state their undo as re-applying the previous bodies; `0354`/`0355`/`0357` are additive views and functions
- [x] **Production apply plan: `0353`–`0358`, project `dbkodyyxxhtygxcxmfcu`. UAT: the same six, project `fsjagxmxjosauwmxwype`.** Both BEFORE their environment's deploy. Run **bare** from the main checkout — no `cd` prefix, no pipe

### The before-picture, and this time `role-cells` / `role-cards` EARN their place

The last two releases recorded that pair as measuring nothing, because nothing touched a role's cards or
cells. **`0355` does:** it changes what the Bills card grants. So the pair is the right snapshot here,
and the reasoning is written down rather than copied either way.

- `check-production.mjs role-cells` — **8 role lines**, saved in full. `0355` changes a card's grants, so
  the cells of whoever holds Bills should move and nothing else should.
- `check-production.mjs role-cards` — **8 role lines**, saved in full.
- `check-production.mjs card-grants-applied` — ***"Every held card is fully applied wherever it is
  held."*** This is the one `CLAUDE.md` names as the card-rule guard, and a card whose grants change is
  exactly when it can break.
- `check-production.mjs table-policy-commands` — **77 lines**.
- `check-public-views.mjs --env production` — **476 `ok`, 1 `skip`, 0 failures**, for a line-by-line diff
  across the new views and the replaced function bodies.

**And a UAT before-picture was taken for the first time**, because `--env uat` now exists
(`check-production.mjs` and `check-public-views.mjs`, PR #1485, built from the backlog item `#rv4qk`
this session filed on 2026-11-10 after two releases could not read UAT): UAT **`role-cells` 8 lines**
and **`public-views` 476 `ok`, 0 failures**. So this release has a genuine second reading.

### Several reads timed out and were retried — recorded as inconclusive, not as findings

**The network to Supabase from this machine was intermittently failing throughout.** Repeated
`UND_ERR_CONNECT_TIMEOUT` at 10 s, against **both** `dbkodyyxxhtygxcxmfcu.supabase.co:443` and
`api.supabase.com:443`: `role-cells`, `check-public-views --env production`, `role-cells --env uat`
(twice) and the production `--dry-run` each failed once or twice and then succeeded unchanged on retry.

**Two things this nearly caused, both avoided and worth recording:**

- **A production "finding" that was a timeout.** `check-public-views` exited 1 with **0 `ok` and 0
  `fail`** — which is an error, not a clean sheet, and would have read as catastrophic if the count had
  been copied without the exit code.
- **A reported defect in a fix that works.** After `role-cells --env uat` failed twice I was about to
  record `--env uat` as only partially implemented. A third attempt, run with the exit code read **from
  the script rather than through a pipe**, returned real output — and `role-cards`,
  `card-grants-applied` and `table-policy-commands` all answered on UAT too. **The `#rv4qk` fix is
  complete.** I had briefly read exit codes through `| tail`, which is the runbook's own trap, and that
  is what made two failures look like four.

## 4. Functional checks

- [ ] All items — n/a: a cut has no functional surface of its own. What it changes for a user is `/releases`, which is section 8's deploy-time check

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| a login holding Bills | `/releases` | sees the four plain notes **and both `bills`-tagged ones** | pending: read on the deployed build, section 8 |
| a login without Bills | `/releases` | sees the four plain notes only | pending: read on the deployed build, section 8 |
| Admin | `/releases` | sees all six | pending: read on the deployed build, section 8 |
| the signed-out public | `/releases` | not a public page | n/a: no public surface in this diff |

- [x] A login that should not have access is blocked server-side — n/a: this diff adds no action, route or policy. Note filtering is display, not access

## 5. Cross-cutting

- [x] Thai — n/a for the diff. **Three of the release's PRs (`refusal-keys-group-4`, `-5`, `-6`) carry their own unreviewed Thai**, each saying so in its plan; carried to the manual list, not fixed here
- [x] Timezone — n/a: the entry's date is the literal `2026-11-11`, and `majorReleasesSince` compares versions
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — `/releases` is the only page reading this file, plus `/api/releases/current` in the Worker; both covered by the order and `latestRelease` assertions
- [x] Shared file touched — `src/lib/releases.ts` is read by the app, the Worker and `deploy.mjs`; the `[object Object]` / `undefined` assertion covers the render and `deploy.mjs`'s own refusal the mismatch

## 7. Documentation

- [x] Backlog item ticked — n/a: a cut closes none
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the judgements here are the deferred-note review, the `role-cells` snapshot choice and the timed-out reads, all of which belong in this plan and the release record
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** n/a: a cut cannot tick this line and must not. The checker holds it to the diff and a tick needs `unreleased` to have *gained* a line, while a cut's purpose is to empty it — six moved out, none remain, and the one added is counted in the same breath
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the pending counts from `--status` on all three; the mail **absence** from the assertion pair rather than from `major: false`; the note count from `[6 vs 6]` against a built base; **that nothing already covered the Bills note by reading all five existing notes**, and that the meme note already existed from `git log -S`; the UAT readings from UAT itself now that `--env uat` exists; and **every timed-out read retried and labelled inconclusive rather than reported**

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` production; `test.lannacare.org` test on the dev project (`qxkmhwybjggxvsfxsxbd`); `uat.lannacare.org` UAT on its own (`fsjagxmxjosauwmxwype`). All three ran `0.44.2` from `7b1d9f03`, read rather than assumed.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — pending: filled in the release record once merged and read back
- [ ] Deployed SHA matches the tested SHA — pending: read from each `deploy.mjs` run's own output. **The code-identity diff is the assertion, not SHA equality**, and one open PR (#1503) could move `main`

### On the deployed build

- [ ] Deployed to test — deferred: release manager, at deploy time
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, at deploy time
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this diff
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager, at deploy time

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager. **And the deploy's own exit code read, not the pipeline's**; his `tee` log is **UTF-16**, so `tr -d '\000'` before grepping
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: on each deploy, not piped through `tail`
- [x] Any new secret/env var in production Cloudflare — **none introduced.** `STATUS_READ_TOKEN` still deliberately unset (`#mzu7v`)
- [x] **`scripts/pi/` DOES change in this release** (`pi-build-lock`, `pi-cloudflared-race`, `pi-persistent-journal`), so **the one-deploy-late caveat bites**: a change to `deploy-pi.sh` takes effect on the *next* deploy, not the one shipping it. Read `deploy-pi: restarting under the script from <sha>` on every clone, and where absent run the guards by hand and say so. **And the Pi builds go ONE AT A TIME** — `setup.sh` step 2b records `next build` peaking above 6 GB on a 4 GB Pi, and `0.44.2` OOM-killed a build by running three
- [x] **This release does NOT mail.** `major: false`, asserted with its control. UAT still gets `--no-mail` in words, even though `0.44.1` established the `major: false` check answers first

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither. The **release** carries both halves
- [x] `--dry-run` run and understood — section 3
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **assessed: none of the six is destructive.** Nothing drops a table, column or row; four replace function bodies and three add views, functions and an activity. **`0355` removes a grant from the Bills card**, which is a permission narrowing rather than data loss and is reversible by restoring the grant. The restore drill is exercised and the remaining risk ruled negligible (`#rg7pv`)

### Rollback

- [x] Rollback position stated — production is served by the Pi, so rollback is `./scripts/pi/deploy-pi.sh --ref <sha>`, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies six to each of production and UAT.** All six are safe under the old build: the four refusal-key files make functions raise keys instead of English, and the worst case under `0.44.2` is a refusal shown as its key; `0354`, `0355` and `0357` add views and functions nothing in `0.44.2` reads. **The one to know:** `0355` takes `maintenance.jobs` read off the Bills card, so rolling the code back leaves a Bills holder without the job board **and** without the new picker until the grant is restored

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | **Repeated Supabase connect timeouts from this machine** (`UND_ERR_CONNECT_TIMEOUT`, 10 s) against both the project host and `api.supabase.com`. Five reads and the production dry-run failed once or twice each, then succeeded unchanged | **Accepted and recorded as inconclusive reads, not findings.** Each was retried. **`check-public-views` exited 1 with 0 `ok` and 0 `fail`**, which would read as catastrophic if the count were copied without the exit code. Worth a backlog item if it recurs; the apply is the step to watch, and `--status` is read back after it |
| 2 | low | **I read exit codes through `| tail`** while characterising the UAT failures, which is the runbook's own trap, and it made two timeouts look like a partial `--env uat` implementation | **Mine, caught before anything was reported.** Re-run with the status read from the script: `--env uat` works for every check tried. **A defect in a working fix was nearly recorded** |
| 3 | low | **I opened this release asserting there was probably nothing to ship** — "only the `setup.sh` PR and some backlog commits" — when 33 PRs had merged and `unreleased` held five notes | **Mine, corrected in the same turn by measuring.** Recorded because "there is nothing to do" is a conclusion that needs evidence like any other |
| 4 | low | **I ran the first production dry-run from the cut's worktree**, which has no `.env.deploy.production`; it exited 2 | **Mine, fixed by running from the main checkout.** The runbook says this about the UAT deploy; it applies to every migration command |
| 5 | low | **`check-deferred-notes.mjs` again ignored the commit range** — 66 plans from `75daad3f` against this release's 33 PRs, so ten of 21 candidates belonged to earlier releases | **Accepted, carried for the planner.** Sixth release running. It over-lists rather than under-lists, and this release is again the argument for keeping it: `bills-job-link` was a genuinely owed note |
| 6 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities | Not a stop. `audit:register`, which CI runs, exits 0 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The six notes read well to a shelter user**, and that **both `bills`-tagged notes show to a Bills holder and not to others** | `/releases`, as Admin and as a Bills login |
| 2 | **The 17 outstanding test-plan items this release ships with**, on Lutan's instruction of 2026-11-11 (*note gaps in test plans*) | listed in the release record |
| 3 | **The unreviewed Thai in `refusal-keys-group-4`, `-5` and `-6`** | production or test, in Thai |
| 4 | **A Bills holder attaching a bill to a job, and no longer reaching the job board** — `0355`'s point, and the change behind the added note | `/bills`, as a Bills login |
| 5 | **The two cards from `0.44.0` are still held by nobody** — `approve_text`, `diet_settings`. **Fourth release running** | Settings → Who does what |

All five are *a person has to go and look*. None is a section 8 deploy-time check given a second home, and no other plan's outstanding items are copied in.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (five items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the six notes on `/releases` and check both Bills-tagged ones show only to Bills holders; a Thai speaker for the three refusal-key groups; a Bills login attaching a bill to a job; the 17 carried items recorded as a stated gap on his instruction of 2026-11-11

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-11
