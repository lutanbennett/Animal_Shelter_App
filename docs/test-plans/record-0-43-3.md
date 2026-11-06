# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.43.3` release record and the release handover — `docs/releases/2026-11-06-0-43-3.md` (new) and `docs/release-handover.md` (replaced). **Documents only; no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → n/a: a release record closes no backlog item, and nothing in this release's range leaves one closable. **No backlog edit in this PR**, unlike the last record |
| Branch / worktree | `claude/record-0-43-3` @ `C:\Development\Animal_Shelter_cut-release-0-43-3` — the **cut's own worktree, reused** after its PR merged, as paperwork rule 2 requires |
| Dev server | not started — n/a: two markdown files, neither served nor imported |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-06 |
| Carries a migration? | no — and neither did the release. Both databases read **318 of 318** with no drift either way |
| Tested at SHA | n/a as a tested build: this branch describes a release that is already deployed and verified on all three hosts |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — the record states what shipped and what was measured, and the handover is replaced with the `0.43.3` edition
- [x] Files/areas touched listed — those two files and this plan. Nothing else
- [x] Cards affected identified — **none.** Neither file is read by the app; no activity, card, cell or control is touched, and the release itself moved none either
- [x] Anything explicitly **out of scope** written down — (a) the two plans signed `pending:`, grouped in the record rather than copied here, which would give them a second home nothing closes; (b) **UAT's unpurged zone cache** and **production's stale `CLOUDFLARE_ZONE_ID`**, both carried as open; (c) `cut-release.mjs`'s lockfile omission, which is backlog `#jhd8s`; (d) **`docs/test-plan-template.md`'s wrong host mapping**, newly found and recorded for the planner, not fixed here

### The one judgement in this PR, stated rather than buried

**The last handover's claim that the Pi build caches would soon cross their ceiling is withdrawn, not
repeated.** They read 779 MB and 782 MB against 1024 MB, down from 958–961 MB. That earlier line was
drawn from two readings, which is precisely the fault `release-procedure.md` names — *two data points
turned into a trend*. A handover that corrects its predecessor is worth more than one that reads as
though nothing moved.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created in the cut's worktree from a freshly fetched `origin/main` (`a5bf0904`), which is also the release's deployed SHA, so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: **this is a documents-only PR**, which `scripts/check-docs-only.mjs` decides and which `ci.yml` gates every heavy job on. Running four gates on markdown would prove nothing, and paperwork rule 1 says not to touch code to make a check run
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run locally before the PR was opened, which is the step the last record PR skipped and paid for
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from it and merged on green, on its own head commit read from `gh run view --json headSha`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Recorded for the next release: `0317` is the highest on `main` and **`0318` is free**
- [x] `--status` reviewed before applying — n/a as this PR's own step. **The release's answer is in the file this PR adds, and it is the unusual one: nothing was pending, so the apply step was skipped rather than run empty.** Those two states read identically afterwards, which is why the record says which it was
- [ ] `--dry-run` reviewed — n/a: no migration in this PR, and none in the release to dry-run
- [ ] Applied to **dev** — n/a: no migration in this PR; both databases read **318 of 318** with no drift
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own step. The record states that `role-cells` and `role-cards` were **not** taken, and why: nothing in the release writes either table, unlike `0.43.2` where `0317` created a card and the snapshots were the record of what moved

## 4. Functional checks

- [x] Happy path works end to end — the record's claims are the release's measured output, pasted rather than described; the handover is a delta against its predecessor and cites the record rather than repeating it
- [x] Data persists — both files are committed on this branch
- [ ] Create / edit / delete all exercised — n/a: two documents, no operation to exercise
- [x] Empty state renders sensibly — n/a as a UI state; neither file is read by the app, so there is no state to render
- [x] Invalid input is rejected with a readable message — n/a as written. The honest equivalent is that `check-test-plan.mjs --base origin/main` validates this plan and was run **before** the PR was opened this time
- [x] Boundary cases checked — the handover is **92 lines against a stated ceiling of 150 and an aim of about 100**, counted with `wc -l` after the last edit rather than estimated. The last edition was 116
- [ ] `/releases` driven in a real browser — n/a: neither file is served. The release's own live verification, on all three hosts, is in the record

### Role access matrix

Not applicable, and the reason is the point rather than a formality: **a release record changes no
activity, no card and no cell.** Neither file is imported, served or rendered, so no login's access
to anything differs before and after this PR. Admin sits outside the card system and is unaffected
either way.

- [ ] Every login above tested — n/a: no activity, card or control changed
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release record is not a manual topic
- [x] Translatable strings go through the translation path — n/a: neither file is translated or served
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; nothing imports either file, so nothing can regress from them
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` has exactly one reader, the next release manager, and says in its own opening lines that the runbook and the record outrank it. **There is one tracked path for it**, confirmed with `git ls-files`, so the capital-`Docs` form seen in chat is Windows case-insensitivity and not a duplicate file
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `a5bf0904`

## 7. Documentation

- [ ] Backlog item ticked — n/a: nothing in this release's range leaves a backlog item closable. **Two items are recorded as the planner's**, in the record rather than ticked: `#jhd8s` (the lockfile, now three releases running) and the template's wrong host mapping
- [x] Non-obvious design choices recorded — the whole PR is that record. The three worth finding again: that the one-command `git log` check caught a hidden cutover last release and came back clean in seconds this one; that `wrangler deployments list` caught a deploy reported finished while it was still bundling; and that `--base` is needed only when the cut writes a note of its own
- [x] `README.md` still accurate — unchanged and still correct: it names no version, and its environments table was corrected to the new hosts in the `0.43.2` record PR
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The two notes this release publishes went in with the cut, #1313
- [x] Commit messages say why, not just what — the message explains what the record establishes, which claim of the last handover it withdraws, and why two findings are left for the planner rather than fixed
- [x] **Claims were measured, not reasoned** — every figure in the record is pasted from a run: the four gate exit codes, the 16 cut assertions, the 16 guard assertions counted with `grep -c`, the 13 CI jobs and their head SHA, both `--status` reads, the five deploys' version ids, the three Server Actions fingerprints, `wrangler deployments list` for the production Worker, the live version, header and `data-env` on all three hosts, both Pi asset checks, the purge probe, the two build-cache sizes, and the inbox search that found `0.43.0` and `0.42.0` but no `0.43.3`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — and stated as what it is: this branch describes a release already deployed, so there is no build of this PR to test
- [x] Deployed SHA matches the tested SHA — n/a: a documents PR deploys nothing. **The release's own answer is in the record**, and it is unusually simple: the gates ran at `a9b5fe8b`, `a5bf0904` deployed, and the only difference between them is one markdown file that is not built, served or imported

### On the deployed build

- [x] Deployed to test — n/a as this PR's own step: the release reached test from `a5bf0904`, Worker `5c4f63c4`, **after** production and never beside it
- [ ] Smoke-tested — n/a: not this PR's own step. The release's own smoke test is partly open and the record says so — the live reads on all three hosts passed, and the two things only a person can judge — the crest on a phone, the locked sign-in page — are listed as awaiting Lutan rather than signed off
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates in these files are the release's own `2026-11-06` and timestamps quoted from runs, all literals
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [x] Public pages re-checked after a cache purge — n/a as this PR's own step. The release's purge and its byte-for-byte proof **from the Pi** are in the record, and so is the fact that **UAT's zone has still never been purged**

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — n/a as this PR's own step; read live from Lutan's terminal during the release and recorded, because `tee` under PowerShell writes UTF-16
- [x] `strip-baked-env: removed N env var(s)` seen — n/a as this PR's own step; **14 on every Worker build**, recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds none, and neither did the release

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR or the release
- [ ] `--env production --dry-run` clean — n/a: nothing pending to dry-run
- [ ] Backup fresh for a destructive migration — n/a: nothing destructive. The last full production dump is the one taken for the cutover on 2026-11-05
- [ ] Apply plan stated — n/a: there was nothing to apply, stated in §3 rather than left blank

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR changes nothing that runs.** Both files are read by people, not by code, and the release they describe is already live. What a revert would cost is the record of what was measured, which is the opposite of a safety net — hence the runbook's rule that a record is bookkeeping and never a gate

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **One `n/a` reason was written in the wrong place and the checker caught it** — the Smoke-tested line read `n/a as this PR's own step. …` on an **unticked** line, and a reason must follow `n/a:` immediately. Fixed before the commit | **The same family of mistake as last release's four, so it is recorded rather than tidied away.** The trap is that `n/a as …` reads perfectly well to a person and greps to nothing, which is exactly why the rule is strict. Running the checker before opening the PR is what caught it |
| 2 | none | `check-test-plan.mjs` was run **before** this PR was opened, and this plan existed in the first commit | **Not a defect — the last record PR's defect, fixed.** `0.43.2`'s record PR committed its record and handover before its own plan existed and went red for it. One ordering change, no cost |
| 3 | low | **Carried from the record, and now three releases old:** `cut-release.mjs` does not bump `package-lock.json`'s `version` field (backlog `#jhd8s`), so a release manager fixes it by hand every time | **Not fixed here.** A documents PR is not the place, and nor is a release — *a release cuts what the build gave it*. Three consecutive records now say this; it needs a stream |
| 4 | low | **`docs/test-plan-template.md` still says `lannacare.org` runs production** and `test.lannacare.org` runs the dev database. Every plan written from it inherits the wrong hosts, as `lock-page-coming-soon` did on 2026-11-06 | **Recorded, not fixed.** It is a one-line correction but it belongs to whoever owns the template, and a release should not be the thing that quietly edits the checklist every stream copies. **For the planner** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The bigger crest and the LCA short name on a phone**, and the home page's new wording. One of the two things this release exists to ship, and nobody has looked at it on a real phone | the public site, on a phone |
| 2 | **The locked sign-in page** — the wording, the colours and the poodle. Same reason | the public site |
| 3 | The two notes read well. **No email this release**, so `/releases` is the only place they appear | `/releases`, signed in |

These are the release's open items, repeated here because this PR is where they are recorded as open
rather than closed. The two `pending:` **plans** at Defect 3 of the record are deliberately not
repeated.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: every item is for Lutan, listed above and carried on the signature below

Manual verification by: pending: Lutan to look at the public site's top bar and home page on a phone, the locked sign-in page, and the two notes on `/releases`

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-06
