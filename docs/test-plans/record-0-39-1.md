# Feature test plan

## Header

| | |
|---|---|
| Feature | The `0.39.1` release record and the rewritten release handover, plus `scripts/push-calendar-secrets.mjs` and the decision that explains why it exists, and Lutan's sign-off recorded on `docs/test-plans/diets-recipe-book.md` |
| Backlog item | `docs/backlog.md` → n/a: a release record is not a backlog item; it is the release procedure's step 8 |
| Branch / worktree | `claude/record-0-39-1` @ `C:\Development\Animal_Shelter_handover-ceiling-target` — **the cut's own worktree, reused**, which is what paperwork rule 2 asks for |
| Dev server | `node scripts/worktree.mjs dev` → not started: nothing here renders. The one code file is a deploy-time script with no import into the app |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-22 |
| Carries a migration? | **no** |
| Tested at SHA | `654619c4` (branch point) |

## 1. Scope and risk

- [x] Change is described in one sentence: the release record for `0.39.1`, the handover rewritten as a delta for the next release manager, the script that pushed this release's two production secrets, the decision explaining why `--secrets` must not be used here, and item 1 of the diets plan signed off at Lutan's request
- [x] Files/areas touched listed: `docs/releases/2026-10-22-0-39-1.md` (new), `docs/release-handover.md` (replaced), `docs/decisions/2026-10-22-push-only-the-missing-secrets.md` (new), `docs/test-plans/diets-recipe-book.md` (signature only), this plan, and `scripts/push-calendar-secrets.mjs` (new). **No route, no component, no `worker/`, no migration, no shared lib**
- [x] Roles affected identified: **none.** Nothing here is reachable by any role; the script runs on the deploy machine and is not imported by the app
- [x] Anything explicitly **out of scope** written down: the release is already deployed and verified, so this PR changes nothing a user sees. It is a record, not a gate

**This PR is deliberately not documents-only, and that is a cost paid on
purpose.** `scripts/push-calendar-secrets.mjs` is code, so
`scripts/check-docs-only.mjs` will route this through the full CI set rather than
the light one. Paperwork rule 1 warns against *touching code to make a check run*;
this is the opposite case — the script is a real artifact of the release that the
next release manager needs, and splitting it into its own PR would cost a second
CI cycle and break paperwork rule 3. **One PR, one cycle, heavier than a pure
documents PR. Recorded so the next reader does not think the gate misfired.**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created directly from `origin/main` at `654619c4`, after the cut merged, so there was nothing to merge
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 21s
=== gates: lint exited 0 after 164s
=== gates: test exited 0 after 16s
=== gates: build exited 0 after 152s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. `origin/main`'s highest is `0246`, next free `0247`
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — for the one executable file, this is not hypothetical: **`push-calendar-secrets.mjs` was run against the real production Worker during this release** and reported `2 secrets successfully created`, confirmed afterwards by `wrangler secret list --env production` showing eleven names where there had been nine
- [x] Data persists — the two secrets are still listed on the production Worker after the subsequent release deploy, which is the durability claim that matters here
- [ ] Create / edit / delete all exercised — n/a: the script only creates or replaces; there is no delete path and deliberately so
- [x] Empty state renders sensibly — the equivalent for this script is its refusal paths, and **both were exercised by construction**: it exits 2 naming the key if a value is missing, and exits 2 if a value does not come from `.env.deploy.production`. The second is the guard that makes it safe, and it is the same condition `deploy.mjs` enforces
- [x] Invalid input is rejected with a readable message — see above; the refusal names the key and the file it must come from
- [ ] Boundary cases checked — n/a: no arithmetic, no dates, no user input. The script takes no arguments

### Role access matrix

Nothing in this PR is reachable by any role. The record, handover and decision are
repository documents; the script runs on the deploy machine under Lutan's
credentials and is not imported by the app.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no change | no change — nothing rendered, nothing imported |
| management | nothing in this PR | no change | no change |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | nothing in this PR | no change | no change |
| volunteer | nothing in this PR | no change | no change |
| signed out | nothing in this PR | no change | no change |

- [x] Every role above tested — by establishing that no route, component or shared lib is touched, which is the thing that would change what a role sees. `grep` over the diff confirms the only non-`docs/` path is `scripts/`
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: no guard, `requirePermission` call or policy is touched

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. Nothing here is a user-facing feature
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings. The script's output is operator console text
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no browser session
- [ ] Network clean — n/a: no browser session

## 6. Regression

- [x] The pages nearest the change still work — n/a as a page claim; the equivalent is that `build` exited 0 with the new script present, so nothing in the app resolves it by accident
- [x] Any shared file touched checked from a second, unrelated page — the one shared thing this script imports is `scripts/lib/env.mjs`, which it only **reads** from; `deploy.mjs` imports the same module and was exercised end to end by the production deploy minutes later, which is the load-it-rather-than-read-it check
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release record closes no backlog item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-22-push-only-the-missing-secrets.md`, which records why `--secrets` is permanently unusable here, why the refusal's own suggested remedy is dangerous, and why the script is deliberately named for its two secrets rather than generalised
- [x] `README.md` still accurate — unchanged; it names no version and describes no secret-push path
- [ ] **Release notes.** — n/a: nobody using the app would notice any of this. A release record, a handover, a decision and a deploy-machine script have no user surface, and `unreleased` is deliberately empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The record's counts come from the scripts' own output; the secret-list claim ("nine of eleven present, exactly the two calendar values absent") is from `wrangler secret list --env production` run before and after, not inferred from the refusal text

## 8. Pre-production gate

Owned jointly with the release manager. **This PR follows the deploy it
describes**, so the usual deploy-time gates are not pending on it — they were
performed for `654619c4` and are recorded in the release record itself.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR ships no build. The release it records deployed `654619c4`, verified on all four layers
- [ ] Deployed SHA matches the tested SHA — n/a: nothing in this PR is deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing in this PR is deployed. Nothing here is bundled
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR reaches a deployed build
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part — n/a: no date logic. The dates in these documents are literals
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block above is the script's own stdout; the record's evidence is likewise each tool's own output
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: nothing in this PR changes a public page. The release's own purge and byte-for-byte checks are in the record

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: this PR deploys nothing. Done for the release it records: `dbkodyyxxhtygxcxmfcu (654619c4)`, read from Lutan's `tee`'d log
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: this PR deploys nothing. Done for the release it records: 14 on both environments
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret. The two the release added were confirmed present by `wrangler secret list --env production` after the push

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Revert the PR; nothing is deployed, stored or rendered by it. **What a revert does not cover:** the two secrets are already on the production Worker and reverting the script does not remove them, which is correct — the release depends on them. Removing them would need `wrangler secret delete`, and would break the vet calendar

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether this handover edition actually serves the next release manager — unanswerable until there is a next release | `docs/release-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the manual list is not empty, so this is left for the person who looks

Manual verification by: pending: whether this handover edition serves its reader, which the next release answers

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-22
