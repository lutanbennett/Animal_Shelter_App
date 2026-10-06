# Feature test plan

Filled from `docs/test-plan-template.md`. The item is closed on reasoning, not a measurement campaign, so most lines are
`n/a` with the reason, and the evidence is the code reading and the check script.

---

## Header

| | |
|---|---|
| Feature | Keep `MAX_UPLOAD_BYTES` at 15 MB: on the Pi path the Worker streams uploads, so the 1102 measurement no longer applies |
| Backlog item | `docs/backlog.md` → Measure the largest upload a Worker actually completes, and set the limit from it |
| Branch / worktree | `claude/worker-upload-limit` @ `C:\Development\Animal_Shelter_worker-upload-limit` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not used: Worker logic and docs only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (worker-upload-limit session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the item's own "moot once the Pi is live" clause applies, so the limit stays 15 MB on evidence from `worker/origin.mjs`, and the item is ticked with the reasoning
- [x] Files/areas touched listed: `scripts/check-worker-origin.mjs` (two 16 MB cases), `docs/backlog.md`, `docs/decisions/2026-10-07-worker-upload-limit.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: no behaviour changes for any role
- [x] Out of scope written down: measuring Worker CPU/memory on Cloudflare, and an upload while the Pi is off the network (named as unmeasured in the decision)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (nothing new to merge at this commit)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 191s

gates: typecheck=0 lint=0 build=0
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

`node scripts/check-worker-origin.mjs` drives the real exported `originOrLocal`/`fetchFromOrigin` against throwaway servers on 127.0.0.1.

- [x] Happy path works end to end: a 16 MB POST through a Pi that answers 303 reaches the Pi with every byte and is never rendered locally
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash: unchanged and still covered by the existing 503 cases in the same script (all pass)
- [x] Boundary cases: the body ceiling itself, 16 MB (`MAX_UPLOAD_BODY_BYTES`), on both branches of the clone — Pi answers, and Pi answers 530 so the local render gets every byte once

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

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface; the limit and its en/th `fileTooLarge` strings are unchanged
- [ ] Translatable strings — n/a: no strings added or changed
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: no page changed; every earlier case in `check-worker-origin.mjs` still passes, and the build bundles `worker/index.mjs` (gates)
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-07-worker-upload-limit.md`
- [ ] `README.md` still accurate — n/a: README does not state the upload limit or how the Worker handles bodies
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: the limit stays 15 MB and nothing a user sees changed
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned — partly, and the decision says which: that the body streams to the Pi and is cloned once is shown by the 16 MB script cases; that this costs the Worker almost no CPU is reasoned from the code (no parsing or re-send happens there), not read from Cloudflare observability, and the decision labels it "Not measured"

## 8. Pre-production gate

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold changed; the limit is untouched
- [ ] Evidence pasted is the tool's actual output — n/a: the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — deferred: release manager
- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added
- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position: revert the PR; it changes a check script and docs only, so production is unaffected either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An upload while the Pi is off the network is rendered by the Worker and was never measured at any size | accepted: named in the decision, same outage as reads already suffer |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing for a person to look at: no UI changed. If Lutan wants the Worker-side CPU measured after all, the one path left is the Pi-off fallback: stop the tunnel on test, upload about 14 MB through a Shelter Friend logo, and read the request's CPU time (or error 1102) in the `lanna-animal-care-test` Worker's observability logs.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (worker-upload-limit session)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — n/a: nothing for a person to look at

Manual verification by: n/a: no UI surface and no manual-verification items

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
