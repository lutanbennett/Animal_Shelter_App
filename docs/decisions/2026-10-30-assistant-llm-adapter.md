# Assistant v2 stream 2: the provider-neutral LLM adapter

> **SUPERSEDED IN PART, 2026-11-01 — every Claude passage below is history.** `llm-claude.ts`,
> `@anthropic-ai/sdk` and `ANTHROPIC_API_KEY` are gone, and `ASSISTANT_LLM_PROVIDER` now defaults to
> `openai-compatible`. The rule is that the assistant's model runs on the shelter's own machine, so no
> model vendor's package belongs in this repository and `check-llm-vendor-imports.mjs` allows none.
> `docs/decisions/2026-11-01-drop-anthropic-sdk.md` is the paper. **What still stands:** the
> `LlmAdapter` interface, the `ASSISTANT_LLM_PROVIDER` switch, the `Draft`-derived tool definitions,
> the output clamp, and the reasoning about where a per-person spend ceiling belongs. This stream was
> briefed while the plan was still "build against the Claude API first"; the no-Claude decision was
> recorded 45 minutes after it merged, which is how the SDK reached `0.41.0`.

2026-10-30. Stream `assistant-llm-adapter`, step two of `2026-10-30-assistant-v2-scoping.md`. A seam with no caller: nothing in
the app calls it yet (stream 3 does), so no user sees a change.

## Step zero

Not already built: `src/lib/assistant/` had no `llm.ts`, `package.json` had no LLM client, no decision file or commit added one.

## The interface (`src/lib/assistant/llm.ts`)

`LlmAdapter { provider, model, complete(request) }`. A request is `system?`, `messages` (each a list of `text` / `tool_call` /
`tool_result` parts), `tools?` (name, description, plain JSON Schema) and `maxTokens?`. A response is `text`, `toolCalls`, `stop`
(`end | tool_calls | max_tokens | refused`), `usage`, and the `model` that answered (stream 3 writes it to the audit row; this
stream does not touch `audit.ts`). Every failure is an `LlmError` with a `kind` (`not_configured | auth | rate_limited |
bad_request | unavailable | unknown`), so no caller sees a vendor class. No vendor type appears in a signature.

`createLlm()` picks the implementation from the environment. `llm-claude.ts` is the Claude one and the **only** file that imports
the SDK; `scripts/check-llm-vendor-imports.mjs` (part of `npm run lint`) fails if any other file under `src/`, `worker/` or
`scripts/` imports a vendor package. Stream 7 adds `llm-openai.ts` behind the same switch.

## Environment (all optional; all three are in `runtime-config.mjs`, `.env.example` and the registry's `environment` list)

| Name | Meaning |
|---|---|
| `ASSISTANT_LLM_PROVIDER` | ~~`claude` when unset~~ — **superseded**: `openai-compatible` when unset |
| `ASSISTANT_LLM_MODEL` | the model id, **one place**; ~~defaults to `DEFAULT_CLAUDE_MODEL`~~ — **superseded**: no default, and unset means `not_configured` |
| ~~`ANTHROPIC_API_KEY`~~ | **superseded 2026-11-01: removed.** It was never set in any environment, and the production Worker's secret list was read on 2026-11-01 to prove it |

The model id comes from the Claude SDK reference, not from the backlog item's `claude-opus-5`. Which model the shelter runs is
Lutan's choice once the eval set exists. Not measured here: effort and thinking are left at the model's defaults.

## Tool definitions derive from `Draft` (`llm-tools.ts`)

One tool per intent, named by the intent. Each tool's field table is typed `{ [K in Exclude<keyof Draft, "kind">]: FieldSpec }`
per kind, so adding, renaming or removing a `Draft` field without updating the table fails `npm run typecheck`. A TypeScript type
cannot be read at run time, so this compile-time tie is the strongest form of "derived" available. Every field is nullable and
required (null is "the sentence did not say", which the cards already show as a blank). `draftFromToolCall` turns a call back into
a `Draft`; a wrongly typed field becomes a blank, not an error, because the card and the server action are what validate.
Tool choice stays `auto`: the current models reject a forced `tool_choice` with a 400.

## The Worker finding (deliverable 6)

**The SDK (`@anthropic-ai/sdk` 1.3.0) loads and runs on the Cloudflare runtime.** Measured: a throwaway Worker (scratchpad, not
committed) imported `llm-claude.ts` and `llm-tools.ts`, used the repo's `compatibility_date` and `nodejs_compat`, and was bundled
with `wrangler deploy --dry-run` (1,125 KiB, 177 KiB gzip, far under the Worker size limit) and run in local `workerd` with
`wrangler dev --local`. It built the adapter, sent a request through an injected `fetch`, parsed a `tool_use` reply, and returned
the right `Draft` and the configured model id.

**Not established:** a real request to the Anthropic API from the deployed Worker (no key exists; stream 3 needs one for live
verification), and the full OpenNext production build with this module in it (nothing imports it from a route yet, so the build
cannot exercise it). Streaming was not used or tested. The Pi serves the same code under Node, which the unit tests cover.

## The spend guard (deliverable 7): both layers, split by what each can know

- **In the adapter:** a cap on the output of every call. `maxTokens` defaults to 1024 and is clamped to 4096 whatever the caller
  asks, so no single call can be made to run away. The adapter knows nothing about who is asking, so this is the most it can do.
  The SDK retries are limited to one.
- **In the route (stream 3), not here:** a request ceiling per login and per day, and the shelter's monthly cap. That needs an
  identity and a clock, and the `assistant.ask` card is already checked there. Stream 3's brief should carry this. The Anthropic
  console spend limit on the key is the backstop that no code can bypass; setting it is Lutan's job when the key is made.

## Not done here

No key was added or requested, no migration, no change to `audit.ts`, no route and no UI. Advisory register unchanged.

## The audit finding this PR raised (GHSA-mrhx-c7xc-m3w5, zod)

The SDK declares `zod` as a peer dependency, so the `zod` that already sat in the lockfile (4.6.5, via the lint plugin) became a
production dependency and `audit:register` failed on it (high: memory exhaustion validating oversized constrained collections).
Reachability: this code never calls the SDK's zod helpers, so the flaw is not reachable here. It was fixed anyway, because a
patched release exists: `npm update zod` moved the lockfile to 4.6.7, nothing else. No register entry was added.
