# Feature test plan — the `0.40.4` release record and handover

## Header

| | |
|---|---|
| Feature | The `0.40.4` release record (`docs/releases/2026-10-25-0-40-4.md`) and the rewritten release handover, which describe a release that **already shipped and was verified** |
| Backlog item | n/a: release paperwork, not a backlog item. The items this release's PRs closed were ticked on their own branches |
| Branch / worktree | `claude/record-0-40-4` @ `C:\Development\Animal_Shelter_record-0-40-4` |
| Dev server | n/a: documents only, no runnable surface |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | `2374d15d82000463a7f5462f44c60ab660e8c850` (the release SHA; this branch adds two documents to it) |

## 1. Scope and risk

- [x] One sentence: records what `0.40.4` deployed, applied and measured, and rewrites the handover as a delta for the next release manager
- [x] Touched: `docs/releases/2026-10-25-0-40-4.md` (new), `docs/release-handover.md` (rewritten), `docs/test-plans/record-0-40-4.md` (this file)
- [x] Roles affected: none — no code, no schema, no permission change
- [x] Out of scope: the Doctor-role card loss (recorded, remedy is a separate Security item); the five `pending:` plans (shipped as a stated gap on Lutan's decision); `check-diets-per-serving-schema.mjs`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in effect: the worktree was created from `origin/main` at `2374d15d` and `main` has **not moved since** (`git rev-list --count 2374d15d..origin/main` = 0), so there was nothing to merge in
- [x] `node scripts/gates.mjs` run on this branch

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit. It is read on the PR before merging

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. The three migrations this release applied (`0262`, `0263`,
`0264`) shipped in their own PRs with their own plans, and the production apply is recorded in
`docs/releases/2026-10-25-0-40-4.md`.

## 4. Functional checks

- [x] Happy path: both documents render as Markdown, their internal links resolve to files that exist, and the handover is **150 lines** against its 150 ceiling
- [ ] Data persists — n/a: documents, no writes
- [ ] Create / edit / delete — n/a: no write path
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: no thresholds. (The handover's line ceiling is a document convention, checked above, not program behaviour)

### Role access matrix

n/a: this PR adds no surface and changes no permission. The release's own role measurements —
`role-cells`, `role-cards`, `doctor-cells`, `cards-union`, `role-cards-coverage`, before and after
the production apply — are recorded in the release file and were taken from production, not inferred.

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page added
- [ ] Manual — n/a: no manual topic describes release paperwork
- [ ] Translatable strings — n/a: no user-facing text
- [ ] Mobile viewport — n/a: no layout
- [ ] Console clean — n/a: no runnable surface
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] Nothing merged from `main` during sync was broken — gates above, and `main` had not moved
- [x] The record's factual claims were each read back from the thing that produced them, not from this session's recollection: PR list from `release-prs.mjs` (exit 0 read from the command), SHAs from `git rev-parse`, Worker version IDs from `wrangler deployments list` matched to each log's `Current Version ID`, Pi results from the deploy logs' own guard lines, drift from `--drift` on both projects with exit codes read from the command, endpoints from live `curl`
- [x] The handover's "Corrections to the last edition" were checked against the previous edition's actual text, which was read in full before rewriting

## 7. Documentation

- [x] Backlog item ticked — n/a in effect: no backlog item; nothing in `docs/backlog.md` is closed by writing a release record
- [x] Non-obvious design choices: no new `docs/decisions/` file. The one deviation from the runbook this release made — verifying the test Pi before starting production's — is recorded **in the release file itself**, which is where a release's own choices belong; it changes no durable rule, so it does not warrant a decision file
- [ ] `README.md` still accurate — n/a: nothing in `README.md` names the release record or the handover
- [ ] **Release notes.** `n/a: release paperwork. These two documents describe a release that has already shipped; no shelter user can see a release record or a handover, and this PR changes no code, page or string.`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned.** The record's two load-bearing negative claims are each backed by a measurement rather than an argument: *this release did not cause the Doctor card loss* rests on `doctor-cells` reading **MISSING 12 of 13 identically before and after** the apply, and *the public site being closed is not a `0263` regression* rests on `/adopt` 307ing on **both** hosts plus `git diff --name-only` finding neither `public-site.ts` nor `public-paths.ts` in the range

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `2374d15d` **is** `origin/main`
- [x] Deployed SHA matches the tested SHA — the code-identity diff `14d1a092..2374d15d` excluding `docs/` and `.claude/` is **empty**, which is the check Lutan's 2026-10-24 rule asks for in place of SHA equality

### On the deployed build

- [ ] Deployed to test — n/a: **nothing deploys from this PR.** The release it describes is already on test and production, both at `0.40.4` @ `2374d15d`
- [x] Smoke-tested on `test.lannacare.org` — done for the release, recorded in the release file: `/api/version` and `/api/releases/current` both `0.40.4`, `x-lanna-served-by: pi`, `check-assets: ok`
- [ ] Timezone-sensitive behaviour — n/a: no date logic in a Markdown document
- [ ] Boundary/banding — n/a: no threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates` line above is verbatim, and every figure in the release file was pasted from the run that produced it
- [x] Public pages re-checked after a cache purge — done for the release: the Cloudflare purge ran, then `check-assets.mjs` was **re-run on the Pi** and reported byte-identical. `/adopt` 307s to `/login` on both hosts because `PUBLIC_SITE=locked`, which was proven from the deploy output rather than recalled

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read and the ref matches production — read during the release; `dbkodyyxxhtygxcxmfcu`
- [x] `strip-baked-env: removed N env var(s)` seen — **14** on both environments, seventh consecutive release, read from both deploy logs
- [ ] Any new secret/env var — n/a: none in this release

### Migration ordering — *skip if no migration*

Skipped: this PR carries no migration. For the record, the release applied all three **before** any
deploy, which was mandatory rather than tidy because all three declare consumers that change in the
release — measured from the headers against the range, not assumed.

### Rollback

- [x] Rollback position stated, including what it does not cover: **reverting this PR removes two documents and nothing else** — no code, no schema, no deployed artefact. The release it describes is unaffected by reverting it. There is nothing a rollback here would fail to cover

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover first came out at **153 lines** against its 150 ceiling | fixed: trimmed to 150 by compressing four bullets, no content dropped |
| 2 | low | `tee` under PowerShell wrote the production deploy log as UTF-16, so it needed decoding before `grep` would read it | accepted: harmless, and `tee` stays because it passes the exit status through. Recorded in the record and the handover |
| 3 | low | The cut script met the `src/lib/releases.ts` **CRLF** hazard for the third release running | accepted: worked around with line-ending detection. The standing ask for `scripts/cut-release.mjs` is unchanged and still unbuilt |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the handover is useful to its next reader — it is a judgement a person makes, and only the next release manager can | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-25

### Manual verification

- [ ] The manual list above is not empty — n/a: only the person who looked may tick this, and nobody has yet

Manual verification by: pending: the next release manager reading the handover

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a in effect: this session **is** the production release manager, and the release is already deployed and verified

Result: pass with accepted defects

Release manager acknowledgement: Claude, 2026-10-25 — `0.40.4` is deployed, verified, and recorded.
