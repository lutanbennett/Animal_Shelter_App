# Resident IDs are written R-0055; adoption clears Ready for adoption in code

2026-10-04. Staff dry run findings F-13, F-14, F-17, F-20
(`docs/uat/dry-run-2026-10-03-staff.md`).

## F-13 — which format is right

The app is. `residents.resident_code` defaults to `'R-' || lpad(…, 4, '0')`
(0045), and every screen, PDF and the public `/r/<code>` page print it that
way. The manual and the acceptance matrix wrote `R0042`, which the app has
never produced — so the documentation was wrong, not the search.

Both were fixed, because people do type it without the hyphen:

- The format stays `R-0055`. `src/lib/manual/en.ts` and
  `scripts/lib/acceptance-matrix-entries.mjs` now say `R-0042`.
- The Residents search accepts `R0055`, `r 0055` and `R-0055` by turning
  `R`, optional hyphens/spaces, digits into `R-<digits>` for the ID column only
  (`residentCodeTerm`, `src/lib/residents/code-search.ts`). The name columns
  still see what was typed. Bare digits already matched inside the code.
- No data change: the stored code is untouched.

## F-20 — flag cleared by the app, no migration

Death clears `ready_for_adoption` in a trigger (0002). Adoption never did.
This batch carries no migration (one schema PR in flight, `volunteer-schema`),
so `rehomeResident` clears the flag after an `Adopt` placement is recorded,
and the hub treats an adopted resident as not waiting for a home whatever the
column says (older adopted rows still carry `true`). A failed clear is not
reported as a failed adoption: the placement is the record that matters.

The public Adopt page showing the animal for one load was the page cache, not
the flag: the rehome action now revalidates `/adopt` and `/`. Edge copies in
other data centres still age out on their own; re-check after a purge or ten
minutes, per the house note.

## F-17 — the contact

The contact is not ours to invent, so it was left empty until Lutan gave it:
the manual's Getting help topic names Lutan Bennett, LINE `lutan1`. It reads
`SUPPORT_CONTACT` in `src/lib/manual/en.ts`, so a change of person or a phone
number is one edit there (null falls back to the general wording).
