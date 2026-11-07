# Giving a dev session a language model

**Why this exists.** On dev there is no `ASSISTANT_LLM_MODEL`, so every assistant path that needs a model (a `#tag`,
a drawn card from a sentence) cannot be run. Three streams each built a private stand-in and none survived
(`assistant-v2-tools`, 440k tokens; `assistant-model-waits`; `assistant-tag-retry-and-proof`, which never saw its
notice). This is the one written way. Backlog `#m4t8q`.

## The step (one command)

From your own worktree:

```
node scripts/dev-assistant-model.mjs --dev
```

It starts a stand-in model on `http://localhost:11500/v1` and `next dev` on this worktree's `.port`, already pointed at
it. To see the "tags did not attach" notice, add `--force-tag-failure denied` (or `failed`); that is the
`ASSISTANT_FORCE_TAG_FAILURE` switch of `docs/decisions/2026-11-06-assistant-tag-retry-and-proof.md`, honoured only
under `next dev`. A second stream at once: `--port 11501`. Without `--dev` it only serves the stand-in, and you point
your own dev server at it with `ASSISTANT_LLM_MODEL=scripted-dev` and `ASSISTANT_LLM_BASE_URL=http://localhost:11500/v1`.

No key, no secret, nothing written to a tracked file. The values are set only in the child's environment (Next reads
the process environment before `.env.local`, so they win over anything in it). Stop it with Ctrl+C.

Then sign in (`CLAUDE.md`, *Getting a signed-in dev session*) and open the Assistant. For the write to save the login
needs the card that carries it: `node scripts/dev-signin.mjs --cards assistant,residents,view_residents,medical_records --port <yours>`
(`medical_records` carries `medical.weight` at edit; without it the card says "Your cards don't let you make this change").
Type, for two real resident names on dev: `Butter weighs 4.2 kg, bitten by Angsumalin`, press Confirm.

## What it is good for, and what it is NOT (the caveat, settled)

It is a few rules, not a model. It reads a sentence with a capital-letter rule, calls the app's own `lookup` for each
name, then calls `weight` with the first name as the resident and the rest as `mentions`. Anything else it answers in
words with no tool call.

- **Good for:** exercising a **save path** and a **failure notice** with real lookups, real validation and a real card;
  seeing that a `#tag` reaches a note, or that the notice appears when it does not. Anything about what happens **after**
  the model has decided.
- **NOT good for:** judging whether the assistant **understands** a sentence, how it copes with Thai, a vague
  request, a wrong name, or a small model's malformed tool calls. It will "understand" exactly one shape (a weight
  with a `kg`) and nothing else, so a brief must never cite a pass here as evidence about comprehension. For that you
  need a real model: Ollama, `docs/self-hosted-model-runbook.md`. Ollama is **not installed on this laptop** (measured
  2026-11-06: no `ollama` on the path, nothing listening on 11434), so that remains a step only Lutan can do.

## Absent case

Nothing in `src/` changed. With `ASSISTANT_LLM_MODEL` unset `createLlm()` still raises `not_configured` and the keyword
assistant carries on (`src/lib/assistant/llm.test.mjs`). Only the `--dev` command sets the variables, and only for the
server it starts.

Tests: `node --test scripts/dev-assistant-model.test.mjs`.

## Names on a fresh dev database (added 2026-11-08)

Dev holds only `Test 1` and `Test 2`. The stand-in reads a trailing number as part of a name, so
`Test 1 weighs 4.2 kg, bitten by Test 2` works: subject `Test 1`, an "Also tag" chip for `Test 2`. The full walk-through
that shows both failure notices is in `docs/decisions/2026-11-08-assistant-tag-notice-seen-no-retry.md`.
