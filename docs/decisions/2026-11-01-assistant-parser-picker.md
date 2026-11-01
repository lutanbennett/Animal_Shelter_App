# Assistant: number words in the free-space question, and the picker on lookup answers (2026-11-01)

Stream 27, batch 12. Two backlog items, both measured against the code before any edit.

## 1. `placesWanted` reads numbers in words

- **Range: one to twenty in English words, plus digits.** "Two" and "three" are certain; twenty is as far as a shelter
  says a count aloud for animals going into an enclosure. Beyond it ("thirty", "a hundred", any three-digit figure) is
  **declined**, not read.
- **Thai: yes, words one to ten (หนึ่ง..สิบ) and Thai numerals (๐-๙).** The assistant is used in both languages and
  the parser already understands สำหรับ and ตัว, so a Thai asker saying "สำหรับสองตัว" was hitting the same silent
  one. These are recognition tokens only; nothing is shown, so no new string and **no dictionary file touched**
  (stream 26 untouched). They are Thai a native speaker should still glance at, but a wrong token fails safe.
- **Failing loudly:** a quantity that is plainly asked for but unreadable ("room for a few dogs", "for 150 dogs",
  "for thirty cats") returns `unreadable`; the parser then **declines the sentence** and the person gets the existing
  "I didn't understand that one" reply, instead of a plausible answer for one place. No new message was needed.
  Absence of any quantity ("which enclosure has space?", "room for a new dog") is still one place, which is a
  genuine reading and not a miss.
- Measured in the browser: "room for twelve dogs" and "room for 12 dogs" both answered "No enclosure has room
  for 12" (dev has no enclosure with twelve free); "room for a few dogs" gave the not-understood reply.

## 2. The picker

`ResidentCandidates` moved out of `AssistantCards.tsx` into `ResidentCandidates.tsx`, unchanged, used by the cards and
by `AssistantAnswer`. A `where` or `summary` question that matches several residents and names none now ends in a new
`pick` turn state, drawn through `AssistantAnswer`; choosing a resident re-asks the same lookup about that one. No
lookup runs until they choose, so nothing is guessed and nothing is read before the choice. No permission changed.
Measured in the browser: "Where is Kame?" (two residents in dev) drew both with code and place; pressing the first
answered for R-0036.

## 3. What needs saying to users (deliverable 5)

- The release note shipped in #1129 ("room for two dogs in the cat zone") is **made true by this fix**, not
  contradicted. A note cannot be unshipped and does not need to be: no correction is warranted.
- A short `unreleased` line was still added, because two things changed in a way a user can see: the picker now
  appears for a shared name, and number words are read. It says that plainly and mentions the earlier example
  only as now working.
- **#1138's manual workaround is reverted:** the manual said to write the number as a figure because a number in
  words is read as one. That is no longer true, so the sentence now says words work to twenty and that an unreadable
  quantity is not guessed at. The English manual only: no Thai manual file exists in `src/lib/manual/`.

## Found, not fixed

Nothing outside scope was touched. `could-not-help.ts:130` remains its own item.
