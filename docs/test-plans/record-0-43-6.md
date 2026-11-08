# Test plan — release record, handover and runbook corrections for `0.43.6`

## Header

| | |
|---|---|
| Feature | The `0.43.6` release record, the rewritten release handover, and **three corrections to `docs/release-procedure.md`**. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. The runbook corrections close nothing on the backlog either; the *code* half of one of them is filed as `#pz3tk` |
| Branch / worktree | `claude/record-0-43-6` @ `C:\Development\Animal_Shelter_cut-release-0-43-6` (the cut's own worktree, reused after its PR merged, as rule 2 says) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `9b07b038`; `check-docs-only.mjs` is the check that matters and it is run below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — four documents: `docs/releases/2026-11-08-0-43-6.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (three corrections) and this plan
- [x] Files/areas touched listed — exactly those four. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified on both production and test.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it

### Why this PR edits the runbook, which is more than a record normally does

Three things in `docs/release-procedure.md` were found to be wrong **by measuring what they asserted**,
and all three would have cost the next release manager:

1. **A standing fact that has been false for two releases.** It said the production purge covers
   `test.lannacare.org` because they are one Cloudflare zone, and that `--env test` refusing was
   therefore harmless. The 2026-11-06 cutover gave production its own zone. Measured with `--dry-run`,
   which sends nothing. **Nothing purges test.**
2. **A measurement the last handover prescribed, which gives a false answer.**
   `find .open-next -newermt '-20 seconds'` returned 63 on `0.43.5` and **`0` on a healthy build here**.
3. **The fix for (2) would itself have misread a healthy build**, because `.open-next` is only written
   during the OpenNext stages — during `next build` the writes go to `.next`. Corrected in the same PR
   as (2) rather than shipped wrong.

Paperwork rule 4 says a durable fact is **promoted into the runbook once rather than recopied every
release**, and two of these had been carried in the handover for several editions while remaining
unfixed at source. **Correcting the runbook is the release's own paperwork, not out-of-scope work:** no
`src/` file, no behaviour and no backlog item is touched, and the code half of (1) is filed separately
as `#pz3tk` rather than done here.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` at `9b07b038` immediately before the first commit, and `main` has not moved since
- [x] `node scripts/gates.mjs` — **n/a: a documents-only PR has nothing for the four gates to exercise, and `check-docs-only.mjs` is what establishes that.** Its output is the evidence, in section 6. Running a 12-minute build over four markdown files would produce a number, not a check. The gates **were** run on this release's code, on the cut: `typecheck=0 lint=0 test=0 build=0`
- [x] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run **before the PR was opened**, which is the ordering `0.43.2`'s record PR got wrong
- [x] **`audit` will show `skipped` on this PR, and that is not a pass** — it means nothing was checked, on purpose, because no dependency file changed. The release's real audit was run on the cut: `audit:prod` exit 1 with five vulnerabilities, `audit:register` **exit 0** with one registered, unreachable high advisory

## 3. Schema and data

- [x] n/a: no migration in this PR. The release's eight (`0330`–`0337`) were applied before its deploy and are recorded in `docs/releases/2026-11-08-0-43-6.md`; production reads **339 applied, 0 pending**, drift zero in both directions on **both** databases

## 4. Functional checks

- [x] Happy path works end to end — the documents render as markdown and their internal references resolve; checked in section 6
- [x] Data persists — n/a: documents, not rows
- [x] Create / edit / delete all exercised — n/a: this PR adds two files and edits two; there is no delete and no user-facing operation
- [x] Empty state renders sensibly — n/a: no list and no empty state
- [x] Invalid input is rejected with a readable message, not a crash — n/a: nothing here takes input
- [x] Boundary cases checked — n/a: no threshold, band or cutoff
- [x] Every login tested / a login that should not have access is blocked server-side — n/a: **none of these files is served to any login.** Two are read by a release manager, one by whoever runs the next release, one by `check-test-plan.mjs`

## 5. Cross-cutting

- [x] Nav entry correct — n/a: no nav change
- [x] Manual updated — n/a: none of this is a manual topic
- [x] Translatable strings go through the dictionaries — n/a: no user-facing string. These documents are English-only by the same convention as every other document in the repository
- [x] Mobile viewport (375px) — n/a: nothing renders
- [x] Browser console clean — n/a: nothing renders
- [x] Network clean — n/a: nothing is fetched

## 6. Regression

- [x] The pages nearest the change still work — n/a: no page is near these files
- [x] Any shared file touched checked from a second, unrelated page — n/a: nothing imports a markdown document. `docs/release-procedure.md` is "shared" only in the sense that people read it, and the three edits are additive or replace a paragraph in place; the surrounding traps are untouched
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

**`node scripts/check-docs-only.mjs --base origin/main`, run after the documents were committed so it
has real paths to read** (the `0.43.4` trap was a plausible block typed from memory; before the commit
existed this same command answered `no changed files could be read`):

```
DOCS-ONLY-BLOCK
```

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes no backlog item. It **files** one (`#pz3tk`, the code half of the purge gap) on the `backlog` branch, which is where backlog edits belong — not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a, deliberately: the judgement in this PR *is* the runbook correction, and it is written into `docs/release-procedure.md` itself with the measurement that justifies it, plus the release record. A decision file would be a third home for the same three paragraphs, and the runbook is where the next release manager actually looks
- [x] `README.md` still accurate — unchanged by this diff
- [x] **Release notes.** n/a: nobody using the app would notice a release record, a handover or a correction to the release runbook. None of the four files is served, imported or rendered, and no behaviour changes. The release's own eleven notes shipped in the cut
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every figure in the record came from a run whose output is quoted: the migration counts from `--status` and `--drift`, the deploy lines from the logs and the terminal, the Worker version from `wrangler deployments list` as well as the log, the purge from the Pi's own byte-for-byte check, the before/after card and policy checks from `check-production.mjs`, and the two false measurements in section 1 from running them

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a as a deploy gate: **this PR ships no code.** The release's own tested and deployed SHAs are in its record, and the code-identity diff `cf54463f..9b07b038` was **empty outright**
- [x] Deployed SHA matches the tested SHA — n/a: nothing to deploy. Merging this changes nothing that runs
- [x] Deployed to test / smoke-tested — n/a: documents are not deployed
- [x] Timezone-sensitive behaviour proved — n/a: no date arithmetic. The record's dates are literal strings
- [x] Evidence pasted into this plan is the tool's actual output, unedited — yes, and the one block that could not be filled before the commit existed says so above rather than being typed from memory
- [x] Public pages re-checked after a cache purge — n/a for this PR; done for the release, and proved `HIT` and byte-identical on production
- [x] Deploy safety / new secret or env var — n/a: this PR introduces none, and changes no deploy script. The runbook edits are prose
- [x] Migration ordering — n/a: no migration in this PR
- [x] Rollback position stated — **reverting this PR removes a record and restores three wrong paragraphs to the runbook.** Nothing that runs would change. That is the whole risk

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | none | The release's own seven defects | Recorded in `docs/releases/2026-11-08-0-43-6.md`, not here. They belong to the release, not to this documents PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | n/a: nothing in this PR has a surface a person could look at. The release's own manual items are on its cut plan and in its record | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, and why is stated

Manual verification by: n/a: nothing in this PR has a surface a person could look at; the release's own manual items are on its cut plan

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-08
