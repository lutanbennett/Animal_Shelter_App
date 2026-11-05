# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.43.1`: move six notes into a new entry, empty `unreleased`, bump `package.json` and the lockfile's stale version field. `minor` — **it does not mail**, on Lutan's answer |
| Backlog item | `docs/backlog.md` → n/a: a release cut is `docs/release-procedure.md` step 4, not a backlog item |
| Branch / worktree | `claude/cut-release-0-43-1` @ `C:\Development\Animal_Shelter_cut-release-0-43-1` |
| Dev server | not started — n/a: the cut changes three data files, `src/lib/releases.ts`, `package.json` and `package-lock.json`, and no code |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — `0316` came in with its own stream (#1290) and is applied from the main checkout at step 5 |
| Tested at SHA | `6ca9f29f` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — six notes sit in a new `0.43.1` entry dated 2026-11-05, `major: false`, and `package.json` and `package-lock.json` follow
- [x] Files/areas touched listed — `src/lib/releases.ts`, `package.json`, `package-lock.json`, this plan. Nothing else
- [x] Cards affected identified — **none changed here.** No card, activity, cell or control is altered by this PR. Four of the six notes carry tags (`propose_website`, `approve_website`, `approve_photos`, `adoption_news`, and one `admin: true`), which decide only who is *shown* a line; Admin sits outside the card system and sees every line. The cards themselves came from `0315` and its streams, not from this PR
- [x] Anything explicitly **out of scope** written down — migration `0316`, both Worker deploys, both Pi builds, the cache purge, the home-icon sync and the verification, all of which follow this PR's merge; and the four plans in this range signed `pending:`, which belong to their own plans and are **not** copied into this one

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the worktree was created by `node scripts/worktree.mjs new cut-release-0-43-1` from a freshly fetched `origin/main` (`fd6352e6`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with the four-gate line, each number that gate's own exit code. The run's own per-gate lines and the closing line are pasted below, from the full log rather than a `tail`
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from this commit and merged on green

### Evidence

```
=== gates: typecheck exited 0 after 59s
=== gates: lint exited 0 after 133s
=== gates: test exited 0 after 14s
=== gates: build exited 0 after 144s
gates: typecheck=0 lint=0 test=0 build=0
```

**All four numbers read from the script's own output, in a full log rather than a `tail`** — the trap the runbook names. The run was redirected to a file in the scratchpad so each gate's own `exited 0 after <seconds>s` line survives.

`lint` reported **79 problems, 0 errors, 79 warnings** — pre-existing unused-variable and unused-directive warnings across `scripts/` and `src/`, none introduced by this PR, which touches no code. Warnings do not fail the gate and its exit code was 0.

`node scripts/check-release-guards.mjs` **exit 0**, run on its own before the gates — **16** assertions `ok`, ending `--drift reads the arrays it prints from driftReport()`. The count is `grep -c "^ok"` on the full log: a `tail -15` of the same run showed fifteen and would have been written down as fifteen.

### The mechanical cut verification

`node scripts/cut-release.mjs 0.43.1 2026-11-05 minor --verify --base affa6511` — **all 16 assertions passed**, unedited:

```
ok   new entry is the newest and has the requested version  [0.43.1]
ok   new entry has the requested date  [2026-11-05]
ok   new entry's major flag matches  [false]
ok   new entry has a title
ok   version is newer than the previous release  [0.43.0 -> 0.43.1]
ok   unreleased is empty after the cut  [0]
ok   base unreleased was not empty
ok   every note carried across character-identical, with its role tags, same order
ok   nothing invented (note count equal)  [6 vs 6]
ok   every earlier entry present and unchanged
ok   releases are in compareVersions order, newest first
ok   latestRelease is the new entry
ok   package.json version equals the newest entry  [0.43.1]
ok   no [object Object] or undefined in the entry
ok   mail ABSENCE: majorReleasesSince(previous) is empty  [[]]
ok   control: from further back, an older major release is still found  [0.43.0 in ["0.43.0"]]

all 16 assertions passed
```

**This cut needed `--base`, for the same reason the last one did:** one of the six notes was written on this branch, in commit `affa6511`, so that commit is the base the comparison runs against. Against `origin/main` the *character-identical* assertion would have failed by construction, and failing it would have said nothing about the five notes that did come from their streams. Two releases running have needed it; **expect it on any release that applies a migration streams were waiting on.**

**The mail check is the absence-plus-presence pair** the runbook requires, because an always-empty `majorReleasesSince()` would satisfy either half alone. This release does **not** mail, so the absence assertion is the load-bearing one — `majorReleasesSince("0.43.0")` is `[]` — and the control proves the function still finds a major release when there is one to find.

### Why `minor`, and why the question was still asked

Lutan's words were *"Let's do a minor release"*. **That is exactly the ambiguity the runbook names**, because in his usage *minor* has meant the middle-number bump (`0.39.5 → 0.40.0`) and **that release mailed**, while in this repo `major` means *worth an email* and has nothing to do with semver. So the prescribed question was put to him with both words removed — should this release email you? — naming the six notes, that the mail reaches one address in practice, and that it cannot be unsent once his deploy runs. **He answered no email**, which makes this `0.43.1` with `major: false`.

Had the words been read at face value it would have shipped as `0.44.0` **with** mail, which is the wrong release. **The trap fired this time and the question caught it**; the previous release recorded it as not firing only because he pre-empted it himself.

He answered the second question in the same round: the four plans signed `pending:` are **noted and left open**, the seventh release running with that answer. **Two touches so far: that one answer, and the production deploy still to come.**

### The deferred-note review, and the one note written here

`node scripts/check-deferred-notes.mjs` listed **twenty** candidates over `45c6513c..HEAD`. `cut-release.mjs` refused to write until a review was supplied; the full text went to `--deferred-reviewed` and is in the commit message and the PR body.

**Exactly one names a step this release closes** — #1290 `project-photos-approval`, withheld because `0316` had to reach production before any user could see a change. `0316` is the one migration production lacks, so under `docs/decisions/2026-10-11-release-note-truth-rule.md` its note belongs in the PR that closes the step: this one, committed as `affa6511` **before** the cut so `--verify --base` still means something.

**Seven candidates are already answered by the last release.** `adoption-illustrate-card` (`0311`), `deceased-records-app`, `deceased-records-verify` and `deceased-visit-notes-app` (`0310`), `fundraising-events-schema` (`0312`), `profile-photo-video-guards` (`0313`) and `website-approval-portal` (`0315`) were all applied to production in `0.43.0` and their notes went in that cut (#1288). Nothing is owed here, and production confirms it: `316 applied, 1 pending`.

**`cutover-rehearsal` stays open**, correctly: the Drive cutover has not happened.

**The rest are the boilerplate case three handovers have now warned about** — the excerpt prints the plan template's own guidance instead of a reason. Each was read in its own plan rather than in the script's excerpt; the two that are PRs in this release, `assistant-tag-save-silent` and `drive-cutover-remap`, both answer their line for real (a tick and an `n/a` respectively), and the three release records are correctly `n/a` because nothing in them is served.

**The six notes were also read as a set, not one at a time**, which is the check that caught a contradiction last release. No two of these disagree: the website-settings note, the Photos-to-approve menu note and the new project-photos note all describe the same approval page from different sides, and the two fixes name `0.43.0` explicitly as what they repair.

**No note is ticked on the §7 release-notes line below**, and that is correct rather than an oversight: the checker holds that line to the diff, and a cut **empties** `unreleased`.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. For the release record: `0316` is the highest on `main`, so the next free number is `0317`, and there is no stale row to avoid — production reports `applied here, no file on origin/main: 0`
- [x] `--status` reviewed before applying — n/a as this PR's own step; done for the release: production reads **316 applied, 1 pending** (`0316_project_photos_approval.sql`) against `origin/main fd6352e6`, with nothing applied that has no file
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration, so there is nothing here to dry-run. The release's own `--env production --dry-run` for `0316` is step 5 of the runbook, run from the main checkout after this PR merges, and its output goes in the release record and in the pre-production gate below
- [ ] Applied to **dev** — n/a: `0316` was applied to dev by its own stream (#1290), whose plan records the harness; dev read 316 of 316 before this release began
- [ ] File is re-runnable — n/a: no migration in this PR. #1290's plan records `0316` as re-runnable (`create or replace`, `alter policy`, idempotent grants)
- [ ] Existing rows still read correctly — n/a: no migration in this PR. #1290 measured it: zero project attachments had `approved_at is null`, so gating the view hides nothing already on the site
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR; #1290's plan records its own harness, including a seeded row proved absent from `is_public_drive_file()` while waiting and present after approval
- [x] Production apply plan stated — `0316` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **after this PR merges and the checkout is pulled, and before either deploy**, because this release carries the code that reads it. `check-production.mjs role-cells` and `role-cards` are taken before and re-run after, even though `0316` adds no card or activity

## 4. Functional checks

- [x] Happy path works end to end — the data `/releases` reads is asserted by the 16 checks above, which is what the runbook prescribes for a cut: *verify the cut mechanically — do not read it over*. `npm run build` compiled `/releases` with the new entry in place
- [x] Data persists — the equivalent for a cut: the entry is in the committed file and `latestRelease` resolves to it, both asserted above
- [ ] Create / edit / delete all exercised — n/a: a cut moves data between two arrays; there is no operation to exercise
- [x] Empty state renders sensibly — `unreleased is empty after the cut  [0]`, which **is** the empty state every release leaves behind
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `cut-release.mjs` **refused to write** at the deferred-notes guard until all twenty candidates were answered, and the note edit was written to **refuse on a missing anchor** rather than write blind
- [x] Boundary cases checked — the version boundary both ways (`0.43.0 -> 0.43.1` is newer, file order still matches `compareVersions`) and the mail window from both ends
- [ ] `/releases` driven in a real browser — n/a: not driven. The runbook's cut check is the mechanical comparison above, which covers the one real failure mode — a note lost, altered or invented — and asserts no `[object Object]` or `undefined`. Stated rather than ticked, so nobody reads this plan as though a browser pass happened

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed in this PR. Reported by card rather than by role, as `CLAUDE.md` requires.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | `/releases` | all 6 notes — Admin sits outside the card system and sees every card-tagged line, and the `admin: true` line too | n/a: no gate changed |
| holds `approve_website` | `/releases` | the website-settings note and the menu note, plus every untagged note | n/a: no gate changed |
| holds `adoption_news` | `/releases` | the adoption-publish fix, plus the untagged notes | n/a: no gate changed |
| holds `approve_photos` | `/releases` | the menu note, plus the untagged notes | n/a: no gate changed |
| holds none of the tagged cards | `/releases` | the two untagged notes only — the assistant line and the new project-photos line — and **not** the `admin: true` note | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed by this PR
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release cut is not a manual topic
- [x] Translatable strings go through the translation path — n/a as a translation change, but worth stating: release notes are **not** translatable labels. They are English prose in `src/lib/releases.ts`, which is why `check-thai-dictionary.mjs` and `translations-unlisted` do not list them. One of the six notes says in its own wording that its Thai has not been read by a Thai speaker
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled `/releases` and `/api/releases/current`, the two readers of this file. A malformed entry fails `typecheck`, which exited 0
- [x] Any shared file touched checked from a second, unrelated place — `src/lib/releases.ts` has three readers: `/releases`, `/api/releases/current` and `scripts/deploy.mjs`'s release-mail step. **The third is the one that matters on this cut, because this release must NOT mail**, and it was exercised by the `--verify` mail pair, which calls the same `majorReleasesSince()` the deploy calls. `package-lock.json`'s other reader is `npm ci`, which now sees it agree with `package.json` where before it did not
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` at `fd6352e6`

## 7. Documentation

- [ ] Backlog item ticked — n/a: a release cut closes no backlog item
- [x] Non-obvious design choices recorded — why `--base` was needed, why the one deferred note belongs here, why the new note is untagged rather than card-tagged, and why the lockfile's version field moved, are all in this plan and the commit messages; the release's own paper is `docs/releases/2026-11-05-0-43-1.md`, which follows in its own PR after the deploy
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: a cut **empties** `unreleased`, so the checker holds this line to the diff and a tick would be a claim the diff contradicts. This is the honest state on every cut plan and the runbook names it as recurring. The one note written on this branch is a deferred note whose step this release closes, which is the one case the runbook puts in the cut
- [x] Commit messages say why, not just what — one explains the deferred note and why it is untagged, the other the cut itself, `--base`, the absence half of the mail pair, and the lockfile field
- [x] **Claims were measured, not reasoned** — every figure here is pasted from a run: the four gate exit codes with their timings, the 16 cut assertions, the 16 guard assertions counted with `grep -c`, production's `--status`, `audit:register`'s one registered advisory, the 11 PRs cross-checked against `gh pr list` by `mergedAt`, and the two stale version strings counted in the lockfile before they were replaced

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of this branch at the time the gates ran — `6ca9f29f`
- [ ] Deployed SHA matches the tested SHA — deferred: this session, at the deploy. The deployed SHA will be this PR's merge commit, not `6ca9f29f`, and the record states both with the allow-list code-identity diff between them

### On the deployed build

- [ ] Deployed to test — deferred: this session, after the production Worker deploy reports. **Test goes after production, never alongside it**: both run `next build` in the main checkout
- [ ] Smoke-tested on `test.lannacare.org` — deferred: this session
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is the entry's own `2026-11-05`, a literal, not a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change. The version and mail-window boundaries are both asserted in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the per-gate lines and the 16 assertions are copied from the runs
- [ ] Public pages re-checked after a cache purge — deferred: this session, after both Pi builds. `PUBLIC_SITE` is `locked`, so an anonymous visitor reaches only the gate; this release adds no new public page, and the project photos it gates are on pages the public cannot reach today

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: this session, read live from Lutan's terminal rather than inferred from the log file, because `Tee-Object` buffers and the log is absent from disk for the whole build
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: this session
- [x] Any new secret/env var exists in the production Cloudflare environment — **none added by this PR, and none by the range.** `scripts/deploy.mjs` and `wrangler.jsonc` are unchanged in `3227a19e..HEAD`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: this PR carries no migration. **The release carries one**, and the ordering is stated: `0316` applied before either deploy, after the merge and the pull
- [ ] `--env production --dry-run` clean — deferred: this session, at the apply step, before either deploy. `0316` depends on no other pending file, so the per-file-transaction caveat that made `0314` report FAILED last release does not apply here; if it reports anything other than `ok` that is a real finding
- [x] Backup fresh for a destructive migration — n/a: `0316` deletes no rows. It rewrites two views and one trigger function in place and adds an approver arm to three attachment policies; #1290 wrote no back-fill on purpose, because one would wrongly approve a waiting photo on a re-run
- [x] Apply plan stated — `0316` to `dbkodyyxxhtygxcxmfcu` from the main checkout, **before** either deploy, with `role-cells` and `role-cards` taken before and re-run after

### Rollback

- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref 3227a19e` on both Pi clones returns users to `0.43.0`; `npx wrangler rollback --env production` reverts only the Worker fallback. **Neither reverts `0316`**, and nothing needs them to: the `0.43.0` build reads `public_project_photos` and `public_projects` through the same view names, and the policies keep every branch the old code uses. The one visible effect that would persist is the right one — a project photo filed after the apply waits for approval. **Nothing here needs the email undone**, because this release does not mail

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | `cut-release.mjs` refused to write until all twenty deferred-note candidates were reviewed | **Not a defect — the guard working.** The review is in the commit message and the PR body |
| 2 | **medium** | `npm ci` in the main checkout **failed**: `EPERM: operation not permitted, unlink node_modules/@next/swc-win32-x64-msvc/next-swc.win32-x64-msvc.node`. It had already deleted most of `node_modules` (484 packages down to 37), leaving the checkout unable to build — and the main checkout is where both deploys run `next build` | **Repaired, with a cause and a residue.** The file is held by a stray `next start -p 3100` started in the **main checkout** at 09:29 and still alive six hours later, with nothing listening on 3100. Repaired with `npm install`, which restores the tree without unlinking the locked file: 484 packages, `next@16.4.2`, the SWC binary present. **The process is still running**, and stopping it was refused by the auto-mode classifier as *Interfere With Workloads*, so it is on Lutan's list below. A second `npm ci` there would fail the same way |
| 3 | low | `package-lock.json`'s own `version` field read `0.41.0` while `package.json` read `0.43.0`. `cut-release.mjs` has never touched the lockfile, so it has been stale since `0.41.0` | **Fixed in this cut** (both strings, no dependency moved). Making `cut-release.mjs` do it belongs on the backlog, not in a release |
| 4 | none | `npm run audit:prod` exits 1 with 5 vulnerabilities (1 moderate, 4 high) | **Not a stop.** `npm run audit:register`, which is what CI runs and what the runbook asks for, exits **0**: one high advisory, `GHSA-5j98-mcp5-4vw2` (`glob` CLI command injection), registered in `docs/advisory-register.json` and still unreachable in this app |
| 5 | none | `release-prs.mjs` exits 0 and this time is **not** short a PR — #1299, a squash-merged planner handover, is in its list | **Noted because five releases running it was short one.** Cross-checked anyway: `gh pr list --state merged` by `mergedAt` names exactly the same 11 PRs merged after `3227a19e` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The six notes read well to you. One was written by this session from #1290's plan; the other five came from the streams that did the work. **No email this release**, so `/releases` is the only place they appear | `/releases`, signed in, after the deploy |
| 2 | Stop the stray `next start -p 3100` in the main checkout, or tell this session it may. Until it is gone, `npm ci` there fails and so would a fresh install before a future deploy | `C:\Development\Animal_Shelter_App` |

Everything else a person would look at in this release belongs to the four plans in this range signed `pending:`, which are **not** copied here. Lutan's instruction before the cut was that outstanding tests may be **noted and left open**; the release record groups them by what each is waiting on.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-05

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: both items are for Lutan, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the six notes on `/releases` after the deploy, and the stray `next start` in the main checkout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
