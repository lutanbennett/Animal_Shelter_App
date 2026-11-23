# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.49.0` release record and the release handover |
| Backlog item | **`#thpfx` is ticked in this PR** — the `/th` 500 found during `0.48.0`'s verification, fixed by #1847 and **proved on production by this release**, which its own item says is not a stream's job. `#pnote` was filed on the `backlog` branch |
| Branch / worktree | `claude/record-0-49-0` @ `C:\Development\Animal_Shelter_cut-release-0-49-0`, port `3002` — **the cut's own worktree, reused**, as the paperwork budget requires |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `9fc01bdc6`, **which is also the release's deployed SHA** — `main` did not move under this release at all |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-23-0-49-0.md`, rewrites `docs/release-handover.md` as a delta for `0.49.0`, and ticks `#thpfx`, whose production proof this release produced
- [x] Files/areas touched — those two, `docs/backlog.md` for the one tick, and this plan. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered, and no card, route or policy changes
- [x] Out of scope — **the release itself, which is already deployed and verified.** This PR describes it. **And out of scope on purpose: the six remaining test gaps**, every one of which needs Lutan at a screen or a phone. They are attributed in the record, not absorbed into it

### One thing IS worth promoting, and it is not promoted here — on purpose

**The useful new fact is how to settle an ambiguous liveness reading: read the process, not the files.**
UAT's bundling stage wrote 0 files for ~180 s and the file-age check could not distinguish healthy from
hung; one `Get-Process node` showed it at **1,877 MB with 238 s of CPU** and settled it in a single
command. The runbook's *A Worker deploy goes SILENT* paragraph already covers the file-age windows, so
this is **one sentence to add to an existing paragraph, not a new section** — and a runbook edit inside a
release is exactly the added scope `docs/release-procedure.md` forbids (*"A release cuts what the build
gave it"*). **It is in the handover instead, where the next release manager reads it**, and whoever edits
the runbook next can promote it in a line.

Two other candidates were considered and declined as already covered: the UTF-16 log decode and the
exit-code-through-a-pipe trap are both in the runbook verbatim. **This release met them in practice
rather than learning anything new**, which is worth recording in the record and not worth recopying.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `50376dbbc` and nothing was merged in. **`main` moved four times during this release, all of it `docs/backlog.md`**, and the code-identity allow-list diff was empty every time
- [ ] `node scripts/gates.mjs` — **n/a: documents-only.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates the heavy jobs on it, so the four gates have nothing to compile. **Per paperwork rule 1, a documents PR is NOT to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — run before opening the PR, as paperwork rule 3 requires: it must not print STALE, since the handover now names `docs/releases/2026-11-22-0-49-0.md`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **The record and the handover are ONE PR**, in the cut's own worktree. `0.37.2` used two PRs and paid two CI cycles for it
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **no migration in this PR, and none in the release either.** Both deploy databases were already at `436 applied, 0 pending` before the cut and read `No drift` after, so there was no schema step at all — the first such release in several, which the record states plainly rather than leaving to be inferred from a missing section

## 4. Functional checks

- [x] **Every figure in the record was measured, and the record says where each came from** — both database
      reads from `--status` and `--drift` on each environment; the live versions from **both** endpoints on
      all four hosts; all THREE Worker Current Version IDs from the deploys' own output; the Pi lines from each
      clone's own log on the Pi; the mail's subject and sender from the inbox; the `/th` before-and-after
      from all four hosts at both releases; and **every exit code from the command rather than through a
      pipe**, which this session had reason to care about an hour earlier
- [x] **The claims that could not be measured are marked as such, and one of them is named twice on
      purpose.** The money page's Thai *wording* is in *What this record cannot say* AND is item 1 of the
      test gap, because it is the page this release's only note describes. **And the record refuses one
      explanation it could have invented**: why production's edge went stale when test's and UAT's did not
      is written down as *not established* rather than guessed at
- [x] **The faults are recorded as faults, and the headline one is production's.** `check-assets: FAILED`
      on production's Pi deploy is in *What broke* with the stale stylesheet named, the purge that fixed it,
      and the fact that **test's and UAT's checks passed first time on the same build** — so the record
      states the asymmetry without explaining it. The `… | tail` exit-code trap from an hour earlier is
      there too, because it is this session's mistake and not a quirk of the tooling
- [x] **The pending items are attributed, not absorbed.** **Seven** plans carry a `pending:` manual line —
      the largest of any release this week — and all seven are listed as the release manager's pre-deploy
      pass, **not copied into any plan's own sign-off**, which the runbook forbids. **One of the seven was
      mine and is closed:** `thai-prefix-500`'s `pending: proof on production`, which its own item says is
      not a stream's. The other six need him at a screen or a phone and say so, with whose each is
- [x] **A contradiction two records carried is now CLOSED rather than restated.** `sync-home-icons` exited
      1 on `0.47.10` and `0.48.0` on a missing `PLATFORM_DRIVE_FOLDER_ID`, and `0.47.9` had claimed exit 0.
      **#1841 registered that variable this release and the script now uploads for real** (536 images, 67
      pages) — so the cause was a missing value all along, and the record says so instead of carrying the
      disagreement into a third edition. **The tell was the `strip-baked-env` count rising from 22 to 23**,
      and naming the new entry is what found it
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy. These files are not served

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two documents in `docs/`. No nav entry, no manual topic, nothing rendered
- [x] **No network value or device identifier is written into the repository.** The Pi was reached over the
      mesh alias and both documents name it as `lanna-pi-mesh` only — `CLAUDE.md`'s rule that the value lives
      in the Desktop notes and the meaning lives in the repo
- [x] **No credential, token or secret value appears in either document.** The two Cloudflare tokens were
      **counted, never printed**, and the record says so in those words. The 23 stripped env var **names**
      are quoted from the deploy's own output, which prints names and not values. **And the release mail was
      read in Lutan's inbox for this record** — its subject, sender name and body are quoted; his address
      appears only where the deploy's own output already printed it

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files. `docs/` is not part of any build, which `check-docs-only.mjs` asserts for itself
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by the next release manager and by `check-release-handover.mjs`, which is run above. `docs/release-procedure.md` is **not** touched this time
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — **`#thpfx` IS ticked here**, and correctly: its own text says *"FIXED AND MERGED 2026-11-23 (PR #1847); WHAT IS LEFT IS THE PRODUCTION PROOF, WHICH IS NOT A STREAM'S"*, and this release produced that proof, so the tick belongs in the PR rather than on the `backlog` branch. The new item `#pnote` went on the `backlog` branch, which is where a new item belongs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **the record and the handover are the write-up**. The judgements worth keeping are taking the `/th` BEFORE reading while the old release was still live (a proof rather than a claim), reading the process rather than the files to settle an ambiguous build-liveness check, and filing `#pnote` instead of observing the untagged-note pattern a second time
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record or a handover.** Neither is served, imported or rendered, and no behaviour changes. **This release's one note shipped in #1842 and was published by the `0.49.0` cut (#1854)**, which also mailed it
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** The release it describes is live on **all four hosts, on both endpoints, every one served by the Pi and every one reporting `9fc01bdc6`** — and the mail it sent has been read in the inbox
- [x] **The record PR is not a gate and is not presented as one** — it is merged on green without asking, per `CLAUDE.md`'s merge-on-green rule and `docs/release-procedure.md`'s *"The record PR is not a gate"*
- [ ] Smoke test / UAT project line — n/a: the smoke test IS this PR's record, already filled in

### Rollback

- [x] Rollback position stated — reverting this PR removes one document, restores the previous handover and un-ticks `#thpfx`. **Nothing deployed changes**, and the release stays exactly as it is. The cost would be losing the written record of a release that shipped and mailed, and the `/th` before-and-after that cannot be re-taken now that production is on the new build

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in this PR.** The release's own three findings are in its record, each with what was done about it, and the headline one — production's failed asset check — is recorded with the purge that fixed it and the asymmetry it leaves unexplained. **`0.48.0`'s avoidable cost did NOT recur:** that release cost Lutan four progress checks caused by my silence, and this one reported at each build boundary and cost him none | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The money page at 375px, and a Thai reader on it** — this release's only note describes that page, so the headline and the biggest gap are the same thing | `cooperjaidee.org`, the money page | **Lutan's.** Tracked in the record, not here, because it belongs to #1842 rather than to this documents PR |
| 2 | **Five more of this release's seven gaps** — two reels uploads from his phone, the Calendar console look and connect, his decision on #rlbat's metadata, and the pinned backlog page | various | **Lutan's.** Itemised in the record with whose each is |

**Nothing in this PR itself needs a person to look at it**, which is why the signature below is `n/a`
rather than `pending`. Both rows are carried for visibility and are owned by the record.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs --base origin/main`, and every figure in the record re-read from the tool that produced it
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-23

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: this PR adds two documents and there is nothing on screen to look at. The release's own pending presses are tracked in its record

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — **the release is deployed and fully verified**: all four hosts on both endpoints, the mail read in the inbox, and the `/th` fix proved with a measured before and after. Six test gaps remain and every one is his, itemised rather than absorbed; this PR is the record, and the next release manager reads the handover it rewrites

Result: pass
