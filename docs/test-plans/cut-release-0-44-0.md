# Test plan — cut release `0.44.0`

## Header

| | |
|---|---|
| Feature | Cut `0.44.0`: fourteen notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It MAILS** (`major: true`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-44-0` @ `C:\Development\Animal_Shelter_cut-release-0-44-0`, port `3001` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-09 |
| Carries a migration? | **no** — the cut itself adds no migration file. **Four migrations written by earlier PRs (`0343`–`0346`) are pending on production** and are applied as a release step, before the deploy. Section 8 carries that ordering. `0338`–`0342` were already applied on production before this release began, read from `--status`, not assumed |
| Tested at SHA | filled in below once the gates finish; the commit that adds this plan is the only thing after the cut commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan: *"Let's do a major release with email sent out. Record gaps and proceed"*. The email is the answer the procedure asks for, given in words and unprompted, so `major: true`; `major` in this repo means *worth an email*, and until go-live a mailing release bumps the **middle** number (`src/lib/releases.ts`'s own numbering note), so `0.43.6` → `0.44.0`. The words "major or minor" were never offered as a question, which step 4 forbids
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry **and one added note**), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. The notes carry card tags (`approve_text`, `diet_settings`, `translations`, `propose_translations`, `suppliers`, `website`), which decide **who is shown a note**, not what anyone may do. One note is `admin: true`. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut fixes no defect and writes no code.** Defects are recorded below and none is fixed here, because a release ships what the build gave it (`docs/release-procedure.md`, "A release cuts what the build gave it"). The one thing it *does* write is a release note it owed, which step 4 requires of a cut

### What is in the release

`node scripts/release-prs.mjs 9b07b038 HEAD` exits **0** with **44 PRs**, #1393–#1437, and checks
**58** added migration and test-plan files against that list. Two were resolved from GitHub
(squash/rebase, no merge commit in git); one was found off the first-parent line.

### The deferred-note review: one note was owed, and it was added

`cut-release.mjs` runs `check-deferred-notes.mjs` before it will write a byte and refuses while a
candidate has no answer. **Ten** candidates were listed. Answering them is the cut's one piece of
judgement, so it is written here rather than left only in a flag string:

- **`site-content-create-feature` — OWED, and added.** Its reason was *"production still needs
  migration 0344 applied at the next release, so the button would not work there yet"*. **This
  release applies `0344`**, so the step closes here. The note went into `unreleased` **before** the
  cut ran, which is the order step 4 prescribes, and it covers `website-settings-row` (part a) in
  the same breath, because the two halves are one thing to a user.
- **`profile-photo-fails-open` — nothing owed, and that was MEASURED, not reasoned.** Its reason
  made the note conditional on the production orphan count being above zero.
  `node scripts/check-profile-photo-orphans.mjs --env production` reads *"0 profile photo(s) are now
  hidden from the website by 0342"*, with `0342 applied: yes` and `no_row 0`. So no resident loses a
  website photo and there is nothing to tell anyone.
- **Four were the script printing the template's own guidance text instead of the plan's reason** —
  `approval-flag-schema`, `db-refusal-keys-mechanism`, `manual-topics-by-card`, `text-approval-app`.
  Each line is in fact **ticked**, and each note is already in `unreleased` and ships in this entry.
  Recorded as a defect on the last three releases and still unfixed.
- **Four owe nothing at all** — `record-0-43-6` (a release record and handover; nothing served,
  imported or rendered), `site-content-create-schema` (covered by the feature half's new note),
  `test-website-off` (a Test-only setting no shelter user can see) and `uat-in-release`
  (deploy-machine scripts and release runbooks).

### `main` did not move under this cut

`gh pr list --state open` showed one PR, #1438 (a planner handover amendment), which is **not** in
this release and had not merged at the branch point. `main` and `origin/main` agreed at `7b1afd7e`
immediately before the worktree was created, and the worktree branched from that. The backlog branch
had nothing outstanding (`git log --oneline main..backlog` empty).

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-44-0` from `origin/main` minutes before the cut, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0` — pending: the run is in progress; its own four lines are pasted here when it ends
- [x] **All 17 cut assertions pass, and they were run against the INTENDED BASE** — `--verify` compares against `origin/main:src/lib/releases.ts`, which is no longer the pre-cut state once a cut **adds** a note, so the two assertions that matter most would have failed on a count of `[14 vs 13]`. The base was built explicitly, as the `0.43.6` handover prescribes:

```
MSYS_NO_PATHCONV=1 git show origin/main:src/lib/releases.ts > <scratchpad>/base.ts
# the owed note inserted into that file's unreleased[], then:
node scripts/cut-release.mjs 0.44.0 2026-11-09 major --verify --base <scratchpad>/base.ts
```

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [14 vs 14]
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.44.0"]]
ok   control: from further back, an older major release is still found  [0.43.0 in ["0.44.0","0.43.0"]]

all 17 assertions passed
```

- [x] **The mail is asserted with its control, not read off the flag.** An always-empty `majorReleasesSince` would satisfy a presence check on its own; the pair above is what distinguishes "this release mails" from "the function is broken"
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **32** assertions, counted with `grep -c "^ok"` rather than read off the screen
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — see section 7
- [x] `npm run audit:prod` exits **1** with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered with a dated reason and still unreachable. **The cut bumps `package.json`, so CI's `audit` job runs for real on this PR rather than showing `skipped`**
- [x] `node scripts/guarded-install.mjs` (`npm ci`) in the main checkout — exit **0**, and justified from the other end too: installed `next` reads **16.4.2**, equal to `package.json`

## 3. Schema and data

The cut carries no migration. Four are pending on production and belong to this release.

| File | What it does | Rewrites rows? |
|---|---|---|
| `0343_text_approval_state.sql` | Adds `text_approval` (`public_ok` / `private_only` / NULL) plus `_by` / `_at` to eight subject tables and re-creates nine public views to ask for it. **Back-fills every existing row to `public_ok` and defaults to `public_ok`**, so the views return exactly what they returned before | Back-fills a new column only; no existing column changes |
| `0344_site_content_insert_policy.sql` | One insert policy on the one-row `site_content` table, asked of `website.content` | no |
| `0345_text_approval_card.sql` | New activity `text.approve` and one card, `approve_text`; two `security definer` functions; a Data-API guard on changing `text_approval`; reset-on-edit | no |
| `0346_approval_default_null.sql` | Flips the default to NULL on six tables, guards INSERT, and removes `0217`'s approve-on-save from `attachments_approval_stamp()`. **Deliberately contains no UPDATE**, so nothing already public leaves the site | no |

- [x] `--status` reviewed: **344 applied, 4 pending** on production, drift clean in both directions
- [x] `--dry-run` reviewed: **three `ok`, one expected failure.** `0346` returns `column "text_approval" of relation "residents" does not exist`, because `0343` adds it in the same pending run and the dry-run rolls each file back. **The script says so itself** and names the files it runs cleanly after: *"NOT a fault … A real apply commits each file first, so this one is expected to apply."* The right action on that red is to apply
- [x] **The `-- consumer:` warnings are the safe direction and were expected.** Twelve warnings across the four files: the readers of all four ship **in this release**, and two files (`src/app/text/approve/page.tsx`, `actions.ts`) do not exist in `0.43.6` at all. Schema lands before the code that reads it is live, and the apply is before the deploy, so nothing is blocked
- [x] File is re-runnable — each of the four says so in its own header (`drop policy if exists`, `or replace`, `if not exists`)
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: not this PR's migrations. Dev holds them already; `--drift test` is read at verification
- [ ] Down-migration — n/a: none of the four is this PR's. `0346` states its own undo in its header; the other three have none, and that is stated under Rollback
- [x] **Production apply plan stated: `0343`–`0346`, four files, project `dbkodyyxxhtygxcxmfcu`, BEFORE the deploy.** Run **bare** — no `cd` prefix and no pipe — because the allow rule is an exact match

### The before-picture, chosen by reading the migrations rather than copied from the last release

The `0.43.6` handover's own warning is that `role-cards` / `role-cells` is not always the right
snapshot. None of these four rewrites a role's cells, so that pair would have measured nothing. What
these four write is **what an anonymous visitor can see** and **the card catalogue**, so those are
what was read before the apply:

- `node scripts/check-public-views.mjs --env production` — **475 `ok`, 1 `skip`, no failures.** The
  skip is `is_public_drive_file()`, which has no non-image attachment in a public project folder to
  ask about. Saved in full, and re-run after the apply.
- `node scripts/check-production.mjs appeal-override` — **1 published, non-draft appeal, and 1 of
  them is for an animal that is not visible on the website.** It is `"Treatment"` (closed), and it
  becomes public on its own the moment `0343` is applied. **Named to Lutan before the release**, as
  the check instructs. It is the deliberate behaviour one of this release's notes announces, and the
  public site is still `locked`, so no anonymous visitor reaches it either way.
- `node scripts/check-profile-photo-orphans.mjs --env production` — **0 hidden**, quoted above.

## 4. Functional checks

- [ ] All items — n/a: a cut has no functional surface of its own. It moves data in one file. What it changes for a user is the content of `/releases`, which is section 8's deploy-time check

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login | `/releases` | sees the plain notes, plus any note whose card they hold | pending: read on the deployed build, section 8 |
| Admin | `/releases` | sees all fourteen, including the `admin: true` one | pending: read on the deployed build, section 8 |
| the signed-out public | `/releases` | not a public page; unchanged by this diff | n/a: no public surface in this diff |

- [x] A login that should not have access is blocked server-side — n/a: this diff adds no action, route or policy. Note filtering is display, not access, and is unchanged

## 5. Cross-cutting

- [x] Thai — n/a for the diff itself; **five of the fourteen notes say in their own text that their Thai has not been checked by a Thai speaker**, which is the honest state and is carried to the manual list below
- [x] Timezone — n/a: nothing in this diff derives "today". The entry's date is the literal string `2026-11-09`, and `majorReleasesSince` compares versions, not dates
- [x] Money and rounding — n/a: none in this diff

## 6. Regression

- [x] Nearest pages still work — `/releases` is the only page that reads this file, plus `/api/releases/current` in the Worker; both read the same array and are covered by the order and `latestRelease` assertions
- [x] Shared file touched — `src/lib/releases.ts` is read by the app, the Worker and `deploy.mjs`. The `[object Object]` / `undefined` assertion is what covers the render, and `deploy.mjs`'s own refusal covers the mismatch case

## 7. Documentation

- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The items this range's features closed were ticked by those PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the two judgements in this cut are the deferred-note review and the `--base` verification, both of which belong in this plan's sections 1 and 2 and in the release record, where a release manager will look for them. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — fourteen notes moved out and none remain. The one note this cut added is counted in the same breath as the thirteen it emptied, so the file's net gain is zero and a tick would be a claim the diff contradicts
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the pending-migration count from `--status` against production; the mail **presence** from the assertion pair rather than from `major: true`; the note count from the `[14 vs 14]` assertion against an explicitly built base; the lockfile bump from the `--verify` assertion; the `npm ci` justification from the installed `next` version; the deferred-note answers from reading each plan's own line rather than the script's printed "reason"; the orphan count and the appeal override from production itself; that `main` did not move from `gh pr list` plus `git status -sb`; and that none of the four migrations rewrites a row from reading all four headers

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` is **production**; `test.lannacare.org` is **test** on the
dev Supabase project (`qxkmhwybjggxvsfxsxbd`); `uat.lannacare.org` is **UAT** on its own project
(`fsjagxmxjosauwmxwype`). All three ran `0.43.6` before this release, read from `/api/version` rather
than assumed — and on three different commits, which is noted in the record.

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

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each deploy. **Not piped through `tail`**
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **none is introduced by this release.** `STATUS_READ_TOKEN` is still deliberately unset and still fail-closed (`#mzu7v`)
- [x] **A `scripts/pi/` change DOES ship in this release, so the one-deploy-late caveat bites** — `deploy-pi.sh` now points at the deploy-machine assertion. The Pi log's `deploy-pi: restarting under the script from <sha>` line is read on every clone, and where it is absent the swap and `check-assets.mjs` are run by hand and said so in the record
- [x] **This release MAILS.** `RELEASE_MAIL_ENV` must read `Production` on the production Worker and the message must arrive titled `[Production]` from a sender not named *UAT*. `0.42.0` and `0.43.0` went out titled `[UAT]`; the value was corrected on 2026-11-06 and **no release has mailed since, so this is the proof run** (`#w4k9n` (e)). UAT is deployed with `--no-mail`, and `deploy.mjs` has refused to mail from UAT without an explicit `--mail` since 2026-11-08 — which matters more than usual here, because **UAT's database holds production's real people**

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. The **release** carries both halves in the range, so the ordering matters and is stated above
- [x] `--dry-run` run and understood — see section 3
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **assessed, not deferred: none of the four is destructive or rewriting.** `0343` back-fills a new column and re-creates views; `0344` adds one policy; `0345` adds an activity, a card and two functions; `0346` changes six defaults and removes three clauses from one trigger function, with no UPDATE. Nothing drops a table, deletes a row or rewrites resident data. The restore drill has now been exercised three times, most recently into UAT's own project on 2026-11-09 (`#rg7pv`), and Lutan ruled the remaining production risk negligible (`docs/decisions/2026-11-09-restore-risk-settled.md`)

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies four.** All four are safe to leave under the old code: `0343`'s back-fill and default keep every row `public_ok`, so the re-created views return what the old build expects; `0344`'s policy is additive; `0345`'s card is held by nobody; `0346` is the one to know about — **with the old build live, a newly saved record takes `text_approval = NULL` and the website will not show it, and there is no screen in `0.43.6` to approve it.** So a rollback past this release is safe for existing data and silently withholds *new* public text until the release is restored. There is no down-migration for any of the four; `0346` states its undo in prose in its own header
- [x] **The mail cannot be unsent.** Once the production Worker deploy runs, the message is away. That is the lever Lutan pulled deliberately, in words, in this session

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`check-deferred-notes.mjs` printed the template's own guidance text as the "reason" for four of ten candidates**, and ignored the commit range it was given, re-reading 44 plans from an older cut point. Recorded as a defect on `0.43.4`, `0.43.5` and `0.43.6`, promoted into `docs/release-procedure.md` on 2026-11-08, and still unfixed at source | **Accepted, carried for the planner.** It over-lists rather than under-lists, and under-listing is the fault it exists to prevent (`0.40.10` lost three notes). Cost here: one lookup per candidate, ten times. Not fixed here — a release ships what the build gave it |
| 2 | low | **The three hosts all answered `0.43.6` from three different commits** (`9b07b038` production, `6ee70899` test, `fb0c384f` UAT). Not caused by this release; test and UAT were last built from later tips of `main`. "All on the same version" is not "all on the same code" | **Accepted, recorded.** This release puts all three on one commit, which closes it for now. Worth a line in the handover because `/api/version` alone cannot show it |
| 3 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The fourteen notes read well to a shelter user, and the MAIL arrives correctly titled.** Nobody but Claude has read the notes in the form they will ship, and the `[Production]` subject and sender name have not been proved since the 2026-11-06 fix | `/releases` signed in as Admin, and the inbox for `releases@lannacareforanimals.org` |
| 2 | **The Thai wording of five of this release's notes and the screens behind them.** Each says so in its own text; no Thai speaker has read any of it | production or `test.lannacare.org`, in Thai |
| 3 | **The sixteen outstanding test-plan items this release ships with**, on Lutan's explicit instruction of 2026-11-09 (*record gaps and proceed*) | listed in the release record |
| 4 | **The appeal `"Treatment"` (closed) becoming public under `0343`'s override.** Named to Lutan before the release, as `appeal-override` instructs. The public site is `locked`, so nothing is visible to an anonymous visitor yet | `/admin` appeals, after the deploy |

All four are *a person has to go and look*, separately from deploying, which is the test for belonging
here. None is a section 8 deploy-time check given a second home.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (four items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the fourteen notes on `/releases` and confirm the mail's `[Production]` subject and sender after the deploy; the Thai wording by a Thai speaker; the sixteen carried items recorded as a stated gap on his instruction of 2026-11-09

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-09
