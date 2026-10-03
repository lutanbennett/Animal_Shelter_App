# Phone width: one shared cause for most of the sideways scrolling, and no gate yet

2026-10-03, `claude/phone-width-fixes`, findings F-05, F-06 and F-07 of the
staff dry run (`docs/uat/dry-run-2026-10-03-staff.md`). Lutan confirmed the same
day that staff are about 100% on phones, so these were not cosmetic: on the
resident hub the Edit pencil sat 8 px on screen and Record death was off it.

## The shared cause: a one-column grid is an `auto` column

Most of the pages did not have eight causes. Almost every list and form in the
app is written `grid gap-3 sm:grid-cols-2 lg:grid-cols-3` (or `grid gap-4
sm:grid-cols-2`). Below `sm` there is **no column template**, so the grid has
one implicit column sized `auto`, and an `auto` track never shrinks below its
widest item's min-content. A `truncate` or `min-w-0` inside the item cannot help,
because the track is already as wide as the item wants. So the column grew to
its longest title or longest `<option>`, and everything beside that was pushed
off the edge.

That is the whole of Enclosures (+117 px, "Blue Enclosure 3 (Hallway Small Dogs
Only)"), Vets (+172), Contacts (+29, the fourth button), and the +31 px on Return
to shelter, Return from hospital, Edit resident and intake step 2: they share the
Zone/Enclosure picker, whose `<select>` is as wide as its longest option, inside
one of those grids. "Exactly +31 px on four pages" was the signature of one
element and it was.

Fix, once: in `src/app/globals.css` (base layer)

- `.grid { grid-template-columns: minmax(0, 1fr) }` — the same single column
  with a floor of 0. In the base layer, so every `grid-cols-*` utility at any
  breakpoint still wins (checked at 1280 px: enclosures, vets and contacts still
  lay out in three columns). A new grid can no longer forget the `grid-cols-1`
  this stands in for (a grep finds about 80 grids with breakpoint columns and no
  `grid-cols-1`).
- `select, input, textarea { max-width: 100% }` — the picker caps at its column
  and clips a long option inside the box.

Writing `grid-cols-1` on 81 grids would have fixed the same pages and left the
eighty-second to do it again next month, and would have conflicted with every
other stream's edits to those files.

## The causes that were not shared

Four things were their own, each a one-line change:

- **Resident hub (F-05).** The header's text column had no `min-w-0` and its name
  row did not wrap, so name + code + pencil + heart + the microchip line set the
  column's width (423 px of content at 375). The column shrinks and the row
  wraps (`flex-wrap`), so the icons drop under a long name. Not the grid cause.
- **Deliveries (+76, +114 in Thai).** The Note box carried `min-w-48` on its input
  inside a `min-w-0 flex-1` wrapper, so it never wrapped under Cost. Now the
  wrapper has `basis-48` and wraps when Cost leaves under 12 rem.
- **A vet's page (+31).** The four period buttons (`px-3`) add up to 349 px in
  English; `px-2 sm:px-3` (406 → 375 in English).
- **Book vet visit (+4)** was the Vet `<select>` itself (379 px wide at the
  time), covered by the select cap above.

## Sign out in the header (F-07)

"ออกจากระบบ" ended 10 px past the edge on every Thai page at 375 px, on dev. The
header is already full (☰, logo, name, DEV badge, Assistant, EN/ไทย), and the
Assistant button already shows only an icon on a phone, so Sign out does the
same: a `LogOut` icon below `sm`, with `title` and `aria-label` carrying the
words, the words from `sm` up. Moving it into the ☰ menu was the other option
in the finding; it is a larger change and it hides the control further.
Production shows no environment badge (`src/lib/app-env.ts`), so the cut-off may
not have shown there; that was not measured. UAT and dev carry the badge.

This is an icon with no visible word, which is what F-08 (batch 37,
`icon-buttons`) is about. It is deliberately here, not there: F-07 is a width bug
and the icon is what makes it fit. If that batch decides every phone icon wants a
label, the header will need a different answer than a label, because there is no
room for one.

## Titles wrap on a phone

The finding said "truncate or wrap". Enclosure and clinic names are the thing a
person is looking for, and `truncate` hid exactly the part that differs
("(Hallway Small Dogs Only)", "(CMCAH)"). On a phone they wrap
(`break-words`); from `sm` up they keep the ellipsis they had.

## No guard was added

F-06 also asked for a 375 px overflow check in the gates. It is not in this PR on
purpose. A real check has to render signed-in pages: a server, a session per role
and real rows (an enclosure with a long name, a vet with a long clinic), and
`playwright-core` is already a dependency but nothing here drives it against the
app in CI. That is a project; half-building it would give a gate that passes on
empty pages. It is a backlog item (*Mobile*, "A 375 px overflow check"), shaped as
a script run by hand or in the release smoke test, English and Thai, asserting
`scrollWidth <= clientWidth`. The base-layer rule is the prevention that fits in
this PR; the check is what would have caught the first page.

## How it was measured

Each page was measured at 375 px in the built-in browser with
`document.scrollingElement.scrollWidth` against `clientWidth`, before and after,
in English and Thai (numbers are in `docs/test-plans/phone-width-fixes.md`). Three
traps worth knowing: a page read while it is still streaming reports 375/375 (the
loading skeleton) and looks fixed; the browser pane does not finish rendering
while it is hidden, so take any screenshot before reading the number; and a
hidden same-origin `<iframe>` of a page also reported 375 with an almost empty
body (cause not established), so each page was navigated to instead.
