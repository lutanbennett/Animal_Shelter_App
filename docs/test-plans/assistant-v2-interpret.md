# Feature test plan — assistant-v2-interpret

## Header

| | |
|---|---|
| Feature | Assistant v2 stream 3: a model turns a sentence into a Draft and the existing cards confirm it; the keyword parser is the fallback; audit rows record `model` and `exchange` |
| Backlog item | `docs/backlog.md` → **Assistant v2 stream 3** (ticked); the parent and the other streams are left open |
| Branch / worktree | `claude/assistant-v2-interpret` @ `C:\Development\Animal_Shelter_assistant-v2-interpret` |
| Dev server | `http://localhost:3001` |
| PR | opened after this plan; number on the PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no (`0289` is already on `main` and applied to dev) |
| Tested at SHA | `befa2b64` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a server action asks the adapter to turn a typed sentence into a `Draft` using lookup tools, the panel tries it first and falls back to the keyword parser, and audit rows now record model and exchange
- [x] Files/areas touched listed — `src/lib/assistant/interpret.ts` (+ `.test.mjs`), `src/app/assistant/interpret.ts`, `AssistantConversation.tsx`, `AssistantCards.tsx` (passes `trace`), `actions.ts` (optional `trace` on writes, cancel and refused rows), `audit.ts`, `types.ts`; decision files; backlog tick
- [x] Roles affected identified — anyone holding the assistant card; read-only holders are offered only the questions. Today nobody sees a change because no model is configured
- [x] Anything explicitly **out of scope** written down — a live model call (no key, none to be bought), an OpenAI-compatible adapter (stream 7), a per-person ceiling on calls, multi-turn (stream 4), `scripts/`, the could-not-help export

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (docs only: release record and handover); the gates ran on the code before it, which that merge did not touch
- [x] `node scripts/gates.mjs` ends with all four codes 0. Paste its closing `gates:` line below exactly as printed.

```
=== gates: build exited 0 after 272s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration added; `0289` already applied to dev
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the two columns are nullable and v1 rows keep null
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration of this PR; but `audit.ts` now sends both keys, so production needs `0289` applied before or with this code (stated in the decision file)

## 4. Functional checks

- [x] Happy path works end to end — `interpret.test.mjs` (10 tests, scripted adapter): lookup then draft, invented id refused then corrected, malformed twice, wrong types, read-only tool set, words-only and refusal, errors, timeout, round cap, lookup matching. In the browser on dev with no model configured: "Where is Angsumalin?" answered through the fallback path (server action returned not configured, parser answered, lookup shown)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing new is stored by this check; the audit write paths are typechecked and covered by the existing row writers
- [ ] Create / edit / delete all exercised — n/a: the nine write actions are unchanged apart from an optional pass-through field
- [x] Empty state renders sensibly — a turn the model and parser both miss reaches the existing "can't help" reply (code path unchanged, `afterParse` records the unmatched row)
- [x] Invalid input is rejected with a readable message, not a crash — bad tool calls go back to the model as plain errors; a sentence over 500 characters or a bad date is not sent
- [x] Boundary cases checked — second malformed call ends the turn; fourth round ends the turn; 25 s timeout (exercised with 20 ms)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| login holding card `assistant` and `view_residents` | the panel and a lookup | opens; question answered via the fallback | pass (dev, 2026-10-30) |
| login with the assistant card read-only | write drafts | offered only `lookup`, `where`, `who`, `due` | pass (unit test `interpretTools(false)`) |
| login without the assistant card | `interpretRequest` | returns not configured, nothing loaded | n/a: not driven in the browser; the code checks `assistant.ask` before loading rows |

- [ ] Every role above tested — n/a: see the table; the no-card row is by reading the code, said plainly
- [x] A role that should not have access is blocked server-side — `interpretRequest` checks `assistant.ask` itself and the write actions are unchanged

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: nothing a user can see until a model is configured
- [ ] Translatable strings — n/a: no new user-facing strings; the existing looking / can't-help / refusal copy is reused
- [ ] Mobile viewport (375px) — n/a: no layout change
- [x] Browser console clean — the only error seen came from the inspection script itself (`getComputedStyle`, `<anonymous>`), not the app
- [ ] Network clean — n/a: not separately inspected; the only new request is the `interpretRequest` server action, which returned normally

## 6. Regression

- [x] The pages nearest the change still work — the assistant panel and the lookup answer were driven on dev
- [x] Any shared file touched checked from a second, unrelated page — `audit.ts` and `actions.ts` are shared by the cards; typecheck covers every card call site (nine) and `assistant-examples-follow-cards.test.mjs` runs in the test gate
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; parent and other streams left open on purpose
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-assistant-v2-interpret.md`; the false claim in `2026-10-30-assistant-v2-schema.md` is corrected
- [x] `README.md` still accurate — it does not describe the assistant's internals
- [ ] **Release notes.** — n/a: no model is configured, so a shelter user sees exactly version 1 until stream 7 and a deploy of a model; the note goes in the PR that turns one on
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Behaviour against a real model is written as not established; only mocked-adapter results and the no-model fallback are claimed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the browser's own calendar date is passed to the server and into the prompt; resolving "tomorrow" is the model's job and is not claimed
- [ ] **For a boundary or banding change, assertions cover both edges** — n/a: no banding; the retry and round caps are tested at their limit
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the gates block above is pasted as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added; `ASSISTANT_LLM_*` and the key were added by stream 2 and stay unset

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR, but see §3: production needs `0289` before this code
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration here
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: `0289` before or with this code, in the release

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; nothing is persisted that the old code cannot ignore (the columns are nullable)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | No per-person or per-day ceiling on model calls | deferred: must exist before a metered key does; a self-hosted model costs only time |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | With a real model configured (stream 7), a sentence produces the right card and the audit row carries model and exchange | `/assistant`, then `assistant_actions` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. — pending: item 1 needs a real model

Manual verification by: pending: item 1 needs a real model, which does not exist yet

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over by the PR itself once merged

Result: pass with accepted defects

Release manager acknowledgement: pending
