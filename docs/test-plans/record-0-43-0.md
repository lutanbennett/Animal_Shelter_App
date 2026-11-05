# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.43.0` release record and the release handover: two documents, written after the release was deployed and verified |
| Backlog item | `docs/backlog.md` → n/a: the release record is `docs/release-procedure.md` step 8, not a backlog item |
| Branch / worktree | `claude/record-0-43-0` @ `C:\Development\Animal_Shelter_fundraising-events-app` — the cut's own worktree reused, as paperwork rule 2 requires |
| Dev server | not started — n/a: two markdown files, neither served nor imported by the app |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — the release's seven, `0309`–`0315`, were applied before either deploy and are recorded in the file this PR adds |
| Tested at SHA | the tip of this branch; the release it describes is deployed from `3227a19e` on both Pi clones and `fda3c508` on both Workers |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — `docs/releases/2026-11-05-0-43-0.md` records what shipped and what was checked, and `docs/release-handover.md` is replaced with the `0.43.0` edition
- [x] Files/areas touched listed — those two files and this plan. No code, no schema, no configuration
- [x] Cards affected identified — **none.** Neither file is read by the app; no activity, card, cell or control is touched
- [x] Anything explicitly **out of scope** written down — the sixteen plans signed `pending:`, which belong to their own plans and their own signatures and are grouped rather than copied; and the backlog note about this session being able to reach both databases, which goes on the `backlog` branch, not in a PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/record-0-43-0 origin/main` from a freshly fetched `origin/main` (`fda3c508`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: **this is a documents-only PR**, which `scripts/check-docs-only.mjs` detects and which `ci.yml` gates every heavy job on. Running the four gates locally on two markdown files would prove nothing the checker does not already assert, and paperwork rule 1 says not to touch code to make a check run
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from it and merged on green, as the merge-on-green rule requires for a record PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Recorded for the next release: `0315` is the highest on `main` and `0316` is free
- [x] `--status` reviewed before applying — n/a as this PR's own step; the release's own `--status`, `--dry-run` and apply are all recorded in the file this PR adds, including the `0314` dry-run failure and why applying was still correct
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; both databases read 316 of 316 with `No drift`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own step: the release's seven migrations were applied before either deploy and verified afterwards, with the role-cell and role-card snapshots diffed before and after

## 4. Functional checks

- [x] Happy path works end to end — the record's claims are the release's measured output, pasted rather than described; the handover is a delta against its predecessor and cites the record rather than repeating it
- [x] Data persists — both files are committed on this branch
- [ ] Create / edit / delete all exercised — n/a: two documents, no operation to exercise
- [x] Empty state renders sensibly — n/a as a UI state; the equivalent is that neither file is read by the app, so there is no state to render
- [x] Invalid input is rejected with a readable message — n/a as written; the honest equivalent is that `check-test-plan.mjs` validates this plan and was run before the PR
- [x] Boundary cases checked — the handover is **118 lines against a stated ceiling of 150 and an aim of about 100**, which is the one measurable constraint on it
- [ ] `/releases` driven in a real browser — n/a: neither file is served. The release's own live verification is in the record

### Role access matrix

**Not run, and deliberately.** No activity, card, cell or control changed. Reported by card rather than by role, as `CLAUDE.md` requires: neither file is behind any card, because neither is part of the app.

| Login | Can reach | Expected | Result |
|---|---|---|---|
| Admin | neither file | nothing to reach — both are repository documents | n/a: no gate changed |
| any card-only login | neither file | the same | n/a: no gate changed |

- [ ] Every login above tested — n/a: no activity, card or control changed
- [ ] A login that should not have access is blocked server-side — n/a: no server check changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry changed
- [ ] Manual updated — n/a: a release record is not a manual topic
- [x] Translatable strings go through the translation path — n/a: neither file is translated or served. The record does note that six of the thirteen notes say their own Thai is unread, which is a standing item rather than a translation change
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; nothing imports either file, so nothing can regress from them
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` has exactly one reader, the next release manager, and it says in its own opening lines that the runbook and the record outrank it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `fda3c508`

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes no backlog item. The one backlog-worthy observation from the release — that this session could read both databases, which `#4xx3l` says no session can — goes on the `backlog` branch, because a backlog edit does not belong in a PR
- [x] Non-obvious design choices recorded — the whole PR is that record. The three worth finding again are the contradicting pair of notes, why `--base` was needed, and why an empty allow-list diff meant doing nothing
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The thirteen notes this release publishes went in with the cut, #1288
- [x] Commit messages say why, not just what — the commit explains what the record settles and what the handover corrects in its predecessor
- [x] **Claims were measured, not reasoned** — every figure in the record is pasted from a run: the gate exit codes, the 16 cut assertions, the apply, both drift checks, the before-and-after role snapshots diffed, the deploy lines read live from his terminal, `wrangler deployments list` for both Workers, the inbox timestamp, the live CSP header and the three cache fetches

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — and stated as what it is: this branch describes a release already deployed from `3227a19e` and `fda3c508`, so there is no build of this PR to test
- [x] Deployed SHA matches the tested SHA — n/a: a documents PR deploys nothing. The release's own SHAs and the empty code-identity diff between them are in the record

### On the deployed build

- [x] Deployed to test — n/a as this PR's own step: the release went to test from the same commit, `d29b2aef` tagged `v0.43.0`, after production and not alongside it
- [x] Smoke-tested on `test.lannacare.org` — n/a as this PR's own step; both of test's endpoints report `0.43.0` and that is recorded
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates in these files are the release's own `2026-11-05` and the timestamps quoted from runs, all literals
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the figures quoted here are the ones in the record, which are themselves pasted from runs
- [x] Public pages re-checked after a cache purge — done for the release and recorded, with its limit stated plainly: the purge ran, both hosts' asset checks pass byte-for-byte, and **the new public Events page could not be seen at all**, because an anonymous visitor is sent to `/login?next=%2Fevents`

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — done for the release, read **live from his terminal**, and it is what revealed the Worker was building from `fda3c508` rather than the release commit
- [x] `strip-baked-env: removed N env var(s)` seen — **14**, each named, on both Worker deploys
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR or by the release

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR
- [x] `--env production --dry-run` clean — n/a as this PR's own step; the release's run was **not** clean and the record says why in full
- [x] Backup fresh for a destructive migration — n/a: no migration in this PR, and none of the release's seven deletes rows
- [x] Apply plan stated — n/a as this PR's own step; the release's is recorded

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR changes nothing that runs.** Both files are documents; the release they describe is already live, and a rollback of the release itself is `./scripts/pi/deploy-pi.sh --ref 2c985e4f` on both clones plus `npx wrangler rollback --env production`, neither of which reverts `0309`–`0315` and nothing needs them to. **The email cannot be unsent**, which is why it was put to him before the cut

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | None in this PR | Two documents, written from the release's own measured output |

The release's own five findings — `main` moving under the deploy, the contradicting pair of notes, the `0314` dry-run failure, `release-prs.mjs` missing a squash-merged PR, and `doctor-cells` — are recorded in `docs/releases/2026-11-05-0-43-0.md` under *Avoidable costs and defects*, which is where they belong.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing in this PR. The release's own two items — the thirteen notes and the email reading well, and the new public Events page — are carried on the cut's plan, #1288, and the sixteen `pending:` plans are carried on their own | `docs/test-plans/cut-release-0-43-0.md` and the sixteen plans named in the record |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-05

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: two documentation files, neither served nor rendered, read only by the next release manager; the release's own manual items are carried on their own plans and on the cut's

Manual verification by: n/a: two documentation files, neither served nor rendered, read only by the next release manager

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
