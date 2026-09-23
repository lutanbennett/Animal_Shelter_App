# Feature test plan — deploys survive a release title with spaces

## Header

| | |
|---|---|
| Feature | Fix `scripts/deploy.mjs` so a multi-word release title does not break every deploy |
| Backlog item | none; a production incident found while deploying `main` to test on 2026-09-23 |
| Branch / worktree | `claude/deploy-message-quoting` @ `C:\Development\Animal_Shelter_deploy-message-quoting` |
| Dev server | not started — this change alters deploy tooling, not app code |
| PR | opened after this checklist; number and CI result in a follow-up commit |
| Tested by / date | Claude (test manager session) / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | `55a9398`; evidence below is from real deploys at `4e6fb67` and `55a9398` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — Lutan asked for `deploy.mjs` to be fixed after a deploy failed with `Unknown arguments: Baseline, Build`
- [x] Files/areas touched listed — `scripts/deploy.mjs` only, plus `docs/test-plans/` and `docs/decisions.md`. No `src/`, no `worker/`, no `supabase/migrations/`, no CI
- [x] Roles affected identified — none; `deploy.mjs` is developer tooling and never reaches the Worker bundle, so no role can reach it
- [x] Anything explicitly out of scope written down — not touching `run()`'s shell form for the two `npm`/`node` calls, which are unaffected and work; not changing the release-notes feature that introduced the message; not deploying production, which is the release manager's

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `main` at `dfb01c3`; `origin/main` unchanged since
- [x] `npm run typecheck` — exit 0
- [x] `npm run lint` — exit 0
- [x] `npm run build` — exit 0, as part of the full `deploy:test` run recorded below
- [ ] CI green on the PR — n/a: not yet; the PR does not exist at this commit. Ticked in a follow-up commit once the run is green

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration; tooling and docs only
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; this change reads no data
- [ ] Constraints exercised in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The feature is a deploy script, so the only meaningful test is a real deploy.

- [x] Happy path works end to end — `npm run deploy:test` exits **0**, uploads, and returns a Current Version ID
- [x] Data persists — n/a in the usual sense; verified instead that the deployment is visible afterwards in `wrangler deployments list --env test`, so the upload is durable rather than reported
- [ ] Create / edit / delete exercised — n/a: no CRUD surface
- [x] Empty state renders sensibly — n/a as written; the equivalent is the failure path, and it is covered below: each wrong fix failed loudly with a distinct, readable error rather than silently
- [x] Invalid input is rejected with a readable message — the original bug *was* the readable failure (`Unknown arguments: Baseline, Build`); confirmed it no longer appears
- [x] Boundary cases checked — the message is multi-word (`v0.0.1 Current Baseline Build`), which is the case that broke. Verified it now arrives as one argument

Evidence, pasted from the runs:

```
--- before the fix, main @ dfb01c3 ---
deploy: `npx wrangler deploy --env test --tag v0.0.1 --message "v0.0.1 Current Baseline Build"` exited with 1
X [ERROR] Unknown arguments: Baseline, Build

--- attempt 1: argv array through npx.cmd ---
Error: spawnSync npx.cmd EINVAL          (Node refuses .cmd without shell, CVE-2024-27980)

--- attempt 2: node + require.resolve("wrangler/bin/wrangler.js") ---
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './bin/wrangler.js' is not defined by "exports"

--- attempt 3: node + entry resolved via package.json, argv array ---
OpenNext project detected, calling `opennextjs-cloudflare deploy`
X [ERROR] Unknown arguments: Baseline, Build      (split happens inside OpenNext's re-invocation)

--- dry run with --autoconfig false ---
Total Upload: 22190.66 KiB / gzip: 5028.48 KiB
--dry-run: exiting now.
exit=0                                            (no "Unknown arguments")

--- the fix, real deploy ---
DEPLOY EXIT=0
deploy: release 0.0.1 "Current Baseline Build" (live now: unknown)
deploy: test -> Supabase project qxkmhwybjggxvsfxsxbd (4e6fb67)
strip-baked-env: removed 10 env var(s) from the Worker bundle
Uploaded 57 of 57 assets
Uploaded lanna-animal-care-test (27.34 sec)
Deployed lanna-animal-care-test triggers (5.12 sec)
Current Version ID: 76d2bf41-9524-4fb1-86c0-95b88a149aa7
```

### Role access matrix

No runtime surface — `deploy.mjs` is tooling and is never bundled into the Worker.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | n/a | n/a |
| staff | nothing | n/a | n/a |
| vet | nothing | n/a | n/a |
| volunteer | nothing | n/a | n/a |
| resident | nothing | n/a | n/a |
| signed out | nothing | n/a | n/a |

- [ ] Every role above tested — n/a: no runtime surface exists for any role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry, no route
- [ ] Manual updated — n/a: deploy tooling, not a feature shelter staff use
- [ ] Translatable strings — n/a: no user-facing strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work, by loading them — `/`, `/login` and `/adopt` all returned **200** on `test.lannacare.org` after the deploy, so the changed upload path produced a serving site rather than merely a successful upload
- [x] Any shared file touched checked from a second angle — `deploy.mjs` is shared by both environments. The `--secrets` path moved to the same helper; it was not exercised (no secrets push was needed) and is recorded as a risk in Defects
- [x] Nothing merged from `main` was broken by this branch — branch is `main` plus this fix; the deployed site serves normally

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; an incident found in passing
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-23
- [x] `README.md` still accurate — checked; its deploy instructions are `npm run deploy:test` / `deploy:prod`, which are unchanged
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — three diagnoses were wrong before the fourth; each was disproved by running it, and the commit message says so

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — `55a9398`, with the deploy evidence at `4e6fb67`
- [x] Deployed SHA matches the tested SHA — `deploy.mjs` printed `(4e6fb67)` and that is the commit that was deployed
- [x] Deployed to test — twice, both exit 0
- [x] Smoke-tested on `test.lannacare.org` — `/`, `/login`, `/adopt` all 200 after the deploy
- [ ] Timezone-sensitive behaviour — n/a: this change does no date arithmetic
- [ ] Boundary or banding change asserts both edges — n/a: no boundary or band
- [x] Evidence pasted is the tool's actual output — the block in section 4 is copied from the run logs, unedited apart from stripping ANSI colour codes
- [ ] Public pages re-checked after a cache purge — n/a: this change alters no page output, so a stale edge cache cannot mask or invent a defect in it
- [ ] Edge cache serving — n/a: no page output changed
- [x] Production Supabase project ref read and matching — the test deploy printed `qxkmhwybjggxvsfxsxbd`, which is dev and correct for test
- [x] `strip-baked-env: removed N env var(s)` seen — 10 vars, named in the output
- [ ] Any new secret or env var in production Cloudflare — n/a: no new env vars
- [ ] PR contains both a migration and code that reads it — n/a: no migration
- [ ] Production `--dry-run` clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration
- [ ] First production deploy after this merges is watched for the same output lines — n/a: a production deploy cannot happen before this PR merges, so it is not a check this plan can carry. Recorded instead as Defect 3, owned by the release manager. (On `main` this would be `deferred: release manager`; PR #61 adds that state and is not merged yet)
- [x] Rollback position stated, including what it does not cover — reverting this PR restores the broken deploy path, so a revert must go *with* a revert of the release-stamping change or deploys break again. `wrangler rollback --env production` is unaffected: this changes how a deploy is invoked, not what is uploaded

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | `main` could not deploy to any environment. Every release title contains a space, so the `--message` argument split and wrangler rejected the remainder. Introduced by the release-stamping change and unnoticed because a deploy is the one thing a PR cannot exercise before merging | fixed — this PR |
| 2 | medium | The `--secrets` path now goes through the new helper but was **not exercised**: no secrets push was needed for a test deploy. It has no multi-word arguments so the original bug cannot affect it, but "should work" is doing real work in that sentence. The next `--secrets` run is the first real test | accepted — noted for the release manager |
| 3 | medium | `--autoconfig false` changes how *production* is deployed, not only test: wrangler now uploads directly instead of delegating to OpenNext. The test deploy is strong evidence it is equivalent, but the first production deploy is the proof | deferred — release manager, at the next production deploy |
| 4 | low | Three wrong diagnoses before the right one, each plausible enough to have been written into `docs/decisions.md` as fact | fixed — all four are recorded, including why the first three were wrong |

## Left for manual verification

Nothing. Every check here is a command that was run, and the one outstanding item
— watching the first production deploy — is the *next* piece of work rather than
verification of this change, so it is `deferred:` in section 8 rather than listed
here.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (test manager session)  Date: 2026-09-23

### Manual verification

- [x] The manual list above is empty, so whoever filled the plan may tick this

Manual verification by: n/a: deploy tooling with no runtime surface; nothing for a person to look at  Date: —

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: pending
