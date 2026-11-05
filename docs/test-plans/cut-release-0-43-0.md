# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.43.0`: move thirteen notes into a new entry, empty `unreleased`, bump `package.json`. `major` — **it mails**, on Lutan's answer |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-0-43-0` @ `C:\Development\Animal_Shelter_fundraising-events-app` |
| Dev server | not started — n/a: the cut changes two data files, `src/lib/releases.ts` and `package.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — `0309`–`0315` came in with their own streams and are applied from the main checkout at step 5 |
| Tested at SHA | `990c4623` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — thirteen notes sit in a new `0.43.0` entry dated 2026-11-05, `major: true`, and `package.json` follows
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, this plan. Nothing else
- [x] Cards affected identified — **none changed here.** No card, activity, cell or control is altered by this PR. Five notes carry card tags (`approve_website`, `propose_website`, `approve_photos`, `adoption_news`, `run_fundraising_events`, `assistant`, `website`), which decide only who is *shown* a line; Admin sits outside the card system and sees every line. The two new cards themselves come from `0315` and #1287, not from this PR
- [x] Anything explicitly **out of scope** written down — the seven production migrations, both Worker deploys, both Pi builds, the cache purge, the home-icon sync and the verification, all of which follow this PR's merge; and the sixteen plans signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/cut-0-43-0 origin/main` from a freshly fetched `origin/main` (`4290d37a`), so there was nothing to merge in. The worktree is a reused free leftover rather than a new one, which is what paperwork rule 2 of the runbook asks for
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code. The run's own per-gate lines and the closing line are pasted below, from the full log rather than a `tail`
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from this commit and merged on green

### Evidence

```
=== gates: typecheck exited 0 after 42s
=== gates: lint exited 0 after 106s
=== gates: test exited 0 after 15s
=== gates: build exited 0 after 116s
gates: typecheck=0 lint=0 test=0 build=0
```

**All four numbers read from the script's own output, in a full log rather than a `tail`** — the trap the runbook names. The run was redirected to a file in the scratchpad so each gate's own `exited 0 after <seconds>s` line survives.

`lint` reported **79 problems, 0 errors, 79 warnings** — pre-existing unused-variable and unused-directive warnings across `scripts/` and `src/`, none introduced by this PR, which touches no code. Warnings do not fail the gate and its exit code was 0.

`node scripts/check-release-guards.mjs` **exit 0**, run on its own after the gates — **16** assertions `ok`, ending `--drift reads the arrays it prints from driftReport()`.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.43.0 2026-11-05 major --verify --base 54a607c6` — **all 16 assertions passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.43.0]
ok   new entry has the requested date  [2026-11-05]
ok   new entry's major flag matches  [true]
ok   new entry has a title
ok   version is newer than the previous release  [0.42.0 -> 0.43.0]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [13 vs 13]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.43.0]
ok   no [object Object] or undefined in the entry
ok   mail PRESENCE: majorReleasesSince(previous) is exactly the new version  [["0.43.0"]]
ok   control: from further back, an older major release is still found  [0.42.0 in ["0.43.0","0.42.0"]]

all 16 assertions passed
```

**This cut needed `--base`, and the handover predicted exactly this case:** *"expect `--base` only on a release that publishes a deferred note in the cut itself"*. Five of the thirteen notes were written on this branch, in commit `54a607c6`, which is therefore the base the comparison runs against. Against `origin/main` the *character-identical* assertion would have failed by construction, and failing it would have said nothing about the eight notes that did come from their streams.

**The mail check is the presence-plus-absence pair** the runbook requires, because an always-empty `majorReleasesSince()` would satisfy either half alone. This release mails, so the presence assertion is the load-bearing one — `majorReleasesSince("0.42.0")` is exactly `["0.43.0"]` — and the control still finds `0.42.0` from further back.

### Why `major: true`

Lutan asked for *"a major release with email"*, in those words, so there was nothing to disambiguate and the prescribed question did not need asking twice. For the record, the question that was put to him before the cut named the email rather than the words *major* or *minor*: what the notes say, and that it cannot be unsent once the production deploy runs. He answered in the same message that outstanding tests may be **noted and left open**, which is why the sixteen `pending:` plans below are recorded as a stated gap rather than put to him a second time. **Two touches so far: that answer, and the production deploy still to come.**

### The deferred-note review, and the five notes written here

`node scripts/check-deferred-notes.mjs` listed **sixteen** candidates over `45c6513c..HEAD`, every one of them flagged as possibly owing a note. `cut-release.mjs` refused to write until a review was supplied; the full text went to `--deferred-reviewed` and is in the commit message and the PR body.

**Five of the sixteen name a step this release closes**, so under `docs/decisions/2026-10-11-release-note-truth-rule.md` their note belongs in the PR that closes it — this one. Each was read in its plan, not in the script's excerpt:

- **#1287 website-approval-portal** — withheld because `0315` was not on production. This release applies it. Note added: the tabbed approval portal and its two new cards
- **#1267 adoption-illustrate-card** — withheld on `0311`. Applied here. Note added: the adoption-update card can add the photo that illustrates its own update
- **#1269 deceased-visit-notes-app**, with **#1261 deceased-records-app** and **#1276 deceased-records-verify** — all three withheld on `0310` and on the app half. All present here, so **one** note covers them: a dead resident's last visit takes a bill, cost and notes
- **#1277 video-upload-csp** — withheld because the fix only becomes true when the Worker is deployed, which is this release's production deploy. Note added: video upload now works, and had never worked
- **#1275 profile-photo-video-guards** — withheld on `0313`. Applied here. Note added: a video can no longer become a resident's profile picture

**`cutover-rehearsal` stays open**, correctly: the cutover has not happened.

**Seven of the sixteen are the boilerplate case the last two handovers warned about** — the excerpt prints the plan template's own guidance instead of a reason (`bills-interface-half`, `record-attachment-fixes`, `release-notes-by-card`, `utilities-app-half`, `website-content-label`, `poodle-drawings`, and the two release records `record-0-41-3` and `record-0-42-0`). Each was read in its plan; the records are correctly `n/a` because nothing in them is served, and the rest either ticked their own line or have their note published already in this cut.

**One note was also corrected rather than added, and it is the sharper finding.** The fundraising-events staff-screens note (#1282) said *"Nothing is on the public website yet"*. #1285 ships the public Events page **in this same release**, and both notes would have been mailed together, one contradicting the other. The clause now says only that the screens are card-gated and points at the Events note. This is the paperwork-overtaken case the runbook describes, caught by reading the notes as a set rather than one at a time.

**No note is ticked on the §7 release-notes line below**, and that is correct rather than an oversight: the checker holds that line to the diff, and a cut **empties** `unreleased`.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. For the release record: `0315` is the highest on `main`, so the next free number is `0316`, and there is no stale row to avoid — production reports `applied here, no file on origin/main: 0`
- [x] `--status` reviewed before applying — n/a as this PR's own step; done for the release: production reads **309 applied, 7 pending** (`0309`–`0315`) against `origin/main 4290d37a`, with nothing applied that has no file
- [x] `--dry-run` reviewed — n/a as this PR's own step; done for the release, and it **failed on `0314` for the documented reason, which is why the apply is still correct**. `0309`–`0313` each report `ok`; `0314` stops with `invalid input value for enum attachment_owner_type: "event"`. `0312:20` is `alter type attachment_owner_type add value if not exists 'event'` and `0314` uses `'event'::attachment_owner_type` in four policy branches. A new enum value cannot be used in the transaction that adds it, and the runner dry-runs each file in its own `begin … rollback`, so the two can never share one. The runner prints this caveat itself. A real apply commits `0312` before `0314` starts, which is how **all seven are already applied to dev** (`316 applied, 0 pending`). `0315` was never reached, since the run stops at the first failure
- [ ] Applied to **dev** — n/a: all seven were applied to dev by their own streams, and dev reads 316 of 316 with `0` in each direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR; each stream's own plan records its harness
- [x] Production apply plan stated — `0309`–`0315` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **after this PR merges and the checkout is pulled, and before either deploy**, because this release carries the code that reads all seven. The before-picture the runbook asks for is taken: `check-production.mjs role-cells` and `role-cards` both exit 0 and are kept, because `0315` adds activities and cards

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — the equivalent for a cut: the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `cut-release.mjs` **refused to write** at the deferred-notes guard until all sixteen candidates were answered, and the first attempt at the note edit **refused** on a line-ending mismatch before touching the file
- [x] Boundary cases checked — the version boundary both ways (`0.42.0 -> 0.43.0` is newer, file order still matches `compareVersions`) and the mail window from both ends
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode — a note lost, altered or invented — and asserts no `[object Object]` or `undefined`. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed in this PR. Reported by card rather than by role, as `CLAUDE.md` requires.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | `/releases` | all 13 notes — Admin sits outside the card system and sees every card-tagged line, and the `admin: true` line too | n/a: no gate changed |
| holds `approve_website` | `/releases` | the approval-portal note, plus every untagged note | n/a: no gate changed |
| holds `adoption_news` | `/releases` | the illustrate-the-update note and the approval note, plus the untagged ones | n/a: no gate changed |
| holds `run_fundraising_events` | `/releases` | the staff-screens note, plus the untagged ones | n/a: no gate changed |
| holds none of the tagged cards | `/releases` | the untagged notes only, and **not** the `admin: true` note | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed by this PR. The `admin: true` behaviour is #1248's, verified on its own plan, not new here
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change, but worth stating: release notes are **not** translatable labels. They are English prose in `src/lib/releases.ts`, which is why `check-thai-dictionary.mjs` and `translations-unlisted` do not list them. Six of the thirteen notes say in their own wording that their Thai has not been read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled `/releases` and `/api/releases/current`, the two readers of this file. A malformed entry fails `typecheck`, which exited 0
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. **The third is the one that matters on this cut, because this release mails**, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `4290d37a`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item
- [x] Non-obvious design choices recorded — why `--base` was needed, the five deferred notes and the one corrected note, and the enum dry-run failure, are all in this plan and the commit messages; the release's own paper is `docs/releases/2026-11-05-0-43-0.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The five notes written on this branch are deferred notes whose step this release closes, which is the one case the runbook puts in the cut
- [x] Commit messages say why, not just what — one commit explains the five deferred notes and the corrected clause, the other the cut itself, `--base`, and the mail pair
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes with their timings, the 16 cut assertions, the 16 guard assertions, production's `--status` and `--dry-run` with the enum failure read against both files, dev's 316 of 316, and `audit:register`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `990c4623`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's merge commit, not `990c4623`, and the record states both with the code-identity diff between them

### On the deployed build

- [ ] Deployed to test — deferred: this session, after the production Worker deploy reports. **Test goes after production, never alongside it**: both run `next build` in the main checkout
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the entry's own `2026-11-05`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are both asserted in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the per-gate lines, the 16 assertions and the dry-run error text are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so an anonymous visitor reaches only the gate — **with the exception that matters this release**: the new public Events page at `/events`, which is the one thing here a member of the public could see

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, read live from Lutan's terminal rather than inferred from the log file, because `Tee-Object` buffers and the log is absent from disk for the whole build
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — **none added by this PR.** The release range adds no new deploy secret: `scripts/deploy.mjs` and `wrangler.jsonc` are unchanged in `2c985e4f..HEAD`. `worker/` did change (the CSP `connect-src` host in #1277 and its test), which is why the production **Worker** deploy is what makes video upload work

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release carries seven**, and the ordering is stated: `0309`–`0315` applied before either deploy, after the merge and the pull
- [x] `--env production --dry-run` clean — not clean, and read rather than waved past: `0309`–`0313` ok, `0314` fails on the enum value `0312` adds, `0315` not reached. Both files were read; this is the runner's own documented per-file-transaction caveat and the same seven are already applied to dev
- [x] Backup fresh for a destructive migration — n/a: none of the seven deletes rows. `0313` rebuilds two functions in place with `create or replace`, `0314` rewrites four attachment policies, and the rest add columns, tables, activities or cards
- [x] Apply plan stated — `0309`–`0315` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** either deploy, with `role-cells` and `role-cards` taken before and re-run after

### Rollback

- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref 2c985e4f` on both Pi clones returns users to `0.42.0`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0309`–`0315`**, and nothing needs them to: the `0.42.0` build reads none of the new columns, and the two policy rewrites keep every branch the old code uses. **What a rollback cannot undo at all is the email**, which is why it was put to Lutan before the cut

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `cut-release.mjs` refused to write until all sixteen deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and the PR body |
| 2 | low | Two notes in one release contradicted each other: the fundraising staff-screens note said nothing was on the public website, while the Events page shipped in the same release | **Fixed in this cut**, with the reason in commit `54a607c6`. Found by reading the notes as a set; no check looks for this |
| 3 | none | `release-prs.mjs` exits 0 but is short one PR — #1284, a squash-merged planner handover with no migration or test plan for its cross-check to find it by | **Not this PR's defect, and now five releases running.** Added by hand after confirming with `git merge-base --is-ancestor` that it is in range and not in `0.42.0` |
| 4 | none | `--env production --dry-run` reports `0314` as FAILED | **Not a defect.** The documented enum caveat, read against `0312:20` and `0314`, with the same seven already applied to dev |
| 5 | low | An untracked `scripts/check-deceased-archive-state.mjs` sat in the main checkout, in no branch | **Moved to `.local/`** before the deploy. An untracked file in the main checkout is what refused a production deploy on `0.38.2`, so it would have cost Lutan his one command |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The thirteen notes read well to you, **and the email reads well**, since this release mails. Five were written by this session from the streams' own plans; the other eight came from the streams that did the work | `/releases` signed in, and the message from `releases@lannacare.org` with `0.43.0` in its subject |
| 2 | The new public Events page, since it is the one thing in this release a member of the public can see | `lannacare.org/events`, after the deploy |

Everything else a person would look at in this release belongs to the sixteen plans signed `pending:`, which are **not** copied here. Lutan's instruction before the cut was that outstanding tests may be **noted and left open**; the release record groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: both items are post-deploy glances, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the thirteen notes on `/releases` and the `0.43.0` email after the deploy, and looking at the new public Events page

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
