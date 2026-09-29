# 2026-09-28 — A vet sees only their clinic's residents, held in RLS (`0108`)

The rule was Lutan's (backlog, 2026-09-28): any clinical record, clinic-level.
What follows is how it was built and the two narrower calls the item left to
whoever built it.

- **One definition, asked everywhere.** `current_vet_resident_ids()` returns
  the residents the caller's clinic has a visit, prescription, procedure or
  blood test for. Every vet policy on a resident's rows asks it (residents,
  the six clinical tables, diets, placements, adoption updates, attachments
  on a resident / blood test / procedure, residents' translations). It is
  security definer because the policies it serves sit on the tables it
  reads; as the caller it would recurse.
- **A prescription, procedure or blood test belongs to a clinic only through
  its visit.** None of them has a `vet_id`, so in practice the four sources
  resolve to "the clinic has a visit for this resident". All four are still
  asked, each through its own `resident_id`, so the function reads as the
  rule was decided. A record with no visit belongs to no clinic and makes
  nobody visible — 13 such records on dev.
- **The owner-rights views were the real hole.** `resident_current_state`,
  `current_placement`, `immunization_compliance`,
  `immunization_duplicate_check` and `translation_queue` run as their owner
  (0086) and bypass RLS by design. Scoping `residents` alone would have left
  the resident pickers on every vet form listing all 80-odd residents, from
  `resident_current_state`. Each gets the same condition, a no-op for every
  session but a vet's. `resident_list_view` is invoker and joins `residents`,
  so it needed nothing.
- **Of the definer functions, only `record_attachment` needed the check.** It
  inserts past `attachments`' RLS and allows a vet. The others refuse a vet
  already or return only an id or yes/no about an id the caller supplied.
  The photo proxy already asks RLS on `attachments`, so it follows.
- **A cancelled visit counts.** The rule says any record the clinic holds and
  a cancelled booking is one. Dropping a resident whose only visit was
  cancelled, possibly to be rebooked, is exactly the "hidden from the vet about
  to treat them" case the rule was chosen to avoid. It also keeps the
  predicate free of status, which a visit can change after the fact.
- **Another clinic's rows on a visible resident are shown.** The scope
  decides *which* residents a vet sees, not how much of each; a resident's
  whole medical history is what a vet needs before treating them, and a
  half-history is the worse failure. What a vet may *write* on another
  clinic's rows is unchanged (as before, anything on a resident they can
  see), and is a backlog follow-up rather than part of this.
- **A vet with no clinic sees no resident.** Deliberate, and the same answer
  the visit forms already give an unlinked vet (2026-09-27). `/residents`
  says why and where an admin fixes it, so it reads as a setting to change
  rather than an empty shelter. **Before this reaches production, every live
  vet account there needs its clinic set**, or it opens to an empty list.
- **A vet cannot bring a resident into scope themselves.** `with check`
  matches `using` on every table, so a vet cannot book a visit — even at
  their own clinic — for a resident outside the scope. They could not find
  one to book anyway; the shelter's staff book the first visit.
- **Not narrowed:** `contacts`, `enclosures`, `zones`, `shelter_friends`. The
  hub reads a carer's name from `contacts` and the list reads enclosure and
  zone names; none of them is a resident's record. Whether a vet should read
  the address book at all is its own question (backlog).
