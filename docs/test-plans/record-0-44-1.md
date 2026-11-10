# Test plan — release record and handover for `0.44.1`

## Header

| | |
|---|---|
| Feature | The `0.44.1` release record and the rewritten release handover. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. This release produced no backlog edit of its own; the two tooling gaps it found are named in the record for the planner to file on the `backlog` branch, and are **not** in this PR |
| Branch / worktree | `claude/record-0-44-1` @ `C:\Development\Animal_Shelter_cut-release-0-44-1` (the cut's own worktree, reused after its PR merged, as rule 2 says) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-10 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `cc1349cb`; `check-docs-only.mjs` is the check that matters and it is read below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — three documents: `docs/releases/2026-11-10-0-44-1.md` (new), `docs/release-handover.md` (replaced) and this plan
- [x] Files/areas touched listed — exactly those three. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified on all three environments.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it. No runbook correction is included: the lessons this release produced are written into the handover's numbered items, and promoting one into `docs/release-procedure.md` is for whoever writes the next handover to do once it has held twice. **The two tooling gaps the release found are recorded, not fixed** — a release ships what the build gave it

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` after the cut PR merged, in the cut's own worktree, which was still present
- [x] `node scripts/gates.mjs` — **n/a, and deliberately so.** This is a documents-only PR; `scripts/check-docs-only.mjs` is what decides, and `ci.yml` gates every heavy job on it (`docs/release-procedure.md`, paperwork rule 1). The rule also says **not** to touch code to make a check run, so nothing here does
- [x] `node scripts/check-docs-only.mjs --base origin/main` — run **after committing**, which is the only way it can answer: against an uncommitted tree it declines to judge rather than reporting a finding about this PR. The `audit` job will therefore show **`skipped`**, which is not a pass and is correct here: no `package.json` or `package-lock.json` change to audit
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit 0

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no data. The migrations this release applied (`0348`–`0349` on production, `0347`–`0349` on UAT) belong to earlier PRs and are recorded, not carried, here

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Two markdown files nobody using the app can open

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The Thai still owed by `0349`'s photo refusals and by the UAT Thai manual is recorded in the record and in the cut plan's manual list, not fixed here
- [x] Timezone — n/a: every date in these files is a literal written by hand
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page. `docs/release-handover.md` is read by the next release manager and by nothing else
- [x] Shared file touched — `docs/release-handover.md` is replaced wholesale, which is what rule 4 prescribes: it is a delta, rewritten each release, and the superseded edition lives in git history. **It is 146 lines — over the ~100-line aim and inside the 150-line limit, counted with `wc -l` rather than estimated.** It was trimmed once before committing: four standing facts the record already states (the Server Actions keys, `STATUS_READ_TOKEN`, the icon count, the restore drill) were folded into one cited line instead of four argued ones, which is exactly what rule 4 asks. The remaining overrun is the eight numbered items, each of which is a thing that would otherwise be re-derived

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgements this release made (the deferred-note review, the choice of `f7618c2f` as the range start, the `--base` verification, the before-picture choice) are each recorded in the record and in the cut's own test plan. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and no behaviour changes. The release's own six notes shipped in the cut PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every figure in the record is a tool's own output, and the ones most likely to have been assumed were deliberately not: **the absence of mail was read from all three deploys' own refusal lines**, not inferred from `major: false`; the Server Actions key match was read off **both** the Worker and the Pi, on production and on UAT; the code identity was settled by reading that `main` and `origin/main` were the **same commit** and the commit range empty, rather than by asserting a streak; and the two before-and-after checks are quoted with both numbers (77→77 policy lines with an empty `diff`, 477→476 public-view assertions) **and the single line that moved**

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — yes, and the record names the one commit every build came from
- [x] Deployed SHA matches the tested SHA — **yes, and for once trivially.** `main` did not move during this release, so all six builds came from `cc1349cb`; the allow-list code-identity diff was run anyway and had an empty commit range to work on. Recorded as the contrast with `0.44.0`, **not** as a revived "all builds from one SHA" property, which stays retired

### On the deployed build

- [x] Deployed to test — done, before production, and verified on both endpoints
- [x] Smoke-tested on `test.lannacare.org` — the endpoint and header checks in the record. **What could not be done without an account is named** in *What this record cannot say*
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this PR
- [x] Evidence pasted into this plan and the record is the tool's actual output, unedited
- [x] Public pages re-checked after a cache purge or a 10-minute wait — both zones purged and **proved by re-fetch** at the expected byte counts, then confirmed byte-for-byte by each Pi clone's own `check-assets`. **Stated honestly in the record:** the read was `curl` and the scripts' own re-fetch, **not** a real browser with a `locale` cookie, so `x-lanna-cache` was not sampled the way the runbook prefers — and while `PUBLIC_SITE` is locked the page a visitor meets is the gate, so that check is vacuous either way

### Deploy safety

- [x] `deploy: <env> → Supabase project <ref>` line read on every deploy, and each named the right project — test `qxkmhwybjggxvsfxsxbd`, production `dbkodyyxxhtygxcxmfcu`, UAT `fsjagxmxjosauwmxwype`. **UAT's was read before anything else**, as the runbook requires
- [x] `strip-baked-env: removed N env var(s)` seen — **14 on all three**, read from each log rather than one and assumed for the rest. Not piped through `tail`, and each deploy's **own** exit code was read rather than a pipeline's
- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced by this release
- [x] **No mail went, and that was read rather than assumed** — three independent refusal lines, quoted in the record, beside the `majorReleasesSince` absence/presence pair at the cut

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither
- [x] `--dry-run` run and understood — in the cut's plan and the record
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a to this PR; **assessed in the cut's plan, where the answer was that `0348` IS destructive and irreversible**, and what stands behind it is written there rather than waved past

### Rollback

- [x] Rollback position stated — for this PR, `git revert`. It changes nothing that runs. **The release's own rollback position is in the cut's test plan**, including the one thing worth knowing: `0348` cannot be undone, so a rollback past this release leaves production without those columns and the `stock_vendors` view — harmless to the app, because nothing in `0.44.0` read them either

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The release's own defects — `check-deferred-notes.mjs` over-listing and ignoring its range, no check counting the Vendor rows `0348` archives, `check-production.mjs` refusing `--env uat`, and `0.44.0`'s four deployed SHAs making this release's range start a choice | **All five recorded in the record.** Two are new and named as backlog items for the planner; the over-listing is recorded for the fifth release running, and this time **with the argument for keeping it**, since one of its six candidates was a genuinely owed note |
| 2 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; nothing here changes a dependency |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Two documents, neither served | — |

The release's own outstanding items are in the cut plan's *Left for manual verification* and in the
record's *Open afterwards*. **They are deliberately not copied here**, because copied items get a
second home that nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-10

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty. Nothing in this PR has a surface a person could look at

Manual verification by: n/a: nothing in this PR is served, imported or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-10
