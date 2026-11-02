# Resident tags: the public strip and the last two boxes

Backlog item: Resident operations, "#tags in a resident's notes link two residents both ways". Follows
`2026-11-02-resident-tags-app.md`, whose lines 39-43 and 48 this settles. No migration, nothing added to
`resident_note_sources`.

## Public pages show a tag as a plain name (Lutan's answer, asked directly)

Lutan chose STRIP TAGS FROM PUBLIC OUTPUT. His answer arrived after #1197 shipped, which is why the earlier file still
calls it an open question. The other two options (keep those boxes off the public pages, forbid tags in them) are not
to be revisited.

- `stripTagMarkup()` in `src/lib/note-tags/text.ts` drops the `#` from every `#word` that starts a word. No link, no
  lookup, no database read: the public page never learns which resident was tagged, so nothing reveals another
  resident's page. A `#` inside a word (`C#3`) or on its own is left alone.
- Applied after the language choice, so it covers the original text and an approved translation alike, on all three
  public places that print `temperament_notes` or `past_story_notes`: `/adopt/[id]` (both fields), `/r/[code]`
  (temperament) and `/adopt/journey/[id]` (temperament; the brief named two pages, this third one also prints it).
- Staff see no change; tagging stays free in every box.
- Limit: a person who types a plain `#word` that was never a tag (say `#urgent`) also loses the `#` on the public page.
  Without a lookup the two cannot be told apart, and that is the cost of the decision.

## The two placement boxes

- **Intake note.** `recordIntake` finds the Intake `placement_history` row `record_intake` just wrote (the RPC returns
  the resident, not that row) and writes the links there. Allowed by `canTagNote(perms, ["resident.register"])`, passed
  from the page; the box is a plain textarea without it.
- **Edit resident housing "move notes".** `moveResidentToEnclosure` already returns the row id; the links are written
  with it. Allowed by `canTagNote(perms, ["placement.move"])`, a separate prop from the resident-notes one because the
  save asks a different activity.
- If the link write fails on intake, the resident and note are saved and the person is redirected as normal; the
  failure is logged, not shown, because a redirect cannot carry a message and returning an error would invite a
  duplicate intake. Not settled: whether that deserves a visible message.

## Assistant-written notes: NOT wired, on purpose

The assistant stamps its notes itself (`stamp(t, input.request)`, `src/app/assistant/actions.ts`) from a typed request.
A link here is only ever made from a resident someone picked (decision 1 of the app file: the text is never matched to a
resident). The assistant has no picker, so wiring it would mean matching names in free text, which that rule forbids,
or changing how the assistant parses requests. That is a different job; reported, not built. The item stays open for it.

## Still open

- `blood_tests.results` and `appeals.outcome_note` remain Lutan's call; each is one INSERT later.
- Not verified in a browser: the picker on the two new boxes and the public strip were checked by unit test and
  type/build gates only (see the test plan).
- The Thai in the release note is not written (the release notes take English only); the dictionary gained no strings.
