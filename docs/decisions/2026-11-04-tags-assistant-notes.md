# Tags in assistant-written notes: the shape is established, and the choice is Lutan's

Backlog item `#4ebnh`. Built nothing; this is the reading the item asked for, and a ruling it needs.

## What the assistant does today (read on `main` at `e4fa7300`)

- A note is `stamp(t, input.request)` = `t.assistant.stamp(request.trim())` (`src/app/assistant/actions.ts:61`), used at
  lines 183, 224, 260, 285, 309, 337, 378 and 411. The saved note **is the typed sentence, verbatim**, wrapped in the
  "added by the assistant" stamp. It contains no `#`, and no field beside it says which names in it are residents.
- Those notes go into boxes that are **already registered** in `resident_note_sources` (`placement_history.notes`,
  `clinic_visits.notes`, `immunization_records.notes`, and so on). So **no insert and no migration is needed**; the
  registry is not what is missing.
- The model path (`interpretRequest`, `interpret.ts`) turns the sentence into a draft with **exactly one** `residentId`
  per draft (`src/lib/assistant/llm-tools.ts:92-189`), chosen from the `lookup` tool over rows the asker can already see
  and shown on a confirm card before anything is saved. The keyword fallback (`parse.ts`) also yields one resident.
- **Does the assistant write on a resident other than the one the request is about? No.** One draft, one subject. The
  second resident in "Billy bit this resident" exists only inside the sentence.

## The routes

- **(a) Match names in the saved text: foreclosed.** Decision 1 of `2026-11-02-resident-tags-app.md` says the text is
  never matched to a resident (two residents can share a name; a rename must not break a link). Nothing has changed.
- **(b) A typed `#` picker in the assistant box.** Viable and consistent, but it makes the assistant a different
  product: the box takes a sentence the model parses, and a picker would be a second way to name a resident beside it.
- **(c) The third route, which does exist: the confirm card.** Add `mentions: residentId[]` to the draft, filled by the
  model from the same `lookup` it already uses, drawn on the card as "Link to: Billy" with a remove control, and written
  by the existing `src/lib/note-tags/sync.ts` in the same save. The person confirming is the one who picks.
  **Cost, in plain words: medium.** The draft type and every tool schema (about eleven in `llm-tools.ts`), the validation
  in `interpret.ts`, the card, the eight actions, the stamp (a link needs a `#Name` in the text to show as a link, so the
  stamp would have to rewrite the sentence), en and th strings, and tests. The keyword fallback would offer no links.

## Why this stops here

Route (c) is a model *proposing* a name match that a person then *confirms*. Whether that counts as "a resident someone
picked" under decision 1 is a reading of Lutan's own rule, not a fact about the code, and it also means the stamp stops
being the sentence as typed. **That is his ruling to make; it is not designed around or guessed here.**

**Ask:** may the assistant fill in the tagged residents for the person to confirm on its card (route c), or should
assistant notes stay un-linked? Nothing else about `#4ebnh` is open.

## Not touched

`blood_tests.results`, `appeals.outcome_note` (his call, unchanged); public strip (shipped); no card created; no
migration. `node scripts/check-hard-coded-security.mjs` is unaffected (no code change).
