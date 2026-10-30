# Assistant v2 stream 7: the OpenAI-compatible adapter

2026-10-30. Branch `claude/assistant-openai-compatible`. No migration.

## Decided

- `src/lib/assistant/llm-openai.ts` implements `LlmAdapter` over the chat-completions
  shape (Ollama, llama.cpp server, vLLM) with plain `fetch`. **No dependency was added**,
  so the Worker bundle and `check-llm-vendor-imports` are unaffected.
- `createLlm()` gained a branch for `openai-compatible` (aliases `openai`, `ollama`).
  The `claude` branch and its default are untouched.
- Env vars: `ASSISTANT_LLM_MODEL` (required here, no default), `ASSISTANT_LLM_BASE_URL`
  (default Ollama on localhost), `ASSISTANT_LLM_TIMEOUT_MS`, `ASSISTANT_LLM_API_KEY`
  (optional). Registered in `scripts/lib/runtime-config.mjs`, `.env.example` and the
  security registry (credential and address only, not access).

## Differences mapped, in code

| OpenAI shape | What the adapter does |
|---|---|
| Tool arguments are a JSON **string** | Parsed; not JSON, or not an object, raises `bad_response`. An object (some servers) is accepted. Never guessed at. |
| Missing tool-call id | Filled `call_N`. |
| No thinking | Nothing to map. |
| `finish_reason` stop / tool_calls / length / content_filter | end / tool_calls / max_tokens / refused. A server saying `stop` while sending calls is read as `tool_calls`. |
| Tool results are `role: tool` messages | Mapped; an error result is prefixed `Error:`. |
| Streaming | Not used. It would not shorten a CPU model's wait before its first word. |

## Declared crossings

- `src/lib/assistant/llm.ts`: two new error kinds, `timeout` and `bad_response`, so a
  slow model and a garbled one are distinguishable from "down".
- `scripts/lib/runtime-config.mjs`: the check `check-runtime-config` requires every env
  var registered. Three lines only; belongs to the replay stream otherwise.

## Failure story for a slow CPU model

Default wait 180 s, configurable; no retry (a retry doubles the wait, and the keyword
parser answers meanwhile). A server that is not running gives `unavailable` with the
words "Is it running?" and the Ollama command, the likeliest slip.

## Deliverable 8: can the Worker reach a local model?

**Not on `localhost` or a LAN address: a Worker runs in Cloudflare's network.** (From how
Workers work; not tested here.) Development on one machine works. For production the
shape is a Cloudflare tunnel from the model machine, as the Pi already uses
(`docs/pi-failover.md`), restricted to the Worker. Not built; its own item. Anything
else (rented GPU, hosted endpoint) is ruled out by the 100%-in-house decision.

## Deliverable 9: tool prompt size

`draftTools()` gives **12** tools (the brief said nine), 6,605 characters of JSON in the
OpenAI wire shape. Roughly 1,700 to 2,200 tokens by the usual 3 to 4 characters per token;
**an estimate, not a tokenizer count.** Largest tools: carer-return (798), rehome (698),
clinic (855). Real token counts come from the server's `prompt_tokens`, which the adapter
returns in `usage.inputTokens`, so the replay will report them.

## Not done / not established

- **No live model was run**; nothing was installed. Whether `qwen3:8b` and the others
  handle these schemas is for the replay to measure. Model choice is Lutan's; no threshold set.
- The runbook has not been followed by anyone yet. Candidate sizes are from memory and
  approximate.
- Whether the replay meets this adapter with no edit on either side: the replay stream's
  files were not present in this branch to check.
