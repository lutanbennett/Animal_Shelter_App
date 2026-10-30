# Assistant v2 stream 3: the model turns a sentence into a Draft; the cards still confirm it

2026-10-30. Step three of `2026-10-30-assistant-v2-scoping.md`. No migration (`0289` is already on `main`).

## What was built

- `src/lib/assistant/interpret.ts` (pure, tested with a scripted adapter): the tool loop. The model gets a `lookup` tool plus the
  `draftTools()` action tools. `draftFromToolCall()` turns the call back into a `Draft`.
- `src/app/assistant/interpret.ts`: the server action `interpretRequest`. Runs under the caller's session and `assistant.ask`,
  loads the rows itself, never throws, writes nothing.
- `AssistantConversation.tsx`: the sentence goes to `interpretRequest` first; any failure falls back to `parseRequest` in the
  browser, which is unchanged. The cards, and the nine write actions, are untouched except that each carries an optional `trace`.
- `audit.ts` now really writes `model` and `exchange` (deliverable 4, below).

## Lookup as tools, so the list is never sent

One tool, `lookup { kind: resident|enclosure|clinic|carer|vaccine, query }`, answered from the rows the server already loads for the
page (`loadAssistantContext`), up to 5 matches, name / Thai name / code. The model's first message contains only the sentence.
`lookups.ts` was read and **not reused**: it answers where / who / due for the *person* after a Draft exists; a find-by-name needs the
context rows, not a database round trip per call. Those three questions stay what they are: the model drafts `where` / `who` / `due`
and the existing `assistantLookup` answers.

## Designed for a small model, not for Claude (Lutan, 2026-10-30)

- Every tool input is checked against its own schema before it is acted on: no field the schema does not have, each field the right
  type and format (`YYYY-MM-DD`, `HH:MM`), every id one that exists in the caller's rows. A bad call goes back to the model once as a
  plain-English `tool_result` with `isError`; the second bad call ends the turn. Rounds are capped at 4 per sentence.
- A field the model leaves out is **not** an error: it reads as null and the card shows a blank, as it does for the keyword parser.
- A person who may only ask (no `assistant.record`) is offered only `lookup`, `where`, `who`, `due`, so a write cannot be drafted for them.
- The keyword parser is the fallback for every failure below, not a safety net nobody uses.

## Deliverable 6: what `exchange` records

```
{ v: 1, prompt: "v1", outcome, errorKind?, rounds, usage: {inputTokens, outputTokens}, messages: LlmMessage[] }
```
`outcome` is one of `draft | no_draft | refused | malformed | timeout | error`. `messages` is the conversation after the system
prompt: the typed sentence, the model's text and tool calls, and the tool results. `model` (its own column) is the id the provider reports.

- **Messages and tool calls: both.** Without the calls you cannot tell *what the model understood* from *what the person later
  changed on the card*, which is the thing the eval set (`claude/assistant-eval-replay`) needs.
- **System prompt: not stored, only a label** (`prompt: "v1"`). The text is in `interpret.ts` in git; copying it into every row
  would add kilobytes per turn for nothing a label does not give.
- **Redaction: none, on purpose.** `request_text` already stores the sentence verbatim in the same row, under the same policy
  (own row for the writer, Admin-only to read), so the exchange holds nothing a person typed that is not there already. Redacting
  one copy and not the other protects nobody and makes the exchange useless for replay. Tool results are shelter data (resident
  name, code, enclosure), not anything typed. If `request_text` is ever scrubbed, scrub `exchange` in the same change.
- **Bounded:** any one text part is cut at 2,000 characters; a sentence over 500 is not sent to the model at all.
- **Carried by the browser.** The trace goes server -> browser -> Confirm/Cancel, as `request` and `draft` already do. It is exactly
  as trustworthy as they are, which for a row on the caller's own session is enough. Making it tamper-proof would need server-side
  storage of the turn, which nothing else here has.

## Deliverable 7: slow, error, refusal

The person never sees a model error. Every case below falls back to the keyword parser: if it places the sentence, the person gets
its card (or lookup answer) as today; if not, the existing "I can't help with that" and an `unmatched` row.

| Case | Person sees | Audit row |
|---|---|---|
| No model configured (`not_configured`) | exactly version 1; the browser stops asking after the first answer | model null, exchange null |
| Slow (> 25 s) | the "looking" bubble for up to 25 s, then version 1 | `outcome: timeout` |
| Provider error (auth, rate limit, outage) | version 1 | `outcome: error`, `errorKind` |
| Model refuses (`stop: refused`) | version 1 | `outcome: refused` |
| Words only, or no usable tool call | version 1 | `outcome: no_draft` |
| Malformed twice / ran out of rounds | version 1 | `outcome: malformed` |
| A draft | the card, as for the parser | model + `outcome: draft` |

A row exists only where there was already one (a confirmed write, a cancelled card, an unmatched sentence, a refused volunteer write).
When a model was asked and the parser then answered, that row still carries the model and the failed exchange: that is how the
failures get counted. The audit log still has no veto: `logAssistantAction` is unchanged in that respect.
The 25-second ceiling is a constant (`MODEL_TIMEOUT_MS`); a small model on slow hardware may need it raised, and that is a config decision for
the stream that adds the self-hosted adapter.

## Deliverable 4: the writer that was reported done and was not

`#1113` said "`audit.ts` writes both - done" and line 12 of `2026-10-30-assistant-v2-schema.md` said the same; neither was true
(`audit.ts` last changed in version 1). It does now: `AssistantActionLog` has optional `model` / `exchange`, the insert sends both,
null by default so every version 1 caller is unchanged. Line 12 of that decision file is corrected in this PR. Because `audit.ts`
sends both keys, **the code needs `0289` applied first** in each environment (already on dev); the schema decision file says the same.

## Proven by mocks, and what is waiting on a live model

Proven here: the loop, lookups, schema validation, retry and give-up, timeout, error and refusal handling, the exchange shape, and
the browser fallback with no model configured (the real state on dev: there is no key). **Not established:** any real model's
behaviour. No live call has been made; whether a 7-8B model calls `lookup` sensibly, and whether 25 s and 4 rounds suit it, is for the
stream that adds the self-hosted adapter. No accuracy number is claimed.

## Found, not fixed

- No per-person or per-day ceiling on model calls (the adapter's header says it belongs in the route). With no key configured it costs
  nothing; it must exist before a metered key is, and a self-hosted model costs only time. Left for the release that turns a model on.
- `loadAssistantContext` runs once per model turn (a few queries). Fine at shelter volume; cache if it shows up.
- Recording the model's *answer in words* when it declines to call a tool is in `exchange.messages`, but the person never sees it.
  Showing it would be new copy and a translation job; not done.
