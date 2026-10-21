# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.39.0` release record and the handover rewritten as a delta |
| Backlog item | `docs/backlog.md` → n/a: the release record is step 8 of `docs/release-procedure.md`, not a backlog item. The two follow-ups this release found were filed on the `backlog` branch instead |
| Branch / worktree | `claude/record-0-39-0` @ `C:\Development\Animal_Shelter_cut-release-0-39-0` — **the cut's own worktree, reused**, per paperwork rule 2, via `git checkout -b … origin/main` because `reset --hard` is refused. No second worktree and no second `npm ci` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` — not started: two markdown files, neither bundled |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-21 |
| Carries a migration? | **no** |
| Tested at SHA | `ca7e4dd2` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence: the `0.39.0` release record and the handover rewritten as a delta for the next release manager. **Filed as `docs/releases/2026-10-21-0-39-0.md` rather than appended to that day's existing file**, because `0.39.0's` record is already complete and signed
- [x] Files/areas touched listed: `docs/releases/2026-10-21.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (one section). **Nothing under `src/`, `worker/` or `supabase/`** — `scripts/check-docs-only.mjs` should classify this PR documents-only and the heavy CI jobs should skip
- [x] Roles affected identified: **none.** No role sees any of these files; their readers are the next release manager and the next planner chat
- [x] Anything explicitly **out of scope** written down: the one follow-up this release found is **not** fixed here — the role-tag cause (the test-plan template never asks *who* a note is for) went to the `backlog` branch, because a release is the wrong place to change the template every stream copies

**The one risk worth naming**, and it is about the documents rather than the code:
a handover that is wrong is corrected by its successor rather than by a reviewer,
and **nobody reviews it** — which is exactly why these two PRs merge without
asking. The mitigation is that it is a **delta** with a ceiling: this edition is
**108 lines**, against an aim of ~100 and a limit of 150, and the one durable
lesson is named once here and not recopied: nothing needed promoting into the runbook this release, because the one new rule (validate a cut plan the way CI does) is a correction to how I used an existing script rather than a change to the procedure.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `ca7e4dd2` after the cut merged, so there was nothing to merge. **`main` did not move at all during this release** — the first in several — so the runbook's moved-`main` trap did not arise; this branch is diffed against its **merge-base** regardless
- [ ] `node scripts/gates.mjs` — **n/a: documents only.** No file in this PR is compiled, bundled, linted as source, or read at runtime. Running a four-minute build over two markdown files is what paperwork rule 1 exists to prevent, and the rule warns explicitly against touching code to make a check run
- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-test-plan.mjs` run locally before pushing — exit 0

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. **Recorded in the record instead, because it is a trap for the next stream:** `origin/main`'s highest file is `0238`, but **`0239` is already claimed by unmerged #803**
- [ ] `--status` reviewed before applying — n/a: no migration in this PR; the release's three are applied and recorded
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — for a document the equivalent is that it is accurate and complete: every tick in the record's smoke test corresponds to output actually read this release, and the three checks that did **not** pass are written as not passing rather than ticked or dressed as `n/a`
- [ ] Data persists — n/a: no data path
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no rendered surface
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked — the handover's **length** is the boundary that matters, and it was measured: 108 lines against a 150 limit

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every live role | none of these files | nothing — `docs/` is not served | n/a: no role reads a file in this PR; none is bundled or routed |
| signed out | none | nothing | n/a: same |

- [x] Every role above tested — n/a as a browser exercise; asserted structurally instead, which is the honest form here: none of the three files is imported, bundled or routed, so there is no surface on which roles could differ
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR touches no guard, policy or permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. These documents are for the release manager and the planner, not for shelter staff; the features' own PRs carried their manual topics
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no browser session
- [ ] Network clean — n/a: no browser session

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page claim; the equivalent is that the documents the next release manager reads still agree with each other. **Checked for the one contradiction this PR could create:** the handover now says the `tee` lesson lives in the runbook, and the runbook's test-deploy section was edited to hold it, so the delta does not describe a rule that is not there
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-procedure.md` is the shared file, read by every release. The edited section was read in full after editing to confirm the surrounding steps still read in order, and the command it now gives is the exact form that ran this release (`node scripts/deploy.mjs --env test`, which `package.json`'s `deploy:test` confirms)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; `main`'s one docs-only move is recorded rather than absorbed

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item. **It opens one**, committed on the `backlog` branch as the rules require, not here: the role-tag cause in the test-plan template. It also **closes two of the previous record's**, by observation rather than by edit — #814 fixed the directory-consumer warning and #810 fixed the icon sync's 344 uploads, both shipped in this very release
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-release-0-39-0-admin-tags-and-silent-number-risk.md`, committed with the cut in #824. Nothing in *this* PR makes a new design choice: it records and promotes
- [x] `README.md` still accurate — not touched; it names no version
- [ ] **Release notes.** — n/a: nothing a shelter user could notice. Three internal documents; `src/lib/releases.ts` is not touched by this PR, and its `unreleased` is correctly empty after the cut. The release's own three notes shipped in #801
- [x] Commit messages say why, not just what — the commit records why the record is a separate file rather than a section appended to that day's existing one, and why the role-tag cause went to the backlog branch instead of being fixed here
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The record's load-bearing claims are measurements, not inferences. "All four builds from one SHA" is four reads of `/api/version` plus two Pi logs. The release mail is the **inbox**, not `sent 1`. The icon sync being fixed is its own run printing `344 unchanged, 0 updated, 0 created`. And four lines describing Lutan's deploy were **written, then marked pending, then filled only after his log was read** — because I had drafted them before the deploy ran

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `ca7e4dd2` plus this branch's commit
- [ ] Deployed SHA matches the tested SHA — **n/a: nothing in this PR reaches a deployed build.** `docs/` is not bundled, so there is no artefact whose SHA could differ. The release it *describes* is deployed at `ca7e4dd2` and verified in the record

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy; no file here is served
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test. **The release's own smoke test is the content of this PR**, filled against the production build at `ca7e4dd2`
- [ ] Timezone-sensitive behaviour proved — **n/a: no logic.** The dates in these documents are the release's own, written once. Unlike `0.38.1` this release did not cross midnight, so the record's filename and its contents agree
- [ ] Boundary or banding change — n/a: no threshold or band in a markdown file. The handover's 150-line ceiling is a writing limit, measured in section 4, not a runtime band
- [x] **Evidence pasted into the record is the tool's actual output, unedited** — the `check-assets` lines, the `strip-baked-env` list, the `no major release new to…` lines, the drift output naming `0239`, and the icon sync's `Done: 344 images` are all as printed
- [ ] Public pages re-checked after a cache purge — n/a: this PR changes no page. The release's purge and its byte-for-byte re-check on both Pi clones are recorded in it

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — n/a: this PR triggers no deploy. The line **was** read for the release and is quoted in the record with its SHA
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: this PR triggers no deploy. **13 on production for the release; test's was lost to my own pipe**, which is Defect 2 in the record and the reason the runbook now `tee`s the test deploy
- [x] Any new secret/env var exists in the production Cloudflare environment — **none added by this PR, and none by the release.** Checked against each feature plan's own line rather than assumed

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **No** — no migration and no code
- [ ] `--dry-run` against production run and clean — n/a: no migration in this PR. It was run for the release: all three `ok`, exit 0, nine predicted warnings and no unpredicted one
- [ ] For a destructive or rewriting migration only — n/a: no migration in this PR
- [x] **Apply plan stated:** n/a as an apply, and stated as such deliberately rather than left blank — there is nothing to apply. **The release's state is recorded:** production `239 applied, 0 pending, No drift`; dev **drifted by `0239` from unmerged #803**, which was clean before the cut

### Rollback

- [x] **Rollback position stated, including what it does not cover.** For two markdown files the rollback is `git revert` of this PR, with no deploy and no database effect — nothing reads them at runtime. **What it does not cover, and this is the point:** reverting it would not un-ship `0.39.0`, which is live at `ca7e4dd2` on all four surfaces. It would only destroy the record of how that happened, which is strictly worse than leaving a flawed record in place and correcting it in the next edition — the practice the runbook already prescribes for a record overtaken by events

## Addendum, 2026-10-21: the record was corrected after it merged

This plan covers the correction commit as well as the original record, because the
two are the same piece of paperwork and a second plan for two edited paragraphs
would be the fault paperwork rule 3 exists to prevent.

- [x] **Why it was corrected rather than left:** within the hour of the record merging, Lutan reported that he could not add a group on Who does what — the `tile-groups-app` plan's own `pending:` line, and one of the fourteen gaps shipped on his decision. The runbook requires a record that is overtaken to say so; a record reading as though nothing moved is worth less than one that corrects itself
- [x] **The claim was checked, not relayed:** production holds `0241 role_groups` and every other file (`apply-migrations.mjs --status --env production`: `246 applied, 0 pending`), so a missing table is ruled out and the correction says so. The suspected cause (an error drawn at the top of the board, far from the Add group form, plus a required Thai name) is another session's diagnosis and is **labelled as suspected rather than confirmed**, because I did not drive it myself
- [x] **What the correction deliberately does NOT claim:** that the release note is false (the feature and its schema shipped), or that the ship-with-gaps decision was wrong. It says the gap paid out where the plan said nobody had looked, which is the decision costing what it was understood to cost
- [x] Same two files, same branch lineage, documents only — no gate, no deploy, no database effect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover is read by nobody before it becomes the next release manager's primary brief, and a wrong one is corrected only by its successor | **accepted** — this is the standing trade-off that makes these two PRs merge without asking (`CLAUDE.md`). Mitigated by the delta shape and the measured 108-line length, and by promoting the one durable lesson into the runbook where it will be read by every release rather than one |

## Left for manual verification

Only items belonging to **this** PR. The release's own nine outstanding items stay
in their own plans with their own signatures and are listed in the record.

| # | What to check | Where |
|---|---|---|
| 1 | Whether this handover edition actually serves the next release manager — in particular whether promoting the `tee` rule into the runbook made it easier to find or merely moved it somewhere they do not look | `docs/release-handover.md` against `docs/release-procedure.md`, at the next release |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-21

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: the next release cannot have happened yet, so whether this edition serves its reader is unanswerable today

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a: this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-21
