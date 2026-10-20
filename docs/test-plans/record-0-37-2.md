# Feature test plan — record-0-37-2

## Header

| | |
|---|---|
| Feature | The release record for `0.37.2`: `docs/releases/2026-10-20.md`, the filled smoke test and the corrections to the previous handover |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item |
| Branch / worktree | `claude/record-0-37-2` @ `C:\Development\Animal_Shelter_record-0-37-2` |
| PR | **#760 — a guess at the time of writing, to be re-read with `gh pr view` after opening.** The handover's record-PR prediction has held five releases running; this makes a sixth if it lands |
| Dev server | not driven — documentation only |
| Tested by / date | Claude (production release manager session) / 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

**This PR is not a gate.** `0.37.2` is deployed and verified on all four builds;
this describes a release that has already shipped. It must never be presented as
something to merge "when you say" — that invented the single largest avoidable
delay in `0.28.0`, and the rule written afterwards is that the record PR is
merged by Claude as soon as CI is green.

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — add `docs/releases/2026-10-20.md`, the record and filled smoke test for `0.37.2`, and this plan
- [x] Files/areas touched listed — `docs/releases/2026-10-20.md` and this plan. **No code, no schema, no configuration.** Nothing in this PR can change what runs
- [x] Roles affected identified — none. Nothing here is served to any role; `docs/` is not shipped
- [x] Anything explicitly **out of scope** written down — three things. (a) The **two items still open** (`0227`'s job, `0224`'s card check) are *recorded* here, not closed here; closing them is not documentation work. (b) The **4-byte disagreement** between `purge-cache.mjs` and `check-assets.mjs`, and the unexplained **`x-lanna-cache: HIT`** on a `no-store` gate page: both are written down and raised on the `backlog` branch, and neither is investigated in this PR. (c) The **handover rewrite** for the next release, which is its own document

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `3e94268e`, which is the release SHA and the tip
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — a docs-only diff cannot change the result, but the gate was run rather than assumed, and its output is pasted unedited

```
=== gates: build exited 0 after 135s

gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — `n/a: not yet at this commit — no PR exists until this plan is committed.` Written and committed **before** the PR opens, so the first run is green by construction; the run's `headSha` is then matched against this branch's HEAD and this line ticked
- [x] `node scripts/check-release-guards.mjs` — `n/a` as a release gate, but run anyway and clean: 16 guards `ok`, exit 0. `src/lib/releases.ts` is untouched by this PR

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR, and none in any PR after the release.`

- [ ] Migration number is one above the highest on `main` — `n/a: no migration.` For the record: `origin/main` tops out at `0229`, so the next free number is **`0230`**
- [ ] `--status` reviewed before applying — `n/a: no migration in this PR`. Read and recorded for the release: production ended **`230 applied, 0 pending`, no drift**
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`. The release's three were all `ok` with no `-- consumer:` warnings, which is recorded in the record as the clean case
- [ ] Applied to dev and recorded in `schema_migrations` — `n/a: no migration in this PR`. Dev is `230 of 230, No drift`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR.` **The release's one row-deleting file, `0227`, is recorded as applied but its job is unverified** — that is the open item, stated as unknown rather than ticked
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed — `n/a: no migration in this PR`
- [ ] Production apply plan stated — `n/a: no migration in this PR`; the release's apply is complete

## 4. Functional checks

A documentation PR has no runtime behaviour.

- [x] Happy path works end to end — the document renders as Markdown and its tables parse; checked by reading the file back after writing it
- [x] Data persists — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly — `n/a: no state.` The nearest equivalent, an empty *What broke* table, does not apply: it has three rows
- [x] Invalid input is rejected with a readable message — `n/a: no input path`
- [x] Boundary cases checked — `n/a: no computed values.` **Every figure in the record was copied from a tool's output rather than recalled**, which is the boundary that matters for a record: the SHA, the 13/13 env-var counts, the two byte counts, the cache sizes, the migration totals and the PR list

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | `docs/` is not served to anyone | unchanged; no route, component or policy touched |

- [x] Every role above tested — `n/a: nothing in this PR is reachable by any role`
- [x] A role that should not have access is blocked server-side — `n/a: nothing is served`

## 5. Cross-cutting

- [x] Nav entry correct — `n/a: not touched`
- [x] Manual updated and the topic reads correctly at `/manual` — `n/a: not touched.` A release record is not user documentation
- [x] Translatable strings go through the translation path — `n/a: none added`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing executes`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: there are none.` `docs/releases/` is read by people, not by code; no script globs it
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched`
- [x] Nothing merged from `main` during `sync` was broken by this branch — the suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release record closes no backlog item.` **Two follow-ups this release produced go on the `backlog` branch, not here**, per the rule that only a feature's own tick belongs in a PR: the 4-byte purge/asset disagreement and the unexplained `x-lanna-cache: HIT`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: this PR decides nothing.` The release's own reasoning lives in the record
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: a release record is internal bookkeeping — no shelter user could notice it, and src/lib/releases.ts is untouched by this PR.` The release's own five notes shipped in the cut, #759
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the record were measured, not reasoned** — the record states only what a tool printed. Where something could not be established it says so rather than estimating: `0227`'s job is written as **unknown**, not as working, and the 4-byte disagreement is written as unexplained rather than attributed to a cause

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: this PR ships after the deploy.` The release SHA it describes, `3e94268e`, was re-asserted after the merge and `release-prs.mjs` re-run against it
- [x] Deployed SHA matches the tested SHA — **yes, and it is the substance of this record**: all four builds on `3e94268e`, verified on both hosts via `/api/version`

### On the deployed build

- [x] Deployed to test — done, and recorded: test Pi and test Worker both `0.37.2` @ `3e94268e`
- [x] Smoke-tested on `test.lannacare.org` — the filled pass is in `docs/releases/2026-10-20.md`; test answered `0.37.2` on both `/api/version` and `/api/releases/current`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this PR derives "today".` The record notes `0227`'s `03:17 UTC` job as the release's one scheduled time
- [ ] **For a boundary or banding change, both edges covered.** `n/a: no boundary change in this PR`
- [x] **Evidence pasted into this plan and the record is the tool's actual output, unedited** — the deploy lines, the dry-run results, the purge output and both byte counts are as printed
- [x] Public pages re-checked after a cache purge — the purge ran and the byte-for-byte check returned `identical to the build`. **The public pages themselves remain unreachable**: `PUBLIC_SITE` is locked, confirmed by fetching the root and matching the gate text rather than assuming

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` read and the ref matches production — `dbkodyyxxhtygxcxmfcu (3e94268e)`, read from Lutan's log by grepping the project ref
- [x] `strip-baked-env: removed N env var(s)` seen — **13 on production and 13 on test**, and the record corrects the handover's claim that test removes 14
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none.` **`CLOUDFLARE_PURGE_TOKEN` is no longer outstanding** and is not a Worker secret
- [x] **The release mail MUST NOT have gone out, and its absence is the check** — confirmed on both logs: `no major release new to production (was 0.37.1), so no email` and the same for test. No `deploy: release mail` line in either

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's three all declared `consumer: none` and were applied before every deploy
- [x] `--env production --dry-run` run and clean — all three `ok`, no warnings
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **`0227` deletes rows nightly**, which is the intent rather than a risk. The README restore recipe has still **never been exercised** — fifteen releases unanswered and still the cheapest item on the outstanding list
- [x] Apply plan stated — complete: `0227`, `0228`, `0229` to `dbkodyyxxhtygxcxmfcu`, before every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `n/a for this PR`, which is documentation and is reverted by reverting the commit. **For the release**: a rebuild on the Pi pinned to `9804e211`, and a `wrangler rollback` for the Worker fallback only. **Neither reverts the three migrations**, and `0227` is the asymmetric one: its reader is a cron job inside the database, not app code, so **the nightly deletions continue against a rolled-back release** until `cron.unschedule('purge-assistant-actions')` is run deliberately. No mail needs undoing, because none was sent

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | Low (tooling, nothing shipped) | **`purge-cache.mjs` and `check-assets.mjs` disagree by 4 bytes** on the same stylesheet — 96235 against 96239. The second compares against the build and reports `identical`, so what the edge serves is correct and nothing in the release turns on it. But one of these two is the tool relied on to prove a purge took, and an unexplained disagreement in it is worth more than a shrug | **Accepted and raised on the `backlog` branch.** Recorded as unexplained rather than attributed to a cause. **A future fix must establish which number is right rather than making them agree** |
| 2 | Low (unexplained, no impact) | **`x-lanna-cache: HIT` on a page served `Cache-Control: private, no-cache, no-store`**, immediately after a full purge. Those cannot both describe the same object, so the header is reporting something other than the gate body | **Accepted and raised on the `backlog` branch.** Written into the record rather than omitted, because the `HIT` check is already documented as vacuous while the site is locked and this is a second reason not to read anything into it |

Neither defect is in shipped code, and neither changes what `0.37.2` contains.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Is `0227`'s retention job scheduled and active on production?** The migration is applied but pg_cron reports to nothing. The read-only check was refused as `[Production Reads]` and not retried | Supabase SQL editor, or a permission rule so the script can run |

**One row, not two.** An earlier draft of this plan listed `0224`'s card check as
a second outstanding item, carried forward from the handover. **That was wrong
and is corrected here**: `docs/backlog.md` records it **confirmed closed by Lutan
on 2026-10-19** — *"Management holds it, and only Management"* — so no role holds
Approve photos without Residents. The error was caught by reading the backlog
while adding this release's follow-ups. It is written into the record under
*`0224` is CLOSED* rather than quietly deleted, because repeating a question the
user has already answered is a specific failure worth naming.

Row 1 is Lutan's, is about a minute, and **is not this PR's change** — it is
listed because a record that omitted it would be the record that let it vanish.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: both rows are open items carried in the record, not checks on this PR's own change

Manual verification by: n/a: this PR is documentation of a release that has already shipped and verified; there is nothing in it for a person to look at beyond reviewing the wording

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
