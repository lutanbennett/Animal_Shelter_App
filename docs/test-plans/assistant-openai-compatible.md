# Test plan: assistant-openai-compatible

## Header

| | |
|---|---|
| Feature | OpenAI-compatible LLM adapter, env switch, self-hosting runbook (assistant v2 stream 7) |
| Backlog item | `docs/backlog.md` → Assistant v2 stream 7 |
| Branch / worktree | `claude/assistant-openai-compatible` @ `C:\Development\Animal_Shelter_assistant-openai-compatible` |
| Dev server | not started: nothing renders, no route calls the adapter yet |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | SHA_HERE |

## 1. Scope and risk

- [x] One sentence: a `fetch`-based `LlmAdapter` for Ollama/llama.cpp/vLLM, a new `ASSISTANT_LLM_PROVIDER` branch, three env vars, tests, runbook; matches the backlog item
- [x] Touched: `src/lib/assistant/llm-openai.ts` (+test), `llm.ts` (branch, two error kinds), `scripts/lib/runtime-config.mjs`, `.env.example`, security registry, docs
- [x] Roles affected: none; no page or route calls `createLlm()` yet
- [x] Out of scope: running a live model, the Worker-to-model tunnel, choosing a model, any threshold

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` closing line below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

```
GATES_HERE
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

- [x] Happy path: 11 mocked-transport tests in `llm-openai.test.mjs` (text, tools, tool results, stop reasons, HTTP errors, malformed arguments, down server, timeout, env wiring) pass; the Claude tests still pass (21 pass, 0 fail)
- [ ] Data persists — n/a: stores nothing
- [ ] Create / edit / delete — n/a: no data surface
- [ ] Empty state — n/a: no UI
- [x] Invalid input: malformed tool-call JSON, non-object arguments, nameless calls, empty choices and non-JSON bodies each raise `bad_response`
- [x] Boundaries: max tokens clamped at the ceiling; timeout under 1 s ignored; trailing slash on the base URL

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no surface | n/a |

- [ ] Every role tested — n/a: no page, route or action added
- [ ] Blocked server-side — n/a: nothing reachable; no `createLlm()` caller exists yet

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual — n/a: no user-facing change
- [ ] Translatable strings — n/a: errors are developer-facing and never shown to users
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI; `check-runtime-config`, `check-hard-coded-security` and `check-llm-vendor-imports` run clean

## 6. Regression

- [x] Nearest code: `llm.test.mjs` (Claude adapter, tools) passes with the changed `llm.ts`
- [ ] Shared file loaded from a second page — n/a: `llm.ts` has no importer outside the adapters and tests
- [x] Nothing merged from `main` during `sync` broke this branch (gates)

## 7. Documentation

- [x] Backlog item ticked on this branch
- [x] `docs/decisions/2026-10-30-assistant-openai-compatible.md`
- [x] README still accurate (it does not mention the assistant's model)
- [ ] **Release notes.** n/a: no shelter user would notice; no route calls the model yet
- [x] Commit messages say why
- [x] Claims were measured: tool prompt size is stated as 6,605 characters (counted) and an estimated token range, labelled as an estimate; the Worker claim is labelled as reasoned, not tested

## 8. Pre-production gate

- [ ] Tested SHA is tip of main — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no banding; the only boundary is the token ceiling, asserted at both ends
- [ ] Evidence unedited — n/a: gate output pasted as printed above
- [ ] Public pages re-checked — n/a: no public page touched
- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New env var in production — n/a: three optional vars, unset by default, and the `claude` default is unchanged
- [ ] Both migration and reading code — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback — n/a: additive and unused; revert the commit

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The brief says nine tools; `draftTools()` returns 12 | noted in the decision file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Follow `docs/self-hosted-model-runbook.md` on the laptop: install Ollama, pull a model, confirm it answers (the model sizes are approximate and unchecked) | the laptop |
| 2 | Run the replay against the model once the replay stream lands | replay stream |

## Sign-off

- [x] Everything that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

- [ ] The manual list above is empty, or checked by a person — pending: Lutan has not followed the runbook

Manual verification by: pending: Lutan to follow the runbook on the laptop

### Result

- [x] Open defects are fixed or accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links the file
- [ ] Handed to the production release manager — n/a: not releasing yet

Result: pass

Release manager acknowledgement: n/a: not releasing
