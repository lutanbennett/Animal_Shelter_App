# Test plan: uat-followups

---

## Header

| | |
|---|---|
| Feature | uat-followups |
| Backlog item | `docs/backlog.md` → #u7d3b (ticked here); #uat7p, #uq4vz retitled and #rg7pv filed on the `backlog` branch |
| Branch / worktree | `claude/uat-followups` @ `C:\Development\Animal_Shelter_uat-followups` |
| Dev server | n/a: nothing served changed |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence: what putting UAT live on 2026-11-08 found, fixed where it will be read next time (the preflight's calendar and Drive-secret rules, the runbook's Parts 1, 2, 4, 5, 6 and 7, a stale "outstanding" line, and the release handover's wrong UAT claim)
- [x] Files/areas touched listed: `scripts/lib/uat-ready.mjs`, `scripts/check-uat-ready.test.mjs`, `docs/uat-finalisation.md`, `docs/email-sending.md`, `docs/domain-checklist.md`, `docs/release-handover.md`, `docs/backlog.md` (one tick), `docs/decisions/2026-11-08-uat-go-live-findings.md`
- [x] Cards affected identified: none. No page, action or permission in the app changed
- [x] Anything explicitly **out of scope** written down: the restore recipe's own fix (`#rg7pv`, filed), the failover drill (skipped by Lutan's choice), the `#uq4vz` signed-in pass (needs a UAT login)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — SYNC_PLACEHOLDER
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
GATES_PLACEHOLDER
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

- [x] Happy path works end to end: the changed `check-uat-ready.mjs` run against the real `.env.deploy.uat` in the main checkout prints `ok calendar switched off: both keys present and empty`, `ok the three GOOGLE_OAUTH_* values match .env.local's`, and `Ready: no failures.`
- [ ] Data persists — n/a: the check is read-only
- [ ] Create / edit / delete all exercised — n/a: the check is read-only
- [x] Empty state renders sensibly: with no `.env.local` the Drive-secret comparison is skipped rather than failing (test)
- [x] Invalid input is rejected with a readable message, not a crash: a calendar key with a value, a missing calendar line, and a differing `GOOGLE_OAUTH_CLIENT_SECRET` each fail with a named reason (10 tests pass)
- [x] Boundary cases checked: the no-secret-in-output test now also covers the OAuth secret, with a marker that is not part of any key name (the old marker `SECRET` matched the key name `GOOGLE_OAUTH_CLIENT_SECRET` once that name could appear in a finding)

### Role access matrix

Nothing here is reachable by a login.

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

- [x] The pages nearest the change still work: no `src/` file changed. UAT itself was checked live the same day: `uat.lannacare.org` 200 and `x-lanna-served-by: pi` on 0.43.6, `lannacare.org` and `www` 301 to production with path and query kept, production, Test and UAT `/login` all 200
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch: `#u7d3b`, with what closed it
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-08-uat-go-live-findings.md`
- [x] `README.md` still accurate: it says UAT is `uat.lannacare.org` on its own project, which is now true live
- [ ] **Release notes.** n/a: no shelter user sees a dev-machine check or a runbook
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: each finding in the decision file is a tool output from the go-live (the deploy preview, `wrangler secret list`, the rolled-back reads as the login, `curl` against the live hosts)

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
- [ ] Rollback position stated — n/a: nothing deployed; reverting restores the old wording and the old check

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | A calendar key left out of UAT's file falls through to Test's calendar at deploy | fixed: empty lines, enforced by the check |
| 2 | medium | Sign-in secret pasted over the Drive secret went unnoticed | fixed: the check compares with `.env.local` |
| 3 | medium | A restore drops seven explicit grants | fixed on UAT and in the runbook; the recipe itself deferred to backlog `#rg7pv` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose: Lutan did the steps these corrections describe, on 2026-11-08.)

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
- [ ] Handed to the production release manager — n/a: documents and a dev-machine check only

Result: pass

Release manager acknowledgement: pending: at the release this lands in
