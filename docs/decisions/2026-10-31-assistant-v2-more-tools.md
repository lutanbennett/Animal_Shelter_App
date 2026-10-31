# Assistant v2 stream 5: three more tools, and what lets a write skip the confirm

2026-10-31, `claude/assistant-v2-tools`. The sixth of the seven streams in
`docs/decisions/2026-10-30-assistant-v2-scoping.md`. Backlog item "Assistant v2 stream 5".

Step zero, before any code: `SPECS` in `src/lib/assistant/llm-tools.ts` held ten tools (`move`,
`clinic`, `hospital`, `weight`, `death`, `rehome`, `immunization`, `where`, `who`, `due`) and none of
the three this stream owes. `FieldSpec` was declared, not exported. The gap was real.

## Low risk is a property of the TOOL, declared beside its fields

The backlog item says *"low risk is a property of the tool beside its activity, never a role"*. The
planner left open whether that is a new flag or a reuse of `WRITE_INTENTS` in `types.ts`. **It is
both, and the split matters:**

- `WRITE_INTENTS` / `isWriteIntent` stays the single list of intents that write. It is what decides
  card-versus-inline-answer, and `prescription` joins it. `interpret.ts` used to carry a second copy
  of that knowledge as `READ_ONLY_KINDS = new Set(["where","who","due"])`; with three new intents
  that would have drifted on the first one someone forgot, so it now asks `isWriteIntent`.
- **Low risk is new, and it belongs in `SPECS`, not in `types.ts`** — `lowRisk: true` on the `weight`
  and `immunization` entries, read through `isLowRiskWrite(kind)`. "Beside its activity" is literal:
  the same object says what the tool does, what fields it takes, what card it needs and whether its
  write is low risk. Nothing anywhere reads a role to answer it.

**Why those two and nothing else.** A weight and a vaccination are each one fact about one animal on
one day. They are additive, they show on the record, and the correction for a wrong one is to record
the right one. Everything else either closes a record (`death`), moves an animal (`move`,
`hospital`, `rehome`, the returns), books something outside the shelter (`clinic`) or starts a course
of medicine (`prescription`). Those keep the card.

**Skipping is a courtesy, never a permission.** The skipped path calls `recordLowRisk` in
`AssistantCards.tsx` — the very function the card's own Confirm calls, so there is one write path per
intent and the two cannot drift. `runWrite` still checks `assistant.record`, each helper still runs
its own check, and RLS is untouched.

### A missing DATE is not a blank, and this is the decision most likely to be re-opened

`readyToRecord` first required an explicit date, and that was wrong in a way that only showed up in
the browser: the keyword parser leaves `date` null unless the sentence says one, and the model is
told to pass null for anything unsaid — so the skip almost never fired and the feature did nothing.

Every card already fills a blank date with today and Confirm writes that. So a draft with no date
writes **exactly the row the person would have confirmed**, and refusing to skip bought nothing. It
now defaults to today, **and both done messages gained the date** (`Done — Angsumalin (R-0055)
recorded at 13.1 kg on 31 Oct 2026.`) so the day is still checked — by reading rather than by
pressing. A genuine blank (no weight, no vaccine ticked) or an ambiguous name still gets the card.

## The prescription tool asks for a card of its own

`createPrescription` checks `medical.prescriptions`, which `assistant.record` does not imply. Under
Lutan's rule of 2026-10-27 the tool must therefore not be offered at all to a login without it.

- A `SPECS` entry may declare `needs: <activity>`. `interpretTools(canWrite, holds)` filters on it,
  and **`holds` defaults to "no"**, so a caller that forgets to answer offers the tool to nobody
  rather than to everyone. The server action answers it from the caller's own cards.
- The browser needs the same answer, so `loadAssistantContext` returns `toolCards`: for every
  activity any tool declares, whether this login holds it. `mayUseTool` in `AssistantConversation`
  reads it, an absent key reads as no, and a write whose tool is withheld ends on a plain refusal
  (`noCard`) with an audit row, never on a card.
- **This path is currently unreachable in practice, and that is worth saying rather than hiding.**
  The model is never given the tool, and there is no keyword parser for a prescription, so nothing
  can produce a prescription draft for a login that lacks the card. It is defence in depth, covered
  by a unit test rather than by a browser step.

### One write, not two: `recordPrescription`

`createPrescription` ends in `redirect()`, which throws, so the assistant could not call it. Rather
than copy the insert, the write is now `recordPrescription(formData)` — everything including the
card check, returning a result — and `createPrescription` is that plus the redirect the form page
wants. The assistant hands it the same `FormData` the form would send, which is the pattern
`assistantRecordImmunization` already used for `recordImmunizations`.

**What the sentence gives and what the card keeps.** The draft carries the resident, the medicine,
the amount, the start and end dates, `timesPerDay` and notes. **Which DAYS the dose falls on (0283)
stays the card's own picker**, reusing `ScheduleDays` and `parseScheduleForm` from the real form, so
this card and `/prescriptions/new` can never disagree about what a pattern means. "Every other
Tuesday" is not something a sentence says reliably; "twice a day" is, so `timesPerDay` (1–4) pre-ticks
that many rounds in the order the form shows them.

## No new card

`medical.prescriptions`, `medical.weight`, `medical.visits`, `medical.immunizations` and
`facility.enclosures` all already exist in `catalogue.ts`. Nothing was added, and `catalogue.ts` and
the dev database are untouched.

## The two new questions

**"Which enclosure has space?"** is answered from `loadEnclosureOptions` and `spacesFree` — the
enclosure list's own capacity arithmetic, so the two can never disagree. Roomiest first, **capped at
eight** (the dev shelter has 47 with room, and a list that long is not an answer) with "39 more have
room". An enclosure with no capacity recorded is **counted and said out loud**, not quietly dropped:
a silent omission reads as "full".

**"Tell me about Panda"** gathers where they are, then each medical part, and **each part is read
only when this login holds the activity the resident hub's own tab asks for** (`SECTION_READS`). A
part it may not read is not queried and not mentioned — the same information, under the same cards,
as clicking through the hub. The identity-and-where part follows the existing `where` lookup and is
gated on `assistant.ask` alone, as the 2026-09-25 decision set for all the read-only questions.

**No keyword parser for a prescription, deliberately.** The two questions got parsers (they are cheap
and the fallback path matters), but a medicine, an amount and a frequency in one sentence is the
model's job: a wrong guess at a dose reads as a plausible one, which is the same reasoning the weight
parser already uses for pounds. With no model, that sentence is unmatched.

The free-space parser **declines any sentence naming a resident**, which keeps it off "where can I
put Panda" — that is a move. The cost is that "is there room for Panda" is also read as a move, which
is the safer of the two readings: it ends on a card, not an answer.

## `FieldSpec` is exported, and ids now say where they come from (#1122)

#1122 reported that field kinds were inferred from the JSON schema and ids spotted by the `…Id` /
`…Ids` naming convention. The report named `AssistantDetails.tsx`; **the actual site is
`askableField` in `src/lib/assistant/interpret.ts`**, which probed `p.pattern` against
`"2026-01-31"` to decide "date". `AssistantDetails.tsx` only renders the `AskField` it is handed.

`FieldSpec` and `fieldSpecs(kind)` are now exported and `askableField` reads the table. The same
change fixes a second, quieter instance: `validateToolInput` held a hand-written list of id fields
and the rows each came from. An `id` field now declares `of: <lookup kind>`, so the check is derived
from the table — **which is what catches `medicationId`**, an id field that is not named like the
others and would have gone unvalidated on the old list. `LOOKUP_KINDS` moved to `llm-tools.ts` so the
two agree by construction, and gained `zone` and `medication`.

## What was driven, and how

Dev, port 3001, signed in with `scripts/dev-signin.mjs`, every page reached by clicking through.

Verified as Admin: the free-space question (47 with room, capped at 8, "39 more", "1 more has no
capacity recorded"); the resident summary (where, status, photo, last weight, five open medicines,
last clinic visit, four vaccinations); and the weight skipping the confirm — "Angsumalin weighs 13.1
kg" wrote the row with no card and replied `Done — Angsumalin (R-0055) recorded at 13.1 kg on 31 Oct
2026`, confirmed by asking for the summary again and reading `Last weighed 13.1 kg on 31 Oct 2026`.

**The prescription card needed a model, and dev has none configured.** Rather than leave the
stream's riskiest write unpressed, a scripted OpenAI-compatible server was run from the session
scratchpad (never in the repo) behind `ASSISTANT_LLM_PROVIDER=openai-compatible`, returning a
`lookup` then a `prescription` tool call built from the ids the app sent back. The card drew with the
resident, medicine, dose, start date, day pattern and Morning + Lunch ticked from `timesPerDay: 2`;
Confirm replied `Done — Panda (R-0002) is now prescribed AMC 500`, and the summary then read
`AMC 500 — from 31 Oct 2026, open`. `.env.local` was restored and the stub stopped.

**Not driven:** the `noCard` refusal (unreachable, above), and the Thai wording of the new strings.

## A card fault this stream hit but did not cause

**No card grants `assistant.record`** — card review 2 dropped it from the `assistant` card as
something that "can do nothing alone". So no non-Admin login can confirm any assistant write today,
these three included, and the browser drive had to be done as Admin. It is already recorded on the
backlog (the buttons-follow-cards item) and is not this stream's to fix.
