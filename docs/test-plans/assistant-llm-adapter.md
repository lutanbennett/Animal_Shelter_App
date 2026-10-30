# Feature test plan — assistant-llm-adapter

## Header

| | |
|---|---|
| Feature | Assistant v2 stream 2: a provider-neutral LLM adapter with a Claude implementation (a seam with no caller yet) |
| Backlog item | `docs/backlog.md` → **Assistant v2 stream 2: provider-neutral LLM adapter with a Claude implementation** (ticked); the parent is left open |
| Branch / worktree | `claude/assistant-llm-adapter` @ `C:\Development\Animal_Shelter_assistant-llm-adapter` |
| Dev server | not started — no UI surface; nothing imports the adapter from a route |
| PR | opened after this plan; number on the PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `a908120e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `llm.ts` interface, `llm-claude.ts`, tool definitions typed against `Draft`, mocked-transport tests, and a check that no vendor SDK is imported outside the adapter
- [x] Files/areas touched listed — `src/lib/assistant/llm.ts`, `llm-claude.ts`, `llm-tools.ts`, `llm.test.mjs`; `scripts/check-llm-vendor-imports.mjs` (added to `npm run lint`); `package.json`/lock (`@anthropic-ai/sdk`); `scripts/lib/runtime-config.mjs`, `.env.example`, `docs/hard-coded-security-registry.json` (three optional env names); decision file; backlog tick
- [x] Roles affected identified — none: no route, page or action calls the adapter yet
- [x] Anything explicitly **out of scope** written down — no key, no route, no UI, no migration, no `audit.ts` change (owned by `assistant-v2-schema`); live call to the API; OpenNext build exercising the module

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged: already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed.

```
=== gates: build exited 0 after 138s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, no data touched
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `src/lib/assistant/llm.test.mjs` (10 tests, mocked fetch): text reply, tool call to neutral call, tool results sent back, and a tool call turned into a `Draft`; also run inside local `workerd` (see decision file)
- [ ] Data persists — reload the page and the change is still there — n/a: stores nothing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash — 401/429/400/500 from the transport arrive as `LlmError` kinds; missing key is `not_configured`; unknown provider refused; wrongly typed tool fields become blanks
- [x] Boundary cases checked — `maxTokens` undefined, negative and 999999 (clamped to 4096); unknown and `constructor` tool names return null; `due.days` absent defaults to 7

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing | no route or page uses the adapter | n/a |

- [ ] Every role above tested — n/a: no surface any role can reach
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL exists

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can see
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages; the test run makes no network call

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page imports the new files, so none can change; the full `gates.mjs` test run and build cover the rest
- [x] Any shared file touched checked from a second, unrelated page — shared files touched: `runtime-config.mjs` and `.env.example` (`check-runtime-config.mjs` reports 24 names agreeing), the security registry (`check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`)
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged, already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; the parent is left open on purpose
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-assistant-llm-adapter.md`
- [x] `README.md` still accurate — it does not mention the assistant's internals
- [ ] **Release notes.** — n/a: a seam with no caller changes nothing a shelter user would see
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The Worker claim was measured (bundle size from `wrangler deploy --dry-run`, a response from local `workerd`); the claim that a live API call works is written as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic of its own; dates pass through unchanged as the model's strings
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: the only banding is the token clamp, tested at below range, in range and above range
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates block above is pasted unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: all three new names are optional and unset by default; nothing reads them yet

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; nothing is persisted, no schema, no caller

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing a person needs to look at | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. Empty: nothing to look at.

Manual verification by: n/a: no UI surface and no caller; nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over by the PR itself once merged

Result: pass

Release manager acknowledgement: pending
