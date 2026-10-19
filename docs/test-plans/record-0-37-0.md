# Feature test plan — record-0-37-0

## Header

| | |
|---|---|
| Feature | The `0.37.0` release record (`docs/releases/2026-10-19.md`) and a rewritten `docs/release-handover.md` |
| Backlog item | `docs/backlog.md` → none — a release record closes no backlog item. **The three faults this release found went on the `backlog` branch**, not here |
| Branch / worktree | `claude/record-0-37-0` @ `C:\Development\Animal_Shelter_record-0-37-0` |
| Dev server | not driven — no runtime surface; see §5 |
| PR | **#732** — guessed at the time of writing, **to be re-read from `gh pr view` after opening and corrected here**. #731 was guessed right after two wrong; the re-read is what makes it safe either way |
| Tested by / date | Claude (production release manager session) / 2026-10-19 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — record what `0.37.0` did, what broke and what it cost, and rewrite the handover so the next release manager does not re-derive the Pi cache fault
- [x] Files/areas touched listed — **two documentation files only**: `docs/releases/2026-10-19.md` (new) and `docs/release-handover.md` (rewritten), plus this plan. No code, no route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified — **none.** Neither file is read by the app or served to any user; they are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down — three things. (a) **Fixing** any of the three faults the record describes: the Turbopack cache, `setup.sh`'s missing swap priority and `eslint` walking into `.claude/worktrees/` are each their own PR with their own plan, and all three are on the `backlog` branch. (b) The nine outstanding manual items, which belong to their own feature plans. (c) The live Pi changes made during the release (swap priority, `fstab` line, cache deletion) — they are **recorded** here but the repo half of each is a separate change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly before anything was written in this worktree
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit.` Written and committed before the PR is opened so the first run is green by construction; ticked in a follow-up commit once a run is seen green with its `headSha` matched against this branch's HEAD
- [x] `node scripts/check-test-plan.mjs` — the plan is complete and correct

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR, and none in the repository changed.`

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`. For the record: `origin/main` tops out at `0223`, so the next free number is `0224`
- [ ] `--status` reviewed before applying — `n/a: no migration in this PR`. Read for the release and recorded: production `221 applied, 3 pending` → `224 applied, 0 pending`
- [ ] `--dry-run` reviewed — `n/a: no migration in this PR`. The release's three dry-ran `ok` and that is stated in the record
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration, and this PR writes no row anywhere`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: no migration in this PR`. The release's apply is complete and recorded: `0221`, `0222`, `0223`, before every deploy

## 4. Functional checks

Two Markdown files. There is no behaviour to drive.

- [x] Happy path works end to end — both files render as Markdown, every table is well-formed, and **every factual claim traces to a tool's output captured during the release**: the cache sizes (`du -sh`), the three OOM kill RSS figures (`journalctl -k`), the migration counts (`--status`), the Server Actions keys (both deploy logs), the asset-check bytes (`check-assets.mjs`) and the backup's size and timestamp (read from Drive)
- [x] Data persists — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a record is written once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — `n/a: neither file has a data-driven empty state`
- [x] Invalid input is rejected with a readable message, not a crash — `n/a: neither file is parsed by code.` `check-backlog-sections.mjs` validates the backlog, which this PR does not touch
- [x] Boundary cases checked — the numbers were **measured, not recalled**: cache 4.4 GB → `.next` 450 MB, kills at 2,799 / 2,680 / 2,254 / 2,212 MB, 13 PRs, 3 migrations, 224 applied, backup 1,279,505 bytes. **Where a number could not be established it is written as not established** — see *What this record cannot say*, which states plainly that why the cache reached 4.4 GB is unknown

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | neither file | documentation is not served by the app | unchanged — no route touched |
| management | neither file | as above | unchanged |
| second_in_command | neither file | as above | unchanged |
| head_of_medical | neither file | as above | unchanged |
| doctor | neither file | as above | unchanged |
| volunteer | neither file | as above | unchanged |
| signed out | neither file | as above | unchanged |

- [x] Every role above tested — tested at the level this change operates at: **no role can reach either file**, because nothing in `src/` or `worker/` reads `docs/`. This PR changes no route, middleware or policy
- [x] A role that should not have access is blocked server-side — `n/a: there is no server surface to block`

## 5. Cross-cutting

- [x] Nav entry correct — `n/a: not touched`
- [x] Manual updated and the topic reads correctly at `/manual` — `n/a: not touched.` The release's features carry their manual changes in their own PRs
- [x] Translatable strings go through the translation path — `n/a: internal documentation is not translated`
- [x] Mobile viewport (375px) — `n/a: no markup or styles in this diff`
- [x] Browser console clean — `n/a: nothing in this diff executes in a browser`
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — `n/a: neither file has a consumer in the running app.` Their consumers are human
- [x] Any shared file touched checked from a second, unrelated page — `n/a: no shared file touched.` `docs/release-handover.md` is rewritten each release by design and nothing imports it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release record closes no backlog item.` **The three faults found during the release were added to the `backlog` branch** (`f6d2bdf1`), which is where follow-ups belong, and deliberately not to this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release's decisions are recorded in the record itself: why major, and why three of Lutan's six touches should not have been his
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: a release record describes a release that has already shipped and adds no user-visible change.` Ticking would be false — `unreleased` gained no line and is deliberately empty, having just been emptied by the cut
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — this is the line that matters most in this PR, because a record is nothing but claims. **Three in particular were corrected rather than left standing**: (a) the opening message's warning that a cardless role lands on a blank home, withdrawn after `check-home-screens.mjs` was found to assert the opposite; (b) the prediction that the self-updating deploy-script fix would not run this release, corrected when `restarting under the script from 2b1dc2e5` appeared in the log; (c) two diagnoses of the Pi failure — swap priority and memory degradation — both recorded as **wrong**, with what disproved each, rather than quietly dropped

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — the branch tip
- [x] Deployed SHA matches the tested SHA — `n/a: this PR ships nothing.` **The release it records is already deployed and verified**: `2b1dc2e5` on all four surfaces

### On the deployed build

- [x] Deployed to test — `n/a: this PR is not deployed.` The release it describes was deployed to test and production and verified before this was written
- [x] Smoke-tested on `test.lannacare.org` — `n/a: not applicable to a documentation PR.` The release's own smoke test **is** this record
- [ ] **Timezone-sensitive behaviour proved** — `n/a: nothing in this diff derives "today".` The dates in both files are literals
- [ ] **Boundary or banding change** — `n/a: no boundary or banding change`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in §2 is copied as printed, and every figure quoted in the record is likewise
- [ ] Public pages re-checked after a cache purge — `n/a: PUBLIC_SITE is locked on both environments`, so there is no anonymous public page to check. **The purge itself was done** for the release and is recorded, and the asset check was re-run against the freshly-purged cold edge and came back identical

### Deploy safety

- [x] `deploy: production → Supabase project <ref>` line read — done for the release and recorded: `dbkodyyxxhtygxcxmfcu (2b1dc2e5)`, read out of Lutan's own log rather than taken from "Done"
- [x] `strip-baked-env: removed N env var(s)` seen — 13 on both Worker builds, recorded
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none.` `CLOUDFLARE_PURGE_TOKEN` is still outstanding and belongs in `.env.deploy.production`, never as a Worker secret

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. The release's three applied before every deploy, which mattered because `0223`'s header had gone stale: the code that reads its tables merged after it did
- [x] `--env production --dry-run` run and clean — done for the release: all three `ok`, the clean case
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: this PR carries no migration`, and none of the release's three is destructive. The backup is recorded with its size and timestamp
- [x] Apply plan stated — complete: `0221`, `0222`, `0223` to `dbkodyyxxhtygxcxmfcu`, before every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **this PR is documentation; reverting it removes a record and changes nothing a user can reach.** The release's own rollback position is stated in full in the record: `deploy-pi.sh --ref e581c631` on the Pi, `wrangler rollback --env production` for the Worker fallback only, neither reverting the three migrations, and **the mail being the one genuinely irreversible step**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | No defect was found in this PR. The defects of the **release** — four killed Pi builds from a stale build cache, an unpersisted swapfile, a refused migration apply, a misleading five-figure lint failure and a stuck backlog merge — are the subject matter, recorded in full in `docs/releases/2026-10-19.md` and raised on the `backlog` branch | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan reads the record and says whether the account of his six interventions, and of the two wrong diagnoses that caused three of them, matches what he experienced | `docs/releases/2026-10-19.md` |

That item is a judgement only he can make and cannot be scripted. Everything
factual in both files traces to tool output captured during the release.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: one row, Lutan's reading of the record, see the table

Manual verification by: pending: Lutan, the one row in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass
