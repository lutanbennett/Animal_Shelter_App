# Test plan — release record, handover and runbook correction for `0.44.2`

## Header

| | |
|---|---|
| Feature | The `0.44.2` release record, the rewritten release handover, **and a correction to `docs/release-procedure.md`**. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. The Pi-memory finding is carried in the runbook and the handover rather than as a backlog item, because it is a rule about how to deploy rather than work to schedule |
| Branch / worktree | `claude/record-0-44-2` @ `C:\Development\Animal_Shelter_cut-release-0-44-2` (the cut's own worktree, reused after its PR merged, as rule 2 says) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `7b1d9f03`; `check-docs-only.mjs` is the check that matters and it is read below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — four documents: `docs/releases/2026-11-11-0-44-2.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (**two corrected passages**) and this plan
- [x] Files/areas touched listed — exactly those four. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified on all three environments.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it
- [x] **The runbook edit is in scope, and here is why it is not scope creep.** *A release cuts what the build gave it* forbids adding **feature** work to a release; the paperwork rules explicitly say *"anything durable gets promoted into this file once"* (rule 4). The edited sentence said *"They build in parallel safely"* about the three Pi clones — **it is factually wrong on a 4 GiB Pi and it is what I followed into an OOM-killed production build.** Leaving a known-false instruction in the runbook for the next release manager is not neutral. **Two passages changed, both corrections of the same claim**, no new procedure invented, and the evidence is in the record

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` after the cut PR merged, in the cut's own worktree, which was still present
- [x] `node scripts/gates.mjs` — **n/a, and deliberately so.** This is a documents-only PR; `scripts/check-docs-only.mjs` decides, and `ci.yml` gates every heavy job on it (paperwork rule 1). The rule also says **not** to touch code to make a check run, so nothing here does
- [x] `node scripts/check-docs-only.mjs --base origin/main` — run **after committing**, which is the only way it can answer: exit **0**, *"The heavy jobs will skip; test-plan still runs."* So the `audit` job will show **`skipped`**, which is not a pass and is correct here — no `package.json` or `package-lock.json` change to audit
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**. **It caught a real fault in this very plan on the first run** and is worth recording as the check earning its keep: these two lines were written `pending` and `pending:` with no detail, and it refused with *"`pending` with no detail — say what is outstanding and who it waits on"*. Both checks had in fact already run, so the honest fix was to tick them with their results rather than to add a reason to a wait that did not exist

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no data. The three migrations this release applied (`0350`–`0352`, to production and to UAT) belong to earlier PRs and are recorded, not carried, here

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Markdown files nobody using the app can open

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The Thai still owed by `0351`'s refusals and `thai-added-since`'s worklist is recorded in the record and the cut plan's manual list, not fixed here
- [x] Timezone — n/a: every date in these files is a literal written by hand
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page. `docs/release-handover.md` is read by the next release manager and by nothing else
- [x] Shared file touched — **two.** `docs/release-handover.md` is replaced wholesale, which rule 4 prescribes: a delta, rewritten each release, superseded editions in git history. **It is 144 lines — over the ~100-line aim and inside the 150-line limit, counted with `wc -l`.** `docs/release-procedure.md` is edited in **two places only**, both the same false claim about parallel Pi builds; the surrounding procedure is untouched, and the new text states the measurement and the remedy rather than a theory

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgements here are the measured deferred-note answer, the before-picture predictions and the runbook correction. The first two are in the cut plan and the record; **the third is itself a documentation change with its evidence beside it in the record**, so a decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice a release record, a handover or a runbook correction. None of the files is served, imported or rendered, and no behaviour changes. The release's own three notes shipped in the cut PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every figure in the record is a tool's own output, and the ones most likely to have been assumed deliberately were not: **the absence of mail from all three deploys' own refusal lines**, not inferred from `major: false`; **the OOM from the bare `Killed` in the build log**, with `du -sh` run first to exonerate the cache and `free -h` read for the 4 GiB total; **the Pi's reachability from a `/dev/tcp` connect to port 2222**, after `ping` had misled me; all three Server Actions keys read off **both** the Worker and the Pi; and the three before-pictures quoted with both numbers **and the prediction each was written against**. **Where a cause is not established it says so** — the 08:39 reboot

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — yes, and the record names the one commit every build came from
- [x] Deployed SHA matches the tested SHA — **yes, trivially: `main` did not move once**, the second release running, so the allow-list code-identity diff had an empty commit range. Recorded as a fact about a quiet day, **not** as a revived "all builds from one SHA" property, which stays retired

### On the deployed build

- [x] Deployed to test — done, before production, and verified on both endpoints
- [x] Smoke-tested on `test.lannacare.org` — the endpoint and header checks in the record. **What could not be done without an account is named** in *What this record cannot say*
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this PR
- [x] Evidence pasted into this plan and the record is the tool's actual output, unedited
- [x] Public pages re-checked after a cache purge or a 10-minute wait — both zones purged and **proved by re-fetch** at the expected byte counts, then confirmed byte-for-byte by each Pi clone's own `check-assets`. **The three differing stylesheet sizes are explained in the record** rather than left looking like a fault. Stated honestly: the read was `curl` and the scripts' own re-fetch, not a real browser with a `locale` cookie

### Deploy safety

- [x] `deploy: <env> → Supabase project <ref>` line read on every deploy, and each named the right project — test `qxkmhwybjggxvsfxsxbd`, production `dbkodyyxxhtygxcxmfcu`, UAT `fsjagxmxjosauwmxwype`. **UAT's was read before anything else**, as the runbook requires
- [x] `strip-baked-env: removed N env var(s)` seen — **14 on all three**, read from each log rather than one and assumed for the rest. Not piped through `tail`, each deploy's **own** exit code read, and **his log de-nulled with `tr -d '\000'`** because PowerShell's `tee` writes UTF-16
- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced by this release
- [x] **No mail went, and that was read rather than assumed** — three independent refusal lines, one per environment, quoted in the record, beside the `majorReleasesSince` absence/presence pair at the cut. **This also corrected a false statement in `0.44.1`'s own record and handover**, which claimed test prints nothing

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither
- [x] `--dry-run` run and understood — in the cut's plan and the record
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a to this PR; **assessed in the cut's plan, where the answer was that none of the three is destructive** and each states its own undo — a real difference from `0.44.1`, which carried the irreversible `0348`

### Rollback

- [x] Rollback position stated — for this PR, `git revert`. It changes nothing that runs. **The release's own rollback position is in the cut's test plan.** Worth noting here because this release proved it: the production Pi's build failure left `.next` untouched and `lanna-care` serving `0.44.1`, which is the rollback path working without anyone invoking it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | **The release's own defects** — the unexplained Pi reboot, the OOM-killed production Pi build, my wrong "the Pi is unreachable" call, `0.44.1`'s false claim about test and mail, the deferred-note over-listing, `--env uat` still refused, and the audit noise | **All seven recorded in the record**, with the one avoidable cost attributed to me rather than to the tooling. **Two produced durable changes in this PR:** the runbook's parallel-Pi-builds claim is corrected, and `0.44.1`'s mail statement is corrected in the record |
| 2 | low | **A false instruction sat in `docs/release-procedure.md`** and was followed into a failed production build | **Fixed here**, in two passages, with the measurement beside it |
| 3 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; nothing here changes a dependency |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Markdown only, none of it served | — |

The release's own outstanding items are in the cut plan's *Left for manual verification* and the record's
*Open afterwards*. **They are deliberately not copied here**, because copied items get a second home that
nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-11

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty. Nothing in this PR has a surface a person could look at

Manual verification by: n/a: nothing in this PR is served, imported or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-11
