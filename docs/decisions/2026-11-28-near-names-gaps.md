# Near-name warning: other names, numbered siblings, and the register-only login (#dupnx)

Three gaps #1919 reported on `src/lib/residents/near-names.ts`. Two are fixed; the third is answered, not built.

## 1. `other_names` is compared — split, exact only, its own reason

`other_names` is one text column, so it is **split on `,` `;` `/` and new lines** — the same split
`scripts/upload-blood-work.mjs` already used. Each piece is normalised like a name.

A match is **any other name of one animal equal to the other animal's name (bracket tag dropped) or to
one of its other names.** It is **exact only, never close spelling**: an animal can carry several other
names, so fuzzy matching every alias against every resident multiplies the near-misses, which is the
noise part 2 exists to remove.

It ranks **as strongly as a name hit** (it is an exact name the animal answers to) and sits after the
Thai-name rule. Its reason is its own — *"the same as another name it goes by"*, shown in the wizard as
*"goes by the same other name"* — so the volunteer is never told *"the same name once the bracket tag is
dropped"* when the match was on a second name.

## 2. A trailing number is ignored for close spelling

`normaliseName` keeps digits, so *Tiger 2* / *Tiger 3* were one letter apart and reported as close
spelling. Now a **trailing number after a space** (`^(.*\D)\s(\d+)$`) is split off first:

| Pair | Before | After |
|---|---|---|
| Tiger 2 / Tiger 3 | close spelling | **no warning** (siblings numbered on purpose) |
| Test 2 / Test 1 | close spelling | **no warning** |
| Tiger / Tiger 2 | **no warning** (2 apart on a 5-letter core) | *the same name with a number added* |
| Lucky 2 / Lucy | close spelling | close spelling (bases compared) |
| R2D2 / R2D3 | close spelling | close spelling (a digit not after a space is a letter) |
| Bunny1 / Bunny2 | close spelling | close spelling (no space: not a counter) |

Measured on dev's 24 residents: 3 near pairs before and after; *Tiger 2/Tiger 3* and *Test 2/Test 1*
left, *Tiger/Tiger 2* and *Tiger/Tiger 3* arrived. The bare-against-numbered warning is the point of the
numbering, so it is kept and given its own reason. `nextNumberedName` is unchanged.

## 3. A login that may register but not read residents: nobody is asking

Checked 2026-11-28 in `src/lib/permissions/cards.ts`: exactly one card grants `resident.register` —
`residents` — and it declares `includes: ["view_residents"]`, which bundles `resident.record` at read
(the card itself adds it at edit). So **every login that can register a resident can read the list the
warning is built from**, and the login the gap describes cannot be assembled from the catalogue.
**Not built**: a security-definer function for a login that cannot exist is new surface with no caller.
**It becomes real** the day a card grants `resident.register` without `resident.record` (or without
including `view_residents`); that card's change is where the bare *"this name is taken"* reader belongs.

## Found on the way

`scripts/load-residents.mjs` failed every run since `0243` dropped `diet_types.is_standard`; it now reads
the standard flag from `diets` (joined by name, as its own `p_diet_id` lookup already did).
