# The Claude path leaves the assistant, and no vendor SDK may come back

2026-11-01. Stream `drop-anthropic-sdk`, run from the `0.42.0` release session because the release
before it owed the removal. It supersedes the Claude parts of
`docs/decisions/2026-10-30-assistant-llm-adapter.md`, which are marked in place there.

## Why

**Lutan, 2026-10-31, mid-release:** *"Why is anthropoid sdk going into production ? We decided that we
won't be using that"*, then *"you can continue the release, we will take it out in the next release."*
This is that removal. The umbrella decision it rests on is older: the Claude API was ruled out on
2026-10-30 (*"Let's not do the proof of concept"*), 45 minutes **after** the adapter stream merged with
a Claude implementation in it. Nothing was wrong with that stream's work; its brief was written before
the ruling, and no item asked anyone to take it out again, so the SDK sat in `package.json` through
`0.41.0`.

## What was removed

| Thing | Was |
|---|---|
| `src/lib/assistant/llm-claude.ts` | deleted — the only file that imported `@anthropic-ai/sdk` |
| `@anthropic-ai/sdk@^1.3.0` | `npm uninstall`ed; 77 lines left `package-lock.json` |
| the `claude` branch of `createLlm()` | deleted; `ASSISTANT_LLM_PROVIDER` now defaults to `openai-compatible` |
| `ANTHROPIC_API_KEY` | out of `scripts/lib/runtime-config.mjs`, `.env.example` and the `environment` list in `docs/hard-coded-security-registry.json` |
| the six Claude tests in `src/lib/assistant/llm.test.mjs` | gone with the file they tested; three provider-neutral tests replace them |
| `ALLOWED` in `scripts/check-llm-vendor-imports.mjs` | **the whole allow-list is gone**, not just its one entry |

**Kept, on purpose:** the provider-neutral `LlmAdapter` interface, the `ASSISTANT_LLM_PROVIDER` switch
and the output clamp, so a second in-house runtime can be added behind them without reopening any of
this.

## The check now allows nothing, and that is the point

`scripts/check-llm-vendor-imports.mjs` is **why no check caught this**: it permitted exactly one file,
`llm-claude.ts`, by design. A check with an exception cannot see the exception. The file is gone and so
is the allow-list, so the rule it enforces is now the rule as stated — *no file imports a model
vendor's SDK* — and `@anthropic-ai/` stays in its `VENDORS` list so that adding the package back fails
`npm run lint`. The one implementation, `llm-openai.ts`, speaks the OpenAI-compatible wire shape over
plain `fetch` and imports nothing.

It was Lutan who caught it, from one mechanical line in a release report saying `npm ci` had been
needed. That is the argument for keeping those lines in.

## Measured, not inferred: no key ever existed

The `0.41.0` record could say the production **bundle** was clean (`strip-baked-env` named fourteen
variables and no assistant LLM one) but left open *"whether `ANTHROPIC_API_KEY` exists as a production
Worker secret"*. **It was read on 2026-11-01**: `npx wrangler secret list --env production` returns
eleven secrets — `BACKUP_DRIVE_FOLDER_ID`, `CLOUDFLARE_ANALYTICS_TOKEN`, `CLOUDFLARE_ZONE_ID`, the four
`GOOGLE_*` ones, `GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`, `ORIGIN_KEY` and `SUPABASE_SERVICE_ROLE_KEY` — and
**no `ANTHROPIC_*`, `OPENAI*` or `ASSISTANT_LLM_*` name at all.** So no text was ever sent to Anthropic
and no metered call was ever possible. The open question from the last release is closed by reading it,
which is the rule the runbook already gives for production.

## Two things checked while in there, and neither was a fault

- **`zod` did not need moving.** The adapter decision said the SDK's peer dependency made `zod` a
  production dependency. It is not in `package.json` at all, in either list, and no file under `src/`,
  `scripts/` or `worker/` imports it. Nothing to do.
- **`npm run audit:register` still exits 0** after the uninstall, and `npm run audit:prod` still exits 1
  on the same `glob`/`minimatch` chain it did before — unchanged by this PR either way.

## Found, not fixed: the self-hosted switch could be pointed at a hosted service

`createLlm()` answers to `openai-compatible`, `openai` **and** `ollama`, and `llm-openai.ts` takes any
`ASSISTANT_LLM_BASE_URL` plus an optional `ASSISTANT_LLM_API_KEY` as a bearer token. Nothing in the code
requires that address to be on the home network. So a future environment could set
`ASSISTANT_LLM_BASE_URL=https://api.openai.com/v1` with a key and send shelter text to a hosted service,
which is exactly what the in-house rule forbids — without importing a vendor SDK, so
`check-llm-vendor-imports.mjs` would pass.

**This is raised rather than decided**, because narrowing it is a judgement Lutan owns: a check that
refuses a non-private address would also refuse a model server on another machine he might want. It is
put to him in the `0.42.0` release round and filed on the backlog under *Security* either way. What it is
**not** is a regression from this PR: the switch behaved this way before and after.

## What a user sees

Nothing. `ASSISTANT_LLM_MODEL` is unset in every environment, so `createLlm()` raised
`LlmError("not_configured")` before this change and raises it after; the assistant falls back to the
keyword reader exactly as it did, and `/admin/assistant` still reads *Keyword reader* on every row. The
release-notes line is `n/a` for that reason.
