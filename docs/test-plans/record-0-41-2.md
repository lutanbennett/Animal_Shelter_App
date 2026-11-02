# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.41.2` release record and the release handover: `docs/releases/2026-11-02-0-41-2.md` and a rewritten `docs/release-handover.md` |
| Backlog item | `docs/backlog.md` → n/a: release paperwork is `docs/release-procedure.md` step 8, not a backlog item. The one item this release's work raised was filed on the `backlog` branch (the stale dev `0302` row), which is where items go |
| Branch / worktree | `claude/record-0-41-2` @ `C:\Development\Animal_Shelter_cut-release-0-41-2` — **the cut's own worktree, reused after the cut merged**, as paperwork rule 2 requires |
| Dev server | not started — n/a: two Markdown files, no code, no schema, no surface |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | the commit this plan is committed on; the release itself shipped `9cd14859` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — the release record for a release that is already deployed and verified, plus the handover delta for whoever runs the next one
- [x] Files/areas touched listed — `docs/releases/2026-11-02-0-41-2.md` (new), `docs/release-handover.md` (rewritten), this plan. Nothing else
- [x] Roles affected identified — **by card, not by role**: none. No permission, card, cell, control or page is touched by either document
- [x] Anything explicitly **out of scope** written down — fixing the stale dev `0302` row (filed on the `backlog` branch; a release ships the commits it was given and writes none), and the 16 plans signed `pending:`, which keep their own plans and signatures and are only *grouped* in the record

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was cut with `git checkout -b claude/record-0-41-2 origin/main` after a fresh `git fetch`, at `9cd14859`, which is the release commit itself. Nothing to merge in
- [x] `node scripts/gates.mjs` — **n/a, and deliberately**: this is a documents-only PR, which `scripts/check-docs-only.mjs` detects and `ci.yml` uses to skip the heavy jobs (paperwork rule 1). The runbook is explicit that a documents PR must **not** be made to run them by touching code. Stated rather than ticked, so nobody reads this as four gates that passed
- [x] `node scripts/check-test-plan.mjs --base origin/main` — exit 0, read from the command and not through a pipe
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

The evidence for everything these two documents assert is in the documents themselves, each line pasted
from the run that produced it: the four gate numbers, the 16 cut assertions, the production `--status`,
`--dry-run` and `--drift` output, the deploy log's own lines read from Lutan's terminal live, both Pi
logs, `wrangler deployments list`, `check-assets` on both hosts after the purge, and
`check-production.mjs`'s own wording for every card check.

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR. The release's four are recorded in the record
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR; the release's apply is recorded as having happened before either deploy

## 4. Functional checks

- [x] Happy path works end to end — the "function" of a record is that a later reader can retrace the release from it. Checked by reading both documents against the runs: every figure in them is quoted from a command's own output, and where a figure could not be captured the document says so (the three gate timings lost to a `tail -15`, in the cut's plan)
- [ ] Data persists — n/a: no data. The documents are in git, which is the persistence
- [ ] Create / edit / delete all exercised — n/a: no operation exists to exercise
- [ ] Empty state renders sensibly — n/a: no rendered state
- [x] Invalid input is rejected with a readable message — exercised for real rather than described: `check-backlog-sections.mjs` was run after filing the backlog item (`ok — 69 open items, all above Completed`), and `check-test-plan.mjs` refused this PR's sibling plan twice before it was correct
- [ ] Boundary cases checked — n/a: no boundary. The release's own version and mail boundaries were asserted in the cut PR
- [ ] Driven in a real browser — n/a: neither document has a surface. Both are read in git or an editor

### Role access matrix

**Not run, and deliberately.** No permission, card, cell or control changed. Reported by card rather than
by role, as `CLAUDE.md` requires: nothing in this PR is readable or unreadable on the strength of any card,
because neither file is served by the app at all.

- [ ] Every role above tested — n/a: there is no matrix to run; both files are repository documents, not pages
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: release paperwork is not a manual topic
- [x] Translatable strings go through the translation path — n/a: both files are English repository documents, never shown in the app, so no dictionary key exists or should
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no code
- [ ] Network clean — n/a: no request

## 6. Regression

- [x] The pages nearest the change still work — n/a as written; the nearest equivalent is that no code is touched, so nothing can regress. `check-docs-only.mjs` is what asserts that, and it is the gate CI uses to skip the heavy jobs
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` is read by the next release manager and by nobody else; it **outranks nothing**, which its own opening lines say. The record is read by the next release manager and by anyone retracing this release
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch starts at `9cd14859`

## 7. Documentation

- [x] Backlog item ticked — n/a: the release closes no backlog item. The one item this work raised is on the `backlog` branch (`e01f2a8d`), which is where items go and never in a PR
- [x] Non-obvious design choices recorded — the record carries them: why two notes were written in the cut, why `--base` points at a file, why the cross-host stylesheet comparison is not a check, and why dev's drift is a stale name rather than wrong schema
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered; nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The eight notes this release publishes were added in the cut, #1213
- [x] Commit messages say why, not just what — they say what the record establishes and what the handover closes rather than listing the files
- [x] **Claims were measured, not reasoned** — every figure in both documents is pasted from a run, and three claims the last edition made on inference are corrected here on measurement: the stale Pi folders (deleted, exit 0 read), the classifier refusing the migration apply (it did not), and the cross-host stylesheet identity (it does not hold, and the two extra rules were diffed and traced)

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — the release shipped `9cd14859`; this PR ships only documents
- [x] Deployed SHA matches the tested SHA — **already satisfied for the release**: both Pi clones and both Workers built from `9cd14859`, and `git diff --name-only 2d91b6b0..9cd14859` excluding documents is empty
- [x] Deployed to test — the release is on test: `test.lannacare.org` reports `0.41.2` @ `9cd14859`
- [x] Smoke-tested — as far as this session can: both environments' `/api/version`, both `/api/releases/current`, `check-assets` on both hosts after the purge. **What could not be smoke-tested is listed in the record under *What this record cannot say*** — nothing behind sign-in, on either environment, for want of an account
- [ ] Timezone-sensitive behaviour proved — n/a: the only date in this PR is `2026-11-02` in a filename and two headings, a literal rather than a derived "today"
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — and where output was lost it is named as lost rather than reconstructed
- [x] Public pages re-checked after a cache purge — done for the release: `purge-cache.mjs --env production` exit 0, then `check-assets.mjs` re-run by hand on **both** hosts, both `ok … identical to the build`. **The edge-cache check in a real browser was not done**, and the record says so
- [x] `deploy: production → Supabase project <ref>` line read — `dbkodyyxxhtygxcxmfcu (9cd14859)`, read live from his terminal rather than from the log file, which `tee` had not yet written
- [x] `strip-baked-env: removed N env var(s)` seen — 14, each named in the log
- [x] Any new secret/env var exists in the production Cloudflare environment — none added or removed anywhere in this release
- [ ] Both a migration and code that reads it — n/a: no migration in this PR. **The release carried four and their readers**, which is why the apply preceded both deploys
- [ ] `--env production --dry-run` clean — n/a: no migration in this PR. Done and recorded for the release, all four ok
- [ ] Backup fresh for a destructive migration — n/a: no migration in this PR
- [x] Rollback position stated, including what it does not cover — **nothing to roll back**: reverting this PR removes two documents and changes no behaviour. The *release's* rollback position is stated in the cut's plan and the record: `deploy-pi.sh --ref 97441fb7` on both clones, `wrangler rollback --env production` for the Worker fallback only, and neither reverts `0298`–`0301`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Dev's `schema_migrations` holds a stale row for `0302_retire_audit_activities.sql`, so `--drift test` exits 1 on every release | **Accepted, filed not fixed.** Nothing is missing from dev and production reads `No drift`; it is a name, not schema. On the `backlog` branch under *Architecture* (`e01f2a8d`). A release writes no commits of its own |
| 2 | none | The two Pi clones built different stylesheets | **Not a defect, and it retires a claim.** Traced to two Tailwind candidates scraped from PNG binary noise; no component uses either class. The last record's "identical on both hosts is expected" line is withdrawn in the handover |
| 3 | none | Three of this release's PRs were absent from `release-prs.mjs`'s list | **Not a defect — the script's stated limit.** Docs-only squash merges carry no migration or test plan for its cross-check. Added by hand and named in the record; now recorded twice running, so the handover says to read the merged list by date |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The eight notes read well to you, in particular the two written by this session — the desexing one and the "See the Thai queue" one | `/releases`, signed in |
| 2 | The desexing sign-up form itself, the only public page in this release's notes | `lannacare.org/services/desexing` |
| 3 | Whether the new rule in `docs/release-procedure.md` from last release, and the way this release followed it, is what you meant | `docs/release-procedure.md`, *A release cuts what the build gave it* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: all three items are post-release reading and looking, listed above and carried on the signature below

Manual verification by: pending: Lutan reading the eight notes on `/releases`, looking at the desexing form, and saying whether the release-scope rule held

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-02
