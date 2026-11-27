# The intake wizard warns about a taken or similar name (#dupnm)

**2026-11-27, `claude/intake-duplicate-name`.**

## What was built

- `scripts/lib/near-names.mjs` moved to `src/lib/residents/near-names.ts`, typed, rules unchanged. The three
  scripts (`load-residents.mjs`, `correct-resident.mjs`, `upload-blood-work.mjs`) import it from there.
  Faithfulness was measured: the five rule tests in `near-names.test.mjs` pass against the pre-move `.mjs`
  and the new `.ts`.
- `/residents/new` loads every resident the login can read from `resident_list_view` (code, name, Thai
  name, status) and the name box (`NameField.tsx`) checks as the volunteer types. An exact clash (the
  loader's own test: same name once case, accents and punctuation go) says *there is already a resident
  called this* and offers the next number; otherwise a near match by the three rules says *looks like*
  and gives the reason. **A warning only**: nothing refuses the save, on the client or the server.

## Choices

- **Departed and dead residents count** (the brief's recommendation, taken). Half the warning's value is
  *is this the same animal coming back?*, and `load-residents.mjs` already compares against every
  resident. Adopted and Deceased matches are marked *no longer at the shelter*.
- **"Next" is one past the highest number in use on that name**, a bare name counting as 1: Tiger → Tiger 2;
  Tiger and Tiger 2 → Tiger 3; Tiger and Tiger 5 → Tiger 6. Gaps are not filled, so the newest animal always
  carries the biggest number and a number is never re-used for a different animal after one leaves. (The
  backlog item suggested lowest-unused; the brief left it to the build. Re-using a departed Tiger 2's number
  is exactly the confusion the warning exists to prevent.)
- **The check runs in the browser against a list the page loads**, not a server action on blur: instant, no
  extra round trip, and the list is what RLS lets the login read, so the detail follows the login's cards
  through the database rather than a code-side gate.

## Not done, for the planner

- A login holding `resident.register` but unable to read residents sees no warning at all (its list reads
  empty). Telling it the bare fact "this name is taken" needs a security-definer function: schema, out of
  this stream.
- `other_names` is not compared (the brief's scope: the helper's rules, unchanged).
- Once numbered names exist, `Tiger 2` against `Tiger 3` is *close spelling* under rule 3 (one letter on a
  7-character core). In the wizard this only shows when typing a new numbered name by hand; in the loader it
  will add noise. A rule change was out of scope by the brief.
- Whether the live shelter already holds duplicate names was **not established**: `load-residents.mjs`
  compares CSV rows against the table, never the table against itself, so a probe row cannot answer it.
