# The assistant's waits, and which brain answered

2026-10-31, `claude/assistant-model-waits`. Backlog item *THE ASSISTANT'S WAITS, AND WHICH BRAIN
ANSWERED*, all three parts. The measurements this builds on were made by
`claude/assistant-local-model-reachable` and are not re-measured here:
`docs/decisions/2026-10-30-assistant-local-model-reachable.md`.

Nothing here changes what the assistant can do or who may ask it. The keyword reader still answers
every sentence the model does not, so all three parts are about **cost and legibility**, not about
capability.

## 1. A sleeping model machine costs one wait, not one per sentence

With the model machine asleep the adapter reports `unavailable` after **10.7 s** — Node's own connect
timeout to an address nothing answers at. With nothing listening at all it is **0.2 s**. The browser's
only memory of the model was `modelOff`, latched on `not_configured` and on nothing else, so a
sleeping machine made **every sentence** pay the 10.7 s again before the keyword reader took over.

A conversation now remembers three states instead of one (`src/lib/assistant/model-wait.ts`):

| state | means | what the next sentence does |
|---|---|---|
| `ask` | nothing known against the model | asks it |
| `none` | no model in this build, or this login may not ask one (`not_configured`) | never asks again in this conversation — unchanged behaviour |
| `asleep` | something is configured but did not answer at its address (`unavailable`) | **skips the model until the window is up, then asks once more** |

**Only `unavailable` latches the new state.** A timeout, a refusal, a malformed answer or a sentence
the model made nothing of all say the model *is* there, and the next sentence may be the one it
handles; latching on those would turn one slow answer into minutes of not asking.

To make that decidable in the browser at all, `interpretSentence`'s failure result now carries
`errorKind` — the `LlmErrorKind` behind a `reason` of `"error"`. The kind was already in the audit
trace, but `AssistantTrace.exchange` is typed `unknown` on purpose, and reading a model's health out
of an opaque blob with a cast is the kind of thing that breaks silently when the blob changes shape.

## 2. How long to remember it: three minutes, and why that number

The item said "a few minutes", which is a direction. **Three minutes** (`MODEL_ASLEEP_MS`), because
the two costs are not symmetrical and both are small:

- **Too short costs another 10.7-second wait.** Someone recording a round of weights on a phone types
  a sentence every twenty to sixty seconds. Three minutes covers a burst of three to six sentences,
  so that burst pays the wait once rather than five times. That is the whole point of the change, and
  a one-minute window would give most of it back.
- **Too long costs a model that is awake and not being asked.** At three minutes, someone who has
  just woken the model machine gets the model back **without doing anything**, and almost certainly
  without noticing — three minutes is shorter than the walk back to the desk.
- **Anything much longer would need a "try now" control**, and that is a button on a screen, a string
  in two dictionaries and a thing to explain in the manual, bought to solve a problem that three
  minutes does not have.

**Is anything a faster retry?** Yes, and it is the reason no control was added: the memory lives in
the open conversation, so **reloading `/assistant`, or closing and reopening the slide-over, asks the
model again at once.** That is a real escape hatch for the one person who would ever want it (Lutan,
testing his own machine), and it needs nothing built.

**Is a `useRef` in a component the right place, or only the cheapest?** It is both, and the test is
what a wrong answer costs. The value is a guess about the next few seconds; it must not outlive the
tab; and when it is wrong the cost is one 10.7-second wait. Somewhere shared — a module-level
variable, `sessionStorage`, a cookie, the server — would have to be invalidated when the machine
wakes, and **nothing in the app can observe that**; the only way to find out is to ask the model,
which is exactly what the window already does. A shared store would also make one person's sleeping
machine shorten everyone else's assistant, which is wrong on a shelter phone shared between people.
So: deliberately per-conversation, not an accident of where it was easy to put.

## 3. The step cap and the configured timeout now agree, within a budget that is written down

Before: `MODEL_TIMEOUT_MS = 25_000`, a flat number, and `ASSISTANT_LLM_TIMEOUT_MS` reached only the
adapter. The two never met: `interpret`'s `withTimeout` wrapped the call at 25 s whatever the env var
said, and **nothing in the tree passed `input.timeoutMs`** — the parameter existed and had no caller.

**The ceiling is real and it is not the env var.** Cloudflare kills a proxied request at 100 s. One
request can make up to `MAX_ROUNDS` model calls, so the per-step cap and the number of steps are **one
decision**, and "make the cap follow the configured timeout" taken literally is the wrong answer: four
steps of a configured 180 s is 720 s, the request would be killed at 100 s, and the browser's `.catch`
would be the only thing standing between the person and nothing at all.

So the cap is now derived rather than chosen:

```
REQUEST_BUDGET_MS   100_000   Cloudflare's limit on a proxied request
REQUEST_RESERVE_MS   20_000   everything in the request that is not the model:
                              auth, the row load, the audit write, two network legs
MODEL_TIMEOUT_MS     20_000   (budget - reserve) / MAX_ROUNDS, with MAX_ROUNDS = 4
```

Two things follow that the flat 25 s did not give:

- **The worst case fits with room.** 4 x 25 s was *exactly* the platform limit, with nothing left for
  the request's own work — which is to say it did not fit. 4 x 20 s is 80 s, inside 100 s with 20 s
  for the rest.
- **MAX_ROUNDS and the cap can no longer drift apart.** Change either and the arithmetic follows; a
  test asserts the product stays inside the budget, so a later stream that wants five rounds gets a
  shorter step rather than a request Cloudflare kills.

And `ASSISTANT_LLM_TIMEOUT_MS` now reaches `interpret` for the first time, through `stepTimeoutMs()`
at the call site that had the unused parameter: **a configured value can SHORTEN a step; it cannot
lengthen one past the budget.** That is the honest form of "the two agree" — they agree downward, and
the reason they cannot agree upward is the platform limit, written here and in the code.

**What this makes slightly worse, said out loud:** on the i7 laptop (no graphics card, ~1,700-token
prompt) a step often takes longer than 25 s already, so the app mostly answers the keyword way there;
20 s makes that marginally more likely. That is the right trade — the alternative is a request killed
by Cloudflare — and the runbook already tells Lutan the laptop is the build-and-measure box, not the
host. The eval replay is unaffected: it goes through the adapter directly and never calls
`interpretSentence`, so it still gets the adapter's own 180 s.

**Found and not changed:** the adapter's own timeout (`ASSISTANT_LLM_TIMEOUT_MS`, default 180 s) is
now always longer than the step cap, so when a step times out the `fetch` is abandoned rather than
aborted and keeps running on the Pi until the adapter gives up. It costs a dangling connection on a
machine on Lutan's own network, nothing is read from it, and wiring the step cap down into
`createLlm()` would couple the env plumbing to `interpret`'s budget. Left as it is, recorded here.

## 4. `/admin/assistant` says which brain answered

`assistant_actions.model` has been there since `0289` (the model id that produced the interpretation;
null = the version 1 keyword reader) and nothing displayed it. Without it the log cannot be *read*: a
sentence the keyword reader could never have placed is not the same finding as one a model got wrong,
and an eval score over a mixture of the two measures nothing.

**What makes it readable at a glance is the count, not the column.** A column of model id strings is
not scannable, so the split is answered above the table — *"412 shown. 22 of them a model read, 390
the keyword reader."* — and the row says only **A model** or **Keyword reader**, with the model id in
small muted text under the word on the rows that have one. The CSV export gains two columns,
`answered_by` and `model`, between `assistant_did` and `intent_guessed`; the replay reads columns by
heading name, so inserting them breaks nothing, and the two columns a reviewer fills in stay last.

## What was not done

- **The seventh assistant v2 stream** and anything else in
  `docs/decisions/2026-10-30-assistant-v2-scoping.md`: read for context, not built.
- **The assistant card fault** — no card grants `assistant.record`, since
  `0268_card_review_2_cards.sql:144` deleted the grant `0257_card_grants.sql:339` made. Met as
  briefed, left alone: it is its own Security item with an open question for Lutan, so it is not
  recorded again in `docs/card-access-faults.md`. The browser checks below were driven as `admin`.
- **The manual.** The assistant's manual topic is its own Documentation item;
  `src/lib/manual/` is untouched.
