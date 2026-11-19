# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Release record for `0.47.5`, and the handover rule 3 puts in the same PR |
| Backlog item | n/a: a release record closes no backlog item |
| Branch / worktree | `claude/record-0-47-5` @ `C:\Development\Animal_Shelter_record-0-47-5`, port `3006` |
| Dev server | n/a: docs-only, nothing is served or rendered |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | the branch head; the release it describes is `a06322eea` |

## 1. Scope and risk

- [x] Change is described in one sentence — records what `0.47.5` shipped, what was measured, what broke and what is still unproven, and rewrites `docs/release-handover.md` as a delta covering it
- [x] Files/areas touched — `docs/releases/2026-11-20-0-47-5.md` (new), `docs/release-handover.md` (rewritten), and this plan. Nothing else
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: two markdown files in `docs/`. Not served, imported or rendered; they gate nothing and change no behaviour
- [x] Out of scope — **the release is already deployed and verified.** This PR describes it; it ships nothing

### This is not a gate, and must not be presented as one

By the time this PR exists, `0.47.5` is live on all four hosts and verified. `CLAUDE.md` is explicit
that saying *"ready to merge when you say"* about a record invents a blocker out of bookkeeping, which
was `0.28.0`'s single largest avoidable delay. **It merges on green, like every PR.**

### The handover is in this PR because rule 3 says so, and because it was missed three times

`docs/release-procedure.md` rule 3 puts the record and the handover in **one PR**. `0.47.1`, `0.47.3`
and `0.47.4` all shipped records without one, each caught only by Lutan asking. **The check `#hndvr`
asked for now exists** — `scripts/check-release-handover.mjs` (#1733) — and it is run in §2.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branched from current `origin/main` by `worktree.mjs new`, nothing merged in
- [ ] `node scripts/gates.mjs` — n/a: **docs-only.** Two markdown files. No TypeScript, lint target, test or build input changed, and `check-docs-only.mjs` is what CI reads to make the same judgement
- [x] **`node scripts/check-release-handover.mjs`** — exit **0**: the handover's first line names `docs/releases/2026-11-20-0-47-5.md`, the newest release file. **The instrument that would have caught three missed handovers, used on the first release after it existed**
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. **The six migrations this release shipped were applied during it**, and both databases read `422 applied, 0 pending, 0 drift`, which the record states

## 4. Functional checks

- [ ] Happy path / data persists / create-edit-delete / empty state / invalid input / boundary cases — n/a: **a record has no surface.** Two files in `docs/`, not served, imported or rendered, and no route reads them
- [x] **Every figure in the record was carried from a measurement made in this session, not from memory** — the versions and SHAs from `/api/version` and `/api/releases/current` on all four hosts; the migration counts from `--status` on all three databases before and after the apply; the Server Actions key fingerprints from the two deploy logs; the stylesheet byte counts from `deploy-pi.sh`'s own asset check and again from `purge-cache.mjs`; the 536 icons from `sync-home-icons.mjs`; the 23 PRs from `release-prs.mjs`; the `--plan` mail defect from reading `scripts/deploy.mjs:392–395` and `:467`; the exit codes from the `EXIT=` line of each backgrounded command rather than from the harness notification
- [x] **What is attributed to someone else is labelled as theirs.** The `cooperjaidee.org` zone being empty (0 of 200 records) is the planner's reading, taken in the Cloudflare zone list with Lutan on screen. **My own DNS reads could prove `www` empty (NXDOMAIN) and could NOT prove the apex empty (SERVFAIL)**, and the record says so
- [x] **Length checked.** The record is in the house style — the filled-in smoke test, as `0.47.4`'s is — rather than a narrative; the first draft was a narrative and was rewritten after reading the previous record's structure. The handover is **~150 lines**, on target for a delta
- [x] **The handover retires as well as adds.** `0.47.4`'s edition opened by naming the missed-handover fault; that section is **replaced by the check that now exists**. `#pdmin` and `#fntlc` move to *now routine*, and the font half of the IPv6 fault is recorded as gone for good rather than carried forward

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two markdown files in `docs/`

## 6. Regression

- [ ] The pages nearest the change still work / shared file touched / nothing merged from `main` was broken — n/a: nothing imports either file, no shared file is touched, nothing was merged into this branch
- [x] **The one real regression risk for a record is a false statement outliving it**, so the claims inherited from `0.47.4`'s handover were re-checked rather than copied: the IPv6 font fault (now closed by `#fntlc`), the Cloudflare API failure (did not recur, and the reason was read from `--plan`), `#pdmin` (closed), the Thai sign-off (still open, now eighth release), and `sync-home-icons` (run, and the gap measured as harmless)

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a record ticks nothing. The items its contents close were ticked by their own PRs
- [ ] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the record is itself the write-up.** The one finding that arguably deserves its own decision file — PowerShell's `Tee-Object` writing the handover log as UTF-16, which makes a plain `grep` read it as empty — is recorded as defect 4 with the fix, and flagged as worth a line in `docs/release-procedure.md`. **Found, not fixed:** the procedure is not edited here
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice a release record or a handover. Neither is served, imported or rendered. **This release's two notes shipped in the cut PR (#1744) and mailed nobody**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the handover's line count from `wc -l`; the three missed editions from `git log -- docs/release-handover.md`; the house style from reading `docs/releases/2026-11-19-0-47-4.md`'s own headings rather than from assuming the shape

## 8. Pre-production gate

- [ ] Every line in this section — n/a: **this PR ships nothing to any environment.** No `src/`, no `worker/`, no migration. The release it describes is already deployed, and all four hosts served `0.47.5` @ `a06322eea` when it was written

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low (process) | **The record was first written as a narrative, not as the filled-in smoke test the house style uses** | **fixed before committing**, by reading `0.47.4`'s record headings. Recorded because the procedure says the smoke test is copied into the record, and a narrative quietly drops its checklist |
| 2 | low (instrumentation) | **`Tee-Object`'s UTF-16 output makes Lutan's deploy log read as empty to `grep`** | **recorded in the record and the handover with the decode command.** Found, not fixed: `docs/release-procedure.md` should carry a line, and this PR does not edit it |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **That the record's account of his deploy reads true** — the Meshnet drop, the two touches, and that he was asked for nothing else | Lutan | open |
| 2 | **`https://cooperjaidee.org` signed in: the authenticator step, then SAVE a web address.** The address opening proves nothing; section F's check is a saving proof | Lutan | open — the largest thing this release leaves unproven |
| 3 | **`/releases` as Admin on production shows both notes** | Lutan | open — Claude has no account there |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: all three items need Lutan's own eyes, and two of them need an account on production

Manual verification by: pending: Lutan — the record's account of his own deploy, the saving proof on the new address, and `/releases` as Admin. A record describes a release that already shipped and a handover is rewritten within one release, which is why both merge on green rather than waiting

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; no deploy step remains

Result: pass with accepted defects
