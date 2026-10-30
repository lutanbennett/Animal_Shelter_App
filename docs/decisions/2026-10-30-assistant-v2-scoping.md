# Assistant version 2: sized into seven finishable streams

2026-10-30. Backlog item "In-app chat assistant that does things (LLM version 2)". A plan, not a build: no code,
no migration. Nothing in it re-opens what the item settled (provider-neutral `llm.ts`, fixed toolset over existing
server operations, self-hosting as the direction with the Pi as stretch goal, low-risk writes may skip the confirm,
no accuracy number until the eval set exists, retention shipped 2026-10-19).

## Step zero: it is not already built

`src/lib/assistant/` has no `llm.ts`; `package.json` has no `@anthropic-ai/sdk` or any LLM client; no decision file
or commit adds one. Version 1 (keyword parsers) and the could-not-help log (#1106) are what exist.

## What version 2 reuses (this decides the size)

| Exists | Where | What version 2 does with it |
|---|---|---|
| `Draft` / `Intent` / `ParseResult` types, one shape per write | `lib/assistant/types.ts` | **They are the tool schemas.** The file says version 2 "replaces the parsers and keeps everything in this file". Each tool call maps to a `Draft`. |
| Preview cards with Confirm / Change / Cancel, candidate pickers, blanks for unknowns | `components/assistant/AssistantCards.tsx` (1,322 lines) | Kept as the confirmation UI. This is the two-step confirm the item describes; it is built. |
| Nine write server actions, each calling the app's own helper under the caller's session, stamping notes "via the assistant" | `app/assistant/actions.ts` → `placements/*`, `weight/record`, `immunizations/new/actions`, clinic RPC | Kept as the executors. RLS and `can()` apply unchanged. Move, hospital, return, weight, death, foster/adopt, return-from-carer, immunization, clinic booking are **all already wired**. |
| Read lookups: where / who / due | `app/assistant/lookups.ts`, `assistantLookup` | Become the read-only tools. |
| `assistant_actions` (0070, 0130 `refused`) and `logAssistantAction` | `lib/assistant/audit.ts` | **The item's "new `assistant_actions` table" is already there.** It needs columns for model and exchange, not a table. |
| Could-not-help log, `/admin/assistant`, CSV with empty `correct_intent` / `correct_answer` | #1106 | The eval set's collection mechanism and labelling format. Filling the two columns is the labelling job. |
| Retention | `0227`, `check-assistant-retention.mjs` | Unchanged. |
| Permission cards `assistant.ask`, `assistant.record` | `permissions/catalogue.ts` | Gate reading and writing. **The item's "admin/management/staff only, volunteers read-only" is superseded: it is these two cards, never a role.** |

**Not built, and what the work really is:** the adapter, the model call on the server, the tool-to-`Draft` mapping,
multi-turn state, `request_details`, a find-enclosure and a resident-summary tool, add-prescription
(`app/prescriptions/actions.ts` `createPrescription` exists but is not wired to the assistant), the eval replay.

**Which band applies:** *a new integration on existing machinery* (145–180k) for every stream. The one thing that
looks like building an instrument from nothing, the eval set, is not: #1106 shipped collection and export, so what
is left is a replay script over it. **The biggest structural saving:** version 1 parses in the browser and the
server only executes, so the LLM can be introduced as "a better `parseRequest`" that returns the same `Draft`,
and every card and action stays untouched in the first cut.

## Model assumption (an assumption, not a decision)

Build and measure against a current Claude model through the adapter, id held in one env var so it is a config
change. The item names `claude-opus-5`; the ids now current are in the Claude 5 family, so stream 2 confirms the id
against the SDK docs rather than copying the item's. **Model choice at swap time is Lutan's, and the bar comes from
the eval set.**

## The streams, in dependency order

Estimates are **my guesses**: no LLM stream has been measured in this repo, so each leans on the band for its
shape. Where I am least sure is marked.

| # | Slug | Owns | Done looks like | Migration | Estimate |
|---|---|---|---|---|---|
| 1 | `assistant-v2-schema` | one migration | `assistant_actions` gains `model text`, `exchange jsonb` (messages + tool calls), both nullable so version 1 rows stay valid; no enum change (an add-value needs two files). `audit.ts` writes them. | **Yes**, schema PR alone, first | 60–90k. Guess: smaller than any band, but a schema PR still carries a full test plan. |
| 2 | `assistant-llm-adapter` | `lib/assistant/llm.ts`, `llm-claude.ts`, tool definitions, `package.json` | One interface taking messages and tools, returning text or tool calls; Claude implementation; env-selected; mocked-transport tests; a check that **nothing outside the adapter imports a vendor SDK**. Tool definitions derive from `Draft` types. Runs on the Cloudflare Worker (the SDK uses `fetch`; confirm). | No | 145–180k. Guess; the unknown is Worker compatibility. |
| 3 | `assistant-v2-interpret` | `app/api/assistant/…` route, client swap in `AssistantConversation.tsx`, `data.ts` trimming | The server turns one sentence into a `Draft` + candidates via the adapter and the **existing cards confirm it**. Resident and enclosure lookup are tools (find returns candidates), so the whole resident list is not sent. Keyword parser stays as the fallback when the model errors. Rows record model and exchange. | No | 180–230k. **The largest and least certain**: card, lookup and audit all change in one move and cannot split without leaving the panel half on each parser. |
| 4 | `assistant-v2-conversation` | `AssistantConversation.tsx`, a `request_details` modal, conversation state | Multi-turn: the model asks for a missing field through a modal built from the tool's field spec; the answer returns as the tool result. Ambiguity ("which Panda?") is asked, not guessed. No memory across conversations. | No | 145–180k. |
| 5 | `assistant-v2-more-tools` | `lib/assistant/tools/`, `actions.ts` | Add-prescription, find-enclosure, resident summary tools; **low-risk writes (weight, immunization) skip the confirm**, with "low risk" a property of the tool declared next to its activity, never of a role. | No, unless a card is needed | 145–180k. Guess. |
| 6 | `assistant-eval-replay` | `scripts/` replay script and its check | Reads the #1106 CSV once `correct_intent` is filled, replays each sentence through the adapter, scores intent and resident agreement, prints a number. **No threshold is set**; the number is the output. | No | 145–180k. Needs real labelled rows and an API key to run live, so it can be built against fixtures first. |
| 7 | `assistant-openai-compatible` | `llm-openai.ts`, runbook | OpenAI-compatible implementation (Ollama, llama.cpp, vLLM, a hosted open-weight endpoint) behind the same env switch; eval replay run against one candidate; the runbook for standing one up. Standing the host up is a guided session with Lutan, not a stream. | No | 145–180k for the code. The hosting part is not sized. |

**Order and why stream 1 first:** the schema lands alone and harmless (CLAUDE.md, "Database migrations"), and
streams 3 to 6 write to it. Stream 2 has no dependency on it and can run alongside. Streams 3 → 4 → 5 are strictly
sequential (same component and file set). Stream 6 needs 2 and some labelled rows, not 3. Stream 7 needs 2 and 6.

**One stream that must stay one:** stream 3. Splitting "route" from "client swap" would leave either an unused
route or a panel calling a route that does not exist.

**Cards:** none of the seven should add a permission card, since `assistant.ask` / `assistant.record` already gate it.
If stream 5 finds it needs one, `catalogue.ts` and the dev-database card row land together in that one stream, as in
#1100, or the lint goes red.

## Genuinely open questions

1. **Who creates the Claude API key, and under what spend cap?** Blocks live verification in stream 3, not
   streams 1, 2 or the code of 3 (mocked). This is a job only Lutan can do, and the item settles using Claude first; it
   is flagged because a metered key is the one paid thing in the plan (`zero-ongoing-cost`).
2. **Do carer names and contact details go to the hosted model?** Resident data is animals; carers are people.
   Stream 3 can ship sending resident and enclosure names only (carer matching stays on the keyword path) and answer
   this later. Does not block stream 1 or 2.
3. **Does the Pi get measured at all?** The item says treat it as a stretch goal. Stream 7 can ignore it. Not blocking.

Nothing needs Lutan before stream 1. **Not open, and not to be asked:** retention, the accuracy number, whether
low-risk writes skip the confirm.

## Out of scope (the item's "Later")

Voice input, weekly summaries, drafting the Facebook post. Not planned here.
