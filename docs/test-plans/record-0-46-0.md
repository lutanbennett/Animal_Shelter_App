# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record and handover for `0.46.0` |
| Backlog item | n/a: bookkeeping for a release that has already shipped |
| Branch / worktree | `claude/cut-release-0-46-0` @ `C:\Development\Animal_Shelter_cut-release-0-46-0`, port `3001` |
| Dev server | not started for this PR — nothing in it is served |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | filled in at the commit that opens the PR |

## 1. Scope and risk

- [x] Change is described in one sentence — two documents: `docs/releases/2026-11-14-0-46-0.md` (the record) and `docs/release-handover.md` (rewritten as a delta for the next release manager), plus this plan
- [x] Files/areas touched — those three files and nothing else. No code, no migration, no string
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: nothing in this PR is served, imported or rendered, so no card, no Admin behaviour and nothing public changes
- [x] Out of scope, written down so the release manager is not surprised — **the release itself is finished.** It is deployed to all three environments and verified; this PR describes it. Per `docs/release-procedure.md` the record PR is **not a gate** and is merged by Claude on green

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: this PR adds markdown to a branch whose code is already on `main` (the cut merged as `afc48e409`). `main` has since moved by one documents PR (#1577), which cannot conflict with these three new files
- [ ] `node scripts/gates.mjs` — n/a: **a documents-only PR skips the heavy CI jobs** by design (`scripts/check-docs-only.mjs`, agreed 2026-10-20), and the gates compile and test code this PR does not touch. The gates were run in full on the cut itself, all four at exit 0
- [ ] CI green on the PR — n/a: the PR does not exist at this commit. **Before merging, the run for this HEAD is read with `gh run view <id> --json status,conclusion,headSha`** and its `headSha` confirmed to be the commit pushed last
- [x] `node scripts/check-docs-only.mjs` — run, and it is what gates the heavy jobs. **Run by hand before the commit it answered `no changed files could be read`, which is a limitation of running it on an uncommitted tree, not a verdict** — CI runs it against the PR's own base. What it decides on this PR: every changed path is under `docs/`, so the heavy jobs skip, and `audit` shows **skipped** because no dependency changed. **Skipped is not a pass** — it means nothing was checked, on purpose
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. The release's nine migrations (`0366`–`0374`) were applied and verified before the deploys; the readings are in the record

## 4. Functional checks

- [ ] Every line in this section — n/a: this PR adds no page, control, form or stored value. Two markdown files under `docs/` are not served, imported or rendered by the app, so there is no happy path to drive. **What stands in for functional checking here is that every figure in the record was copied from a tool's own output**, which §7 lists

### Role access matrix

- [ ] Every login tested — n/a: nothing in this PR is reachable by any login. No route, no card, no query

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: no nav entry, no manual topic, no string path, no component. Nothing renders

## 6. Regression

- [x] The pages nearest the change still work — nothing imports either file. Confirmed rather than assumed: `grep -rn "release-handover\|2026-11-14-0-46-0" src/ worker/` finds nothing, so no bundle reads them
- [ ] Shared file touched, checked from a second unrelated page — n/a: neither file is shared code. `docs/release-handover.md` is read by one chat per release and replaced by its successor
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see §2

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: no item. Every item this release closed was ticked in its own PR
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a separate file: the judgements in this release are recorded **in the record itself**, which is where the next release manager looks. They are the per-build SHA measurement, the decision not to apply the migrations before the merge, and the unreconciled `table-policy-commands` count
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and no behaviour changes. **This release's thirteen notes shipped in the cut PR and have already been mailed**
- [x] Commit messages say why, not just what
- [x] **Claims in the record were measured, not reasoned** — and this is the line that matters on a record PR:
  - the six build SHAs from each build log's own `built from` line, **not** inferred from the order of events (an earlier draft got this wrong — see the record's Defects table)
  - both Worker deploys from `wrangler deployments list`, each `Version(s)` matched against its log's `Current Version ID`
  - the mail from the Gmail message itself — subject, sender display name, recipient count, timestamp — and independently from Lutan's own deploy log's `sent 1, skipped 1`
  - the applies and drift from `--status` and `--drift` on all three databases, and both schema assertions naming the Management API as the route that answered
  - the caches from a `CF MISS` re-fetch plus the Pi's byte-for-byte `identical to the build`
  - the backup from Drive's own file listing, **never** from `backup.log`
  - the Pi's power reading from `journalctl --list-boots` and a throttling count, not from the previous record
  - the public-site lock from a deploy's binding list and `src/lib/public-site.ts`, not from a document

## 8. Pre-production gate

| Host | What it is | Database |
|---|---|---|
| `lannacareforanimals.org` | **production** | `dbkodyyxxhtygxcxmfcu` |
| `test.lannacare.org` | **test** | the **dev** project, `qxkmhwybjggxvsfxsxbd` |
| `uat.lannacare.org` | **UAT** | its own project, `fsjagxmxjosauwmxwype` |

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release's deploys are done; the record names each build's SHA individually, which is the point of its *two of six* section
- [x] Deployed SHA matches the tested SHA — **answered as code identity, not SHA equality**: four builds came from `4644759ef` and two from the cut `afc48e409`, and the diff between them is two files under `docs/`, empty outside it

### On the deployed build

- [ ] Deployed to test / smoke-tested / public pages re-checked after a purge — n/a: this PR ships nothing, so there is nothing to smoke-test. All three were done for the release and are recorded there
- [ ] Timezone-sensitive behaviour — n/a: this PR derives no date. The record's dates are literals
- [ ] Boundary or banding change — n/a: no threshold, band or cutoff in this diff
- [x] Evidence pasted in the record is the tool's actual output, unedited — the gates block, the assertion lines, the deploy lines, the check outputs and the mail fields are all copied from their runs

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read / `strip-baked-env` seen / new secrets exist — n/a: this PR deploys nothing. Done and recorded for the release: production's project line read `dbkodyyxxhtygxcxmfcu` in Lutan's own log, UAT's read `fsjagxmxjosauwmxwype`, and test's `strip-baked-env: removed 14 env var(s)`. This release added no secret or environment variable

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR. Done for the release, and the one FAILED line is explained in the record as the per-file-transaction caveat
- [ ] Destructive or rewriting migration: a fresh backup exists — n/a: no migration in this PR. The release's gate was met from Drive and is recorded

### Rollback

- [x] Rollback position stated, including what it does not cover — **reverting this PR removes two documents and changes nothing a user or the app can reach.** The release itself rolls back by `./scripts/pi/deploy-pi.sh --ref 15854dd4` on the production clone, with `npx wrangler rollback --env production` for the Worker fallback; neither reverts a migration and **neither unsends the mail**, which has already gone

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **medium — mine** | **I deleted a worktree after reading an empty `rev-list --count` as "zero commits".** Nothing was lost (GitHub 404 proves the branch was never pushed), but the proof came after the deletion | recorded in the record's Defects table |
| 2 | low | A draft of this record claimed *"five of six builds came from the cut"*; four came from `4644759ef`, Lutan's production Worker among them | fixed before commit |
| 3 | low | My `/releases` render probe could never match a note whose text contains HTML-escaped quotes | fixed; re-probed |
| 4 | low | `table-policy-commands` cannot be reconciled with `0.45.0`'s figure | accepted; for the planner |
| 5 | low | Lutan's deploy log is UTF-16 and the UAT Pi log needs `grep -a`; both read as empty first | worked around; figures recovered |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Thai nobody independent has read** — nine of the thirteen notes say so themselves | a Thai reader |
| 2 | **The merchandise and report-an-animal pages, signed in, on production.** While the public site is `locked` a signed-out check only sees the redirect, and Claude has no production account | Lutan, signed in |
| 3 | **The new screens on a phone**, and a reviewed row on Translations showing the reviewer's name | Lutan, on his phone |

*(The release mail is deliberately **not** on this list — read from the message, as `0.45.0` established.)*

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the list is not empty and nobody has looked yet; only the person who looks may tick this

Manual verification by: pending: a Thai reader for the nine notes' wording, and Lutan for the signed-in look at the two public pages and the phone checks

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the release is deployed and verified, and this PR is bookkeeping, not a gate

Result: pass with accepted defects
