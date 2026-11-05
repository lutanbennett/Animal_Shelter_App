# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.43.1` release record and the release handover: two documents, written after the release was deployed and verified |
| Backlog item | `docs/backlog.md` → n/a: the release record is `docs/release-procedure.md` step 8, not a backlog item |
| Branch / worktree | `claude/record-0-43-1` @ `C:\Development\Animal_Shelter_cut-release-0-43-1` — the cut's own worktree reused, as paperwork rule 2 requires |
| Dev server | not started — n/a: two markdown files, neither served nor imported by the app |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-05 |
| Carries a migration? | no — the release's one, `0316`, was applied before either deploy and is recorded in the file this PR adds |
| Tested at SHA | the tip of this branch; the release it describes is deployed from `beabcf7f` on **all four** builds, both Pi clones and both Workers |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the procedure asked for — `docs/releases/2026-11-05-0-43-1.md` records what shipped and what was checked, and `docs/release-handover.md` is replaced with the `0.43.1` edition
- [x] Files/areas touched listed — those two files and this plan. No code, no schema, no configuration
- [x] Cards affected identified — **none.** Neither file is read by the app; no activity, card, cell or control is touched
- [x] Anything explicitly **out of scope** written down — the four plans signed `pending:`, which belong to their own plans and their own signatures and are grouped rather than copied; the stray `next start` in the main checkout, which is Lutan's to stop and is carried on the cut's plan; and the `cut-release.mjs` lockfile item, which went on the `backlog` branch (`#jhd8s`) rather than in a PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a sync: the branch was created with `git checkout -b claude/record-0-43-1 origin/main` from a freshly fetched `origin/main` (`beabcf7f`), so there was nothing to merge in
- [x] `node scripts/gates.mjs` — n/a: **this is a documents-only PR**, which `scripts/check-docs-only.mjs` detects and which `ci.yml` gates every heavy job on. Running the four gates locally on two markdown files would prove nothing the checker does not already assert, and paperwork rule 1 says not to touch code to make a check run
- [ ] CI green on the PR — n/a: the PR does not exist at this commit; it is opened from it and merged on green, as the merge-on-green rule requires for a record PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. Recorded for the next release: `0316` is the highest on `main` and `0317` is free
- [x] `--status` reviewed before applying — n/a as this PR's own step; the release's own `--status`, `--dry-run` and apply are all recorded in the file this PR adds, including the classifier refusing the apply once and succeeding on the retry
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR; both databases read 317 of 317 with no drift in either direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as this PR's own step: `0316` was applied before either deploy and verified afterwards, with the role-cell and role-card snapshots diffed before and after and found byte-identical

## 4. Functional checks

- [x] Happy path works end to end — the record's claims are the release's measured output, pasted rather than described; the handover is a delta against its predecessor and cites the record rather than repeating it
- [x] Data persists — both files are committed on this branch
- [ ] Create / edit / delete all exercised — n/a: two documents, no operation to exercise
- [x] Empty state renders sensibly — n/a as a UI state; the equivalent is that neither file is read by the app, so there is no state to render
- [x] Invalid input is rejected with a readable message — n/a as written; the honest equivalent is that `check-test-plan.mjs` validates this plan and was run before the PR
- [x] Boundary cases checked — the handover is **122 lines against a stated ceiling of 150 and an aim of about 100**, which is the one measurable constraint on it. Counted with `wc -l` after the last edit. **No line count appears in a commit message on this branch before it was counted**, which is the mistake the last edition's own plan had to correct twice
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
- [x] Translatable strings go through the translation path — n/a: neither file is translated or served. The record does note that one of the six notes says its own Thai is unread, which is part of a standing item rather than a translation change
- [ ] Mobile viewport (375px) — n/a: no layout or component changed
- [ ] Browser console clean — n/a: no code changed
- [ ] Network clean — n/a: no request changed

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; nothing imports either file, so nothing can regress from them
- [x] Any shared file touched checked from a second, unrelated place — `docs/release-handover.md` has exactly one reader, the next release manager, and it says in its own opening lines that the runbook and the record outrank it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` at `beabcf7f`

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes no backlog item. The one backlog-worthy finding from the release — that `cut-release.mjs` never bumps `package-lock.json`'s version field — went on the `backlog` branch as `#jhd8s`, because a backlog edit does not belong in a PR
- [x] Non-obvious design choices recorded — the whole PR is that record. The three worth finding again are that the "minor release" trap fired and the question caught it, that `npm ci` in the main checkout can strip the tree and leave it unable to build, and that a no-mail release can be verified at the inbox with a presence control beside it
- [x] `README.md` still accurate — it names no version
- [ ] **Release notes.** — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched. The six notes this release publishes went in with the cut, #1300
- [x] Commit messages say why, not just what — the commit explains what the record settles and what the handover corrects in its predecessor
- [x] **Claims were measured, not reasoned** — every figure in the record is pasted from a run: the four gate exit codes, the 16 cut assertions, the apply and both `--status` reads, the before-and-after role snapshots diffed, the deploy lines read live from his terminal, `wrangler deployments list` for the production Worker, the two Server Actions key prints, the live CSP header, the two asset checks, the icon-sync counts, and the inbox search that found `0.43.0` and `0.42.0` but no `0.43.1`

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — and stated as what it is: this branch describes a release already deployed from `beabcf7f`, so there is no build of this PR to test
- [x] Deployed SHA matches the tested SHA — n/a: a documents PR deploys nothing. The release's own SHA is in the record, and for once there is only one: `main` did not move, so the full `git diff --name-only` between the release commit and `origin/main` is empty

### On the deployed build

- [x] Deployed to test — n/a as this PR's own step: the release went to test from the same commit, Worker version `851fb06d`, after production and not alongside it
- [x] Smoke-tested on `test.lannacare.org` — n/a as this PR's own step; both of test's endpoints report `0.43.1` at `beabcf7f16cc…` and that is recorded
- [ ] Timezone-sensitive behaviour proved — n/a: the only dates in these files are the release's own `2026-11-05` and the timestamps quoted from runs, all literals
- [ ] Boundary or banding change covers both edges — n/a: not a banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the figures quoted here are the ones in the record, which are themselves pasted from runs
- [x] Public pages re-checked after a cache purge — done for the release and recorded, with its limit stated plainly: the purge ran, both hosts' asset checks pass byte-for-byte, and **nothing publicly visible shipped in this release**, so there was nothing new for an anonymous visitor to look at

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — done for the release, read **live from his terminal**: `dbkodyyxxhtygxcxmfcu (beabcf7f)`, with `Next.js version : 16.4.2` on the build banner
- [x] `strip-baked-env: removed N env var(s)` seen — **14**, each named, on both Worker deploys
- [x] Any new secret/env var exists in the production Cloudflare environment — none added by this PR or by the release

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration in this PR
- [x] `--env production --dry-run` clean — n/a as this PR's own step; the release's run was **`0316 … ok`**, with three `-- consumer:` warnings that mean the reader is newer than the live release, which is the safe direction
- [x] Backup fresh for a destructive migration — n/a: no migration in this PR, and `0316` deletes no rows
- [x] Apply plan stated — n/a as this PR's own step; the release's is recorded

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR changes nothing that runs.** Both files are documents; the release they describe is already live, and a rollback of the release itself is `./scripts/pi/deploy-pi.sh --ref 3227a19e` on both clones plus `npx wrangler rollback --env production`, neither of which reverts `0316` and nothing needs them to. **There is no email to unsend this release**, which is the one thing a rollback could not have undone

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | None in this PR | Two documents, written from the release's own measured output |

The release's own findings — the failed `npm ci` and the stray `next start` holding it, the stale lockfile version, the classifier refusing the production apply once, `audit:prod` red against `audit:register` green, and `doctor-cells` — are recorded in `docs/releases/2026-11-05-0-43-1.md` and on the cut's plan, which is where they belong.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Nothing in this PR. The release's own two items — the six notes reading well, and the stray `next start -p 3100` in the main checkout — are carried on the cut's plan, #1300, and the four `pending:` plans are carried on their own | `docs/test-plans/cut-release-0-43-1.md` and the four plans named in the record |

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

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-05
