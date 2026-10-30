# Test plan: assistant-local-model-reachable

## Header

| | |
|---|---|
| Feature | How the live app reaches a model on Lutan's own machine: established (through the Pi, no tunnel), runbook steps 5–9, replay meets the adapter |
| Backlog item | `docs/backlog.md` → *THE LIVE APP REACHES A MODEL ON LUTAN'S OWN MACHINE THROUGH THE PI* (Assistant) |
| Branch / worktree | `claude/assistant-local-model-reachable` @ `C:\Development\Animal_Shelter_assistant-local-model-reachable` |
| Dev server | not started: no page, route or component changed; the measurements ran the adapter and the replay directly |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | f395a0de |

## 1. Scope and risk

- [x] One sentence: establish how production reaches a home model (the Pi calls it across the home network; no tunnel), write Lutan's steps, pin the replay-adapter meeting point with a test; matches the backlog item's three parts and the replay check
- [x] Touched: `docs/self-hosted-model-runbook.md`, `scripts/lib/runtime-config.mjs` (`where` of two names), `.env.example` (comment), `scripts/assistant-eval-replay.test.mjs` (one test), decision file, backlog item
- [x] Roles affected: none; nothing a person signs in to changed
- [x] Out of scope: standing anything up on Lutan's PC, router or Cloudflare (his steps); the conversation code and its fallback (`claude/assistant-v2-conversation` owns it this batch; findings reported, not changed)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merged `181dd4f2` before the work commits)
- [x] `node scripts/gates.mjs` closing line below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable file — n/a: no migration
- [ ] Existing rows still read — n/a: no migration
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: the real `scripts/assistant-eval-replay.mjs` CLI, with `ASSISTANT_LLM_PROVIDER=openai-compatible`, against a stub HTTP server in Ollama's shape: report printed, exit 0, intent 75.0% (3 of 4), the server received `/v1/chat/completions` with 12 tools and `tool_choice: auto`. Pinned as a test in `scripts/assistant-eval-replay.test.mjs` (7 pass, 0 fail)
- [ ] Data persists — n/a: stores nothing
- [ ] Create / edit / delete — n/a: no data surface
- [ ] Empty state — n/a: no UI
- [x] Invalid input: a garbled tool-call argument string scores as one model error and the run continues
- [x] Boundaries: model machine off measured at 0.2 s and asleep at 10.7 s to `unavailable`, with the real adapter on Node (decision file has the method)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no surface | n/a |

- [ ] Every role tested — n/a: no page, route or action added or changed
- [ ] Blocked server-side — n/a: nothing reachable changed; `assistant.ask` is untouched

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no user-facing change; the runbook is for Lutan, not the in-app manual
- [ ] Translatable strings — n/a: no strings shown in the app
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI; `check-runtime-config` prints `27 names, .env.example and consumers agree.`

## 6. Regression

- [x] Nearest code: the replay's existing six tests still pass beside the new one
- [ ] Shared file loaded from a second page — n/a: `runtime-config.mjs` changed only the `where` of two optional names; the Worker never received them before either (neither secret nor build), and `check-runtime-config` passes
- [x] Nothing merged from `main` during `sync` broke this branch (gates)

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: rewritten, not ticked; Lutan's runbook steps 5–9 remain, and the title now says so
- [x] `docs/decisions/2026-10-30-assistant-local-model-reachable.md`
- [x] README still accurate (it does not mention the assistant's model)
- [ ] **Release notes.** n/a: nobody would notice; no app code changed, and the model is not switched on anywhere until Lutan follows the runbook
- [x] Commit messages say why
- [x] Claims were measured: the off and asleep timings, the Pi's address and the replay meeting were run; the Worker's reach is labelled not established, with why

## 8. Pre-production gate

- [ ] Tested SHA is tip of main — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no banding
- [ ] Evidence unedited — n/a: gate output pasted as printed above
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New env var in production — n/a: no new variable; the runbook puts the existing ones on the Pi only, by Lutan
- [ ] Both migration and reading code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: docs, a test and a registry field; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | `ASSISTANT_LLM_BASE_URL` and `_TIMEOUT_MS` were registered `where: "both"` but never reached the Worker | fixed: now `pi` |
| 2 | low | The runbook told Lutan to raise `ASSISTANT_LLM_TIMEOUT_MS` for slow answers; the app caps each step at 25 s regardless | fixed in the runbook; the cap itself reported, not changed (not this stream's file) |
| 3 | low | While the model machine sleeps, every sentence waits about 11 s, because only `not_configured` is remembered | accepted: reported for the conversation stream |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Follow runbook steps 5–9 once the model machine exists; the Pi's `curl` in step 8 must list the model | the model machine, the router, the Pi |
| 2 | Whether a Worker can reach a home address: re-run the throwaway remote-preview probe after signing wrangler in with write scope, only if a tunnel is ever wanted | this PC |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

- [ ] The manual list above is empty, or checked by a person — n/a: the list is not empty; only the person who looked may tick this, and Lutan has not yet

Manual verification by: pending: Lutan to follow runbook steps 5–9 when the model machine exists

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file
- [ ] Handed to the production release manager — n/a: not releasing yet

Result: pass

Release manager acknowledgement: n/a: not releasing
