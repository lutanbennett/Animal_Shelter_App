# The manual's assistant topic, rebuilt from `SPECS` — and why no Thai was drafted

2026-10-31, `claude/assistant-manual-topic`. Backlog item *"The user manual's assistant topic owes the
sentences the assistant has learned to understand since it was written…"*, under `## Documentation`.
Prose only: no code, no migration, nothing under `src/lib/assistant/`, `worker/`, or any card,
catalogue or permission file.

## Step zero: the gap was real, and bigger than the item's five

`SPECS` in `src/lib/assistant/llm-tools.ts` holds **fifteen** tools. The topic named twelve of them.

| Missing from the topic | Kind |
|---|---|
| `prescription` — "put Panda on AMC 500 twice a day" | write |
| `find-enclosure` — "which enclosure has space?" | question |
| `summary` — "tell me about Panda" | question |

And two shapes it named but described **wrongly**, because their behaviour changed under it: `weight`
and `immunization` are now `lowRisk: true`, so a complete sentence is written on Send with no card.
The topic's intro still said *"writes nothing until you press Confirm"* of everything, and the
immunizations topic's own cross-reference (line 763) told the reader to *"check the card it fills
in"* for a vaccination that no longer draws one.

Read against `SPECS` rather than against the item's list of five, as the item itself asks. The other
five assistant v2 decision files were read too; what they added that a reader meets is the
`request_details` dialog (stream 4) and the Assistant log's *which brain answered* (model-waits),
both now in the manual. Nothing in streams 1, 2, 6 or 7 changes what a person can type.

## Deliverable 2: which writes skip the confirmation, written as a reader would meet it

The authority is `isLowRiskWrite` plus `readyToRecord` in `llm-tools.ts`, not a list of tool names.
The topic now gives it a step of its own: the two sentences, the actual reply text including the date
(`Done — Panda (R-0002) recorded at 12.4 kg on 31 Oct 2026.`), **why** those two and nothing else
(one fact about one animal on one day, corrected by recording the right one), and the three cases
that still draw a card — no weight, no vaccine named, or a name more than one resident answers to.
The date sentence says a missing date means today and that the reply tells you which day it used,
which is the whole of how a skipped write is still checked.

## Deliverable 3: access, never a role

The old callout read *"recording a change is for staff and management, and it is not offered to a
volunteer, who reads only who a resident is and where they live."* Three role names in one sentence,
and the exact shape `CLAUDE.md` forbids: a shelter that renames its roles would be reading about
roles it does not have.

It now says that asking and recording are **two separate permissions**, that an account may be able
to ask where a resident is and not record that she has moved, and that starting a medicine needs
*"Prescriptions: what should be given"* on top. No role key, no role name, and nothing that narrows
an unrecognised reader to anyone's manual — the topic is `activity: "assistant.ask"`, so the manual's
own card filter decides who is shown it, as it does for every other topic.

**Said as access, not as a card grant, on purpose.** Which card carries `assistant.record` is being
changed today by `claude/assistant-record-card`, so the topic states the shape of the rule and not
today's assignment, and nothing here needs rewriting when that lands.

## Deliverable 4: the Thai has nowhere to live, and drafting it now would mean drafting it twice

**Established, not assumed:**

- `src/lib/manual/` is `en.ts` and nothing else. There is no `th.ts`.
- `src/app/manual/page.tsx` imports `@/lib/manual/en` directly — one import, no locale pick — and
  says so in its own header comment: *"English only for now — the Thai edition is a later pass once
  the app settles"*. `src/app/manual/pdf/route.ts` reads the same single file.
- So there is no surface a Thai topic could be shown on. A `th.ts` added today would be dead code
  that `npm run typecheck` is happy with and no reader can reach.

**And the sequencing is deliberate.** The backlog's *Thai edition of the manual* item reads *"waits
on the real-use review so it is translated once"*, and *Review the manual against real use* reads
*"The Thai manual waits on this."* A Thai draft of this topic now would be drafted against English
the review is expected to change, and then drafted again — which is the one outcome that item exists
to prevent. **So: not drafted, and this is the reasoning.** What the Thai-edition item must build
first is named in it already: `src/lib/manual/th.ts` in the same `Manual` shape, a locale pick in
`page.tsx` and the PDF route, and Thai screenshots.

**What a Thai speaker actually needs from this topic is in it, in Thai.** The sentences to *type* are
not prose to translate — they are input, and they come from the parsers. The Thai step was extended
from the code with the two new questions (`คอกไหนว่าง`, `สรุป …` / `… เป็นอย่างไร`, from `SPACE_RE`
and `SUMMARY_RE` in `src/lib/assistant/intents/lookups.ts`) and now says plainly that **starting a
medicine has no Thai sentence** — because it has no keyword parser in any language (below).

Nothing was approved: no machine-drafted Thai was written, published or signed off anywhere, which is
the subject of the Thai sweep item.

## Where the code and a shipped note disagree, twice

The brief asks for these out loud. The code is the authority in both.

1. **"room for two dogs" does not work; "room for 2 dogs" does.** `placesWanted` in
   `intents/lookups.ts` matches `(\d{1,2})` only, so a number in words finds nothing and the question
   is answered for **one** place. The release note already shipped in `unreleased` uses *"room for two
   dogs in the cat zone"* as its example, and `docs/decisions/2026-10-31-assistant-v2-more-tools.md`
   repeats it. The manual uses a figure and says why. **Not fixed here:** the shipped note is another
   stream's line and `src/lib/releases.ts` is not this stream's to rewrite; either the example changes
   or the parser learns written numbers, and that is a backlog call, recorded below.
2. **A prescription has no keyword parser, deliberately** (that decision file: *"With no model, that
   sentence is unmatched"*). `ASSISTANT_LLM_PROVIDER` is blank in `.env.example` and the model-waits
   note shipped to users says *"Until a model is set up for the shelter every row reads Keyword
   reader"* — so today the medicine sentence answers *"I didn't understand that one."* A manual that
   listed it beside the other ten without saying so would be promising a shelter worker something
   that does not happen. The topic lists it, and a callout says it is the one sentence that needs a
   model, with Settings → Assistant log as the way to see which of the two read a sentence.

## Found, not fixed

- **`assistant.volunteerReadOnly` in `src/lib/i18n/dictionaries/en.ts` names roles**: *"Volunteers can
  ask the assistant questions, but recording this one is for staff and management."* So does
  `assistant.pageSubtitleReadOnly`: *"Recording changes is for staff and management."* Both are the
  fault `CLAUDE.md`'s no-named-role rule describes, in user-facing copy, and both would read wrongly
  at a shelter that renames its roles. Left alone for two reasons: the dictionaries are
  `claude/translations-labels-app`'s this batch, and the fix is two strings in two languages, not one.
  Backlog item added.
- **The manual's screenshots are untouched**, as the item and the brief require.
- **No browser drive.** This is one content file rendered by a page whose layout did not change; the
  gates typecheck it and `acceptance-matrix.mjs` resolves every topic's activity to real cards. A
  signed-in pass over `/manual` would have shown the same paragraphs the diff shows, which the brief
  calls a thin drive, so it was not done — and the two paragraphs' claims were checked against the
  code that produces them instead (`who`, `weight.done`, `immunizationStrings().done`, `SPACE_RE`,
  `SUMMARY_RE`, `isLowRiskWrite`, `readyToRecord`, `toolNeeds`).
