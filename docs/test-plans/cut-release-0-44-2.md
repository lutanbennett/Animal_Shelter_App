# Test plan — cut release `0.44.2`

## Header

| | |
|---|---|
| Feature | Cut `0.44.2`: three notes move from `unreleased` into a new entry, `unreleased` is emptied, `package.json` and `package-lock.json` bumped. **It does NOT mail** (`major: false`) |
| Backlog item | `docs/backlog.md` → none. A release cut is procedure (`docs/release-procedure.md`), not a backlog item |
| Branch / worktree | `claude/cut-release-0-44-2` @ `C:\Development\Animal_Shelter_cut-release-0-44-2`, port `3009` |
| Dev server | n/a: not started. A cut changes one data file and two version fields; nothing renders differently in `next dev` that the deployed build will not show better |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-11 |
| Carries a migration? | **no** — the cut adds no migration file. **Three migrations written by earlier PRs (`0350`–`0352`) are pending on production AND on UAT** — the same three on both, read from `--status`, not assumed — and are applied as a release step, before the deploy |
| Tested at SHA | `b4e076a5`. The four gates ran against that commit's tree **except for this markdown file**, which was written while `build` was running and committed with the cut: no code, data or config differs between the tested tree and the commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan: *"Let's do a minor release no email. Outstanding open tests logged as gap"*. **The email is the answer the procedure asks for**, given in words and unprompted, so `major: false`; `major` in this repo means *worth an email*, and a non-mailing release moves the **last** number, so `0.44.1` → `0.44.2`. The words "major or minor" were never offered as a question, which step 4 forbids. The same sentence pre-answered the `pending:` test-plan decision, as it did on `0.44.1` — **two releases running where his opening message answered both decisions**
- [x] Files/areas touched listed — exactly three: `src/lib/releases.ts` (the new entry only; **no note was added this time**), `package.json`, `package-lock.json`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Cards affected identified — **none.** No card, activity or cell is touched by this diff. All three notes are plain strings shown to everyone; none is card-tagged and none is `admin: true`. Admin sees every note through the `perms.isAdmin` short-circuit, untouched. The signed-out public is unaffected: `/releases` is not a public page
- [x] Anything explicitly out of scope written down — **this cut fixes no defect and writes no code**, and unlike `0.44.1` it does not even write a note, because none was owed (below). Defects are recorded below and none is fixed here, because a release ships what the build gave it (`docs/release-procedure.md`, "A release cuts what the build gave it")

### What is in the release

`node scripts/release-prs.mjs cc1349cb HEAD` exits **0** with **14 PRs**, #1457–#1470, and checks **17**
added migration and test-plan files against that list. Four were resolved from GitHub (squash/rebase, no
merge commit in git); the rest from git.

**The range start is unambiguous this time, and that is a change worth noting.** `0.44.1` deployed from
**one** commit on all three hosts, so "the previous deployed SHA" is a fact rather than a choice —
`cc1349cb`, confirmed from `/api/version` on production, test and UAT before the cut. `0.44.0` deployed
from four commits and `0.44.1`'s plan had to argue for which one to use.

### The deferred-note review: nothing was owed, and the one that mattered was MEASURED

`cut-release.mjs` runs `check-deferred-notes.mjs` before it will write a byte and refuses while a
candidate has no answer. **Eleven** candidates were listed — but **only five are in this release's
range**, because the script again ignored the range it was given and re-read 32 plans from `75daad3f`.
The six strays (`card-names-on-screen`, `planner-handover-736`, `public-cards-gate`,
`receipt-attach-phone`, `record-0-44-0`, `suppliers-cleanup`) all belong to `0.44.1`'s range and were
each answered in its cut plan; `public-cards-gate`'s owed note shipped there, and
`receipt-attach-phone` is still open on its phone check. **Nothing about them has changed.**

The five that are genuinely this release's:

- **`public-visible-one-expression` — NOTHING OWED, AND THAT WAS MEASURED RATHER THAN REASONED.** Its
  reason has two clauses: *"no appeal is running on production today, so nobody would notice until the
  first one; and the production apply is still outstanding"*. This release applies `0350`, so the second
  clause closes — and the first is **a condition a read-only script can settle**, which is exactly what
  `0.44.0`'s handover says to look for. `node scripts/check-production.mjs appeal-override` reads
  **0 running, text-approved appeals on production**, and prints *"No animal is public through an appeal
  alone."* So `0350`'s widening — an animal under a running appeal now also gets its own public profile
  page, not just an enclosure listing — **has no subject today and changes nothing any user can see.**
  **And the rule itself was already announced:** `0.44.1`'s own note told users the website shows an
  animal only if it is ready for adoption or has an appeal still running. `0350` makes
  `public_resident_profiles` obey the rule that note described, rather than introducing a new one. A
  note here would re-announce it.
- **`th-path-locale` — STILL OPEN, and left.** Its reason is *"slice A is the routing mechanism only;
  nothing visible until slice B"*, and slice B of `#t48xh` is **not in this release**. Not closed; the
  note stays with the PR that closes it.
- **`control-drive-24-pages` — nothing owed; the script mislabelled it.** Its release-notes line is
  **ticked**, not `n/a`, and reads *"one line added to `unreleased`"* — the supplier-page and Who-does-what
  note, which ships in this entry.
- **`control-drive-remainder` — nothing owed.** `n/a: no user would notice, the hint only stops showing
  to logins without a Save button`. No step outstanding.
- **`record-0-44-1` — nothing owed.** A release record and handover; nothing served, imported or rendered.

**Because no note was added, `origin/main:src/lib/releases.ts` IS the intended pre-cut base**, so plain
`--verify` and `--base` are equivalent here. The base was still built and passed explicitly, to keep the
method uniform rather than to argue each release about whether it is needed.

### `main` did not move under this cut

`gh pr list --state open` returned **nothing** — no open PR at all, the same as `0.44.1`. `main` and
`origin/main` agreed at `b4e076a5` immediately before the worktree was created, and the worktree branched
from that. The backlog branch was folded in first (one commit, `b4e076a5`), `check-backlog-sections.mjs`
passed with **49 open items, all above `## Completed`**, and `backlog` was fast-forwarded to `main`
afterwards.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the worktree was created by `node scripts/worktree.mjs new cut-release-0-44-2` from `origin/main` minutes before the cut, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, every exit code `0`. **All four numbers read, not three**, and the script's own status read separately from the shell's:

```
=== gates: typecheck exited 0 after 38s
=== gates: lint exited 0 after 130s
=== gates: test exited 0 after 26s
=== gates: build exited 0 after 133s
gates: typecheck=0 lint=0 test=0 build=0
GATES EXIT=0
```

**The run was driven by reading its own log** rather than waited on, which is the `0.44.0` lesson the handover carries as item 8
- [x] **All 17 cut assertions pass, run against an explicitly built base:**

```
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [3 vs 3]
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.44.0 in ["0.44.0"]]

all 17 assertions passed
```

- [x] **The absence of mail is asserted with a presence control, not read off the flag.** An always-empty `majorReleasesSince` would satisfy the absence check on its own; the pair above is what distinguishes "this release does not mail" from "the function is broken". **On a minor release this is the single easiest check to fake**, which is why it is quoted rather than summarised
- [x] `node scripts/check-release-guards.mjs` — exit **0**, **32** assertions, counted with `grep -c "^ok"` rather than read off the screen
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**, *"the plan is complete and correct"*, with items reported as awaiting a person and pre-production gates as deferred to the release. Both of those states pass on purpose since 2026-11-05 (`docs/decisions/2026-11-05-test-plan-pending-and-unfinished.md`)
- [x] `npm run audit:prod` exits **1** with 5 vulnerabilities (1 moderate, 4 high); `npm run audit:register`, which is what CI runs, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered with a dated reason and still unreachable. **The cut bumps `package.json`, so CI's `audit` job runs for real on this PR rather than showing `skipped`** — and skipped is not a pass
- [x] `node scripts/guarded-install.mjs` (`npm ci`) in the main checkout — exit **0**, and justified from the other end too: installed `next` reads **16.4.2**, equal to `package.json`

## 3. Schema and data

The cut carries no migration. Three are pending on production **and the same three on UAT**, and all
three belong to this release's range.

| File | What it does | Rewrites or drops? |
|---|---|---|
| `0350_public_visible_one_expression.sql` | Creates `private.on_website` (a view of resident ids: adoption-ready **OR** a running, text-approved appeal) and makes **both** `public_enclosures` and `public_resident_profiles` ask it. `is_public_visible` is no longer read by the views, though both write paths still set it equal to `ready_for_adoption`. `public_resident_cards` deliberately unchanged, so the kennel card still answers for every resident | Re-creates two views and adds one. **Widening, not narrowing:** a profile page used to require `is_public_visible`; now a running appeal also qualifies |
| `0351_refusal_keys_photo_folders.sql` | `set_resident_drive_folder`, `shelter_photo_folder`, `set_shelter_photo_folder` and `set_hero_photo` raise refusal **keys** instead of English text — five raises in bodies otherwise unchanged from `0264`, `0219` and `0274` | Replaces four function bodies |
| `0352_unit_conversions_by_row_kind.sql` | `item_unit_conversions`' **write** policies asked `stock.diets` for every row, medicine rows included, while the app already asked `stock.medications` for a medicine. Drops `0145`'s unscoped policies (permissive policies OR together, so they must be dropped rather than supplemented) and replaces them with per-row-kind ones. `0340`'s ingredient-scoped policies and `0143`'s READ policy are left alone | **Drops and replaces three write policies.** This is a *narrowing* — a login holding only `stock.diets` can no longer write a medicine unit row |
| | | |

- [x] `--status` reviewed on all three databases: production **351 applied, 3 pending**; UAT **351 applied, 3 pending** — the same three; test **354 applied, 0 pending**. Drift clean in both directions on each. **UAT is level with production this time**, unlike `0.44.1` where it was a migration further behind
- [x] `--dry-run` reviewed on production: **all three `ok`**, with no expected-failure case, because none of the three depends on another
- [x] **The `-- consumer:` warnings and the ones that did NOT appear were both read.** Three warnings, all on `0351` (`src/app/api/medical/residents/[id]/photos/route.ts`, `src/app/api/photos/shelter/[id]/route.ts`, `src/app/admin/website/actions.ts`) — the **safe** direction, schema before the reader is live. `0350`'s five declared consumers and `0352`'s one printed **nothing**, which was checked rather than skipped: they are unchanged since `0.44.1`, so their readers were already live and the schema lands under code that already reads it. Over-predicting warnings is free; the point is that none surprises you
- [x] File is re-runnable — each of the three says so in its own header (`create or replace`, `drop policy if exists`)
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: not this PR's migrations. Dev holds all 354 already; `--drift test` is read at verification
- [ ] Down-migration — n/a: none of the three is this PR's. **All three state their own undo in prose**: `0350` (re-run `0347`'s and `0343`'s view definitions, then drop `private.on_website`), `0351` (re-apply the bodies from `0264`, `0219`, `0274` in a new file), `0352` (re-create `0145`'s unscoped policies)
- [x] **Production apply plan stated: `0350`–`0352`, project `dbkodyyxxhtygxcxmfcu`. UAT apply plan: the same three, project `fsjagxmxjosauwmxwype`.** Both BEFORE their environment's deploy. Run **bare** — no `cd` prefix and no pipe — because the allow rule is an exact match

### The before-picture, chosen by reading the migrations

`role-cards` / `role-cells` would measure **nothing** again — none of the three touches a role's cards or
cells. What these three write is **what an anonymous visitor can see** (`0350`), **two sets of function
bodies** (`0351`) and **the policy set on one table** (`0352`), so those are what was read before the
apply:

- `node scripts/check-production.mjs table-policy-commands` — **77 lines**, saved in full. **This is the
  one that should move, or at least be checked hard:** `0352` drops three write policies and replaces
  them. The check reports a command with *no live policy for anyone*, so if the replacement is correct
  the count should be **unchanged** — and an `item_unit_conversions` line appearing would mean the
  replacement left a command uncovered.
- `node scripts/check-public-views.mjs --env production` — **476 `ok`, 1 `skip`, 0 failures**, saved in
  full for a line-by-line diff. This covers `0350`'s two re-created views and `0351`'s four replaced
  function bodies.
- `node scripts/check-production.mjs not-listed-publicly` — **281 residents** in an enclosure neither
  adoption-ready nor under a running appeal. **This should NOT move**, because `0350` changes the profile
  view, not the enclosure view's membership — so an unchanged 281 is the evidence, and a change is the
  thing to explain.
- `node scripts/check-production.mjs appeal-override` — **0 running, text-approved appeals.** This is both
  a before-picture and the measurement that answered the deferred note above.

**What the before-picture still cannot cover, and it is unchanged from `0.44.1`:** `check-production.mjs`
refuses `--env uat` (`--env must be production or test`), so UAT gets no before-and-after at all. Filed as
backlog `#rv4qk` yesterday; **this release is the second to meet it**, and this time it costs more, because
UAT has the same three pending migrations and would have been a genuine second reading.

## 4. Functional checks

- [ ] All items — n/a: a cut has no functional surface of its own. It moves data in one file. What it changes for a user is the content of `/releases`, which is section 8's deploy-time check

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login | `/releases` | sees all three notes; none is card-tagged or admin-only | pending: read on the deployed build, section 8 |
| Admin | `/releases` | the same three | pending: read on the deployed build, section 8 |
| the signed-out public | `/releases` | not a public page; unchanged by this diff | n/a: no public surface in this diff |

- [x] A login that should not have access is blocked server-side — n/a: this diff adds no action, route or policy. Note filtering is display, not access, and is unchanged

## 5. Cross-cutting

- [x] Thai — n/a for the diff itself. **None of the three notes claims its Thai has been checked.** The Thai items this release carries (`refusal-keys-group-3`'s wording, `thai-added-since`'s worklist layout) are listed for manual verification rather than ticked
- [x] Timezone — n/a: nothing in this diff derives "today". The entry's date is the literal string `2026-11-11`, and `majorReleasesSince` compares versions, not dates
- [x] Money and rounding — n/a: none in this diff

## 6. Regression

- [x] Nearest pages still work — `/releases` is the only page that reads this file, plus `/api/releases/current` in the Worker; both read the same array and are covered by the order and `latestRelease` assertions
- [x] Shared file touched — `src/lib/releases.ts` is read by the app, the Worker and `deploy.mjs`. The `[object Object]` / `undefined` assertion is what covers the render, and `deploy.mjs`'s own refusal covers the mismatch case

## 7. Documentation

- [x] Backlog item ticked — n/a: a release cut closes no backlog item. The items this range's features closed were ticked by those PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the two judgements in this cut are the measured deferred-note answer and the before-picture choice, both of which belong in this plan's sections 1 and 3 and in the release record, where a release manager will look for them. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: a cut cannot tick this line, and must not. The checker holds it to the diff and a tick requires `unreleased` to have *gained* a line, while a cut's whole purpose is to empty it — three notes moved out and none remain, and **this cut added none**, so the file's net change is a loss of three
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — the pending counts from `--status` on all three databases; the mail **absence** from the assertion pair rather than from `major: false`; the note count from the `[3 vs 3]` assertion against an explicitly built base; **the deferred note's answer from `appeal-override` against production rather than from its reason's wording**; the `npm ci` justification from the installed `next` version; that the range start is unambiguous from `/api/version` on all three hosts agreeing on one SHA; and that `main` did not move from `gh pr list` plus `git status -sb`

## 8. Pre-production gate

**Host mapping:** `lannacareforanimals.org` is **production**; `test.lannacare.org` is **test** on the dev
Supabase project (`qxkmhwybjggxvsfxsxbd`); `uat.lannacare.org` is **UAT** on its own project
(`fsjagxmxjosauwmxwype`). All three ran `0.44.1` **from the same commit `cc1349cb`** before this release,
read from `/api/version` rather than assumed.

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

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager, at deploy time. **And the deploy's own exit code read, not the pipeline's**
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — deferred: release manager, on each deploy. **Not piped through `tail`**
- [x] **Any new secret/env var exists in the production Cloudflare environment** — **none is introduced by this release.** `STATUS_READ_TOKEN` is still deliberately unset and still fail-closed (`#mzu7v`)
- [x] **No `scripts/pi/` change ships in this release**, so the one-deploy-late caveat does not bite — `git diff --name-only cc1349cb..HEAD -- scripts/pi/` is empty. The Pi log's `deploy-pi: restarting under the script from <sha>` line is still read on every clone, because an absent line means the release's guards did not run
- [x] **This release does NOT mail.** `major: false`, asserted with its control above. UAT is still deployed with `--no-mail` written in words — and `0.44.1` established that on a minor release the `major: false` check answers **before** the flag is reached, so the flag is belt rather than braces here. **It is written anyway**, because on a mailing release it is the only thing between a test site holding production's real people and every real admin's inbox

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No — this PR contains neither. The **release** carries both halves in the range, so the ordering matters and is stated above
- [x] `--dry-run` run and understood — see section 3
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — **assessed, not deferred: none of the three is destructive.** Nothing drops a table, a column or a row. `0350` adds a view and re-creates two; `0351` replaces four function bodies; `0352` drops three **policies** and replaces them in the same file, which is a permission change rather than data loss and is reversible by re-creating `0145`'s definitions. **This is a real difference from `0.44.1`, which carried `0348` — irreversible, and recorded as such.** The restore drill is exercised and the remaining production risk was ruled negligible by Lutan (`#rg7pv`, `docs/decisions/2026-11-09-restore-risk-settled.md`)

### Rollback

- [x] Rollback position stated, including what it does not cover — production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi, a rebuild; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts a migration, and this release applies three to each of production and UAT.** All three are safe to leave under the old build: `0350` widens what the public views return and `0.44.1`'s app reads those views either way, with the only effect being that an animal under a running appeal keeps a public profile page — and there are **0 running appeals**, so the practical effect is nil; `0351` makes four functions raise keys instead of English, and the worst case under the old build is a refusal shown as its key; `0352` narrows who may write a medicine unit row, which the old app already assumed. **Each has a written undo in its own header**, which is better than `0.44.1`'s position, where `0348` had none
- [x] **Nothing is mailed, so there is no unsendable consequence.** The lever that cannot be taken back on a mailing release is absent here by Lutan's instruction

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`check-deferred-notes.mjs` again ignored the commit range it was given** — it re-read **32** plans from `75daad3f` against this release's **14** PRs, so **six of eleven candidates belonged to `0.44.1`'s range** — and again printed the template's own guidance text as the "reason" for four of them. Recorded on `0.43.4`, `0.43.5`, `0.43.6`, `0.44.0` and `0.44.1`; promoted into the runbook 2026-11-08; still unfixed at source | **Accepted, carried for the planner.** It over-lists rather than under-lists, which is the right way round — `0.44.1` is the standing proof, where one over-listed candidate was a genuinely owed note. Cost here: eleven lookups for five real questions. Not fixed here: a release ships what the build gave it |
| 2 | low | **`check-production.mjs` still refuses `--env uat`**, so UAT got no before-and-after for three pending migrations. Filed yesterday as backlog `#rv4qk` from `0.44.1`, where it also bit | **Accepted, recorded for the second release running.** It costs more this time: UAT carries the same three migrations as production, so a second independent reading was available and could not be taken |
| 3 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | Not a stop. `npm run audit:register`, which is what CI runs, exits 0: one high advisory registered with a dated reason and a decision file, and still unreachable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The three notes read well to a shelter user.** Nobody but Claude has read them in the form they will ship — and the same is still true of `0.44.0`'s fourteen and `0.44.1`'s six | `/releases` signed in as Admin |
| 2 | **The six outstanding test-plan items this release ships with**, on Lutan's instruction of 2026-11-11 (*outstanding open tests logged as gap*) | listed in the release record |
| 3 | **The Thai wording of the four photo-folder refusals `0351` converts to keys**, and the Thai worklist layout `thai-added-since` produces. No Thai speaker has read either | production or `test.lannacare.org`, in Thai |
| 4 | **`0352` narrows who may write a medicine unit row.** A login holding `stock.diets` but not `stock.medications` could write one before and cannot now. Settings → Units is Admin-only (`#j8vt4`), so this was proved at the database level and not on screen | Settings → Units, as a non-Admin holding only `stock.diets` |
| 5 | **The two cards from `0.44.0` are still held by nobody** — `approve_text` and `diet_settings` — so public text saved since that release is waiting with no one able to approve it. Not caused by this release, and **now carried for a second release running** | Settings → Who does what |

All five are *a person has to go and look*, separately from deploying, which is the test for belonging
here. None is a section 8 deploy-time check given a second home, and none of the other plans' outstanding
items is copied in — they belong to their plans and their signatures.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty (five items), so only the person who looked may tick it

Manual verification by: pending: Lutan to read the three notes on `/releases`; the Thai wording by a Thai speaker; `0352`'s narrowing on screen if he wants it seen rather than read in SQL; the six carried items recorded as a stated gap on his instruction of 2026-11-11

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-11
