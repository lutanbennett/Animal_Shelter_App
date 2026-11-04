# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.42.0`: move the nine notes in `unreleased` into a new entry, empty `unreleased`, bump `package.json`. `major` — **it mails**, on Lutan's answer |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-42-0` @ `C:\Development\Animal_Shelter_cut-release-0-42-0` |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-04 |
| Carries a migration? | no — `0306`, `0307` and `0308` came in with #1241, #1244 and #1249 and are applied from the main checkout at step 5 |
| Tested at SHA | `f6f943dd` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — nine notes sit in a new `0.42.0` entry dated 2026-11-04, `major: true`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, this plan. Nothing else
- [x] Cards affected identified — **none.** No card, activity, cell or control changed in this PR, and no migration in this release adds a card or an activity (checked: no `insert into cards`, `insert into activities` or `card_grants` row in `0306`–`0308`). A release note is shown to whoever holds one of its `cards` tags and always to Admin; an untagged note is everyone's. Admin is unaffected
- [x] Anything explicitly **out of scope** written down — the three production migrations, both Worker deploys, both Pi builds, the cache purge, the home-icon sync and the verification, all of which follow this PR's merge; and the 8 plans signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut from a freshly fetched `origin/main` (`5501f10d`) minutes before, so there was nothing to merge in. Re-checked after the gates: `origin/main` is still `5501f10d`, so nothing landed underneath this branch. Recorded rather than ticked silently
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code. The run's own per-gate lines and closing line are pasted below, from the full log rather than a `tail`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

```
=== gates: typecheck exited 0 after 57s
=== gates: lint exited 0 after 127s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 139s
gates: typecheck=0 lint=0 test=0 build=0
```

**All four numbers read from the script's own output, in a full log rather than a `tail`** — the trap the runbook names, and the practice the last handover asked for by name. This run was redirected to a file in the scratchpad, so each gate's own `exited 0 after <S>s` line survives rather than scrolling out. The build is a **cold** Turbopack cache: this worktree was created by `worktree.mjs new` minutes earlier, so nothing was warm.

`lint` reported **74 problems, 0 errors, 74 warnings** — all pre-existing unused-variable and unused-directive warnings across `scripts/` and `src/`, none introduced by this PR, which touches no code. Warnings do not fail the gate and its exit code was 0.

`node scripts/check-release-guards.mjs` **exit 0**, run on its own after the gates — all **16** assertions `ok`, the script printing no summary line of its own. It also runs inside `lint`, where its assertions printed in this run, including `a migration the database lacks is refused`, `--force without a reason is refused`, `production file refused for test, filename named` and `test file refused for production`.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.42.0 2026-11-04 major --verify` — **all 16 assertions passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.42.0]
ok   new entry has the requested date  [2026-11-04]
ok   new entry's major flag matches  [true]
ok   new entry has a title
ok   version is newer than the previous release  [0.41.3 -> 0.42.0]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [9 vs 9]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.42.0]
ok   no [object Object] or undefined in the entry
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.42.0"]]
ok   control: from further back, an older major release is still found  [0.41.0 in ["0.42.0","0.41.0"]]

all 16 assertions passed
```

**This cut needed no `--base` file.** `--verify` ran against `origin/main` directly, because not one note was written in the cut — all nine came from the streams that did the work. So *every note carried across character-identical* and *nothing invented [9 vs 9]* are assertions against `origin/main` itself, which is the stronger form. Two of the last three cuts needed a hand-built base; this is the second running that did not.

**The mail check is the presence-plus-absence pair** the runbook requires, because an always-empty `majorReleasesSince()` would satisfy either half on its own. This is a mailing release, so the presence assertion is the load-bearing one — `majorReleasesSince("0.41.3")` is exactly `["0.42.0"]` — and the control asserts the function still finds `0.41.0` when asked from further back. Both printed above.

### Why `major: true`, and why the question put to Lutan was not "major or minor"

He asked for "a minor release". That word cannot be acted on here, and the runbook says so: in his usage *minor* is the middle-number bump, while in `src/lib/releases.ts` `major` means **worth an email**. The two readings disagree — `0.41.0` was a middle-number bump that mailed, `0.40.1` a last-number bump that did not — so the word fits a release that mails and one that does not.

The prescribed question was asked instead, with the words removed: **should this release email you?**, naming what the nine notes say, that the mail reaches **one** person rather than every admin (the shelter's own address is not on the production admin list), and that it cannot be unsent once the production deploy runs. He answered **yes**.

So `0.42.0` with `major: true` — the middle-number bump he asked for and the mail he chose, which agree. **The trap fired for the second release running and the prescribed question defused it in one round again.**

### The deferred-note review, and why no note was added here

`node scripts/check-deferred-notes.mjs` listed **nine** candidates over `45c6513c..HEAD`, four flagged as possibly owing a note. `cut-release.mjs` refused to write until a review was supplied; the full text went to `--deferred-reviewed` and is in the commit message and the PR body.

**The window is much narrower than last release's 48**, which is worth recording rather than leaving as a surprise in either direction.

**Three of the four flagged print the plan template's own boilerplate instead of a reason**, which is exactly what the last two handovers warned about — so each was read in its plan rather than in the excerpt:

- `bills-interface-half` (#1245) — its plan **ticked** the release-notes line. Its note IS published in this cut (Bills settings). The script matched template text, not a reason.
- `utilities-app-half` (#1250) — likewise ticked; its note IS published in this cut (the Utility bills page).
- `record-attachment-fixes` (#1241) — real reason, correctly withheld: *a database guard nobody sees; the visible half shipped in 0.41.x via #1233*.
- `record-0-41-3` (#1240) — real reason, correctly withheld: a release record and a handover, neither served, imported nor rendered.

Of the five skimmed, `bills-lines-schema` (#1249) withheld its note pending the app half — and **the app half is in this release** (#1253), whose note is published here. The rest (`doctor-insert-as-caller`, `planner-handover`, `plan-day-priorities`, `poodle-drawings`) are either genuinely invisible or, in the poodle case, boilerplate again with its note published in this cut.

**Nothing is owed.** Mapping the nine notes onto the 14 PRs in `befdeeb8..HEAD` leaves five with no note — #1240, #1241, #1247, #1249, #1251 — and each is accounted for above. So every user-visible change in the range has a note, and no note promises something a deploy has not yet made true.

**No note is ticked on the §7 release-notes line below**, and that is correct rather than an oversight: the checker holds that line to the diff, and a cut **empties** `unreleased`.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. For the release record: `0308` is the highest on `main`, so the next free number is `0309`, and unlike two releases ago there is no stale row to avoid — dev reads 309 applied of 309 files with `applied here, no file on origin/main: 0`
- [x] `--status` reviewed before applying — n/a as this PR's own step; done for the release: production reads **306 applied, 3 pending** (`0306`, `0307`, `0308`), with nothing applied that has no file on `origin/main`
- [x] `--dry-run` reviewed — n/a as this PR's own step; done for the release: all three **ok, exit 0**, with three `-- consumer:` warnings, every one expected because this release carries the readers. Proved rather than assumed: the three files that warned (`videos/finish/route.ts`, `bills/[kind]/[id]/route.ts`, `admin/intake-date/actions.ts`) all changed in `befdeeb8..origin/main`, and `0307`'s fourth declared consumer `admin/intake-date/page.tsx` printed **no** warning because it is unchanged since `0.41.3` — the benign case the runbook names, confirmed with `git diff --stat`
- [ ] Applied to **dev** — n/a: all three were applied to dev by their own streams. `--drift test` ends `No drift: test matches origin/main`, 309 of 309, `0` in each direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR. The harnesses are recorded in `docs/test-plans/record-attachment-fixes.md`, `intake-date-deceased.md` and `bills-lines-schema.md`
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own migration; the release's plan is `0306`, `0307` and `0308` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before either deploy**, because this release carries the code that reads all three

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — n/a as written; the equivalent here is that the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state, and the state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `cut-release.mjs` **refused to write** at the deferred-notes guard until all nine candidates were answered
- [x] Boundary cases checked — the version boundary both ways (`0.41.3 -> 0.42.0` is newer, the file order still matches `compareVersions`) and the mail window from both ends (exactly `["0.42.0"]` from `0.41.3`, and `0.41.0` still found from further back)
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode — a note lost, altered or invented — and asserts no `[object Object]` or `undefined`. All nine notes' wording was written and reviewed in the PR that added it. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed in this PR. Reported by card rather than by role, as `CLAUDE.md` requires: the question a cut can be judged on is *which card does each note name*, not which role holds it this week.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | `/releases` | all 9 notes — Admin sits outside the card system and sees every card-tagged line, and the Admin-only note too | n/a: no gate changed |
| holds `record_delivery` | `/releases` | the several-items-per-bill note, plus the untagged ones | n/a: no gate changed |
| holds `utility_bills` | `/releases` | the Utility bills note and the Bills settings note, plus the untagged ones | n/a: no gate changed |
| holds `correct_intake_date` | `/releases` | the deceased-intake-date note, plus the untagged ones | n/a: no gate changed |
| holds none of the tagged cards | `/releases` | the untagged notes only, and **not** the Admin-only note | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed. **One note in this release is the first ever to carry `admin: true`** (#1248), so the bottom row of this table is a new behaviour — but it is new in #1248, which has its own plan and its own `pending:` signature for exactly this check, not new in the cut. The cut only moves the note
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change, but worth stating: release notes are **not** translatable labels and never have been. They are English prose in `src/lib/releases.ts`, which is why `check-thai-dictionary.mjs` and `translations-unlisted` do not list them. Six of the nine notes say in their own wording that their Thai has not yet been read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled `/releases` and `/api/releases/current`, the two readers of this file, with the new entry in place. A malformed entry fails `typecheck`, which exited 0
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. **The third is the one that matters on this cut, because this release mails**, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls to decide whether to send
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `5501f10d`, which was still `origin/main` after the gates finished

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item
- [x] Non-obvious design choices recorded — the email question and why it was not put as "major or minor", the deferred-note review, and the `--base`-not-needed point are in this plan and the commit message; the release's own paper is `docs/releases/2026-11-04-0-42-0.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The nine notes this release publishes are the point of the PR; none was written here, which is why this cut needed no `--base` file
- [x] Commit messages say why, not just what — the commit explains why the question put to Lutan was *should this release email you?*, the presence-plus-absence mail pair, and the full nine-candidate deferred-note review
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes with their own timings, the 16 cut assertions, the guards run, production's `--status` and `--dry-run` with the consumer warnings matched file-by-file against `git diff`, `--drift test`, `check-production.mjs all`, and the live `/api/version` reading on both environments

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `f6f943dd`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's **merge commit**, not `f6f943dd`, and the record states both, with the code-identity diff between them

### On the deployed build

- [ ] Deployed to test — deferred: this session, after the production Worker deploy reports. **Test goes after production, not alongside it**: both run `next build` in the main checkout, and `0.40.9` lost a ten-minute deploy to that collision
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the release entry's own `2026-11-04`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are both asserted in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the per-gate lines and closing line, the 16 assertions and the guards run are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so an anonymous visitor reaches only the gate — **with the exception that matters this release**: the Donate, Foster, Volunteer and About pages now show a poodle drawing when no photo is chosen, which is in a note

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, read live from Lutan's terminal rather than inferred from the log file, because `Tee-Object` buffers and the log is absent from disk for the whole build
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — **none added or removed** by this PR or by any PR in the release range: no line adding a `process.env` or `env.` read appears in `befdeeb8..origin/main` across `src/`, `worker/` and `wrangler.toml`. Nor did `scripts/deploy.mjs`, `worker/` or `scripts/pi/` change at all in this range, so no deploy-script caveat applies and the Pi guards are already live

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release does, all three**, and the ordering is stated: `0306`–`0308` are applied before either deploy
- [x] `--env production --dry-run` clean — run before this plan was written: all three **ok, exit 0**, output summarised in section 3
- [ ] Backup fresh for a destructive migration — n/a: all three are additive or rebuild a function in place. `0306` rebuilds `record_attachment()` from its `0278` definition and adds bill owner types, `0307` lets a deceased resident's intake date be corrected under the existing card, `0308` gives a delivery a parent invoice. Nothing deletes rows
- [x] Apply plan stated — `0306`, `0307` and `0308` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** either deploy

### Rollback

- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref befdeeb8` on both Pi clones returns users to `0.41.3`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0306`–`0308`**, and nothing needs them to: all three are additive or rebuild a function, and the `0.41.3` build reads none of the new columns. **What a rollback cannot undo at all is the email**, which is why it was put to Lutan before the cut rather than after

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `cut-release.mjs` refused to write until all nine deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and the PR body |
| 2 | none | `release-prs.mjs` exits 0 but is short one PR — #1247, a squash-merged planner handover with no migration and no test plan for its cross-check to find it by | **Not this PR's defect, and now four releases running.** Added by hand after confirming it is in range with `git merge-base --is-ancestor` both ways. Its exit 0 is correct rather than reassuring |
| 3 | none | `check-deferred-notes.mjs` still prints the plan template's boilerplate instead of a reason for three of its four flagged candidates | **Known and carried.** Read the plan, not the excerpt. The window itself narrowed sharply this release, from 48 candidates to 9 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The nine notes read well to you, **and the email reads well**, since this release mails. None was written by this session — each came from the stream that did the work | `/releases` signed in, and the message from `releases@lannacare.org` with `0.42.0` in its subject |
| 2 | The poodle drawings on the Donate, Foster, Volunteer and About pages, since that is the note in this release touching what a visitor could see | `lannacare.org` those four pages, after the deploy |

Everything else a person would look at in this release belongs to the 8 plans signed `pending:`, which are **not** copied here: they have their own plans and their own signatures, and the release record groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: both items are post-deploy glances, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the nine notes on `/releases` and the `0.42.0` email after the deploy, and looking at the poodle drawings on the four public pages

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-04
