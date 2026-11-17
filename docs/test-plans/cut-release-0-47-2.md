# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.2` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-2` @ `C:\Development\Animal_Shelter_cut-release-0-47-2`, port `3008` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-18 |
| Carries a migration? | no — the release carries **eighteen** (`0390`–`0407`); the cut PR itself carries none |
| Tested at SHA | `e312e67c2` (the cut commit); the release range is `3dde3e2eb..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.2` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.2`, and **one note is added**, which is the unusual part of this cut
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note is untagged**, so every signed-in login sees it and Admin sees it through the same path; the signed-out public does not reach `/releases` at all
- [x] Out of scope, written down so the release manager is not surprised — **the eighteen migrations and all three deploys are the release, not the cut.** No application code was written: per `docs/release-procedure.md`, *a release cuts what the build gave it*. Two things that look like scope and are not: the `#dvsgn` dev-signin fix and the `#lklst` migration renumber both merged as their own PRs **before** this cut, not inside it

### The one judgement in this cut: a note was added, and why

`unreleased` was **empty** and all 38 PRs answered the release-notes line `n/a`, so `cut-release.mjs`
refused outright — *"`unreleased` is empty — there is nothing to cut (see release-procedure step 4: an
empty list is not proof nothing shipped)"*. **That refusal is correct and has no override flag.**

So the release could not be cut without a note, and the alternative was to apply the eighteen
migrations and deploy under `0.47.1`, which passes every guard (`releaseProblems()` checks only that
`package.json` matches the newest entry and `unreleased` is empty — both already true) but leaves all
three hosts reporting a version whose record describes a materially different schema.

**Both options went to Lutan and he chose the note.** It is one plain sentence saying the separation
happened and that nothing on screen changes. It promises nothing that does not work, which is the
test `docs/decisions/2026-10-11-release-note-truth-rule.md` sets.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run, and it reported **`Already up to date`**, which was checked rather than taken at face value. The main checkout's local `main` read `bb3e0e6ab` when this release began, but `origin/main` had already moved to `ca054e859` (two commits, `docs/backlog.md` only, filing `#ccwnx` and `#calsh`), and `worktree.mjs new` branches from `origin/main` — so **the cut commit's parent is `ca054e859`**, confirmed with `git log -1 e312e67c2^` and `git merge-base --is-ancestor`. The gates below therefore ran on the final tree, and `main` has not moved since: `behind: 0  ahead: 1`. **An earlier draft of this plan said the gates ran before a sync; that was wrong and is corrected here rather than left to read plausibly**
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 45s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 212s
=== gates: test — npm test
=== gates: test exited 0 after 39s
=== gates: build — npm run build
=== gates: build stopped on Next's SecurityFatalError advisory halt; re-running build once now, while its five-minute receipt is fresh
=== gates: build exited 0 after 239s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers were read from the gates line itself, and the whole run was redirected to a file
rather than piped through `tail` — the trap that has cost two releases a gates cycle.

**The build needed two attempts, and that is this release's own feature working rather than a fault.**
Next 16.4.2 halts a completed build with a `SecurityFatalError` advisory notice; `gates.mjs` recognises
it and re-runs the build once while the advisory receipt is still fresh. `tenancy-not-null`'s plan
records the same thing as its accepted defect 1 (*"local `build=1` from the Next.js advisory stop after
a full compile"*), and `build-halt-gates` in this release is the PR that taught the gates runner to
handle it. The second attempt is the one whose exit code counts.

- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass, against a hand-built base — and this cut is the case the runbook describes.** Because it *adds* a note, `origin/main:src/lib/releases.ts` is no longer the pre-cut state, and verifying against it would fail *"nothing invented (note count equal)"* on a count that is correct. The base was built as the runbook prescribes: `origin/main`'s file plus exactly the one added note, inserted into its `unreleased`. Against that base both the carried notes and the added one are asserted rather than waved through

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   package.json version equals the newest entry  [0.47.2]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.2 / root 0.47.2 / package.json 0.47.2]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]

all 17 assertions passed
```

- [x] **The no-mail is asserted as an ABSENCE with a control beside it**, which is the pairing the runbook requires: `majorReleasesSince("0.47.1")` is empty **and**, asked from further back, the same function still finds `0.47.0`. An always-empty function would satisfy the first and fail the second, so the emptiness is this release's and not a broken function
- [x] `node scripts/check-release-guards.mjs` — exit **0**, all **32** assertions
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [x] **Audit.** `npm run audit:prod` exits 1; `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), dated in `docs/advisory-register.json` and still unreachable. **The cut bumps `package.json`, so CI's `audit` runs for real** — `skipped` would not have been a pass. The two **moderate** Next.js cache advisories (`GHSA-mfr8-8qww-v76h`, `GHSA-vc7v-qv4w-wrv8`) were judged in this release's own `docs/decisions/2026-11-17-next-agent-upgrade-halt.md` and are now held unreachable by a CI check (`check-next-cache-apis.mjs`) rather than by anyone remembering
- [x] **`npm ci` in the main checkout was run, and separately established as unnecessary** — `git diff 3dde3e2eb..HEAD -- package.json package-lock.json` is empty, and installed `next` reads **16.4.2** against `package.json`'s **16.4.2**
- [x] **The deferred-note gate was answered per plan, not waved through** — see §7

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's eighteen (`0390`–`0407`) each landed in their own PR and were applied to dev there; they are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were checked in their own plans. The apply plan and its orderings are in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end — `/releases` was **loaded** on the worktree dev server with a disposable card-keyed login, and the new `0.47.2` section renders with `0 ×` `[object Object]` and `0 ×` `undefined<`

```
login holding exactly website_photos  -> HTTP 200, 657,232 bytes
    PRESENT  0.47.2 section header
    PRESENT  the release title
    PRESENT  note, first half ("is now kept separately in the database")
    PRESENT  note, second half ("ready for other shelters to join later")
    PRESENT  note, closing clause ("Nothing changes on your screens")
    PRESENT  previous release still present (0.47.1)
    0 x [object Object]   0 x undefined<
```

**`next dev` had to be started twice, for the same reason the build did.** The advisory halt stops
`next dev` after it has already printed `Ready`, and its own message says to retry the same command;
the retry came up in 1,017ms. Worth recording because a release manager meeting it for the first time
would read a halted dev server as a broken worktree.

**One login is the right number here, and that is a measurement rather than a shortcut:** the only
note is untagged, so there is no audience boundary to test — the two-login probe the last two cuts ran
existed to prove a card-tagged note was shown to a holder and withheld from a non-holder, and this cut
has no tagged note. The previous release's `0.47.1` section was asserted still present in the same
fetch, so the carried entries render too.

**Every probe string was chosen to contain no character the page HTML-escapes.** The note contains
*shelter's*, which renders as `&#x27;`, so a probe on that phrase would read a correctly rendered note
as absent — the failure `0.46.0` hit on a quoted word. The probes match on `is now kept separately in
the database` and `ready for other shelters to join later` instead.

The page was fetched over HTTP with the session cookie and matched as text, **not** rendered in the
browser pane, because a page loaded there by its address never completes React's Suspense swap and
every note would read as absent (`CLAUDE.md`, *the built-in browser pane lies about pages you load by
their address*).

- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered", "a note was invented" and "the mail flag is wrong", and all three are asserted mechanically in §2 rather than clicked

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no card gates the cut and it adds no route. `/releases` was already open to every signed-in login, and the one note is untagged, so there is no per-card audience to matrix

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed by the cut. **The release does change the English and Thai dictionaries**, and `src/lib/i18n/shelter-prose.test.mjs` asserts Lanna's rendered output is byte-for-byte unchanged; that test is inside the `test` gate above. Release notes themselves are not translated — they are shown as written, which is why the unread Thai is listed in **Left for manual verification** rather than ticked

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and it was loaded above with both the new and the previous entry present
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs` and `scripts/pi/guard-release.mjs`, both of which refuse a mismatch between `package.json` and the newest entry; the three-way version assertion is that check made ahead of the deploy, and `check-release-guards.mjs` exercises both guards' own branches
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged. The branch was cut from the current `origin/main` and `sync` reported `Already up to date`; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the cut itself. **The items this release closes are named where they belong**: `#shtci` is unblocked by the apply and is recorded in the release record, as is the tenancy programme's part-5 release step
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical. Its one judgement — publishing a note rather than deploying under `0.47.1` — is Lutan's, recorded in §1 and in the release record, where the next release manager looks
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[1 vs 1]` against a hand-built base; the no-mail from the absence-and-control pair rather than from `major: false`; the note's rendering from a real fetch of `/releases`; the "nothing user-visible" from reading all 47 plans plus the byte-for-byte dictionary test; the pending counts from `--status` on each of the three databases; the audit from `audit:register`'s own exit code; the backup from Drive's own file listing rather than from `backup.log`; the row counts about to be rewritten from the dry-run's own error text; and the Worker-is-live proof from a byte comparison of two files at three deployed commits

### The deferred-note question, answered per plan

`check-deferred-notes.mjs` scanned `3dde3e2e..HEAD` — this release's own **47** plans, 14 flagged as
possibly owing a note and 31 answered `n/a` outright. Every one of the 14 has a line in the
`--deferred-reviewed` argument on this PR. Four groups, and only one needed a decision:

- **Seven are the scanner matching the test-plan template's own instructional prose** rather than the
  plan's reason (`next-cache-api-guard`, `tenancy-de-lanna`, `tenancy-part5-release-guard`,
  `tenancy-part7-filters-2`, `tenancy-service-role-audit`, `tenancy-shelter-export`,
  `tenancy-unscoped-tables`). Each one's real answer is *no user surface*. **A scanner false positive,
  not a plan fault** — worth knowing because it will recur on every release
- **`tenancy-anon-view-leaks` is the one whose premise this release changes.** Its reason was *"the
  migration reaches production in a later release"* — **this is that release.** Checked rather than
  assumed: with one shelter on production no row changes hands, so nothing is visible and the `n/a`
  still holds, but the reason it gives is now out of date
- **Two are still genuinely open**: `shelter-drive-connect` and `tenancy-part9-drive-app`. A shelter
  still cannot connect its own Google account (`#cn7gk`), so a note would promise something that does
  not work
- **Four have no user surface at all**: `deploy-cf-token` (a deploy script's credential handling),
  `record-0-47-1` (a release record), `pi-scheduled-writers` (its supplier-email fix repairs a break
  that never reached users, because the migration that would have caused it is in *this* release), and
  `tenancy-part6-singletons` (receipts print identically)

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.47.1` @ `3dde3e2eb` when this release began, read from `/api/version` on each,
all three `x-lanna-served-by: pi`, and **no Worker was behind** — `#uatwk` stayed closed after
`0.47.1` reversed the deploy order so Lutan's command goes last.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `e312e67c2` is the cut commit, sitting directly on `origin/main` at `ca054e859` with nothing behind it. Re-checked against `origin/main` immediately before the deploy is handed over, because `main` moving under a release is expected rather than remarkable
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each build's own log. **The code-identity diff is the assertion, not SHA equality**, and it is recorded in the release record

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date; the entry's date is a literal asserted against the requested value. (**The release rewrites one scheduled job's body**: `purge_donation_tax_ids`, 03:41 UTC, which now loops per shelter — read in `0397` and recorded below)
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable.** It is the first release to deploy with a Cloudflare **API token** rather than wrangler's OAuth login, set up on 2026-11-16 after a `401` cost Lutan a second run, so the `deploy: wrangler auth:` line is read and recorded
- [ ] UAT's project line reads `fsjagxmxjosauwmxwype` before anything else — deferred: release manager, at the UAT deploy. If it names dev or production, stop

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — n/a for the cut PR, **but the release's ordering is the one thing about `0.47.2` that could have gone badly, and it was checked rather than assumed.** `0392`'s per-shelter restrictive policies blank the public website if no `x-shelter-id` header arrives, so they must reach a database only **after** the Worker that sends it is live — the opposite of the usual direction, which is why `scripts/lib/release-order.mjs` exists and why a `-- consumer:` header cannot carry it. `check-release-order.mjs` answered **ok** for both guarded environments: *"1 guarded migration(s) pending, Worker proven live at 84e614b2d"* (production) and *"at ad1abd0b7"* (UAT). `worker/shelter.mjs` and `worker/index.mjs` are **byte-identical** at those two commits, at test's `3dde3e2eb`, and on `origin/main`. **So the "Worker first" half of the pair already shipped in `0.47.1`, and this release is the second half** — the apparent deadlock (the deploy guard wants the migrations applied; the order guard wants the Worker live) never arises
- [x] **`0397`'s `NOT NULL` is safe to apply in this release specifically**, which the runbook makes conditional: a tightening constraint must reach a database no earlier than the code that stops writing the rows it forbids, and *"if the apply and the code deploy are not the same release, apply the migration last"*. Part 7's writer fixes are **in this release**, so they are the same release
- [x] `--env production --dry-run` run — **read, not obeyed.** Fifteen `ok`, **three FAILED** (`0397`, `0405`, `0406`), each because the dry-run rolls every file back before the next: `0397` saw the null rows `0394` had just restamped and rolled back, and `0405`/`0406` could not see the table and function `0404`/`0405` create. The runner says so itself, per file — *"NOT a fault in 0397…: a real apply commits each file first, so this one is expected to apply."* **A red dry-run normally means do not apply; here the correct action is to apply**
- [x] **Destructive or rewriting migration: a fresh production backup exists.** **This release rewrites existing production rows, and the dry-run is what revealed how many.** `0390` and `0394` stamp `shelter_id` onto every row that has none; `0397`'s assertion printed the live counts — **about 4,600 rows across roughly 50 tables**, the largest `audit_log=2293`, `resident_diet_rounds=590`, `placement_history=388`, `attachments=373`, `residents=300`. The backup gate is met and was **read from Drive, not from `backup.log`**: `lannacare-production-2026-11-16T2000Z.dump.age`, 1,993,529 bytes, created `2026-11-16T20:00:56Z`, with the nightly run unbroken back through 11 November
- [x] **Apply plan stated** — `0390` to `0407` in order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** either deploy. Test's database (dev) already holds all 408 files with `0 pending` and `0` drift either way. **The order inside the batch matters and the runner honours it:** `0394` must commit before `0397` can assert no nulls remain, and `0404`/`0405` must commit before `0405`/`0406` can see what they create — which is exactly what the three dry-run failures demonstrate. The tenancy catalogue lint is therefore run **after** the whole batch, not between files
- [x] **Production's live scheduled jobs were read, which no previous release had done.** `check-scheduled-writers.mjs --env production` (new in this release, read-only) reports **3 cron jobs, all active**, 91 writing functions and 95 tables carrying `shelter_id`. One job was flagged — `purge-donation-tax-ids`, *"inserts into `retention_runs` without naming `shelter_id`"* — which after `0397`'s `NOT NULL` would error every night at 03:41 UTC and stop silently. **It is fixed by the migration that would have broken it**: `0397` rewrites that function to loop per shelter and name `shelter_id` in the insert, read in the file rather than inferred. The decision file's procedure said this read was Lutan's to run; it is now done and recorded
- [x] **The one known scheduled job this release breaks is inert on production, measured not assumed.** `pi-scheduled-writers` finding 2 records `runLabelDrafts` as *recorded, not fixed*: it calls `propose_label_th` with no `x-shelter-id` and will error after `0397`, silently proposing no Thai label drafts. It only runs when `LABEL_DRAFT_EMAIL` and `LABEL_DRAFT_PASSWORD` are both set, and **`LABEL_DRAFT_EMAIL` is set in none of the places the Worker's environment is built from** — not `.env.deploy.production`, not `.env.deploy.uat`, not `.env.local`, not `wrangler.jsonc`, and `deploy.mjs` passes no such var. So the cron's own guard (`missingLabelLogin`) short-circuits it and nothing is lost

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 3dde3e2eb` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release's eighteen are NOT all safe to leave applied under `0.47.1`'s code — a real difference from the last release, stated rather than copied.** `0392`'s restrictive policies are satisfied by `0.47.1`'s Worker, which is proven byte-identical above, so the public site survives a code rollback; but `0397`'s `NOT NULL` means any writer that stops sending the header starts erroring, and Part 7's writer fixes are in the code that a rollback would remove. **So a code rollback past this release needs the schema rolled back with it**, and each file's own header carries its undo. **Nothing to unsend:** this release mails nobody

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (documentation, no user surface) | **`tenancy-anon-view-leaks`'s release-note reason is now out of date.** It reads *"the migration reaches production in a later release"*, and this is that release. The `n/a` answer is still correct — one shelter, so no row changes hands — but the stated reason no longer describes why | **found, not fixed — deliberately.** An applied plan is a historical record, and editing one inside a release is the scope creep that *a release cuts what the build gave it* exists to stop. Recorded here and in the release record so the next reader is not misled |
| 2 | low (tooling, recurs every release) | **`check-deferred-notes.mjs` reports seven false positives** by quoting the test-plan template's own instructional prose as a plan's reason, which makes a correctly answered `n/a` look as though it may owe a note. It inflated the "may owe a note" list from 7 real entries to 14 | **found, not fixed.** It costs the release manager a read of seven plans and nothing more, and no release is wrong because of it. Worth a backlog item for the planner rather than a fix inside a release |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has read.** The project's largest standing gap, and the fifth release running to name it. **This release converts both dictionaries** so text takes a shelter's own name; a test asserts Lanna's output is byte-for-byte unchanged, but no bilingual reader has signed `dictionary-shelter-prose` | a Thai reader, and Lutan to sign |
| 2 | **The live Pi exercise** — `pi-scheduled-writers` leaves it pending. Production's `cron.job` list has now been read by this release (see §8), which was the larger half; what remains is the Pi's own scheduled units | Lutan, procedure in `docs/decisions/2026-11-17-pi-scheduled-writers.md` |
| 3 | **A browser click-through of the per-shelter policies** — `tenancy-part5-policies`, `tenancy-part6-singletons` and `tenancy-part7-filters` each leave one pending | Lutan, after the deploy |
| 4 | **`/admin/security` with the authenticator** — `tenancy-part7-filters-2` leaves it pending; it cannot be driven without a real code | Lutan |
| 5 | **One plan image uploaded on `/admin/facility-maps`** — `tenancy-part7-filters-3` leaves it pending | Lutan |
| 6 | **One Who does what click-through on dev** — `tenancy-part10-shelter-roles` leaves it pending | Lutan |
| 7 | **Two real Google accounts for the shelter Drive connect** — `shelter-drive-connect` leaves a guided step pending | Lutan, with the release manager |
| 8 | **The next card walkthrough pasting a dev-signin snippet** — `dev-signin-shelter-key` leaves it pending | the next stream that needs one |
| 9 | **The `SUPABASE_CANARY_TOKEN` repository secret**, carried forward unclosed from `0.47.1`. **Not needed by any deploy in this release** | Lutan, in GitHub's settings |
| 10 | **The accountant's answer on the e-Donation export format**, carried forward unclosed, and its release note waits with it | Lutan, with the accountant |
| 11 | **`0.47.1`'s own open items**, carried forward — the e-Donation screens, the Sold out badge at phone width, the Shelter Friends map on a phone, the order-flood wording, the Cloudflare rate-limit rule and the PromptPay id | Lutan |

*(No release mail is on this list, and there is nothing to read for one: this release mails nobody, asserted in §2.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the converted dictionaries, and Lutan for the live Pi exercise, the policy click-throughs, the two Drive accounts and the items carried forward from 0.47.1

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass with accepted defects
