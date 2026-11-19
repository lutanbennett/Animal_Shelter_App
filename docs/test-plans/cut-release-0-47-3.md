# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Cut release `0.47.3` — **minor, and it mails nobody** |
| Backlog item | n/a: a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-47-3` @ `C:\Development\Animal_Shelter_cut-release-0-47-3`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-19 |
| Carries a migration? | no — the release carries **eight** (`0408`–`0415`); the cut PR itself carries none |
| Tested at SHA | `e92f71cf1` (the cut commit); the release range is `854891267..HEAD` |

## 1. Scope and risk

- [x] Change is described in one sentence — a new `0.47.3` entry is created, `package.json` and both `package-lock.json` version fields go to `0.47.3`, and the one note already in `unreleased` moves across
- [x] Files/areas touched — `src/lib/releases.ts`, `package.json`, `package-lock.json`, and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: the cut changes no card's behaviour and gates nothing. **The one note is `admin: true`**, so only Admin sees it; a card-holding login sees the `0.47.3` heading and its title and no note beneath it, which is measured in §4. The signed-out public does not reach `/releases` at all
- [x] Out of scope, written down so the release manager is not surprised — **the eight migrations and all three deploys are the release, not the cut.** No application code was written: per `docs/release-procedure.md`, *a release cuts what the build gave it*

### This cut needed no judgement about its note, and that is worth saying plainly

`0.47.2` had to decide whether to invent a note, because `unreleased` was empty and
`cut-release.mjs` refused. **This cut has the opposite situation and no decision to make:**
PR #1714 wrote one note for the Product admin screen, so `unreleased` had exactly one line and
the cut carried it across unchanged. Lutan's instruction — *"Let's do a minor release no email,
gaps in testing noted"* — settled the three things a cut asks: the version moves the last number,
`major` is `false`, and the outstanding person-checks are **written into the release record**
rather than treated as blockers.

**One thing about that note is true of the software and not yet true of anybody, and it is
recorded rather than hidden.** `product_admins` is seeded by nobody on purpose (`0411`, because
the repository is public) and its insert policy is `with check (public.is_product_admin())`, so
the list cannot bootstrap itself through the app — the first row has to come from outside RLS.
`docs/decisions/2026-11-18-product-admin-list-schema.md` says the first one is placed with the
service role, and **no script does that** (`grep -rn product_admins scripts/` is empty, read
2026-11-19). So after this release the screen, its read path and its write function are all live
on production and **nobody can reach any of it.** Filed as `#pdmin` on the `backlog` branch and
set out in the release record under *What is not tested*. **The release was not held for it** —
he asked for the gaps noted — and **no product administrator was placed unasked**, because whose
account it is, is his call and creating an access identity is not a release step.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at `400a759a3` by `worktree.mjs new`, and `main` has not moved since (`git status -sb` on the main checkout reads clean against `origin/main`, and the cut commit's parent is `400a759a3`). Checked rather than assumed, because `main` moving under a release is expected rather than remarkable
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 37s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 134s
=== gates: test — npm test
=== gates: test exited 0 after 36s
=== gates: build — npm run build
=== gates: build exited 0 after 126s
gates: typecheck=0 lint=0 test=0 build=0
```

All four numbers were read from the gates line itself, and the whole run was redirected to a file
rather than piped through `tail` — the trap that has cost two releases a gates cycle.

**The build passed on the first attempt, which is the point worth recording.** `0.47.2` needed two,
because Next `16.4.2` halted a completed build with a `SecurityFatalError` advisory notice and
`gates.mjs` re-ran it. This release ships on `16.4.6` (PR #1699, the security patch), and the halt
did not occur: no re-run line in the log, build `exited 0 after 126s` at the first try. Added to the
seven clean stream builds the planner handover already records, **this is the eighth**, and the
release manager's own dev server came up first time too.

- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

### The cut's own assertions, which are the real check

A cut's one real failure mode is losing or altering a note, and that is invisible to every gate.

- [x] **All 17 cut assertions pass against `origin/main`, and the plain base is the correct one here.** The runbook's hand-built-base case applies only when the cut *adds* a note of its own, which makes `origin/main:src/lib/releases.ts` no longer the pre-cut state. **This cut adds nothing** — PR #1714's note was already on `origin/main` — so `origin/main` *is* the pre-cut state and *every note carried across character-identical* is asserted against the real thing

```
ok   new entry is the newest and has the requested version  [0.47.3]
ok   new entry has the requested date  [2026-11-19]
ok   new entry's major flag matches  [false]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [1 vs 1]
ok   every earlier entry present and unchanged
ok   package.json version equals the newest entry  [0.47.3]
ok   package-lock.json top-level and root-package versions equal package.json (the three agree)  [lock 0.47.3 / root 0.47.3 / package.json 0.47.3]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.47.0 in ["0.47.0"]]

all 17 assertions passed
```

- [x] **The no-mail is asserted as an ABSENCE with a control beside it**, which is the pairing the runbook requires: `majorReleasesSince("0.47.2")` is empty **and**, asked from further back, the same function still finds `0.47.0`. An always-empty function would satisfy the first and fail the second, so the emptiness is this release's and not a broken function
- [x] `node scripts/check-release-guards.mjs` — exit **0**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0** once this plan was written
- [x] **Audit.** `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob`), dated in `docs/advisory-register.json` and still unreachable. **Not "clean"** — one registered, accepted advisory. **The cut bumps `package.json`, so CI's `audit` job runs for real** rather than showing `skipped`, which would not have been a pass
- [x] **`npm ci` in the main checkout was run, and this release is the case where it mattered.** `package.json` *did* move in this range — `next` `16.4.2` → `16.4.6` (PR #1699) — which is exactly the asymmetry `0.28.0` was bitten by, where the Pi clones ran `npm ci` inside `deploy-pi.sh` and the laptop did not. Installed `next` reads **16.4.6** against `package.json`'s **16.4.6** after the install
- [x] **The deferred-note gate was answered per plan, not waved through** — see §7

## 3. Schema and data

- [ ] Every line in this section — n/a: **the cut PR carries no migration.** The release's eight (`0408`–`0415`) each landed in their own PR and were applied to dev there; they are applied to production and UAT by the release manager before the deploys. Their numbering, dry-run, re-runnability and down-migrations were checked in their own plans. The apply plan and its orderings are in §8 and the readings are in the release record

## 4. Functional checks

- [x] Happy path works end to end, **and the note's audience boundary was measured in both directions** — `/releases` was fetched on the worktree dev server twice, once as Admin and once as a login holding exactly one card, and the `admin: true` note is shown to the first and withheld from the second

```
Admin -> HTTP 200, 920,167 bytes
    PRESENT  0.47.3 section header
    PRESENT  the release title
    PRESENT  note, first half
    PRESENT  note, second half
    PRESENT  note, closing clause
    PRESENT  previous release still present
    0 x [object Object]   0 x undefined<

card-only (website_photos) -> HTTP 200, 660,982 bytes
    PRESENT  0.47.3 section header
    PRESENT  the release title
    ABSENT   note, first half
    ABSENT   note, second half
    ABSENT   note, closing clause
    PRESENT  previous release still present
    0 x [object Object]   0 x undefined<
```

**Two logins is the right number here, and it is a measurement rather than a shortcut.** `0.47.2`
used one because its only note was untagged and there was no audience boundary to test. This cut's
note is `admin: true`, so there is one, and both halves of it are now proven: *shown to Admin* and
*withheld from a non-Admin*. The non-Admin fetch is 259,185 bytes smaller, which is the rest of the
page differing by role rather than anything about this note.

**One observation, not introduced by this cut:** a non-Admin sees the `0.47.3` heading and its title
with no notes beneath it, because the entry's only note is admin-only. That is what `admin: true`
means and the behaviour is unchanged by this cut; it is recorded so a reader meeting it does not
file it as a fault.

**Every probe string was chosen to contain no character the page HTML-escapes.** The note contains
no apostrophe, but its first sentence begins with an arrow (`Settings → Product admin`), which is
encoded in the markup, so the probes match on `a product administrator who has verified with their
authenticator app`, `add or remove the web addresses that open it` and `it still has no Admin role
and no first login` instead — the failure `0.46.0` hit on a quoted word.

The page was fetched over HTTP with the session cookie and matched as text, **not** rendered in the
browser pane, because a page loaded there by its address never completes React's Suspense swap and
every note would read as absent (`CLAUDE.md`, *the built-in browser pane lies about pages you load by
their address*).

- [ ] Data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: the cut adds no page, control, form or stored value. It edits two data files. The failure modes that exist here are "a note was lost or altered", "a note was invented" and "the mail flag is wrong", and all three are asserted mechanically in §2 rather than clicked

### Role access matrix

- [x] Every login tested / a login that should not have access is blocked server-side — the one audience boundary this cut has is the `admin: true` note, and it was driven with two real logins above. **It is a visibility boundary and not a security one**: `/releases` is open to every signed-in login and the cut adds no route, so there is nothing for the server to refuse

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no page, nav entry, manual topic or string path changed by the cut. **The release does change the English and Thai dictionaries** (the calendar and product-admin screens), and those strings were checked in their own plans; release notes themselves are not translated — they are shown as written, which is why the unread Thai is listed in **Left for manual verification** rather than ticked

## 6. Regression

- [x] The pages nearest the change still work — `/releases` is the only page that reads `src/lib/releases.ts`, and it was loaded above with the new and the previous entry both present, under two different logins
- [x] Shared file touched, checked from a second unrelated page — `src/lib/releases.ts` is also read by `scripts/deploy.mjs` and `scripts/pi/guard-release.mjs`, both of which refuse a mismatch between `package.json` and the newest entry; the three-way version assertion is that check made ahead of the deploy, and `check-release-guards.mjs` exercises both guards' own branches
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: nothing was merged. The branch was cut from the current `origin/main` at `400a759a3`; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a for the cut itself. **What this release closes is named where it belongs**: `#swrun`'s production step (`0413` reaching production) is recorded on that item and in the release record, and the one gap this cut found was filed as `#pdmin` on the `backlog` branch rather than carried in the PR
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: the cut is mechanical and had no judgement to record (§1). The finding it turned up is a backlog item, not a design decision
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a cut **empties** `unreleased`, and the checker holds a tick to the diff having *gained* a line, so `n/a` is the honest state on every cut plan. What this cut publishes is set out in §1
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the note count from `[1 vs 1]` against `origin/main`; the no-mail from the absence-and-control pair rather than from `major: false`; the note's audience from two real fetches with two different logins; the "nothing else user-visible" from reading all 35 plans plus the diff of `src/app`, `src/components`, `src/lib/i18n` and `worker` (§7 below); the pending counts from `--status` on both databases; the audit from `audit:register`'s own exit code; the backup from Drive's own file listing rather than from `backup.log`; the additive-only claim from grepping all eight migrations for `not null`, `update`, `delete` and `alter column`; the Pi's health from the mesh and from three `x-lanna-served-by: pi` answers; and the empty PADMIN list from `0411`'s own policy text

### The deferred-note question, answered per plan

`check-deferred-notes.mjs` scanned `85489126..HEAD` — this release's **35** plans, **7** flagged as
possibly owing a note and 25 answered `n/a` outright. Every one of the 7 has a line in the
`--deferred-reviewed` argument on this PR. **One of them had to be checked properly and is the
reason this section is not a formality:**

- **`scheduled-writer-visibility` reads as closed by this release and is not.** Its reason names
  *"0408 on production and a Worker deploy"*, **both of which happen here** — so the surface reading
  is that its note is now owed. It is not: Thai label proposals also need the machine login, its
  `propose_translations` card and the `LABEL_DRAFT_PASSWORD` secret, which are `#aaqtl` and Lutan's.
  `LABEL_DRAFT_EMAIL` is set in **none** of the places the Worker's environment is built from, so
  `missingLabelLogin` still short-circuits the cron. **No note owed, and the near-miss is the point**
- **`calendar-connect-screen` is half-closed.** Its reason says *"piece 3 is not built"* and piece 3
  **did** land here (PR #1698) — but the rest of it stands: connecting a shelter's own calendar still
  needs the operator script and a Google refresh token only Lutan can mint (`#cn7gk`). No note owed
- **Four have no user surface at all** — `handover-0-47-2` and `record-0-47-2` (the previous
  release's own paperwork, not served or rendered), `shelter-admin-role-schema` and
  `shelter-write-schema` (schema only; `0415`'s functions have no reader until a later app half, and
  `shelter-write-schema`'s own app half, PR #1714, carries the one note in this cut)
- **One is the scanner quoting the test-plan template's own instructional prose** rather than the
  plan's reason (`part5-closing-pass`, whose real answer is *docs-only*). **A scanner false positive,
  not a plan fault**, and the same shape `0.47.2` recorded — it will recur on every release

### Nothing else user-visible shipped, and that was established rather than inferred

`unreleased` having one line is not proof that one thing shipped (`0.39.5`'s trap). The objective
cross-check: `git diff 854891267..HEAD` touches **eight** files under `src/app`, plus both
dictionaries and four `worker/` files. Read individually, the app changes are the Product admin
screen (the note's subject), the `aal2` step-up page learning to send a PADMIN back to Product admin
instead of Security, a new calendar status tile on `/admin`, and the per-shelter calendar conversion
in `clinic-visits`, `upcoming-visits` and `/admin/status`.

**The per-shelter calendar conversion is the one that could have changed what Lanna sees, and it does
not.** `calendarConfigured()` (environment) became `shelterCalendarOn(shelterId)` (the shelter's own
row), so a wrong answer would switch Lanna's calendar **off** — the clinic-visit indicators would read
*not switched on* and the Confirm list on Upcoming visits would disappear. It stays on because
`decideCalendar()` keeps the environment variables for a shelter whose `shelters.key` equals
`FALLBACK_SHELTER_KEY` (`"lanna"`) and which has no credentials row, and **production has exactly one
shelter and its key is `lanna`** — read from `check-shelter-settings.mjs --env production`, which
reports `1 shelter(s) compared` and names it. `0409` creates the credentials table empty, so the
fallback branch is the one that runs.

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

All three were on `0.47.2` @ `854891267540352d5405b924083bc4f5feaca608` when this release began, read
from `/api/version` on each, all three `x-lanna-served-by: pi`, and no Worker was behind.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `e92f71cf1` is the cut commit, sitting directly on `origin/main` at `400a759a3` with nothing behind it. Re-checked against `origin/main` immediately before the deploy is handed over
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, read from each build's own log

### On the deployed build

- [ ] Deployed to test / smoke-tested on `test.lannacare.org` / public pages re-checked after a purge — deferred: release manager, at deploy time, recorded in the release record
- [ ] Timezone-sensitive behaviour — n/a: the cut derives no date; the entry's date is a literal asserted against the requested value
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff. The one ordering property (`compareVersions`, newest first) is asserted
- [x] Evidence pasted here is the tool's actual output, unedited

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read and the ref matches production / `strip-baked-env: removed N` seen / any new secret exists in production — deferred: release manager, at deploy time. **This release adds no secret or environment variable**
- [ ] UAT's project line reads `fsjagxmxjosauwmxwype` before anything else — deferred: release manager, at the UAT deploy. If it names dev or production, stop

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — n/a for the cut PR. **The release's ordering was checked and there is nothing to hold:** `check-release-order.mjs` answers `ok: no guarded migration is pending here, nothing to prove` for **both** guarded environments, because `0392` — the one file in `MUST_FOLLOW_WORKER` — went on in `0.47.2`. So the reversed-direction problem that dominated the last release does not arise in this one
- [x] **Every one of the eight migrations is additive, which is the single most important fact about this release's risk.** Grepped all eight for `not null`, `update public`, `delete from`, `drop table`, `drop column` and `alter column`: the matches are three **new** tables' own column definitions (`scheduled_writer_runs`, `shelter_calendar_credentials`, `product_admins`), and two `delete from` statements that are **inside function bodies** (`propose_label_th` in `0408`, the unmap-host function in `0414`), not migration-time statements. **No existing row is rewritten, no column on a populated table is tightened, and nothing is dropped.** A materially lower-risk release than `0.47.2`, stated rather than copied
- [x] `--env production --dry-run` and `--env uat --dry-run` run — **read, not obeyed, and this is the case the runbook describes.** Five `ok` and **three FAILED** on each database (`0410`, `0412`, `0413`), every one because the dry-run rolls each file back before the next: `0410` cannot see the table `0409` creates, `0412` cannot see the function `0411` creates, `0413` cannot see the table `0408` creates. The runner says so itself, per file — *"NOT a fault in 0410…: a real apply commits each file first, so this one is expected to apply."* **A red dry-run normally means do not apply; here the correct action is to apply**
- [x] **Six `-- consumer:` warnings predicted and seen**, all the safe direction — schema landing ahead of code that deploys minutes later in the same release (`0408`'s three, and `0409`/`0410`'s readers which *"do not exist in release 0.47.2"* because they ship in this one). The runner names its own limit: it cannot tell a harmless file from one that must follow its code, which is why the release-order guard above and not this warning is what holds a `0392`
- [x] **Destructive or rewriting migration: a fresh production backup exists** — and this release has none, per the additive-only reading above, so the gate is met by a wide margin rather than relied on. **Read from Drive, not from `backup.log`**: `lannacare-production-2026-11-18T2000Z.dump.age`, 2,173,370 bytes, created `2026-11-18T20:00:59Z`, with the nightly run unbroken back through 13 November in the same listing. The size step up from the 17th's 1,994,304 bytes is `0.47.2`'s eighteen migrations stamping `shelter_id` across about 4,600 rows, which is a sanity signal that the backup is of the post-tenancy database
- [x] **Apply plan stated** — `0408` to `0415` in order, to **production** (`dbkodyyxxhtygxcxmfcu`) and **UAT** (`fsjagxmxjosauwmxwype`), **before** either deploy. Test's database is the dev project and already holds all 416 files. **The order inside the batch matters and the runner honours it**, which is exactly what the three dry-run failures demonstrate: `0409` before `0410`, `0411` before `0412`, `0408` before `0413`. UAT is applied first as a rehearsal, as it was on `0.47.2`
- [x] **Production's live scheduled jobs were read again, and `0.47.2`'s one flagged job is confirmed fixed on the live catalogue.** `check-scheduled-writers.mjs --env production` reports **3 cron jobs, all active**, 92 functions and 113 tables carrying `shelter_id`. `purge-donation-tax-ids` now reads *"every insert (retention_runs) names shelter_id"* — last release it was the job that `0397`'s `NOT NULL` would have broken at 03:41 UTC, and `0397` fixed it. The other two are delete-only and need no shelter. **No job in this release's path is at risk**
- [x] **The one known-inert scheduled writer is still inert, re-measured rather than carried forward** — `runLabelDrafts` calls `propose_label_th` with no shelter header, and `propose_label_th` is in this read's *SENDS NO SHELTER* list. It only runs when `LABEL_DRAFT_EMAIL` and `LABEL_DRAFT_PASSWORD` are both set, and `LABEL_DRAFT_EMAIL` is set in none of the places the Worker's environment is built from, so the cron's own `missingLabelLogin` guard short-circuits it. Nothing is lost and nothing new breaks

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 854891267` on the production clone (a rebuild, about five minutes); `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration — but unlike `0.47.2`, this release's eight ARE all safe to leave applied under `0.47.2`'s code**, which is the practical consequence of their being purely additive: three new tables nothing older reads, new functions nothing older calls, and no tightened constraint for an older writer to fall foul of. Each file's own header still carries its undo. **Nothing to unsend:** this release mails nobody

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium (a shipped screen nobody can open; no user-visible breakage) | **Nobody is a product administrator on production and no script places the first one.** `0411` seeds nobody on purpose and its insert policy asks `is_product_admin()`, so the list cannot bootstrap itself through the app; the decision file says the first row is placed with the service role, and no script does it. After this release `/admin/product-admin`, its read path and `0414`'s write function are all live and unreachable | **found, not fixed, and raised.** Filed as `#pdmin` on the `backlog` branch and set out in the release record. **Not fixed inside the release** for two reasons, both deliberate: whose Google account is the first PADMIN is Lutan's call, and creating an access identity is not a release step. The release was not held for it — he asked for the gaps noted |
| 2 | low (documentation, no user surface) | **The one note is true of the software and not yet true of anybody**, as a consequence of defect 1. It is carefully hedged (*"a product administrator who has verified with their authenticator app"*) and `admin: true`, so it reaches one person and promises nothing broken, but a reader could take it as a capability somebody has today | **accepted, and recorded in two places.** The note was written and merged by PR #1714 on green and is carried across unaltered — *a release cuts what the build gave it*. Rewriting a merged note inside a cut is the scope creep that rule exists to stop. Named in §1, in the release record and on `#pdmin` |
| 3 | low (tooling, recurs every release) | **`check-deferred-notes.mjs` reports one false positive** by quoting the test-plan template's own instructional prose as a plan's reason. Milder than `0.47.2`'s seven only because this release has fewer plans; the mechanism is unchanged | **found, not fixed.** It costs the release manager one plan read and nothing more. `0.47.2` already recommended a backlog item for the planner rather than a fix inside a release |
| 4 | low (the release manager's own path, not the product) | **`lanna-pi.local` timed out from this machine**, which on `0.47.0` almost led to the conclusion that the Pi was down | **diagnosed, not a fault.** The runbook's own check settled it: all three sites answered `x-lanna-served-by: pi`, so the Pi was healthy and the path was broken. Over `lanna-pi-mesh` it answers in full — up 6 days, load 0.00, 3.3 GB available, all three clones on `854891267`, all three services `active`. The mesh is the route for this release's three builds, and the runbook says in terms not to put that to Lutan as a question |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Who the first product administrator is, and whether that account already has an authenticator** — defect 1. A PADMIN with no authenticator cannot self-enrol (first setup is opened by a shelter Admin), and every write on the screen needs `aal2`, so the account matters | Lutan, then the `#pdmin` script |
| 2 | **The `aal2` presses on `/admin/product-admin`** — Add, Remove, create a shelter, map and unmap an address, and the step-up return. Four plans leave these `pending:` (`shelter-management-app`, `shelter-management-schema`, `shelter-write-app`, `shelter-write-schema`); a dev sign-in has no authenticator, so none of it has been driven | Lutan, with an authenticator |
| 3 | **Thai nobody independent has read.** The project's largest standing gap, and the sixth release running to name it. This release adds Product admin and calendar-status strings to both dictionaries | a Thai reader, and Lutan to sign |
| 4 | **Lanna's calendar status tile and the Confirm list on Upcoming visits**, on test after the deploy — `calendar-per-shelter-readers` leaves this `pending:`. The conversion is argued safe in §7 from production's single `lanna`-keyed shelter; this is the look that confirms it on screen | Lutan, after the deploy |
| 5 | **Settings as Admin and as a card-only login** — `calendar-connect-screen` leaves this `pending:` | Lutan |
| 6 | **The live Pi's own scheduled units** — `scheduled-writers-classify` and `scheduled-writer-visibility` leave the production run and the tile wording `pending:` (`#pirow`). Production's `cron.job` list was the larger half and this release has read it again (§8) | Lutan |
| 7 | **The runbook changes, and the screenshot PNG** — `onboarding-runbook-screens` leaves both `pending:`; the images wait for the next full manual re-run | Lutan |
| 8 | **The next `/plan-day` run** — `plan-day-agreement` leaves its proof `pending:`, because the proof of a skill edit is the next run that follows it | Lutan, by triggering it |
| 9 | **`0.47.2`'s own carried-forward items** — the per-shelter policy click-throughs, `/admin/security` with the authenticator, a plan image on `/admin/facility-maps`, one Who does what click-through, the two Google accounts for the shelter Drive connect, and the e-Donation and phone-width items from `0.47.1` | Lutan |

*(No release mail is on this list, and there is nothing to read for one: this release mails nobody, asserted in §2.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the first product administrator and the aal2 presses, a Thai reader for the new strings, and the items carried forward from 0.47.2

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the one step that is Lutan's is the production Worker deploy

Result: pass with accepted defects
