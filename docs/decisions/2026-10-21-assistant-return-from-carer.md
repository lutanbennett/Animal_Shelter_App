# The assistant's "came back from foster" sentence

2026-10-21, branch `claude/assistant-return-from-carer`.

**What.** A ninth parser, `src/lib/assistant/intents/carer-return.ts`, claims
"Panda came back from foster", "Panda is back from Khun Noi" and the Thai
"… กลับจากฝากเลี้ยง". Confirm runs `assistantReturnFromCarer`, which calls
`returnResidentToShelter` (`src/lib/placements/rehome.ts`), the same helper as
the resident's Return to shelter page. No new write path.

**It runs before `rehome`.** `rehome` already declined any sentence saying
"back"; the return now claims those. It needs a carer word (foster, adopt,
carer), a known carer's name or a person's title (Khun, Mrs, คุณ…) as well as
"back", so "Panda is back from hospital" still reaches the hospital return and
"move Panda back to B1" still reaches move.

**The enclosure.** A sentence rarely names one, so `enclosureId` is null unless
it did ("back from foster to B1"), and the card's enclosure picker starts blank.
Confirm stays disabled until one is chosen. We did not guess the enclosure the
resident left from: for a resident who was fostered a long time ago that
enclosure may well be someone else's now, and a pre-filled guess is the kind of
thing people confirm without reading.

**Occupied or unsuitable enclosures.** Left to the existing helper, which
refuses a Lifecycle (system) enclosure and a resident who is not fostered or
adopted. The helper does **not** check occupancy, and neither does the Return
to shelter page; enclosures here hold several dogs, so adding a check only in
the assistant would make it stricter than the page it stands for. The card does
say "not with a carer" up front, from the status it already has, and disables
Confirm, rather than letting the person discover it at Confirm.

**The carer is shown, not written.** The helper ends whoever has the resident
now, so the carer is no input to the write. It is matched only against the
existing carers (the `loadCarerOptions` list the context already loads) and,
when matched, shown on the card. A name after "from" that matches nobody is
kept in the draft as `carerName` and the card says "No carer called … is on the
list, and none is added here". Nobody is created from a sentence, by design.

**Strings.** In `src/lib/assistant/carer-return-strings.ts`, following
`immunization-strings.ts`, because the dictionaries were another stream's this
batch. Fold both into `t.assistant` when that settles.

**Not done, deliberately:** a new carer from a sentence; batch numbers and
dates in words on the immunization card; checking that the named carer is the
one the resident is actually with (the context does not load the current carer,
and the return does not depend on it).
