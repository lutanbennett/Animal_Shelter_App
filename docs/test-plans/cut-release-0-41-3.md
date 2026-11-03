# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.41.3`: move the seven notes in `unreleased` into a new entry, empty `unreleased`, bump `package.json`. `minor` — **no mail** |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-41-3` @ `C:\Development\Animal_Shelter_cut-release-0-41-3` |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-03 |
| Carries a migration? | no — `0302`–`0305` came in with #1221, #1229, #1233 and #1237 and are applied from the main checkout at step 5 |
| Tested at SHA | `2efa7e42` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — seven notes sit in a new `0.41.3` entry dated 2026-11-03, `major: false`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, this plan. Nothing else
- [x] Cards affected identified — **none.** No card, activity, cell or control changed in this PR. A release note is shown to whoever holds one of its `cards` tags and always to Admin; an untagged note is everyone's. Admin is unaffected, and the signed-out public is unaffected: `/releases` is behind sign-in and `PUBLIC_SITE` is `locked`. Who holds the tagged cards today is context, below, and not a measurement
- [x] Anything explicitly **out of scope** written down — the four production migrations, both Worker deploys, both Pi builds, the cache purge, the home-icon sync and the verification, all of which follow this PR's merge; and the 10 plans signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut from a freshly fetched `origin/main` (`8278dc53`) minutes before, so there was nothing to merge in. Recorded rather than ticked silently
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code. The run's own per-gate lines and closing line are pasted below, from the full log rather than a `tail`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

```
=== gates: typecheck exited 0 after 44s
=== gates: lint exited 0 after 108s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 123s
gates: typecheck=0 lint=0 test=0 build=0
```

**All four numbers read from the script's own output, in a full log rather than a `tail`.** `0.41.2`'s plan could quote only `build`'s per-gate line, because that run was piped through `tail -15` and the other three scrolled out — the trap the runbook names. This run was redirected to a file, so each gate's own `exited 0 after <S>s` line survives. The 123s build is a **cold** Turbopack cache: this worktree was created by `worktree.mjs new` minutes earlier, so nothing was warm.

`node scripts/check-release-guards.mjs` **exit 0**, all 16 assertions ok, including `--force without a reason is refused` and `--drift reads the arrays it prints from driftReport()`.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.41.3 2026-11-03 minor --verify` — **all 16 assertions passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.41.3]
ok   new entry has the requested date  [2026-11-03]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.41.2 -> 0.41.3]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [7 vs 7]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.41.3]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.41.0 in ["0.41.0"]]

all 16 assertions passed
```

**This cut needed no `--base` file, and that is worth stating because the last two did.** `--verify` ran against `origin/main` directly. `0.41.2` had to be verified against a hand-built base because two of its notes were **written in the cut**, which the verifier correctly reports as invented. Here every one of the seven notes was written by the stream that did the work, so "every note carried across character-identical" and "nothing invented" are assertions against `origin/main` itself — the stronger form.

**The mail check is the absence-plus-presence pair** the runbook requires: an always-empty `majorReleasesSince()` would satisfy the absence alone, so the control asserts it still finds `0.41.0` when asked from further back. Both printed above.

### The deferred-note review, and why no note was added here

`node scripts/check-deferred-notes.mjs` listed **48** candidates — every PR in a window far wider than this release's range whose plan answered the release-notes line `n/a`. `cut-release.mjs` refused to write until a review of all 48 was supplied; the full text went to `--deferred-reviewed` and is in the commit message and the PR body. Read plan by plan, not excerpt by excerpt, because many of them print the template's own boilerplate instead of a reason — which `0.41.1` and `0.41.2` both recorded and which is still true.

**Two are closed by this release and both already carry their note**, written by the stream that closed the step, which is exactly what `docs/decisions/2026-10-11-release-note-truth-rule.md` asks for:

- `docs/test-plans/adoption-video-schema.md` wrote `n/a: nothing a shelter user can see changes until the app half ships; the form still refuses videos`. `0303` is applied in this release at step 5 and **#1233 ships the app half**, so the videos note is live wording rather than a promise.
- `docs/test-plans/resident-tags-schema.md` wrote `n/a: nothing a shelter user can see ships until the app half`. #1224 finishes the last two note boxes, and the `#` tagging note covers them.

**Nothing else is owed.** The bills schema (`0304`/`0305`, #1237) is correctly withheld — there is no screen yet. The remainder are either already published in an earlier release (the desexing and *See the Thai queue* notes went out in `0.41.2`; the prescription, shop and affiliate notes went out with "Prescriptions on a schedule, a Shop page, and the Assistant log"), still waiting on a step this release does not close (a card Lutan has **decided** to leave unheld, a model nobody has configured, a bilingual read of proposed Thai, a browser check of a real "can't tell", and the `WRAPPED_WRITE_PATHS` entries that no PR added), or genuinely invisible.

**Neither closed note is ticked on the §7 release-notes line below**, and that is correct rather than an oversight: the checker holds that line to the diff, and a cut **empties** `unreleased`.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. **Worth a line for the release record, because the last handover predicted a clash:** it said `0302` was best left alone, since dev held a stale `schema_migrations` row for `0302_retire_audit_activities.sql` (the name #1204 gave the file before renumbering it to `0301`). A stream took `0302` anyway. Measured rather than assumed — the stale row has since been deleted, dev reads `306 applied, 0 pending` with `applied here, no file on origin/main: 0`, so there is exactly one `0302` and the number is sound
- [x] `--status` reviewed before applying — n/a as this PR's own step; done for the release: production reads **302 applied, 4 pending** (`0302`, `0303`, `0304`, `0305`)
- [x] `--dry-run` reviewed — n/a as this PR's own step; done for the release: all four **ok, exit 0**, with ten `-- consumer:` warnings. Every one expected, because **this release carries the readers of all four**, which is why the apply precedes the deploy. Two declared consumers of `0305` printed **no** warning (`src/lib/bills/access.ts`, `src/app/maintenance/bills-actions.ts`), which is the benign case the runbook names: unchanged since `0.41.2`, so their readers were already live
- [ ] Applied to **dev** — n/a: all four were applied to dev by their own streams; dev reads 0 pending
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR. The harnesses are recorded in `docs/test-plans/intake-date-correction.md`, `adoption-video-schema.md` and `bills-sites-schema.md`
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own migration; the release's plan is `0302`, `0303`, `0304` and `0305` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before either deploy**, because this release carries the code that reads all four

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — n/a as written; the equivalent here is that the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state, and the state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `cut-release.mjs` **refused to write** at the deferred-notes guard until all 48 candidates were answered
- [x] Boundary cases checked — the version boundary both ways (`0.41.2 -> 0.41.3` is newer, the file order still matches `compareVersions`) and the mail window from both ends (empty from `0.41.2`, finds `0.41.0` from further back)
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode — a note lost, altered or invented — and asserts no `[object Object]` or `undefined`. All seven notes' wording was written and reviewed in the PR that added it. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed in this PR. Reported by card rather than by role, as `CLAUDE.md` requires: the question a cut can be judged on is *which card does each note name*, not which role holds it this week.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | `/releases` | all 7 notes — Admin sits outside the card system and sees every card-tagged line | n/a: no gate changed |
| holds `adoption_news` | `/releases` | the videos note, plus the 4 untagged notes | n/a: no gate changed |
| holds `book_clinic_visits` | `/releases` | the doctor-name note, plus the 4 untagged notes | n/a: no gate changed |
| holds `correct_intake_date` | `/releases` | the intake-date note, plus the 4 untagged notes | n/a: no gate changed |
| holds none of those three | `/releases` | the 4 untagged notes | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed. **Three of the seven notes are card-tagged, and one of those tags is a card nobody holds yet**: `correct_intake_date` is created by `0302` in this release, so until Lutan gives it out on Settings → Who does what the intake-date note reaches Admin only. That is the note's own wording working as intended — it says the card is needed and where to get it — rather than a withheld note, because the feature *is* live for anyone holding the card
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change, but worth stating: release notes are **not** translatable labels and never have been. They are English prose in `src/lib/releases.ts`, which is why `check-thai-dictionary.mjs` and `translations-unlisted` do not list them
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled `/releases` and `/api/releases/current`, the two readers of this file, with the new entry in place. A malformed entry fails `typecheck`, which exited 0
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. The third is the one that matters on a cut, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls to decide whether to mail
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `8278dc53`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item
- [x] Non-obvious design choices recorded — the deferred-note reasoning and the `--base`-not-needed point are in this plan and the commit message; the release's own paper is `docs/releases/2026-11-03-0-41-3.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The seven notes this release publishes are the point of the PR; none was written here, which is why this cut needed no `--base` file
- [x] Commit messages say why, not just what — the commit explains why the question put to Lutan was *should this release email you?* rather than "major or minor", the absence-plus-presence mail pair, and the deferred-note review
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes with their own timings, the 16 cut assertions, the guards run, production's `--status` and `--dry-run`, `check-production.mjs`'s own output, and the dev `schema_migrations` reading that retired the `0302` warning

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `2efa7e42`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's **merge commit**, not `2efa7e42`, and the record states both

### On the deployed build

- [ ] Deployed to test — deferred: this session, after the cut merges
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the release entry's own `2026-11-03`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are both asserted in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the per-gate lines and closing line, the 16 assertions and the guards run are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so an anonymous visitor reaches only the gate — **with the exceptions that matter this release**: `/services/desexing` is a public form, and the website's success-story and journey pages now carry adoption-update **videos**, which is in a note

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, read live from Lutan's terminal rather than inferred from the log file
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — none added or removed by this PR or by any PR in the release range

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release does, all four**, and the ordering is stated: `0302`–`0305` are applied before either deploy
- [x] `--env production --dry-run` clean — run before this plan was written: all four **ok, exit 0**, output summarised in section 3
- [ ] Backup fresh for a destructive migration — n/a: all four are additive. `0302` adds a card and its activity, `0303` adds the public video columns, `0304`/`0305` add bill owner types, sites, kinds and three bill cards. Nothing rewrites or deletes existing rows
- [x] Apply plan stated — `0302`–`0305` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** either deploy

### Rollback

- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref 9cd14859` on both Pi clones returns users to `0.41.2`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0302`–`0305`**, and nothing needs them to: all four are additive, the three new bill cards and `correct_intake_date` are held by nobody, and the `0.41.2` build reads none of the new columns

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `cut-release.mjs` refused to write until all 48 deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and the PR body |
| 2 | none | `release-prs.mjs` exits 0 but is short two PRs (#1226, #1235), both squash-merged planner handovers with no migration and no test plan for its cross-check to find them by | **Not this PR's defect, and now three releases running.** Both added by hand after confirming they are in range. Its exit 0 is correct rather than reassuring |
| 3 | none | `check-deferred-notes.mjs` listed 48 candidates for a 24-PR release, many printing the plan template's boilerplate rather than a reason | **Known and carried.** Read the plan, not the excerpt. Noted again so the next release manager budgets for it |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The seven notes read well to you. None was written by this session — each came from the stream that did the work | `/releases`, signed in, after the deploy |
| 2 | The adoption-update **videos** on the public pages, since that is the only note in this release that changes something a member of the public sees | `lannacare.org` success-story and journey pages, after the deploy |

Everything else a person would look at in this release belongs to the 10 plans signed `pending:`, which are **not** copied here: they have their own plans and their own signatures, and the release record groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: both items are post-deploy glances, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the seven notes on `/releases` after the deploy, and looking at an adoption-update video on the public pages

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-03
