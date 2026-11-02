# Assistant: a name that is only part of a resident's name shows the "which one?" picker (2026-11-02)

Backlog item "THE ASSISTANT SAYS 'CANNOT HELP' WHEN A NAME IS ONLY PART OF A RESIDENT'S NAME" (Assistant).

## Before and after (the could-not-help log's own line)

- **Before.** Production, 2026-11-01 05:29: *"Can you give me all the Gigi residents"* was logged `unmatched` and the
  worker got "I didn't understand that one". `matchByName()` needs the whole stored name in the sentence, so "Gigi"
  never matched "Gigi (1)".
- **After.** The same sentence reads as a `where` lookup with no resident chosen and every near match as `candidates`,
  so the existing picker (#1170) shows "Which one do you mean?". Driven on dev against "Tilly (1)" and "Tilly (2)"
  (see "Dev" below).

## What was built

`matchResident` in `src/lib/assistant/text.ts`: codes first, then whole names (unchanged), then `nearNameMatches`.
Near matches return `id: null` and every near resident as `candidates`, **even when there is only one**, because a near
match is a guess. Three UI checks that required "more than one" candidate now require "at least one"
(`AssistantConversation.tsx`, `AssistantCards.tsx` twice): an exact match never produces candidates of one, so nothing
else changes. A new `listResidentsIntent` in `intents/lookups.ts` reads "all / every / list / show ... residents / dogs /
cats / animals" plus a resident (whole or near) as a `where` draft with the picker. The picker offers residents from
`context.residents`, the list the lookups already use: no card, query or read is new, and Admin is untouched.

## The boundary rule (the open question)

A name is split into its words: runs of `a-z0-9`. Brackets, spaces, hyphens and apostrophes are separators. A word counts
as a near match when it:

1. has at least one letter (so the "1" in "Gigi (1)" is a disambiguator, never a match: "1" finds nothing);
2. is at least 2 characters (the existing floor);
3. is not filler: `the`, `all`, `residents`, `dog`, `tell`, ... (a short list in `text.ts`);
4. stands alone in the sentence, using the existing `mentions` rule (not inside another word).

Thai names get no near match; their substring rule is unchanged.

**Rejected:**
- *Prefix or substring of a word* ("Gi", "Pan" for "Panda"): the item says they find nothing, and it would put a wrong
  animal's record in front of someone.
- *Fuzzy spelling* (`scripts/lib/near-names.mjs`): see verdict below.
- *Matching on the digit or on "(1)" as written*: the number is the duplicate tag, not the animal's name.
- *No filler list*: found on dev, where "all the Tilly residents" also offered "O'Malley The Quokka" (the word "the") and
  every resident with "residents" in its name. A list of every common word would be endless, so the filler list is only
  the words an assistant sentence is made of, and a leftover guess is still only a picker the person can ignore.

## `near-names.mjs` verdict

Not reused. It answers "do two stored names look like the same animal?" by dropping bracket tags and by Levenshtein
spelling distance, which is for the bulk loader. Here the question is whether a typed word is a whole word of a stored
name, which is simpler, and spelling closeness ("Lucky" ~ "Lucy") would break "Pan finds nothing". It is a server `.mjs`
under `scripts/`, outside the app bundle's `src/`. Its bracket rule agrees with the rule above in spirit.

## Dev

Dev already holds a resident "GiGi", which matches "Gigi" exactly, so the near-match path never shows for that name
there (correct: a whole-name match wins). The drive used "Tilly (1)" and "Tilly (2)" created on dev and left there.
Saw: "Tell me about Tilly" gave a two-name picker, picking Tilly (1) gave its summary; "Can you give me all the Tilly
residents" gave the same two-name picker; "Tell me about Pan" gave "I didn't understand that one". "Where is Tilly" was not
driven; it shares `matchResident` and the `where` picker path with the list sentence, and the parse tests cover it.

## Found, not fixed

The one-candidate picker still says "Which one do you mean?". A "Did you mean ...?" wording would say better that it is a
guess, but it needs a new English and Thai string; left for a later change. Any new Thai is not applicable here: none was added.
