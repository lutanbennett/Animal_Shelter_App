# The acceptance checklist's printable edition is drawn from the generator's data, and names no role

2026-10-09, `claude/acceptance-checklist-pdf`. Follows
`docs/decisions/2026-10-02-acceptance-matrix.md`, which shipped the Markdown and left the PDF for later.

## What was built

`node scripts/acceptance-matrix.mjs --pdf <file>` (with `--role <role>` for one tester's copy) prints
an A4 checklist to write on: a cover, the matrix, one tester's sheet per role, a failures page with
ruled rows, and the Director's sign-off. The renderer is `scripts/lib/acceptance-matrix-pdf.mjs`.

## Choices worth knowing

**One data object, two editions.** The generator now builds the whole checklist as a `doc` object,
words included, and both the Markdown and the PDF are drawn from it. The Markdown output was diffed
before and after the change and is byte-identical. So the PDF cannot test something the Markdown does
not, and a wording change to an instruction is made once. `--json <file>` writes the object, which is
what the check script uses.

**The renderer names no role.** Matrix columns, tester's sheets and sign-off rows are whatever `doc`
lists, and column widths are shared out by how many roles there are. This was the point of building
it now: `vet-to-doctor-rename` is renaming a role, and the backlog has an item to remove Staff, and
neither should need a change here. `scripts/check-acceptance-pdf.mjs` proves it by adding a role the
generator has never heard of and renaming an existing one to something longer, and checking each
still gets its column, sheet and sign-off row.

**A script, not a page in the app.** The checklist is built from files in the repo (the manual, the
walkthrough, the matrix entries), not from the database, and the person who prints it is Lutan, not a
shelter user. So there is no download button, nothing in Release notes, and nothing for the app's
roles to reach.

**Thai goes through the fixed path, not a new one.** The font and `thaiPdfChildren()` are imported
from `src/lib/archive/fonts/`, the code #486 fixed so a ำ stops dropping letters, not copied. Plain
`node` cannot import those files as they are (their imports leave off `.ts`, as Next allows), so the
renderer registers the same small resolver hook `check-home-screens.mjs` uses. The check renders Thai
with ำ in a role name, a step, an expected result and a boundary line, each ending in ")", and reads the
text back out with `pdftotext`. With `thaiPdfChildren()` bypassed, three of the four lose their last
character; with it, none do. (The fourth, a step with two ำ, survived even unfixed, so it is not
evidence on its own; the other three are.)

**Characters the font cannot draw.** Noto Sans Thai has no "→" or "☰", and the manual's "the ☰
button" printed as a "0" over the next word. These are swapped for words ("to", "three-line") in the
renderer's `SUBSTITUTES`. Any *other* character neither weight can draw stops the render and names
itself and the text it is in, because a silently wrong glyph on a sign-off sheet is the failure this
whole document is meant to catch.

**Landscape for the tables, portrait for the cover and sign-off.** A tester's table has nine columns
(four of them boxes, one per language and device) and does not fit A4 portrait legibly. Each table
gets its own run of pages so its column headings repeat on every page: a tester on the third page of
Admin still needs to know which box is "ไทย phone". The running head names the role and the table, so
a loose page can be put back. The failures page has 14 ruled rows, and says to continue on a copy.

**Still English steps.** The instructions stay English until the Thai manual exists (the 2026-10-02
decision). The font matters anyway: role names and anything typed into the generator's sources are
free text and may be Thai whatever the interface language.

## Not decided here

The pre-run agreements in the backlog item stay with Lutan and the Director: who tests which role,
the per-role accounts on Test, and what counts as a blocker. One new question came out of building
this. The 2026-10-02 decision says a signed edition is committed as `docs/uat/acceptance-<date>.md`,
but a signed paper copy carries the testers' real names and signatures, and this repository is
public. Where the signed copy is kept is now part of those agreements.
