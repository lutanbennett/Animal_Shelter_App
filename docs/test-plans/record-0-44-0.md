# Test plan — release record and handover for `0.44.0`

## Header

| | |
|---|---|
| Feature | The `0.44.0` release record and the rewritten release handover. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. The one backlog edit this release produced — `#w4k9n` (e), the proof that the release mail is titled `[Production]` — went on the `backlog` branch (`8ac7a893`), where backlog edits belong, and is **not** in this PR |
| Branch / worktree | `claude/record-0-44-0` @ `C:\Development\Animal_Shelter_cut-release-0-44-0` (the cut's own worktree, reused after its PR merged, as rule 2 says) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #TBD |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `968d1c37`; `check-docs-only.mjs` is the check that matters and it is read below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — three documents: `docs/releases/2026-11-09-0-44-0.md` (new), `docs/release-handover.md` (replaced) and this plan
- [x] Files/areas touched listed — exactly those three. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified on all three environments, and the mail has already gone.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it. No runbook correction is included: the two durable lessons this release produced are written into the handover's numbered items, and promoting them into `docs/release-procedure.md` is for whoever writes the next one to do once the lesson has held twice

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` after the cut PR merged, in the cut's own worktree
- [x] `node scripts/gates.mjs` — **n/a, and deliberately so.** This is a documents-only PR; `scripts/check-docs-only.mjs` is what decides, and `ci.yml` gates every heavy job on it (`docs/release-procedure.md`, paperwork rule 1). The rule also says **not** to touch code to make a check run, so nothing here does
- [x] `node scripts/check-docs-only.mjs --base origin/main` — run **after committing**, which is the only way it can answer: against an uncommitted tree it replies `docs-only: false — no changed files could be read` and `deps-changed: true`, which is the script declining to judge rather than a finding about this PR. Committed, it answers documents-only. The `audit` job will therefore show **`skipped`**, which is not a pass and is correct here: no `package.json` or `package-lock.json` change to audit
- [x] `node scripts/check-test-plan.mjs --base origin/main` — run the way CI runs it, exit 0

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no data. The four migrations this release applied (`0343`–`0346`) belong to earlier PRs and are recorded, not carried, here

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Two markdown files nobody using the app can open

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The Thai still owed by five of this release's notes is recorded in the record and in the cut plan's manual list, not fixed here
- [x] Timezone — n/a: every date in these files is a literal written by hand
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page. `docs/release-handover.md` is read by the next release manager and by nothing else
- [x] Shared file touched — `docs/release-handover.md` is replaced wholesale, which is what rule 4 prescribes: it is a delta, rewritten each release, and the superseded edition lives in git history. **It is 141 lines — over the ~100-line aim and inside the 150-line limit, counted with `wc -l` rather than estimated.** The overrun is two numbered items this release earned the hard way (the hidden deploy failure and the fifteen idle minutes); the alternative was to drop them, and a handover exists to carry exactly that

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none. `#w4k9n` (e) was recorded on the `backlog` branch, as the rules require
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the judgements this release made (the deferred-note review, the `--base` verification, the before-picture choice, the four code-identity reads) are each recorded in the record and in the cut's own test plan. A decision file would be a third home for the same reasoning
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and no behaviour changes. The release's own fourteen notes shipped in the cut PR and have already been mailed
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — every figure in the record is a tool's own output, and the ones most likely to have been assumed were deliberately not: the mail's **title and sender name were read in the inbox**, not taken from the deploy's `sent 1`; the Server Actions key match was read off **both** the Worker and the Pi; the code identity was re-read on **each of the four** SHAs the banners showed; and the two before-and-after checks are quoted with both numbers (72→71 policy pairs, 475→477 public-view assertions) and the specific lines that moved

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — yes, and the record names every SHA that was built, which on this release is four rather than one
- [x] Deployed SHA matches the tested SHA — **answered in the record rather than ticked blindly.** `main` moved four times during the release, so the builds came from three commits; the assertion that holds is the code-identity diff, and it was read each time and was documents-only each time

### On the deployed build

- [x] Deployed to test — done, before production, and verified on both endpoints
- [x] Smoke-tested on `test.lannacare.org` — the endpoint and header checks in the record. **What could not be done without an account is named** in *What this record cannot say*
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this PR
- [x] Evidence pasted into this plan and the record is the tool's actual output, unedited
- [x] Public pages re-checked after a cache purge or a 10-minute wait — the purge was run for both zones and **proved by re-fetch** (production `CF HIT` at the expected byte count, confirmed byte-for-byte by the Pi's own `check-assets`). **Stated honestly in the record:** the read was `curl` and the scripts' own re-fetch, **not** a real browser with a `locale` cookie, so `x-lanna-cache` was not sampled the way the runbook prefers

### Deploy safety

- [x] `deploy: <env> → Supabase project <ref>` line read on every deploy, and each named the right project — test `qxkmhwybjggxvsfxsxbd`, production `dbkodyyxxhtygxcxmfcu`, UAT `fsjagxmxjosauwmxwype`
- [x] `strip-baked-env: removed N env var(s)` seen — **14 on all three**, read from each log rather than one and assumed for the rest. Not piped through `tail`
- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced by this release
- [x] **The mail went, and was verified beyond the deploy's own claim** — see the record

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither
- [x] `--dry-run` run and understood — in the cut's plan and the record
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a to this PR; assessed in the cut's plan, where the answer was that none of the four is destructive or rewriting

### Rollback

- [x] Rollback position stated — for this PR, `git revert`. It changes nothing that runs. **The release's own rollback position is in the cut's test plan**, including the one thing worth knowing: under the old build, `0346`'s NULL default means newly saved public text would be withheld with no screen to approve it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The release's own defects — the `tail` pipeline that hid a failed deploy, the fifteen minutes spent waiting on a notification, `--plan` claiming test would mail, `check-deferred-notes.mjs` over-listing, four `main` movements | **All seven recorded in the record, with the two avoidable ones attributed to this session rather than to the tooling.** Two are promoted into the handover as numbered items so the next release manager meets them first |
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

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty. Nothing in this PR has a surface a person could look at

Manual verification by: n/a: nothing in this PR is served, imported or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-09
