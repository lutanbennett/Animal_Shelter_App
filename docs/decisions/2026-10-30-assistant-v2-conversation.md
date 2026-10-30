# Assistant v2 stream 4: multi-turn conversation and the `request_details` dialog

2026-10-30 · branch `claude/assistant-v2-conversation` · plan of record
`docs/decisions/2026-10-30-assistant-v2-scoping.md` · builds on stream 3
(`2026-10-30-assistant-v2-interpret.md`)

## What it does

- **A conversation, held in the page only.** `AssistantConversation.tsx` keeps its two `useState`
  hooks. `Turn` gains `history` (the earlier sentences it was sent with), `answers` (what the person
  told the model) and an `asking` state. Each new sentence is sent with the outcomes of the last
  three before it. Nothing is kept on the server between calls, so a new page (or closing the
  slide-over, which unmounts it, as it always has) is a new conversation. **No memory across
  conversations**, as the item says.
- **`request_details`.** A fourteenth tool. The model names an action and fields of that action;
  the server checks the request (below) and returns the question with each field described by
  `askableField()`, which reads the **action tool's own JSON schema** from `draftTools()`:
  an enum becomes a choice, a date pattern a date picker, a time pattern a time, a number a number,
  a plain string a text box. There is no form per intent. The browser shows `AssistantDetails.tsx`;
  the person's answer goes back with the paused exchange and **is appended as the tool result**, and
  the loop carries on. Skip sends no values (the card shows those fields blank); Escape or clicking
  outside closes the dialog and leaves the question waiting with an Answer button; Cancel records
  the turn as cancelled, as Cancel on a card does.
- **"Which Panda?" is asked, not guessed.** The existing card picker was already the right surface
  (`ResidentCandidates` in `AssistantCards.tsx`), but the model path handed it
  `residentCandidates: []`, so it never appeared. `interpretSentence` now returns candidates from the
  model's own resident lookups. And because a small model told to pass null will sometimes pick the
  first match instead, `settleResident()` **checks the pick**: an id chosen out of a lookup that found
  several stands only if it is the exact name, Thai name or code that lookup asked for. Otherwise it is
  cleared and the matches go to the picker. The dialog can never ask for an id.

## Hardening against a small model drifting (deliverable 4)

Every rule is enforced in code, not in the prompt, and each refusal goes back to the model as a
tool error that counts as malformed. The second malformed call in a sentence ends it on the keyword
parser, exactly as stream 3 did.

| Drift | What happens |
|---|---|
| Re-asks a field already answered or skipped | Dropped from the question. If nothing new is left, refused with "Already answered: …; call the action now". |
| Drops or rewrites an answer when it finally calls the action | The person's answer is put back into the call before it is validated. The person outranks the model's memory. |
| Asks for a field the action does not have, an id, or an action it was not given | Refused, with the field list or "ids come from lookup". A read-only person's question tool only names `where`, `who`, `due`. |
| Asks and acts in the same reply | Action calls are taken first: it has answered its own question, and the card has blanks for the rest. |
| Never converges | At most `MAX_ASKS` = 2 questions per sentence ("No more questions" after that), at most `MAX_ROUNDS` = 4 calls per leg and `MAX_ROUNDS_PER_SENTENCE` = 6 across all legs. |
| Picks one resident out of several | `settleResident()`, above. |
| Acts on an earlier sentence again | The prompt says not to; the earlier sentences are labelled "do not act on these again". **Not enforceable in code**: a repeat would still reach a confirm card, which is the backstop. |

**The paused exchange is held by the browser**, so it is treated as coming from anywhere
(`resumeConversation()`): shape-checked, capped at 40,000 characters, it must start with this exact
sentence and end on a question still waiting for its answer, the question is re-derived and re-checked
rather than trusted, the answer is fitted to the asked fields only (`coerceAnswer`), and every counter
(rounds, questions, malformed calls, answers) is **recounted from the messages**, so editing a number
buys nothing. Any failure is `malformed`, with no model call made. The worst a tampered resume can do
is make the model see different words, and its output still goes through `validateToolInput` and a
confirm card.

**A guess, written as one:** that these are the drifts a small model will show. Nobody has run a local
model against this repo yet, so there is no evidence about multi-turn behaviour. The rules cover the
failure shapes named in the brief; the first real model may show others.

## Does it fit the budget? (deliverable 5)

**Measured on 2026-10-30**, on the wire, with a scripted stand-in model speaking the OpenAI format on
localhost (the dev server pointed at it through `ASSISTANT_LLM_*`), across eleven model calls covering
a lookup, a question, the answer, a history-resolved "send her to hospital", Skip and Cancel:

| Part of each call | Characters | Changes between calls? |
|---|---|---|
| Tool block (14 tools: lookup, 12 actions, `request_details`) | 7,765 | no |
| System prompt | 1,339 | once a day (it names today's date) |
| Conversation (history preface, the sentence, tool calls and results) | 41 to 835 | yes |

At roughly 3.5–4 characters per token (an estimate, not a tokenizer count), the fixed part is about
2,300–2,600 tokens and the part that grows was at most about 200–240 tokens in the run. The stream 3
figure for the 12 action tools alone was 6,605 characters; `lookup` and `request_details` add the rest.

**Decision: cap, do not summarise.** History is capped at three earlier sentences of at most 300
characters each, oldest dropped, so it can never add more than about 1,000 characters. Summarising
would need another model call, which on a CPU-bound box costs more than it saves. Within a sentence
the exchange is capped by the round limits above.

**Why the history goes in the user message, not the system prompt:** the system prompt and the tool
block then stay byte-identical from call to call, which is the part a local server can keep already
read between calls. **A guess, not verified on Lutan's hardware:** that the server will reuse it
(llama.cpp's server can cache a repeated prompt prefix; whether the chosen server does, and with what
setting, is for `claude/assistant-local-model-reachable` to establish). If it does, the cost of a
call grows with the conversation part only, which stays small; if it does not, every call reads about
2,500 tokens however short the conversation is, and this design cannot change that.

## What `exchange` records for a multi-turn request (deliverable 6)

**One row per sentence**, whatever questions it took: the row is written where it always was (on
Confirm, Cancel, refusal or no match), and its `exchange` holds every leg, the questions and the
person's answers. `AssistantExchange` is now `v: 2`, adding `asks` (questions put) and `history` (how
many earlier sentences the model was shown). Why:

- **One row per sentence** matches what a row has always meant (one request, one outcome) and what
  the could-not-help log and the eval replay read. One row per model call would split a request
  across rows with no outcome on most of them.
- **The earlier sentences are counted, not copied.** Each already has its own row. Copying them into
  every later row would put the same words (people type names and worries in this box) in several
  places, so a row deleted under the retention rules would survive inside its neighbours. The
  sentence stored in `messages[0]` is the sentence alone; the preface the model saw is rebuilt from
  `prompt` and the earlier rows if it is ever needed.
- **Size is bounded:** every text and tool result is clipped at 2,000 characters as in stream 3, and
  a sentence has at most six model calls and two answers, each answer at most 200 characters a field.

Nothing reads `exchange` back in the app today (checked with `grep`), so the version change breaks
nothing. A v1 row and a v2 row differ only in the two added counts.

## Files outside the brief's list, declared

- `src/lib/assistant/interpret.ts` and its test: the loop lives there. Neither yours nor forbidden in
  the brief; it had to change for any of this to work.
- `src/lib/i18n/dictionaries/en.ts` and `th.ts`: the dialog's words (`assistant.details`).
- **Not touched:** `llm.ts`, `llm-claude.ts`, `llm-openai.ts`, `scripts/`, the runbook. **The adapter
  needed no change:** `LlmMessage` already carries tool calls and results in both directions, which is
  all multi-turn needs.
- **`llm-tools.ts` not touched. A finding for whoever owns it next:** it does not export its
  `FieldSpec` table, so the dialog reads field kinds off the generated JSON schema and recognises an
  id by the `…Id`/`…Ids` naming every Draft uses (as `validateToolInput` already does). An exported
  `fieldSpecs(kind)` would be cleaner, and the dialog would then show `about` text as a hint.

## Found, not fixed

- A **question** ("where is Panda?") with several matches still answers "which resident?" in words,
  because the lookups answer outside the cards and the picker lives inside them. It asks rather than
  guesses, so the rule holds; moving the picker to a shared component would let the answer show it.
- **Buttons follow cards:** the dialog's Send, Skip and Cancel write nothing; they call
  `interpretRequest`, which checks `assistant.ask` itself, and the write tools are only offered when
  `assistant.record` is held. The card's Confirm is unchanged.
- Observed on dev on 2026-10-30, as transient context only: a login holding only the `assistant`
  card had `canWrite` false, so on dev at that moment that card did not carry `assistant.record`
  (`0257_card_grants.sql` grants it). The shared dev data may be mid-rebuild; not investigated.
