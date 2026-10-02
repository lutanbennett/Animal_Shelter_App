# 2026-10-02 — The public roster stays full: every resident, including the dead and the adopted (DB-7)

Lutan's decision, 2026-10-02, on the database review's DB-7. **No code
change.**

`public_resident_cards` (`0103`) returns every resident, not only those with
`is_public_visible`, deceased and adopted ones included, and codes are
sequential (`R-0001`, `R-0022`, …; case-insensitive lookup in
`src/lib/residents/card.ts`), so `/r/<code>` can be walked to list every animal
the shelter has ever had.

- **A kennel tag must always answer.** The code is printed on a tag or a QR
  code and outlives the animal's time at the shelter. Someone who scans the tag
  of an animal that has since died or been adopted gets an answer, not a
  not-found that reads as "the shelter lost track of it".
- **The roster carries no personal data.** The card is the animal's own profile — name,
  species, breed, bio, temperament, photo — and nothing about a carer, adopter
  or vet. What is
  exposed is the shelter's history of animals, which the shelter publishes
  anyway.
- **The walkability is accepted, not overlooked.** Anyone can count the
  shelter's residents by stepping through the codes. That was weighed as a
  privacy and reputation question and judged not worth giving up the first
  two points for.
- **Closed, and not to be re-proposed:** public animals only for signed-out
  callers, plus a random suffix on newly printed codes. Changing a code that is
  already on a printed tag is the cost that settled it.

Folded into the `0126` contact-visibility PR (`2026-10-02-vets-and-volunteers-
read-less-of-the-address-book.md`), since both settle what a role may see.
