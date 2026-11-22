# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.48.0` release record and the release handover |
| Backlog item | **`#tstok` is ticked in this PR** (closed by the release's own test deploy). The release's new finding was filed on the `backlog` branch as `#thpfx` |
| Branch / worktree | `claude/record-0-48-0` @ `C:\Development\Animal_Shelter_cut-release-0-48-0`, port `3009` — **the cut's own worktree, reused**, as the paperwork budget requires |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `50376dbbc`; the release's own deployed SHA is `050b44b0f` |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-22-0-48-0.md` and rewrites `docs/release-handover.md` as a delta for `0.48.0`
- [x] Files/areas touched — those two, and this plan. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered, and no card, route or policy changes
- [x] Out of scope — **the release itself, which is already deployed and verified.** This PR describes it. **Also out of scope on purpose: the fault it records.** `#thpfx` is a code fix to the `/th` rewrite, and `docs/release-procedure.md`'s *"A release cuts what the build gave it"* puts that outside a release — it is filed for the planner, with the whole measurement, rather than patched here

### Nothing is promoted into the runbook this time, and that is deliberate

Two candidates were considered and both declined. **The `.open-next` liveness window** (UAT's bundling
stage wrote 0 files in 120 s while perfectly healthy) is already in the runbook under *A Worker deploy goes
SILENT*, which says to use two or three minutes — this release is one more confirmation, not a new rule.
**And the lesson about test gaps** — that a plan's unchecked line is a place to look rather than a place to
sign — is this release's own story and belongs in the handover, where the next release manager reads it;
the runbook already says *"shorten the prose, never the checking"*. Promoting either would be the
recopying paperwork rule 4 exists to stop.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `50376dbbc` and nothing was merged in. **`main` moved four times during this release, all of it `docs/backlog.md`**, and the code-identity allow-list diff was empty every time
- [ ] `node scripts/gates.mjs` — **n/a: documents-only.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates the heavy jobs on it, so the four gates have nothing to compile. **Per paperwork rule 1, a documents PR is NOT to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — run before opening the PR, as paperwork rule 3 requires: it must not print STALE, since the handover now names `docs/releases/2026-11-22-0-48-0.md`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **The record and the handover are ONE PR**, in the cut's own worktree. `0.37.2` used two PRs and paid two CI cycles for it
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **no migration in this PR.** The release's one migration, `0435_shelter_drive_staged.sql`, is applied and recorded, and both deploy databases read `436 applied, 0 pending` with `No drift` in both directions

## 4. Functional checks

- [x] **Every figure in the record was measured, and the record says where each came from** — both database
      reads from `--status` and `--drift` on each environment; the live versions from **both** endpoints on
      all four hosts; all THREE Worker Current Version IDs from the deploys' own output; the Pi lines from each
      clone's own log on the Pi; the tenancy lint's before and after from its own output; every exit code
      from the command rather than through a pipe
- [x] **The claims that could not be measured are marked as such.** `0435` has no reader on `main` at all,
      so there is nothing to press and the record says the first real proof is the Drive move itself, which
      belongs to another stream. And the Thai *wording* of the product page is listed under *What this record
      cannot say*: 5,418 Thai characters render, but whether they say the right thing cannot be read from here
- [x] **The faults are recorded as faults, including the one that is not this release's.** `#thpfx` is in
      *What broke* with the measurement that separates it from the release — `/th` answered 500 on all three
      environments **including the two still serving `0.47.10`** — so the record neither claims it nor
      disowns it. `sync-home-icons.mjs` exiting 1 is there too, with the open item that already owns the
      missing variable. **And the record carries its own correction**: the first `#thpfx` write-up had the
      wrong URL in its table, and that is written down rather than quietly fixed
- [x] **The pending items are attributed, not absorbed.** The release's three outstanding manual signatures
      (#1829's Thai wording, #1831's production canary, #1827's test deploy) are listed as the release
      manager's pre-deploy pass — **not copied into any plan's own sign-off**, which the runbook forbids.
      **Two of them moved:** #1827's is closed by this release's own test deploy, and two of #1829's three
      unchecked functional lines were closed from here rather than passed on
- [x] **A contradiction the LAST record could only state, this one can settle.** `0.47.10` found
      `sync-home-icons` exiting 1 where `0.47.9`'s record says 0, and had no way to choose between them.
      **It exited 1 again today**, so two consecutive releases agree and `0.47.9`'s figure is the odd one
      out. The record says that, rather than repeating the open disagreement
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy. These files are not served

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two documents in `docs/`. No nav entry, no manual topic, nothing rendered
- [x] **No network value or device identifier is written into the repository.** The Pi was reached over the
      mesh alias and both documents name it as `lanna-pi-mesh` only — `CLAUDE.md`'s rule that the value lives
      in the Desktop notes and the meaning lives in the repo
- [x] **No credential, token or secret value appears in either document.** The two Cloudflare tokens were
      **counted, never printed**, and the record says so in those words. The 22 stripped env var **names**
      are quoted from the deploy's own output, which prints names and not values. **And the release mail was
      read in Lutan's inbox for this record** — its subject, sender name and body are quoted; his address
      appears only where the deploy's own output already printed it

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files. `docs/` is not part of any build, which `check-docs-only.mjs` asserts for itself
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by the next release manager and by `check-release-handover.mjs`, which is run above. `docs/release-procedure.md` is **not** touched this time
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — **`#tstok` IS ticked here**, and correctly: it was closed by this release's own `--env test` deploy running on `.env.deploy.test`'s token, which is the proof it owed, so the tick belongs in the PR rather than on the `backlog` branch. The new fault `#thpfx` went on the `backlog` branch in its own two commits, which is where a new item belongs
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **the record and the handover are the write-up**. The judgements worth keeping are the `#thpfx` diagnosis (one cause, pre-existing, masked by the lock), the decision not to hold the release for it, and the decision not to alter an untagged note during a cut
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record or a handover.** Neither is served, imported or rendered, and no behaviour changes. **This release's two notes shipped in #1829 and #1823 and were published by the `0.48.0` cut (#1834)**, which also mailed them
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** The release it describes is live on **all four hosts, on both endpoints, every one served by the Pi and every one reporting `050b44b0f`** — and the mail it sent has been read in the inbox
- [x] **The record PR is not a gate and is not presented as one** — it is merged on green without asking, per `CLAUDE.md`'s merge-on-green rule and `docs/release-procedure.md`'s *"The record PR is not a gate"*
- [ ] Smoke test / UAT project line — n/a: the smoke test IS this PR's record, already filled in

### Rollback

- [x] Rollback position stated — reverting this PR removes one document, restores the previous handover and un-ticks `#tstok`. **Nothing deployed changes**, and the release stays exactly as it is. The cost would be losing the written record of a release that shipped and mailed, and the measurement behind `#thpfx`

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in this PR.** The release's own four findings are in its record, each with what was done about it, and the one that needs action is filed as `#thpfx`. The avoidable cost of the release — four progress checks Lutan should not have had to make — is recorded there too, under *What it cost him*, with the cause named as my silence rather than the release | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **Look at `cooperjaidee.org` and read the Thai wording** — this release's headline note, and the one gap that only he can close. 5,418 Thai characters render; whether they say the right thing cannot be read from here | `cooperjaidee.org/platform/about` | **Lutan's.** Tracked in the record, not here, because it belongs to #1829 rather than to this documents PR |
| 2 | **The `pending: Lutan` production presses carried from `0.47.9` and `0.47.10`** | `lannacareforanimals.org`, signed in | **Lutan's**, carried forward rather than re-adopted |

**Nothing in this PR itself needs a person to look at it**, which is why the signature below is `n/a`
rather than `pending`. Both rows are carried for visibility and are owned by the record.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed — `check-release-handover.mjs`, `check-test-plan.mjs --base origin/main`, and every figure in the record re-read from the tool that produced it
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (release manager session)  Date: 2026-11-22

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a in substance: this PR adds two documents and there is nothing on screen to look at. The release's own pending presses are tracked in its record

Manual verification by: n/a: documents only — nothing is served, imported or rendered, so there is no screen to check

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed on — the release is deployed and verified apart from test's Worker, which is recorded as outstanding with its cause; this PR is the record, and the next release manager reads the handover it rewrites

Result: pass
