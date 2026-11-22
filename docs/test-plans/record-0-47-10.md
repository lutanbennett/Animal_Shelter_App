# Feature test plan

---

## Header

| | |
|---|---|
| Feature | The `0.47.10` release record and the release handover |
| Backlog item | n/a: a release record closes no backlog item. This release's one new finding was filed on the `backlog` branch as `#tstok` |
| Branch / worktree | `claude/record-0-47-10` @ `C:\Development\Animal_Shelter_cut-release-0-47-10`, port `3003` — **the cut's own worktree, reused**, as the paperwork budget requires |
| Dev server | n/a: documents only, nothing to run |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (release manager session) / 2026-11-22 |
| Carries a migration? | No |
| Tested at SHA | this branch, created from `origin/main` at `7a1aae4ea` — the release's own deployed SHA |

## 1. Scope and risk

- [x] Change is described in one sentence — adds `docs/releases/2026-11-22-0-47-10.md` and rewrites `docs/release-handover.md` as a delta for `0.47.10`
- [x] Files/areas touched — those two, and this plan. No code, no schema, no configuration
- [ ] Cards affected identified, plus whether admin and the signed-out public are affected — n/a: documents. Nothing is served, imported or rendered, and no card, route or policy changes
- [x] Out of scope — **the release itself, which is already deployed and verified.** This PR describes it. **Also out of scope on purpose: the finding it records.** `#tstok` needs a Cloudflare API token that only Lutan can create, and `docs/release-procedure.md`'s *"A release cuts what the build gave it"* puts fixing it outside a release

### Nothing is promoted into the runbook this time, and that is deliberate

`0.47.9` promoted the per-environment Server Actions key into `docs/release-procedure.md` §6, and it paid
immediately — the three keys were read correctly this release with no thought. **This release's lesson is a
missing credential, not a rule**, so it belongs in the handover and in `#tstok`, not in the runbook: the
runbook already says *"the durable fix is a scoped `CLOUDFLARE_API_TOKEN`"*. Writing it again would be the
recopying paperwork rule 4 exists to stop.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created from `origin/main` at `7a1aae4ea` and nothing was merged in
- [ ] `node scripts/gates.mjs` — **n/a: documents-only.** `scripts/check-docs-only.mjs` decides this and `ci.yml` gates the heavy jobs on it, so the four gates have nothing to compile. **Per paperwork rule 1, a documents PR is NOT to be "fixed" by touching code to make a check run**
- [x] `node scripts/check-release-handover.mjs` — run before opening the PR, as paperwork rule 3 requires: it must not print STALE, since the handover now names `docs/releases/2026-11-22-0-47-10.md`
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [x] **The record and the handover are ONE PR**, in the cut's own worktree. `0.37.2` used two PRs and paid two CI cycles for it
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [x] Migration numbering / re-runnable / down-migration / dry-run — n/a: **no migration in this PR.** The release's one migration, `0434`, is applied and recorded, and both deploy databases read `435 applied, 0 pending, No drift`

## 4. Functional checks

- [x] **Every figure in the record was measured, and the record says where each came from** — both database
      reads from `--status` and `--drift` on each environment; the live versions from **both** endpoints on
      all four hosts; the two Worker Current Version IDs from the deploys' own output; the Pi lines from each
      clone's own log on the Pi; the tenancy lint's before and after from its own output; every exit code
      from the command rather than through a pipe
- [x] **The claims that could not be measured are marked as such.** `0434`'s effect was read in the
      catalogue, not in the app: no screen was pressed to watch `set_shelter_logo` run as `rls_definer`, and
      the record says so under *What this record cannot say* rather than implying a production press
- [x] **The failure is recorded as a failure.** Test's Worker did not deploy, the record's *During the
      deploy* section carries an unticked line saying so, and the host table shows `0.47.9` against test's
      Worker instead of a tidy row of fours. **A release record that reads as though everything landed when
      one thing did not is worse than none**
- [x] **The pending items are attributed, not absorbed.** 13 production items are `pending: Lutan` because
      Claude has no account there; the release's one outstanding test-plan signature (#1818's Google
      consent) is listed as the release manager's pre-deploy pass — **not copied into any plan's own
      sign-off**, which the runbook forbids
- [x] **One contradiction with the previous record is stated rather than smoothed over** — `sync-home-icons`
      exited 1 today where `0.47.9`'s record says 0, from an unchanged script. The record says one of the two
      readings is wrong and which one was run bare
- [x] Empty state / invalid input / boundary cases — n/a: documents have no inputs

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: no route, no card, no policy. These files are not served

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: two documents in `docs/`. No nav entry, no manual topic, nothing rendered
- [x] **No network value or device identifier is written into the repository.** The Pi was reached over the
      mesh alias and both documents name it as `lanna-pi-mesh` only — `CLAUDE.md`'s rule that the value lives
      in the Desktop notes and the meaning lives in the repo
- [x] **No credential, token or secret value appears in either document.** The two Cloudflare tokens were
      **counted, never printed**, and the record says so in those words. The 20 stripped env var **names**
      are quoted from the deploy's own output, which prints names and not values

## 6. Regression

- [x] The pages nearest the change still work — nothing imports these files. `docs/` is not part of any build, which `check-docs-only.mjs` asserts for itself
- [x] Shared file touched, checked from a second unrelated page — `docs/release-handover.md` is read by the next release manager and by `check-release-handover.mjs`, which is run above. `docs/release-procedure.md` is **not** touched this time
- [x] Nothing merged from `main` was broken by this branch — nothing was merged

## 7. Documentation

- [x] Backlog item ticked on this branch — n/a: nothing to tick here. `#tncy3` and `#wwwcb` were already ticked by #1812 and #1813, and the new finding was filed on the `backlog` branch in its own commit, which is where backlog edits belong
- [x] Non-obvious design choices as a new file in `docs/decisions/` — n/a as a decision file: **the record and the handover are the write-up**, and the judgement not to borrow another environment's token is recorded in both
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody using the app would notice a release record or a handover.** Neither is served, imported or rendered, and no behaviour changes. **This release's one note shipped in #1816 and was published by the `0.47.10` cut (#1820)**
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned**

## 8. Pre-production gate

- [x] **Nothing in this PR is deployed.** The release it describes is live on production, `cooperjaidee.org` and UAT on both endpoints, and on test's Pi app
- [x] **The record PR is not a gate and is not presented as one** — it is merged on green without asking, per `CLAUDE.md`'s merge-on-green rule and `docs/release-procedure.md`'s *"The record PR is not a gate"*
- [ ] Smoke test / UAT project line — n/a: the smoke test IS this PR's record, already filled in

### Rollback

- [x] Rollback position stated — reverting this PR removes one document and restores the previous handover. **Nothing deployed changes**, and the release stays exactly as it is. The only cost would be losing the written record of a release that shipped, including the one thing in it that did not land

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| — | — | **None in this PR.** The release's own five findings are in its record, each with what was done about it, and the one that needs action is filed as `#tstok` | n/a |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **The release's 13 `pending: Lutan` production items**, the logo cap above all — a file over 1 MB refused in both languages, then one under it on the public header | `lannacareforanimals.org`, signed in | **Lutan's.** Tracked in the record, not here, because they belong to the release rather than to this documents PR |
| 2 | **`#tstok`: restore the test deploy's authentication**, then one command brings test's Worker to `0.47.10`. **Corrected the same day: NOT a token in `.env.local`**, which the 2026-11-16 decision forbids — `wrangler login` now, or a gitignored `.env.deploy.test` as the durable fix | this machine | **Lutan's** for the login press; the durable fix is a one-line code change and anybody's |

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
