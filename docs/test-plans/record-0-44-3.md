# Test plan — release record and handover for `0.44.3`

## Header

| | |
|---|---|
| Feature | The `0.44.3` release record and the rewritten release handover. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. The DNS finding is carried in the handover rather than filed, because it is a setting on Lutan's machine and not work to schedule |
| Branch / worktree | `claude/record-0-44-3` @ `C:\Development\Animal_Shelter_record-0-44-3` (a fresh worktree; the cut's own was left alone and is cleaned up separately) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #1507 |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `f2c1b996`; `check-docs-only.mjs` is the check that matters and it is read below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — three documents: `docs/releases/2026-11-11-0-44-3.md` (new), `docs/release-handover.md` (replaced) and this plan
- [x] Files/areas touched listed — exactly those three. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed and verified on all three environments.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it
- [x] **No runbook edit this time, deliberately.** `0.44.2` corrected a false claim in `docs/release-procedure.md`, which was in scope because it was false and had been followed into a failed build. This release found nothing false there. The DNS fault is new knowledge about **one machine**, not a rule about how to deploy, so it goes in the handover where the next release manager reads it — not into the durable runbook, and not invented as a backlog item nobody asked for

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a: the branch was cut from `origin/main` at `f2c1b996` minutes before committing, which is after every deploy
- [x] `node scripts/gates.mjs` — **n/a, and deliberately so.** This is a documents-only PR; `scripts/check-docs-only.mjs` decides, and `ci.yml` gates every heavy job on it (paperwork rule 1). The rule also says **not** to touch code to make a check run, so nothing here does
- [x] `node scripts/check-docs-only.mjs --base origin/main` — run **after committing**, which is the only way it can answer: exit **0**, listing exactly the three files, *"The heavy jobs will skip; test-plan still runs."* So `audit` will show **`skipped`**, which is not a pass and is correct here — no `package.json` or `package-lock.json` change to audit
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**, *"ok — docs/test-plans/record-0-44-3.md"*

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no data. The six migrations this release applied (`0353`–`0358`, to production and to UAT) belong to earlier PRs and are recorded, not carried, here

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Markdown files nobody using the app can open

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The Thai owed by the three `refusal-keys-group-*` plans is recorded in the record and the handover, not fixed here
- [x] Timezone — n/a: every date in these files is a literal written by hand
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page. `docs/release-handover.md` is read by the next release manager and by nothing else
- [x] Shared file touched — **one.** `docs/release-handover.md` is replaced wholesale, which rule 4 prescribes: a delta, rewritten each release, superseded editions in git history. **It is 150 lines — at the limit, counted with `wc -l`, and trimmed to get there** rather than allowed to drift past it

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none. **One was checked and needed nothing:** `#pm4kz`, both halves of the Pi work, was already ticked `[x]` by the streams that shipped it, so there was no phantom to correct
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a. The judgements here are the DNS diagnosis, the `--skip-build` reuse and the two code-identity readings; all three are in the record with their evidence, and a decision file would be a second home for the same reasoning. **The DNS finding is about one machine's configuration, not a design choice this repo makes**
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice a release record or a handover. Neither file is served, imported or rendered, and no behaviour changes. The release's own six notes shipped in the cut PR
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — and the ones most likely to have been assumed deliberately were not. **The DNS cause came from the wrangler log naming the failing call and a timed `Resolve-DnsName`**, not from "the network is flaky", which is exactly the guess that cost Lutan a press. **The absence of mail is read from each deploy's own refusal line**, not inferred from `major: false`. **The reused bundle was proved to be production's** by the Server Actions key fingerprint printing identically on both attempts and by only the production Supabase project appearing in the static bundle. **The two code-identity answers are the allow-list grep's actual output, with the inverse grep read as that decision requires.** **`table-policy-commands` was NOT reported as a regression**: the apparent 77→74 drop was my own miscount, caught by checking that this release's migrations create zero policies and that the check's code was untouched. **Where a cause is not established it says so** — whether the DNS fault is fixed, and whether the Pi journal survives a reboot

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — yes, and the record names all three SHAs the release built from
- [x] Deployed SHA matches the tested SHA — **No, and this is the honest answer: three SHAs.** `main` moved twice mid-release (`6218fd73`, then `f2c1b996`), both times while a build was running. **The retained property is code identity, not SHA equality**, and the allow-list diff was run for both moves and came back **empty** — the only differences are `docs/planner-handover.md`, a test plan and `docs/backlog.md`. The inverse grep was read and printed only those three documents. **No Pi was rebuilt to chase a SHA**, and the UAT Pi was pinned to the shipped commit with `--ref`

### On the deployed build

- [x] Deployed to test — done before production, and verified on both endpoints
- [x] Smoke-tested on `test.lannacare.org` — the endpoint and header checks in the record. **What could not be done without an account is named** in *What this record cannot say*
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this PR
- [x] Evidence pasted into this plan and the record is the tool's actual output, unedited
- [x] Public pages re-checked after a cache purge — both zones purged and **proved by re-fetch** at the expected byte counts (99829 production, 99881 test, 99851 UAT), then confirmed byte-for-byte by each Pi clone's own `check-assets`. **The three differing sizes are explained in the record** rather than left looking like a fault. Stated honestly: the read was `curl` and the scripts' own re-fetch, not a real browser with a `locale` cookie

### Deploy safety

- [x] `deploy: <env> → Supabase project <ref>` line read on every deploy, and each named the right project — test `qxkmhwybjggxvsfxsxbd`, production `dbkodyyxxhtygxcxmfcu`, UAT `fsjagxmxjosauwmxwype`. **UAT's was read before anything else**, as the runbook requires
- [x] `strip-baked-env: removed N env var(s)` seen — **14 on production**, read from the log rather than assumed. Lutan's log is UTF-16 (PowerShell `tee`), so it was de-nulled with `tr -d '\000'` before reading, and **each deploy's own exit code was read from the script, never through a pipe**
- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced by this release. The production binding list was read in full from the deploy's own output, including `PUBLIC_SITE ("locked")`
- [x] **No mail went, and that was read rather than assumed** — production printed `no major release new to production (was 0.44.2), so no email.`, and `--no-mail` was additionally passed to production's retry and to UAT. **Belt and braces on purpose:** `major: false` already guaranteed it, but mail to every admin cannot be undone and Lutan asked for none
- [x] **The production Worker was confirmed from the Worker, not from the log** — `wrangler deployments list --env production` shows `v0.44.3` at 100%, version `eecb02cc…` matching the log's `Current Version ID`. The same was done for UAT (`14b81371…`). This is the `0.40.3` rule and it mattered here, because two earlier attempts had *finished* without deploying

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither
- [x] `--dry-run` run and understood — in the cut's plan and the record
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a to this PR; assessed in the cut's plan, where none of the six was destructive
- [x] **A card-grant change takes effect at the deploy, not at the apply** — recorded because the cut plan got it wrong. `0355` changes what the Bills card grants, but that lives in `src/lib/cards.ts`, so `role-cells` did not move at the apply. The four card checks were re-run **after** the production deploy and are clean there

### Rollback

- [x] Rollback position stated — for this PR, `git revert`. It changes nothing that runs. **The release's own rollback position is in the cut's test plan.** Worth noting here because this release demonstrated the safety property twice: both failed Worker deploys died on a **read** before any upload, so the live Worker was never touched, and users were on `0.44.3` via the Pi throughout

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **high** | **Production's Worker deploy failed twice.** A cold DNS lookup of `api.cloudflare.com` took 12.1 s against wrangler's 10 s connection timeout, so the deploy's first API call could never connect | **Diagnosed and worked around** — third attempt warmed the cache and went through in 20 s with `--skip-build`. **Not repaired:** the durable fix is a network setting on Lutan's machine and is his to make. Written up in the record and made the handover's lead item |
| 2 | **medium** | **I handed Lutan a retry without diagnosing the failure**, calling it flaky network. That guess cost him a second failed press | **Mine, recorded as mine** in the record's avoidable costs. The diagnosis took one log read and one timed lookup, both of which were available before his first retry |
| 3 | low | **The first UAT Worker deploy exited 1** on `Cannot find module 'wrangler/package.json'` — the daily `guarded-install.mjs` had `node_modules` down to 109 entries mid-flight | **Not a fault in the deploy.** Waited for `npm ci` to finish (486 entries, `.package-lock.json` present) and re-ran. Carried into the handover as a race to expect |
| 4 | none | Three readings I nearly reported wrongly: `role-cells` predicted to move, `table-policy-commands` as a 77→74 regression, and `--env uat` as half-built | **All three caught before they reached a record**, and each is written up with the reason it was wrong — a prediction error, my own miscount, and reading exit codes through a pipe |
| 5 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; nothing here changes a dependency |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Markdown only, none of it served | — |

The release's own outstanding items — the 18 `pending:` plans — are listed in the record, grouped by what
each waits for. **They are deliberately not copied here**, because copied items get a second home that
nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-12

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty. Nothing in this PR has a surface a person could look at

Manual verification by: n/a: nothing in this PR is served, imported or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-12
