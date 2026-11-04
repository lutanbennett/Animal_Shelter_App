# Tags in assistant-written notes: route (c), the confirm card, built

Backlog item `#4ebnh`. First the reading (below), then Lutan's ruling, 2026-11-04 ("Yes, build it", to the question whether the assistant may fill in the tagged residents for the person to confirm on its card). Route (c) is built.

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

## What was built (after the ruling)

- The write tools (not the read-only ones) take an optional `mentions`: ids of OTHER residents, from a lookup
  (`llm-tools.ts`). `validateToolInput` refuses an id that is not a visible resident; `cleanMentions`
  (`src/lib/assistant/mentions.ts`) drops the subject, repeats and anything past five. It is NOT part of the Draft, so the
  eleven Draft types and their field tables are untouched.
- `interpretSentence` returns `mentions`; the keyword parser returns none, so it tags nobody.
- The card shows "Also tag in the note: #Billy ×" (`MentionChips`). The person can drop any. A low-risk write (weight,
  vaccine) that would have skipped the card does not skip it when it names someone: a tag is only ever made from what the
  person saw and left.
- Confirm sends the ids. `runWrite` reads the names under the caller's own session (a resident the login cannot read is
  not tagged), and saves the stamped sentence followed by `#Name` for each (`noteWithTags`). **The sentence stays as typed;
  the tags are appended**, so nothing is rewritten.
- After the write, `linkMentions` finds the row(s) just written (the helpers do not all return an id: by resident and exact
  note text, newest first, those within 10 seconds of the newest, which covers one row per vaccine) and calls the existing
  `syncNoteTagPicks`. The link policies decide whether the login may tag, as on every other form. No card created, no
  migration, no registry insert (the boxes were registered).

## Found, not fixed (for the planner to file)

- If the link write fails (policy refusal, or the row cannot be found) the note is saved WITHOUT its links and the person
  is not told; it is logged (`assistant: tags not linked`). The shared `AssistantResult` has no warning channel.
- Not driven end to end: dev has no language model, so the card with chips was not exercised in a browser. Unit tests cover
  the id checks, the card-versus-skip rule and the note text.
- Thai wording unreviewed.
