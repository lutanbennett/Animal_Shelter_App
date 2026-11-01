# Feature test plan

## Header

| | |
|---|---|
| Feature | Remove the Claude path from the assistant: delete `llm-claude.ts` and `@anthropic-ai/sdk`, drop `ANTHROPIC_API_KEY`, make the self-hosted implementation the default, and delete the vendor-import check's allow-list entirely |
| Backlog item | `docs/backlog.md` → **REMOVE THE CLAUDE PATH FROM THE ASSISTANT** (Security) |
| Branch / worktree | `claude/drop-anthropic-sdk` @ `C:\Development\Animal_Shelter_drop-anthropic-sdk` |
| Dev server | not started — n/a: no route, page, component or user-visible behaviour changed |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude Opus 5 (production release manager session), 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `005f6c37` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the Claude implementation, its package and its key leave the repository, and the check that forbids a vendor SDK stops making an exception for one file
- [x] Files/areas touched listed — deleted `src/lib/assistant/llm-claude.ts`; `src/lib/assistant/llm.ts` (header, and the `claude` branch of `createLlm()`); `src/lib/assistant/llm.test.mjs` (rewritten); `scripts/check-llm-vendor-imports.mjs`; `scripts/lib/runtime-config.mjs`; `scripts/lib/permission-probes.mjs`; `scripts/assistant-eval-replay.mjs`; `.env.example`; `package.json`, `package-lock.json`; `docs/hard-coded-security-registry.json`; `docs/decisions/2026-10-30-assistant-llm-adapter.md` (marked superseded in place); a new decision file; `docs/backlog.md`; this plan. **No route, no page, no component, no `worker/`, no migration**
- [x] Roles affected identified — **by card, not by role**: none. No activity, card, cell, policy or control changed. `assistant.ask` and `assistant.record` are untouched, and `scripts/lib/permission-probes.mjs` changed only the prose describing where `assistant.ask` is enforced
- [x] Anything explicitly **out of scope** written down — narrowing `ASSISTANT_LLM_BASE_URL` to private addresses (raised with Lutan, who answered *file it*, 2026-11-01; see Defects); the `LlmAdapter` interface, the `ASSISTANT_LLM_PROVIDER` switch and the output clamp, all deliberately kept; `llm-openai.ts` itself, unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran, `Already up to date`, then pushed the branch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below, read from the script's own exit code rather than through a pipe
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

### Evidence

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 39s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 100s
=== gates: test — npm test
=== gates: test exited 0 after 15s
=== gates: build — npm run build
=== gates: build exited 0 after 119s
gates: typecheck=0 lint=0 test=0 build=0
```

`npm run lint` is the gate that matters here, because `scripts/check-llm-vendor-imports.mjs` is part of
it. On its own:

```
ok: no model vendor's SDK is imported anywhere (1245 files scanned)
```

And the two config checks that read the environment list, each exit 0:

```
check-runtime-config: 26 names, .env.example and consumers agree.
no coded security outside the Admin bypass
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; no table, column, view, function or policy is touched
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The feature under test is a **removal with no reachable surface**, so the checks are the unit tests and
the scripts, not a browser. `ASSISTANT_LLM_MODEL` is unset in every environment, so `createLlm()` raised
`LlmError("not_configured")` before this change and raises it after; the assistant's keyword reader is
what answers, exactly as it did.

- [x] Happy path works end to end — `npm test`: 16 tests across `llm.test.mjs` and `llm-openai.test.mjs`, 16 pass. With the provider unset and `ASSISTANT_LLM_MODEL` set, `createLlm()` returns `["openai-compatible", "qwen3:8b"]`; with the model unset it raises `not_configured`
- [x] Data persists — answered as the equivalent, since nothing is written: **nothing persists anywhere.** No database, file or setting is written by any code path in this PR
- [ ] Create / edit / delete all exercised — n/a: this PR adds no operation; it removes one
- [x] Empty state renders sensibly — the "no model configured" state **is** the empty state, and it is the only state any environment is in: `createLlm()` raises `not_configured` and `/admin/assistant` reads *Keyword reader* on every row, unchanged by this PR
- [x] Invalid input is rejected with a readable message — `ASSISTANT_LLM_PROVIDER` set to `claude`, `anthropic` or `nope` all raise `LlmError("not_configured")` with the provider named in the message. **The retired name is asserted explicitly**, so a leftover `claude` value in some environment fails cleanly instead of reaching a module that no longer exists
- [x] Boundary cases checked — the output clamp, which moved to pure asserts now that no vendor adapter is here to drive it: `undefined`, `-5`, `0` and `NaN` all give `DEFAULT_MAX_TOKENS`, `10` gives 10, `999999` gives `MAX_TOKENS_CEILING`. That the clamped value reaches the wire as `max_tokens` is still covered, by `llm-openai.test.mjs`

### Role access matrix

**Not run, and deliberately.** No permission check, card, cell or control's visibility changed anywhere
in this PR, so there is nothing a role could reach differently. Reported by card rather than by role, as
`CLAUDE.md` requires.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | unchanged | unchanged | n/a: no gate changed |
| management | unchanged | unchanged | n/a: no gate changed |
| staff | — | retired role (`0173`) | n/a |
| doctor | unchanged | unchanged | n/a: no gate changed |
| volunteer | unchanged | unchanged | n/a: no gate changed |
| signed out | unchanged | unchanged | n/a: no public surface touched |

- [ ] Every role above tested — n/a: no activity, card or control changed; a role pass would measure nothing
- [ ] A role that should not have access is blocked server-side — n/a: no server check changed. `assistant.ask` and `assistant.record` are enforced exactly where they were

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added, removed or moved
- [ ] Manual updated — n/a: the manual never described the model provider, and a shelter user has no way to see which one is configured
- [ ] Translatable strings go through the translation path — n/a: no user-facing string added or changed. The strings that moved are code comments, a config `purpose:` field and a registry `gates:` field
- [ ] Mobile viewport (375px) — n/a: no rendered output changed
- [ ] Browser console clean — n/a: no client code changed; the deleted file was server-only and reached only through a dynamic import
- [ ] Network clean — n/a: no page's requests changed. The one network call this PR removes the ability to make was never made

## 6. Regression

- [x] The pages nearest the change still work — `npm run build` compiled every route including `/assistant` and `/admin/assistant`, the two that reach `src/lib/assistant/`. The build is the check here: a stale import of the deleted file would fail it, and that is exactly the failure mode (`Can't resolve '@anthropic-ai/sdk'` is how the missing `npm ci` showed up on 2026-10-31)
- [x] Any shared file touched checked from a second, unrelated place — `scripts/lib/runtime-config.mjs` is read by `scripts/check-runtime-config.mjs` (exit 0: *26 names, .env.example and consumers agree*) and by `scripts/deploy.mjs`'s env verification; `scripts/lib/permission-probes.mjs` is read by the permission check scripts, which run inside `npm run lint` (exit 0). Both were exercised by running their consumers, not by reading the files
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date`, so nothing was merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**, with what was measured rather than assumed. The follow-up it raised is filed on the `backlog` branch, not here
- [x] Non-obvious design choices added as `docs/decisions/2026-11-01-drop-anthropic-sdk.md`, and the Claude passages of `docs/decisions/2026-10-30-assistant-llm-adapter.md` are marked `SUPERSEDED` in place rather than left to read as current
- [x] `README.md` still accurate — checked: it does not name the assistant's model provider, the SDK or `ANTHROPIC_API_KEY`
- [ ] **Release notes.** — n/a: nobody would notice. `ASSISTANT_LLM_MODEL` is unset in every environment, so the assistant answered with its keyword reader before this change and answers with it after; no page, control, wording or permission changed. The only thing removed was an ability nothing had the credential to use — the production Worker's secret list was read and holds no `ANTHROPIC_API_KEY`
- [x] Commit messages say why, not just what — the commit explains how the SDK got in (a brief written before the ruling that superseded it) and why the allow-list went with it
- [x] **Claims were measured, not reasoned** — the three that could have been guessed were each read instead: the production Worker secret list (`wrangler secret list --env production`, eleven names, no `ANTHROPIC_*`/`OPENAI*`/`ASSISTANT_LLM_*`); `zod`'s position (absent from `package.json` entirely, so nothing to move, against the adapter decision's statement that the SDK's peer dependency had made it a production dependency); and `audit:register` still exiting 0 after the uninstall

## 8. Pre-production gate

- [x] Tested SHA recorded in the header, and it is the tip of this branch — `005f6c37`
- [ ] Deployed SHA matches the tested SHA — deferred: the `0.41.1` release manager (this session), at the cut
- [ ] Deployed to test — deferred: the `0.41.1` release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: the `0.41.1` release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing in this PR reads a clock, a date or a timezone
- [ ] Boundary or banding change covers both edges — n/a: not a boundary change. The one numeric boundary this PR touches is the output clamp, whose both edges are asserted in section 4
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines, the vendor-import line and the two config-check lines are copied from the runs, not retyped
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed, and `PUBLIC_SITE` is `locked`
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: the `0.41.1` release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: the `0.41.1` release manager
- [x] Any new secret/env var exists in the production Cloudflare environment — **inverted here, and checked: this PR removes one, and it was never there.** `npx wrangler secret list --env production` holds no `ANTHROPIC_API_KEY`, so nothing must be unset at deploy time and no environment is left referring to a name the code no longer reads
- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, including what it does not cover — `./scripts/pi/deploy-pi.sh --ref <previous sha>` on both Pi clones rebuilds the previous build; `npx wrangler rollback --env production` reverts only the Worker fallback. Neither is likely to be needed and neither reverts anything persistent, because **this PR changes no schema and writes no data.** The one thing a rollback would restore is the ability to call a vendor API with a key that does not exist

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | **The self-hosted switch could be pointed at a hosted service.** `createLlm()` answers to `openai-compatible`, `openai` and `ollama`, and `llm-openai.ts` takes any `ASSISTANT_LLM_BASE_URL` plus an optional `ASSISTANT_LLM_API_KEY` bearer token. Nothing requires that address to be on the home network, so a future environment could send shelter text to a paid online service — forbidden by the in-house rule — without importing a vendor SDK, so `check-llm-vendor-imports.mjs` would pass. **Not a regression from this PR:** the switch behaved this way before and after | **Accepted, and filed.** Put to Lutan in the `0.41.1` release round on 2026-11-01; he answered *file it*, because a check that refuses a non-private address would also refuse a model server on another machine he may want. Recorded in the decision file under *Found, not fixed* and filed on the `backlog` branch |

## Left for manual verification

Empty. There is no surface for a person to look at: no page, no control, no wording a shelter user
reads, and the one state any environment is in (no model configured) is unchanged by this PR and
already visible on `/admin/assistant` as *Keyword reader*.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-01

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at and nothing being signed for

Manual verification by: n/a: no page, control or wording changed; the removed code path had no credential in any environment and could never run

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and `0.41.1` carries it

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-11-01
