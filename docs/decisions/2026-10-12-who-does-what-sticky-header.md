# Who does what: the role names stay in view (option a)

**Chose (a): the wrapper (`.wdw-scroll`) is the scroller in both directions.**
`position: sticky` sticks to the nearest scrolling ancestor, and the
`overflow-x-auto` wrapper made that ancestor the box, not the page, so
`sticky top-0` on the `<th>`s alone would have done nothing. The wrapper is now
`overflow-auto` with `max-height` of the window less the app header
(`--app-header-h`, which is only sticky from `md` up, so below `md` it is just
the window) less 1rem. The role-name `<th>`s are `sticky top-0 z-20`; the
top-left cell is `top-0 left-0 z-30`, above the sticky first column (`z-10`).

**Why not (b):** a second copy of the header row outside the table has to be
kept in step with the sideways scroll and gives screen readers two sets of
headings. (a) keeps one table.

**Print:** the page's print block now reads
`.wdw-scroll { overflow: visible !important; max-height: none !important }`,
so the whole grid still lays out.

**Accessible name:** each box's select now reads "role: activity" (it read
activity first), so it says which box it is without the header in sight.

Presentation only: no cell, writer or permission changed; `actions.ts` untouched.
