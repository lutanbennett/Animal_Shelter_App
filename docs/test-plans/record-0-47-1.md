# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.47.1` release record |
| Backlog item | n/a: a release record closes no backlog item of its own; `#uatwk` and `#v0302` are ticked in this PR because the **release** closed them |
| Branch / worktree | `claude/record-0-47-1` @ `C:\Development\Animal_Shelter_cut-release-0-47-1` (the cut's worktree, reused as the paperwork budget requires) |
| Dev server | n/a: markdown only |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-16 |
| Carries a migration? | no |
| Tested at SHA | `ad1abd0b7` — the tip of `main` this branch was cut from |

## 1. Scope and risk

- [x] Change is described in one sentence — the record `docs/releases/2026-11-16-0-47-1.md`, a **reversal of the Worker deploy order in `docs/release-procedure.md`** (test → UAT → production, which is what `#uatwk` called option (c) and what this release actually did), one backlog tick and this plan
- [x] Files/areas touched — `docs/releases/2026-11-16-0-47-1.md`, `docs/release-procedure.md`, `docs/backlog.md`, this plan. **No code, no migration, no string.** The runbook edit is in this PR rather than left for a stream because it is the thing that makes the order stick: without it the next release manager reads *"test, then production, then UAT"* and the race `#uatwk` describes returns
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: nothing in this PR is served, imported or rendered, and no card gates a file under `docs/`
- [x] Out of scope, written down so the release manager is not surprised — **the release is live on all three hosts and one step is outstanding: production's Cloudflare Worker, which is Lutan's.** The record says so in its header, its deploy table and its Result rather than reading as if everything shipped. **This PR does not wait on it** — the record is bookkeeping, not a gate, and if he deploys afterwards the row is corrected by the next edition, which is how a record that is overtaken is meant to behave

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: this PR adds markdown to a branch cut from `origin/main` at `ad1abd0b7` minutes earlier, so there was nothing to merge in
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs`, agreed 2026-10-20), and the gates ran in full on the cut, which is where this release's code was asserted
- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**
- [x] `node scripts/check-docs-only.mjs` — run; every changed path is under `docs/`, so the heavy jobs skip and `audit` shows `skipped`, which is **not a pass** but means nothing was checked, on purpose. `package.json` is untouched by this PR
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value in this PR. The release's **nine** (`0381`–`0389`) were applied to production and UAT before any deploy, each dry-run first, with no drift on any of the three databases afterwards and the tenancy lint reading 124 of 124 tables clean. All of that is in the record

## 4. Functional checks

- [ ] Every line in this section — n/a: this PR adds no page, control, form or stored value. Markdown under `docs/` is not served, imported or rendered

### Role access matrix

- [ ] Every login tested — n/a: nothing in this PR is reachable by any login. No route, no card, no query

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no nav entry, no manual topic, no string path, no component. Nothing a browser loads

## 6. Regression

- [x] The pages nearest the change still work — nothing imports this file. Confirmed rather than assumed: `grep -rn "docs/releases" src/ worker/` finds no reader
- [ ] Shared file touched, checked from a second unrelated page — n/a: a release record is not shared code and is read by people, not by the app
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [x] Backlog item ticked on this branch — **one, `#uatwk`**, because the release closed it: UAT's Worker came up on `0.47.1` (Version ID `2bceb9a6`) and, more importantly, option (c) is now the runbook's order rather than a suggestion, so the race it describes cannot recur by following the runbook. Its *"needs Lutan's call on which"* is retired in the same edit: nothing was left to decide. **`#v0302` is deliberately NOT ticked, and the cut's own test plan said it would be.** That plan (merged in #1631) wrote *"its backlog item `#v0302` is ticked in the record PR instead"* — written when the production Worker deploy was expected to have happened by now. **It has not**, and `#v0302`'s own header says it is held open by exactly that deploy, so ticking it would be false. It stays open and the next release manager will find it waiting on one command. **The correction is recorded here and in the record rather than left for someone to notice**
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a separate file: this release's judgements are recorded **in the record itself**, which is where a release manager looks — the reversed deploy order and why, the `401`'s cause, why `--skip-build` was refused for the retry, why the dev-signin break was not fixed here, and why nothing was rebuilt when `main` moved
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record. The file is not served, imported or rendered, and no behaviour changes. **This release's four notes shipped in the cut PR (#1631) and mailed nobody**, which is the whole point of it
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — the migration safety from reading all nine files and grepping for top-level DML, not from their summaries; the backup from Drive's own file listing; the `401`'s cause from the mtime of wrangler's credentials file against the error's own timestamp; the token's scopes from `whoami` rather than from the warning it printed; the no-mail from `majorReleasesSince` run on the release commit **with a control**, plus two deploys saying it themselves; the code identity from the allow-list diff **and** its complement; each build's Server Actions key read from its own log and paired with its Pi; the asset bytes from `check-assets.mjs` on each clone after the purge; the icons from the sync's own closing line

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deploys are done bar one; the record names each build's own SHA
- [x] Deployed SHA matches the tested SHA — **answered as code identity, not SHA equality.** Five builds came from two commits: `3dde3e2eb` (all three Pi builds and test's Worker) and `ad1abd0b7` (UAT's Worker, and production's when it runs). The allow-list diff over everything built or run at deploy is **empty**, and its complement is two documents, so the served application code is identical

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: this PR ships nothing, so there is nothing to smoke-test. Done for the release and recorded there: test's Worker and Pi are both on `0.47.1`, both zones purged, and all three clones' stylesheets byte-identical to their builds afterwards
- [ ] Timezone-sensitive behaviour — n/a: this PR derives no date. The record's dates are literals
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff in this diff
- [x] Evidence pasted in the record is the tool's actual output, unedited — the dry-run's own per-file notes, the deploy lines, the `check-assets` lines, the lint counts and the icon sync's closing line

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read / `strip-baked-env` seen / new secrets exist — n/a: this PR deploys nothing. For the release, read on test (`qxkmhwybjggxvsfxsxbd`) and UAT (`fsjagxmxjosauwmxwype`), with 14 env vars stripped from each bundle. **Production's own line is still to be read, because his deploy has not been re-run** — `--plan` was run beforehand and confirmed the ref `dbkodyyxxhtygxcxmfcu` and that the guards pass
- [x] **No secret or environment variable was added by this release**, so no `--secrets` push was needed or made. `0385`'s purge runs on `pg_cron` inside the database, so applying the file *is* the install

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code in this PR. Across the release each migration and its consumer merged in their own PRs, which is why the apply came before the deploys
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR. Run for the release, and **its five FAILED lines were read rather than obeyed**: each is a later file unable to see what an earlier pending file creates, which the runner names per file. All nine then applied `ok`
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR. **None of the release's nine rewrites a row at apply time** (checked by reading each file: top-level DML exists only in `0382`'s three seed inserts), and the backup gate was met from Drive regardless

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR removes one document and changes nothing a user or the app can reach.** The release's own rollback is in the record: `deploy-pi.sh --ref ca23f2c27` on each clone, `wrangler rollback` for a Worker, neither reverting a migration — and **nothing to unsend, because this release mailed nobody**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | — | The two defects belong to the release, not to this PR, and are recorded in full in the record: the production deploy's Cloudflare `401` (and the extra touch it cost Lutan), and `0387` breaking `dev-signin --cards` for every stream | both accepted; the second is filed as `#dvsgn` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Production's Worker deploy, which is the release's one outstanding step** — his command, with the guards already pre-checked | Lutan |
| 2 | **The nine items the record lists under *What is not tested*** — the e-Donation screens, the Sold out badge at phone width, the Shelter Friends map on a phone, the order-flood wording, a public page on test, the canary secret, the accountant's answer, and `0.47.0`'s carried-forward items | Lutan, and a Thai reader |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: Lutan for the outstanding production Worker deploy and the nine items the record lists, and a Thai reader for the unread wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the release is live on all three hosts and the one step left is Lutan's

Result: pass with accepted defects
