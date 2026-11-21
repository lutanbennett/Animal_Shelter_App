# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.47.9` release record, the release handover, and one promotion into the runbook |
| Backlog item | n/a: a release record closes no backlog item. This release's two findings were filed on the `backlog` branch as `#tncy3` and `#wwwcb` |
| Branch / worktree | `claude/record-0-47-9` @ `C:\Development\Animal_Shelter_cut-release-0-47-9`, port `3001` — **the cut's own worktree, reused**, as the paperwork budget requires |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-21 |
| Carries a migration? | No |
| Tested at SHA | this branch, cut from `origin/main` at `3435f97c1` — the release's own deployed SHA |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-21-0-47-9.md`, rewrites `docs/release-handover.md` as a delta for `0.47.9`, and promotes one durable fact into `docs/release-procedure.md`
- [x] Files/areas touched — those three, and this plan. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered, and no card, route or policy changes
- [x] Out of scope — **the release itself, which is already deployed and verified.** This PR describes it. **Also out of scope on purpose: the two findings it records.** `#tncy3` needs a migration plus a lint line and `#wwwcb` needs a script change, and `docs/release-procedure.md`'s *"A release cuts what the build gave it"* puts both outside a release

### The one promotion, and why it is in this PR rather than left to a handover

`docs/release-procedure.md` §6 told the reader the Server Actions key *"must match what the Pi build
printed"*, which reads as one global key. **There are three, one per environment**, and this release read
production's against test's for a moment before catching it. Paperwork rule 4 says a durable fact is
**promoted into the runbook once** rather than recopied into every handover, so it is promoted here, with
the three fingerprints as the worked example.

**This is the only change to the runbook**, and it adds a clarification rather than altering any step.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `3435f97c1` and nothing was merged in
- [ ] `node scripts/gates.mjs` — **n/a: documents-only.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates the heavy jobs on it, so the four gates have nothing to compile. **Per paperwork rule 1, a documents PR is NOT to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — run before opening the PR, as paperwork rule 3 requires: it must not print STALE, since the handover now names `docs/releases/2026-11-21-0-47-9.md`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **The record and the handover are ONE PR**, in the cut's own worktree. `0.37.2` used two PRs and paid two CI cycles for it
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **no migration in this PR.** The release's six are applied and recorded, and both deploy databases read `434 applied, 0 pending, No drift`

## 4. Functional checks

- [x] **Every figure in the record was measured, and the record says where each came from** — the two
      database reads from `--status` and `--drift` on each environment; the live versions from **both**
      endpoints on all four hosts; the Worker versions from `wrangler deployments list` on production and
      UAT; the Pi lines from each clone's own deploy log; the four gate numbers, the 17 cut assertions and
      every check's exit code from the runs quoted
- [x] **The one claim that could not be measured is marked as such.** `0430`'s leak was measured on dev
      inside `0429`'s harness, not on production, because production's public site is locked and there is
      no anon read there to re-measure. The record says so under *What this record cannot say* rather than
      implying a production measurement
- [x] **The pending items are attributed, not absorbed.** 11 production items are `pending: Lutan` because
      Claude has no account there, and the release's ten outstanding test-plan signatures are listed as the
      release manager's pre-deploy pass — **not copied into any plan's own sign-off**, which the runbook
      forbids
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy. These files are not served

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: three documents in `docs/`. No nav entry, no manual topic, nothing rendered
- [x] **No network value or device identifier is written into the repository.** The Pi was reached over the
      mesh alias and the record and handover name it as `lanna-pi-mesh` only — `CLAUDE.md`'s rule that the
      value lives in the Desktop notes and the meaning lives in the repo. **The alias resolves to a host
      name that was deliberately not written down here**

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files. `docs/` is not part of any build, which `check-docs-only.mjs` asserts for itself
- [x] Shared file touched, checked from a second unrelated page — `docs/release-procedure.md` is read by people, not by code. The promotion adds a paragraph and changes no step, so no instruction elsewhere is contradicted
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: nothing to tick. The two findings were filed on the `backlog` branch in their own commit, which is where backlog edits belong
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **the record and the handover are the write-up**, and the one durable judgement went into the runbook instead, which is where paperwork rule 4 puts it
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record, a handover or a runbook paragraph.** None is served, imported or rendered, and no behaviour changes. **This release's one note shipped in #1790 and was published by the `0.47.9` cut (#1807)**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** The release it describes is already live on all four hosts, verified on both endpoints, and this PR is its record
- [x] **The record PR is not a gate and is not presented as one** — it is merged on green without asking, per `CLAUDE.md`'s merge-on-green rule and `docs/release-procedure.md`'s *"The record PR is not a gate"*
- [ ] Smoke test / UAT project line — n/a: the smoke test IS this PR's record, already filled in

### Rollback

- [x] Rollback position stated — reverting this PR removes three documents and restores the previous handover. **Nothing deployed changes**, and the release stays exactly as it is. The only cost would be losing the written record of a release that shipped

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in this PR.** The release's own five defects are in its record, each with what was done about it | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The release's 11 `pending: Lutan` production items**, the logo card above all — it is this release's only note | `lannacareforanimals.org`, signed in | **Lutan's.** Tracked in the record, not here, because they belong to the release rather than to this documents PR |

**Nothing in this PR itself needs a person to look at it**, which is why the signature below is `n/a`
rather than `pending`. The row above is carried for visibility only and is owned by the record.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs --base origin/main`, and every figure in the record re-read from the tool that produced it
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: this PR adds three documents and there is nothing on screen to look at. The release's own pending presses are tracked in its record

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the release is already deployed and verified; this PR is its record, and the next release manager reads the handover it rewrites

Result: pass
