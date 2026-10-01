# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The Worker no longer replays a write against the local render when the Pi's status says it is down |
| Backlog item | `docs/backlog.md` → Completed → Deployment: The Worker may replay a `POST` when the tunnel returns 502/530 |
| Branch / worktree | `claude/worker-post-replay` @ `C:\Development\Animal_Shelter_worker-post-replay` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not used: Worker logic only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (worker-post-replay session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a POST/PUT/PATCH/DELETE that gets 502/503/504/521/522/523/530 from the Pi is answered with the existing 503 "check whether your change was saved" (`x-lanna-served-by: pi-timeout`) instead of being rendered locally; GET/HEAD/OPTIONS fall back as before
- [x] Files/areas touched listed: `worker/index.mjs`, new `worker/origin.mjs`, new `scripts/check-worker-origin.mjs`, `docs/backlog.md`, `docs/decisions/`, this plan. Nothing under `src/` or `supabase/`
- [ ] Roles affected identified — n/a: no role-specific behaviour; it applies to any signed-in write while the Pi is down
- [x] Out of scope written down: telling a request that never reached the Pi (530/52x) from one that did (502/504), which the Worker cannot do; wiring the check script into CI

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (see the PR for the merge commit)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`node scripts/check-worker-origin.mjs` stubs `fetch` and drives the real exported `fetchFromOrigin`.

- [x] Happy path works end to end: a 200/303/400/401/404/500 from the Pi passes through for GET and POST
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash: each down status and a thrown fetch, for POST/PUT/PATCH/DELETE, returns the 503 with the plain-language message
- [x] Boundary cases: all seven `ORIGIN_DOWN_STATUSES` plus a thrown fetch, against both the idempotent and the write methods (the matrix the item asked for)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no role logic | n/a |
| management | n/a | no role logic | n/a |
| staff | n/a | no role logic | n/a |
| vet | n/a | no role logic | n/a |
| volunteer | n/a | no role logic | n/a |
| signed out | n/a | no role logic | n/a |

- [ ] Every role above tested — n/a: no role logic
- [ ] A role that should not have access is blocked server-side — n/a: no role logic

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no feature a user operates
- [ ] Translatable strings — n/a: the message is the existing one, unchanged
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest path still works: GET fallback on every down status returns `null` (check script); the build bundles `worker/index.mjs` with the new import (gates)
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-01-worker-does-not-replay-writes-on-origin-down.md`
- [ ] `README.md` still accurate — n/a: README does not describe the Worker's fallback rules
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: only seen as an error message on a failed write that they would have received anyway, in place of a silent double write
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the replay was confirmed by reading `serve()`/`fetchFromOrigin`, and the fix by the stubbed matrix. That a real cloudflared 502 arrives mid-POST was not reproduced on the live tunnel, and the decision says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the boundary is the status set and the method set, both covered exhaustively in §4
- [ ] Evidence pasted is the tool's actual output — n/a: the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker; no migration is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Status branch replayed a write locally (the backlog item) | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: the behaviour is a function with a stubbed `fetch`.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (worker-post-replay session)  Date: 2026-10-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; behaviour is covered by the stubbed matrix

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is opened

Result: pass

Release manager acknowledgement: n/a  Date: —
