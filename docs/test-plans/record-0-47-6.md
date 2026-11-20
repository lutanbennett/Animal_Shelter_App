# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.47.6` release record, and the release handover rewritten after it |
| Backlog item | n/a: a release record closes no backlog item |
| Branch / worktree | `claude/record-0-47-6` @ `C:\Development\Animal_Shelter_record-0-47-6`, port `3001` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-20 |
| Carries a migration? | no — `0422`–`0426` were applied before the deploy and are recorded, not carried |
| Tested at SHA | this commit; the release it describes is `8b071e47dc9a8a56d42978ad2f584099dbd5fbe2` |

## 1. Scope and risk

- [x] Change is described in one sentence — two documents: `docs/releases/2026-11-20-0-47-6.md` (the filled-in smoke test for a release that has already shipped) and `docs/release-handover.md`, rewritten as the delta after it
- [x] Files/areas touched — those two files and this plan. **No application code, no migration, no script, no string**
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: neither file is served, imported or rendered. Nothing reads them but a person and the handover check
- [x] Out of scope — the release itself, which was deployed and verified before either file existed. **This PR is not a gate on it**

### Why both files are in one PR

`docs/release-procedure.md` rule 3 puts the handover in the same PR as the record. **Both merge on green
without an approval round-trip**, which is settled (`CLAUDE.md`, "Every PR merges on green"): a record
describes a release that already shipped, and a handover is rewritten within one release and corrected by
its successor rather than by a reviewer.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was cut from `origin/main` at the release SHA by `worktree.mjs new`, and nothing was merged in
- [ ] `node scripts/gates.mjs` — n/a: **no code changed.** Two Markdown files and this plan; `check-docs-only.mjs` is what CI uses to reach the same conclusion, and CI runs the gates anyway
- [x] `node scripts/check-release-handover.mjs` — **the check `#hndvr` asked for, and it passes**: *"Newest release record: docs/releases/2026-11-20-0-47-6.md (0.47.6) … Current: the handover names 0.47.6."* It is advisory and it cannot tell whether the contents are current, which is why §4 below reads the contents against what was measured
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit 0
- [x] **The record is NOT under `docs/test-plans/`, and that is deliberate** — a release record filed there would satisfy a feature PR's gate with no feature verified, and `check-test-plan.mjs` rejects it if you try
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [ ] Migration numbering / re-runnable / dry-run — n/a: **this PR carries no migration.** The five the release applied (`0422`–`0426`) went on production and UAT before the deploy and are recorded with their figures
- [x] **The figures in the record were read, not carried from a message.** `assert-schema.mjs` answers *"production holds every migration this commit carries"* and the same for UAT, both at `origin/main @ 8b071e47d`

## 4. Functional checks

- [x] **Every claim in the record traces to a command whose output was read.** The four hosts' two endpoints from `curl -4`; the Pi exit codes from the log's own `echo "…EXIT=$?"` lines rather than the harness notification; the Server Actions key from both sides (`cbd55beae8d8`); the mail proof quoted verbatim from his own deploy log after decoding it out of UTF-16; the baked `allowedOrigins` read from `.next/required-server-files.json` on the Pi; the purge re-fetches and the byte-for-byte asset check from their own output; the icon count from `sync-home-icons.mjs`
- [x] **Nothing is claimed about anything behind a sign-in on production**, which Claude has no account for. Those lines are `n/a: <reason>` and the eight outstanding presses are tabulated as gaps
- [x] **`#hostx` is recorded as NOT verified for UAT and production, with the reason.** The item asks for that check; no script in this repository reads `shelter_hosts` and an ad-hoc production read is refused, so what exists is behavioural evidence for production only — **written up as evidence, not as a check**
- [x] **The record states that the release did not make `#hostx` worse, and that was reasoned from the files**: `0426` keeps `resolve_shelter_host` alongside the new `resolve_shelter_site`, and both need the same row, so the set of hosts needing one is unchanged
- [x] **The signed-out `n/a: vacuous (site locked)` answer was checked rather than assumed** — `PUBLIC_SITE=locked` read on the Pi, and `publicSiteStateFor()` taking the more closed of the floor and the shelter's value read in `src/lib/public-site.ts`. So `0426` setting Lanna's row to `'open'` does not open the site, and this is not a regression to report
- [x] Empty state / invalid input / boundary cases — n/a: two documents, no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: neither file is reachable from the app at all. No route, no card, no page

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two Markdown files under `docs/`. No nav entry, no manual topic, no string a user sees

## 6. Regression

- [x] The pages nearest the change still work — n/a as pages; nothing imports either file. The one consumer is `check-release-handover.mjs`, which was run and passes
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is rewritten in place every release by design, so there is no second reader to break
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: a record ticks nothing. **`#rlord` was filed on the `backlog` branch during the release** and is not on `main` yet, so it cannot be ticked here either; it is a new item, not a closed one
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a: **the record and the handover ARE the write-up.** The two judgements worth keeping are in them: why the `#plhbd` note was declined, and why a baked value is proved by reading the build
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record or a handover.** Neither is served, imported or rendered, and no behaviour changes. **This release's two notes shipped in #1747 and #1750 and were published by the cut PR (#1757); it mailed nobody**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the handover check from its own run; the line count from `wc -l` (150, the target); the `check-test-plan` result from its own exit code

## 8. Pre-production gate

- [x] **Nothing is deployed by this PR**, and the release it describes was deployed and verified before it existed. There is no pre-production state to gate
- [x] Deployed SHA recorded — `8b071e47dc9a8a56d42978ad2f584099dbd5fbe2`, read back from `/api/version` on all four hosts and from `/api/releases/current` on all three Workers
- [ ] Smoke test / UAT project line — n/a: **this PR is the smoke test**, filled in against production, `cooperjaidee.org`, test and UAT

### Rollback

- [x] Rollback position stated — reverting this PR deletes a record of a release that has already shipped and restores the previous handover, which would then name `0.47.5` and fail `check-release-handover.mjs`. **Nothing live is affected either way**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in these two files.** The six defects the release itself turned up are tabulated in the record, each with what was done about it | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The saving proof on `cooperjaidee.org`** — the only check that closes `#plhbd`, and the first of the record's eight gaps | `cooperjaidee.org` | **Lutan's.** Recorded as outstanding in both files |
| 2 | That the record's account of **his own deploy** is right — the one command, no retry, no extra touch | his terminal / `.local/deploy-0.47.6.log` | **Lutan's.** Quoted from the decoded log, but only he knows whether it cost him anything unrecorded |
| 3 | `/releases` read signed in as Admin, to see the two `0.47.6` notes as a person sees them | `lannacareforanimals.org/releases` | **Lutan's.** Claude has no account on production |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs`, and every read the record cites
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: all three need Lutan, and the first needs a press on a deployed host

Manual verification by: pending: Lutan — the saving proof on `cooperjaidee.org`, the record's account of his own deploy, and `/releases` as Admin. A record describes a release that already shipped and a handover is rewritten within one release, which is why both merge on green rather than waiting

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; nothing follows this PR's merge but the gaps, which are Lutan's

Result: pass with accepted defects
