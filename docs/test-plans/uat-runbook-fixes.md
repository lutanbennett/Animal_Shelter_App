# Test plan: uat-runbook-fixes

---

## Header

| | |
|---|---|
| Feature | uat-runbook-fixes |
| Backlog item | none of its own: it corrects `docs/uat-finalisation.md` (#uat7p, #u7d3b, #rqv5c), whose titles were updated on the `backlog` branch |
| Branch / worktree | `claude/uat-runbook-fixes` @ `C:\Development\Animal_Shelter_uat-runbook-fixes` |
| Dev server | n/a: nothing served changed |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked: the UAT runbook corrected from its first real run (Parts 1 to 5 on 2026-11-08), plus two small dev/UAT-only scripts the run showed were missing, and the missing executable bit on `setup-uat.sh`
- [x] Files/areas touched listed: `docs/uat-finalisation.md`, `docs/pi-hosting.md`, `docs/google-cloud-inventory.md`, `docs/email-sending.md`, `docs/decisions/2026-11-08-uat-runbook-from-the-real-run.md`, `scripts/check-drive-leftovers.mjs`, `scripts/send-reset-email.mjs`, `scripts/lib/drive-map.mjs`, `scripts/drive-map.test.mjs`, the mode of `scripts/pi/setup-uat.sh`
- [x] Cards affected identified: none. No page, action or permission changed
- [x] Anything explicitly **out of scope** written down: Parts 6 to 8 of the list (not run yet), production's sender name (Lutan's dashboard step), `drive-remap-ids.mjs` (left unchanged on purpose, see the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one backlog line from upstream), no conflicts
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 49s
=== gates: lint exited 0 after 150s
=== gates: test exited 0 after 31s
=== gates: build exited 0 after 210s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `check-drive-leftovers.mjs` run read-only against UAT (`fsjagxmxjosauwmxwype`) with the real map from the main checkout: `CLEAN: every Drive id in 25 columns is one of the copies.`, exit 0. `send-reset-email.mjs`'s request (the scratch version of the same code) was run by Lutan against UAT: HTTP 200 and the mail arrived
- [ ] Data persists — n/a: both scripts write nothing to any database
- [ ] Create / edit / delete all exercised — n/a: both scripts write nothing to any database
- [x] Empty state renders sensibly: `send-reset-email.mjs` with no address prints `Give the email address to send to.` and exits 1
- [x] Invalid input is rejected with a readable message, not a crash: `--env production` is refused by both scripts before any request (run, output read); `drive-map.test.mjs` proves malformed and injected ids are dropped and odd table names refused (4 tests pass)
- [x] Boundary cases checked: a CRLF map file parses; a map with no root line gives `null`

### Role access matrix

Nothing here is reachable by a login: dev-machine scripts and documents.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a: no access rule touched |

- [ ] Every login above tested — n/a: no access rule or page was added or changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule or page was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport (375px) — n/a: no UI added
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: no `src/` file changed; `setup-uat.sh`'s content is unchanged (mode only, `git ls-files -s` shows 100755 like `setup.sh` and `setup-test.sh`)
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the sync brought one `docs/backlog.md` line, and the gates above ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: nothing is finished; #uat7p, #u7d3b and #rqv5c each still contain Part 6, and their titles were updated on the `backlog` branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-uat-runbook-from-the-real-run.md`
- [x] `README.md` still accurate: it lists none of the Drive or UAT scripts, and nothing it says changed
- [ ] **Release notes.** n/a: no shelter user sees any of this; it is documents and dev-machine scripts
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned.** Every row of the decision file's table is something seen in the run's own output or Lutan's report that day; the tunnel-config claim is a `diff` of the live file against the repo

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the release this lands in
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the release this lands in
- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing that ships
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no banding
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates block, the tool's own output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable
- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deployed; reverting the PR restores the old wording and removes two unused scripts

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `setup-uat.sh` committed without the executable bit | fixed |
| 2 | medium | No check that UAT holds no Drive id outside its copy | fixed: `check-drive-leftovers.mjs` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose: the list's steps are Lutan's, and the ones this PR corrects were performed by him on 2026-11-08.)

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-08

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no user-facing surface changed and the manual list is empty

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — n/a: documents and dev-machine scripts only

Result: pass

Release manager acknowledgement: pending: at the release this lands in
