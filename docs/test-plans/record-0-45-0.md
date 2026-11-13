# Test plan — release record, handover and one runbook promotion for `0.45.0`

## Header

| | |
|---|---|
| Feature | The `0.45.0` release record, the rewritten release handover, and **one promotion into `docs/release-procedure.md`**. **Documents only — no code, no schema, no configuration** |
| Backlog item | `docs/backlog.md` → none. The record and handover are procedure (`docs/release-procedure.md` rule 3), not backlog items. The Pi's under-voltage finding is carried in the handover rather than filed: it is hardware on Lutan's premises, not work to schedule |
| Branch / worktree | `claude/record-0-45-0` @ `C:\Development\Animal_Shelter_cut-release-0-45-0` (the cut's own worktree, reused after its PR merged, rather than a fourth folder) |
| Dev server | n/a: nothing in this PR is served, imported or rendered |
| PR | #1540 |
| Tested by / date | Claude Opus 5 (production release manager) / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | this branch's own head, cut from `origin/main` at `15854dd4`; `check-docs-only.mjs` is the check that matters and it is read below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — four documents: `docs/releases/2026-11-12-0-45-0.md` (new), `docs/release-handover.md` (replaced), `docs/release-procedure.md` (one paragraph added) and this plan
- [x] Files/areas touched listed — exactly those four. Nothing under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Cards affected identified — **none.** No card, activity, cell or page. Admin and the signed-out public are unaffected: none of these files is served
- [x] Anything explicitly out of scope written down — **the release is already deployed, mailed and verified on all three environments.** This PR describes it; it does not change it. It is **not a gate**, and nothing waits on it
- [x] **There IS a runbook edit this time, and the test for one was applied rather than skipped.** `0.44.3` deliberately made none, on the grounds that its finding was about one machine. This one is different: `cut-release.mjs --verify` fails two assertions whenever a cut *publishes an owed note*, because `--verify` compares against `origin/main`, which has stopped being the pre-cut state. **Two releases running have worked that out from scratch** (`[6 vs 5]` on `0.44.3`, `[10 vs 9]` here), and the remedy is a command, not a machine setting — so it belongs in the durable runbook. The handover keeps the per-release findings

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — run before committing; `origin/main` had moved two backlog commits ahead of the cut (`46ceb197`), and those are merged in rather than left to conflict
- [x] `node scripts/gates.mjs` — **n/a, and deliberately so.** This is a documents-only PR; `scripts/check-docs-only.mjs` decides, and `ci.yml` gates every heavy job on it (paperwork rule 1). The rule also says **not** to touch code to make a check run, so nothing here does
- [x] `node scripts/check-docs-only.mjs --base origin/main` — run **after committing**, which is the only way it can answer: exit **0**, `docs-only: true — 5 path(s), all documents`, *"The heavy jobs will skip; test-plan still runs."* It also prints `deps-changed: false`, so `audit` will show **`skipped`** — not a pass, and correct here
- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**, *"the plan is complete and correct, and 2 item(s) await a person"*, and *"Nothing to fix."* The two awaiting a person are the cut plan's Thai reader, which is real. The five `deferred:` gates it lists are the cut's, and **the record now answers all five**

## 3. Schema and data

- [ ] All items — n/a: no migration, no column, no policy, no data. The seven migrations this release applied (`0359`–`0365`, to production and to UAT) belong to earlier PRs and are recorded, not carried, here

## 4. Functional checks

- [ ] All items — n/a: no functional surface. Markdown files nobody using the app can open

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any login, Admin, the signed-out public | none of these files | unchanged | n/a: not served, not imported, not rendered |

- [x] A login that should not have access is blocked server-side — n/a: nothing in this PR is reachable by any login

## 5. Cross-cutting

- [x] Thai — n/a: no user-facing string. The Thai owed by the four `refusal-keys-group-*` plans and by the offline page is recorded in the record and the handover as awaiting an independent reader, not fixed here
- [x] Timezone — n/a: every date in these files is a literal written by hand
- [x] Money and rounding — n/a

## 6. Regression

- [x] Nearest pages still work — n/a: no page. `docs/release-handover.md` is read by the next release manager and by nothing else
- [x] Shared file touched — **two.** `docs/release-handover.md` is replaced wholesale, which rule 4 prescribes: a delta, rewritten each release, superseded editions in git history. It is **121 lines**, counted with `wc -l`, inside the 150-line ceiling rather than at it. `docs/release-procedure.md` gains one paragraph in an existing section and changes nothing already there
- [x] **The handover RETIRES its predecessor's lead item rather than copying it forward.** `0.44.3` led with the DNS fault; it was re-measured before this release's deploy command was handed over (0.1 s cold, no NordLynx adapter) and both Worker deploys ran first time, so the workaround is explicitly **not** handed over by default. Copying it forward unmeasured was the available mistake

## 7. Documentation

- [x] Backlog item ticked — n/a: this PR closes none
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a. The one durable judgement is the `--verify --base` recipe, and that is a *procedure*, so it is promoted into the runbook where it will be read, not filed as a decision nobody opens. The per-release judgements are in the record with their evidence
- [x] `README.md` still accurate — unchanged by this diff
- [ ] **Release notes.** n/a: nobody using the app would notice a release record, a handover or a runbook paragraph. None of these files is served, imported or rendered, and no behaviour changes. The release's own ten notes shipped in the cut PR and have now mailed
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned — and the ones most likely to have been assumed deliberately were not. **The mail is read from the deploy's own line** (`release mail for 0.45.0 [Production]: sent 1, skipped 1`) and from Lutan confirming receipt, not inferred from `major: true`. **The DNS fault is reported gone from a fresh timed lookup and the resolver list**, not from "it worked this time". **The Server Actions key is read as a fingerprint on both sides** (`cbd55beae8d8` in the production deploy's own output, and the Pi's build printing the same), which is what proves the bundle is production's. **`table-policy-commands` was counted by the script, not by hand** — the hand count said 73 and read as an improvement; it is 77/74, identical to `0.44.3`. **`role-cells` was predicted not to move at the apply, and did not**, which is the `0.44.3` lesson applied rather than re-learned. **Where a cause is not established it says so** — whether under-voltage caused the Pi's three reboots, and where the nightly backup actually runs from

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — yes, and the record names it
- [x] Deployed SHA matches the tested SHA — **yes, and for the first time in several releases: one commit, `15854dd4`, for all builds.** The record says in one sentence that the reason is luck rather than method (no open PRs, `main` did not move), so the retired property — code identity, not SHA equality — stays retired

### On the deployed build

- [x] Deployed to test — done before production, and verified on both endpoints
- [x] Smoke-tested on `test.lannacare.org` — the endpoint and header checks in the record
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a: see section 5
- [x] For a boundary or banding change, the assertions cover both edges — n/a: no threshold in this PR
- [x] Evidence pasted into this plan and the record is the tool's actual output, unedited
- [x] Public pages re-checked after a cache purge — **both zones purged and proved by re-fetch**, each `HTTP 200 (CF MISS)`: production 99847 bytes, test 99923, UAT 99917. **`CF MISS` is the assertion** — it proves the fetch reached the origin and not the cache just purged. The three sizes differ because each environment's bundle differs, which the record explains rather than leaving to look like a fault. Stated honestly: this was `curl` and the purge script's own re-fetch, not a real browser with a `locale` cookie

### Deploy safety

- [x] `deploy: <env> → Supabase project <ref>` line read on every deploy, and each named the right project — test `qxkmhwybjggxvsfxsxbd`, production `dbkodyyxxhtygxcxmfcu` (read from Lutan's own terminal while it built), UAT `fsjagxmxjosauwmxwype`. **UAT's was read before anything else**, as the runbook requires
- [x] `strip-baked-env: removed N env var(s)` seen — **14 on production**, read from the log rather than assumed. Lutan's log is UTF-16 (PowerShell `tee`), so it was de-nulled with `tr -d '\000'` before reading
- [x] Any new secret/env var exists in the production Cloudflare environment — none introduced by this release
- [x] **Mail went, and it was read rather than assumed** — `release mail for 0.45.0 [Production]: sent 1, skipped 1` from the deploy's own output, Lutan confirming receipt, **and the message itself**: subject `[Production] Lanna Care release 0.45.0: …`, sender name `Lanna Care Production`, one recipient, sent ten seconds after `Current Version ID`. **Neither the name nor the subject says UAT** — the first proof since `RELEASE_MAIL_ENV` was fixed, which closes `#w4k9n`. Test and UAT both got `--no-mail`, read back as `[off]: sent 0, skipped 3` and `--no-mail, not announcing 0.45.0.` — belt and braces, because mail to every admin cannot be undone
- [x] **The production Worker was confirmed from the Worker, not from the log** — `wrangler deployments list --env production` shows `v0.45.0` at **100%**, version `01eba824-…` matching the log's `Current Version ID`; UAT the same at `51b41065-…`. This is the `0.40.3` rule and it is not ceremony: `0.44.3` had two deploys *finish* without deploying. Production's `v0.44.3` (`eecb02cc…`) is still listed at 0%, so the rollback position is visible rather than assumed

### Migration ordering

- [x] Does this PR contain both a migration and code that reads it? No — neither
- [x] `--dry-run` run and understood — in the cut's plan and the record
- [x] For a destructive or rewriting migration only: a production backup exists and is fresh — assessed in the cut's plan. `0361` rewrites rows, and the gate is met by a Drive backup about twenty hours old. **The alarming local reading was wrong and is recorded as such**: `backup.log` is 0 bytes from 4 October and no Windows task runs the script, which read alone says production has never been backed up. Drive disproves it
- [x] **A card-grant change takes effect at the deploy, not at the apply** — applied as a prediction this time rather than discovered. `0361`'s grant change lives in `src/lib/permissions/catalogue.ts` and `cards.ts`, so `role-cells` was expected not to move at the apply and did not. The card checks were re-run **after** the production deploy

### Rollback

- [x] Rollback position stated — for this PR, `git revert`. It changes nothing that runs. **The release's own rollback position is in the cut's test plan**

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **medium** | **`gates.mjs` was backgrounded through a `tail` pipe, discarding three of the four `=== gates:` lines** the cut plan requires | **Mine.** Re-run with `tee`: one wasted cycle, about six minutes. The runbook names the `tail` trap in writing for deploys; it applies to every script in it. Carried into the handover |
| 2 | low | **`table-policy-commands` was counted by hand** and gave 73 `no policy` lines, which read as a one-line improvement | **Caught before it reached a record.** Counted properly: 77 total / 74 `no policy`, identical to `0.44.3`. `0.44.3` recorded the same trap from the other direction |
| 3 | low | **`cut-release.mjs --verify` failed 2 of 17 assertions** on a correct cut, because the cut published an owed note and `--verify` compares against `origin/main` | **Not a fault in the cut.** Re-run against an explicitly built base: all 17 pass. **This is the one thing promoted into the runbook**, because two releases running have re-derived it |
| 4 | none | **`backup.mjs --env production` refused** and offered `--shared-drive-token` to borrow the app's token | **The flag was not taken.** The app's token is deliberately not used for backups, and a refusal's suggested remedy is not advice. The gate was met from Drive instead |
| 5 | none | `audit` will show `skipped` on this PR | Correct and expected for a documents-only diff. Skipped is not a pass; nothing here changes a dependency |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Nothing in this PR.** Markdown only, none of it served | — |

The release's own outstanding items — the 19 `pending:` plans — are listed in the record, grouped by
what each waits for. **They are deliberately not copied here**, because copied items get a second home
that nothing closes.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-13

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: the list is empty. Nothing in this PR has a surface a person could look at

Manual verification by: n/a: nothing in this PR is served, imported or rendered, so there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-13
