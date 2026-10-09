# 2026-10-09 — Facility map: markers sized from the shape, details loaded on the tap

Two backlog items from Lutan's Main Zone screenshot, built together because both rewrite
`src/app/enclosures/map/FacilityMap.tsx`.

**Markers are sized from each enclosure's own bounding box, not a fixed size.** `markerBoxes`
(`src/lib/facility-map/geometry.ts`) lays one row, or two when that lets them be bigger, in the
shape's **top-left corner**, in from the outline by 12% of its smaller side (at most 1.2 units), capped
at 2.6 drawing units (of 100 across). Not the centroid, though the backlog item suggested it: seen on
the dev plan, centred icons sat exactly on the circled enclosure numbers the drawing puts in each
middle, which is the thing the change exists to uncover. A shape whose corner is outside its own
outline (an L) falls back to the centroid. The fixed 3-unit icons strung out beside a chip are what ran
enclosure 10's icons into 9. On today's dev plans every enclosure is big enough for the cap, so they
all draw at 2.6 — the box sizing only takes over for a smaller enclosure drawn later. It is pure so
`scripts/check-map-markers.mjs` can prove containment against the real plans rather than by eye.

**The count is gone from the plan, not moved.** Occupancy is still the outline's colour, and the
number is in the card and in each shape's accessible name, so colour is never the only signal (the
rule the chip existed for). Putting a smaller count somewhere else would have brought the clutter
back on the small row.

**Rooms lose their name on the plan; zones on the overview keep theirs.** Lutan's scope was a zone
plan only. A room is still told apart by its dashed sky outline, and tapping it names it in the card.
`isZone` no longer covers rooms.

**The details are fetched on the tap, through one loader the enclosure page shares.**
`loadEnclosureDetails` (`src/lib/enclosures/details.ts`) is what `/enclosures/[id]` used inline, moved
out so the map's server action (`loadEnclosurePanel`) cannot drift from the page: same permission
(`facility.enclosures` read), same views, so a volunteer gets who and where only (0134). Preloading
every enclosure on the plan was the alternative; it would add a residents-and-maintenance read for
the whole shelter to every map view to save one round trip on a tap. Fetched details are kept for the
visit, so tapping back to an enclosure is instant.

**The panel reuses `EnclosureHub`'s pieces, and leaves out the actions.** Residents, notes and the
maintenance card are exported from `EnclosureHub.tsx` and used by both. Log maintenance is not shown
in the panel (`canWriteMaintenance={false}`): actions stay on the full page, one Open full page link
away, so the panel is something to read and the safeguard in the file's header — a tap never
navigates — is unchanged.

**Scroll only when the card's top is out of view.** On a phone the card is below the plan, so it is
scrolled to; on a desktop where it is already visible the page does not jump on every tap.

**Medication now shows on the enclosure page too.** The loader marks residents on a current
prescription (the map's own rule) for the panel, and the page gets it for free; a role that cannot
read prescriptions gets nobody marked, as RLS decides.
