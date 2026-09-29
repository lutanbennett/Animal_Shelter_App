# 2026-09-28 — Shelter Friends logo tile: the softer tile, chosen over a side-by-side

Homepage polish (`docs/backlog.md`, part 2): Lutan didn't like the white
"paper" box each logo sat in on the sand band (a box inside a box, since
most business logos bring their own background). A scratch preview route
built all four candidates from the backlog item — no tile, logo-as-tile
(`object-cover`), round badges, and a softer tile — each rendered against a
friend with no logo and a wide wordmark, the two cases that break a
layout, then shown to Lutan live at `:3002/friends-tile-preview` before
anything was picked.

- **Chosen: (d) the softer tile, with the business name added underneath
  the logo** (Lutan's own refinement on the option as written). No border,
  `bg-site-line` instead of `bg-site-paper` — still a tile, but a shade of
  the band rather than a paper box on top of it. Logo-as-tile was ruled out
  in the preview itself: `object-cover` on the wide wordmark cropped it to
  the point of being unreadable, and the brief's requirement that "logos of
  very different proportions must all look deliberate" is exactly what that
  candidate failed.
- The tile grew from `h-24` to `h-28` to fit the name under the logo without
  cramping it; the dashed "Your business here?" tile grew to match, same
  shape and height as the brief requires.
- A friend with no logo shows its name centred and `line-clamp-3`'d instead
  of a logo, same as before — just inside the new tile colour.
- `FriendCard`'s small logo square on `/friends` had the same "box inside a
  box" problem (`border border-border bg-white`), even though it isn't the
  same grid tile the backlog item describes. Made consistent with the
  homepage's choice: `bg-surface-hover` (the generic-token equivalent of
  `site-line`), no border.
- The impact band (part 1) needed no such discussion — `items-center
  text-center` on each figure's column, which holds regardless of whether
  the band ever grows past four figures, since centring is a property of
  each column, not the count.
