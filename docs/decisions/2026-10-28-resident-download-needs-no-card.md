# Downloading the whole resident list needs no card of its own

**2026-10-28. Lutan, asked directly, as the last card-level question outstanding in
`docs/card-access-faults.md`.**

> *"no we don't need a separate card for downloading residents data, it is given by the residents
> read or residents cards"*

## What was asked

The fault log's gate-3 section carried two card-level questions for him. This was one of them:
should downloading the whole resident list as a spreadsheet be its own card?

It was asked because `/residents/export` returns a great deal about every resident at once — name,
Thai name, species, breed, microchip, status, enclosure, intake date and diet — and it is reached
through a read that several cards carry. The question was whether that breadth deserved a gate of
its own.

## The answer, and why nothing was built

**The existing resident read *is* the intended gate.** His answer is not a request for a change; it
is a ruling that the current behaviour is correct.

**Verified against the route itself rather than against a note about it**
(`src/app/residents/export/route.ts:29`, re-read 2026-10-28):

```ts
if (!can(perms, "resident.record", "read")) {
  return new Response("Your role cannot read the residents list.", { status: 403 });
}
```

That is the only access check the route makes. So the behaviour he described is already exactly
what the code does: **no migration, no new card, no app change, and no `card_grants` row.**

## Which cards carry it today

Stated by **card**, not by role, per his standing instruction of 2026-10-28 that all analysis is by
card because roles are a transient grouping of cards. Eight cards reach the download:

- **Directly:** View residents, Residents, Approve photos.
- **Through an included card** (`card_closure()` expands `card_includes` transitively): View
  medical, Manage medical, Book clinic visits, Run fundraising appeals, Record a death.

**He was shown that spread and chose it.** It is recorded here so that the next person to notice how
many cards carry the download finds the decision rather than re-raising it as a fault.

## Why this is not a gap to re-file

The tempting reading is that eight cards carrying a whole-list export is itself a finding. It is
not, for two reasons:

1. **The count of cards is a consequence of the read, not an independent fact.** Narrowing it would
   mean giving the resident list a second, narrower activity — which is a change to what *reading
   residents* means, not the addition of a download card. He was asked and declined.
2. **A per-card count here would age the moment card assignments are rebuilt**, which he has said
   they will be. What is durable is the sentence above: the route asks `resident.record` at read.

## One record corrected in the same change

The paragraph next to this question in `docs/card-access-faults.md` still read *"not yet answered"*
for **should Add medical photos be able to look at the photos it files?** — a question he had
answered the same day (*"Yes add medical photos should also be able to view medical photos"*) and
which was already built as migration `0279`.

It is corrected in place rather than left to be read as current. This is the exact shape the
2026-10-28 planner handover named as the round's main finding: **the record was right and the thing
itself was not**, or here the reverse — the thing was done and the record still described it as
open. A sentence describing an intention reads identically to one describing a completed action, so
the guard is to re-read the artifact rather than the note about it. That is what was done for both
halves of this change.

**With both answered, nothing in the card-access fault log is with Lutan.** What remains in it is
the 141 rows marked *not established*, which are the planner's to settle because only the main
checkout can read production.
