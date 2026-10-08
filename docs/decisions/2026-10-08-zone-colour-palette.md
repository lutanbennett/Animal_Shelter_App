# Zone colour: twelve swatches, a ringed dot, coloured chips, map outlines untouched

2026-10-08, `claude/zone-colour-feature`. Builds on
`2026-10-08-zone-colour-schema.md` (migration `0162`).

**Sand and white are swatches.** The backlog item listed ten colours (blue,
green, yellow, orange, red, pink, purple, brown, grey, teal) and left open the
two the site already uses: the House Zone is called sand and the Front Zone
white. Leaving them out would force a zone that everyone calls "the white one"
into grey, which defeats the point. So the palette is twelve
(`src/lib/zones/palette.ts`), each with an English and a Thai name.

**Contrast was measured against the app's real surfaces, all dark.** The item
asked for "both themes". The app has no light theme: production is
`#121212` / `#1c1c1e` / `#262629`, and dev and Test are the green-cast
`#0e1615` / `#172221` / `#1f2d2c`. The public site is light but shows no zones.
Every swatch is 4.5:1 or better on all six (lowest: brown on dev's hover row,
4.5:1), above the 3:1 a graphic needs. If the "pick a colour theme" item in Admin
ever adds a light theme, white and sand will need a re-check against it: on
white, white is 1.1:1 and sand 1.7:1.

**The database keeps checking the form only.** The palette lives in the app.
The server action accepts any `#rrggbb`, not only palette values, so a zone
holding an older or hand-set shade still saves when only its name is edited.
The picker shows such a value as an extra "Other colour" choice rather than
quietly dropping it.

**One component, three shapes.** `ZoneName` is the dot plus the name, and
`ZoneDot` the dot alone. `ZoneSelectFrame` draws the chosen zone's dot inside a
native `<select>`, because an `<option>` cannot hold one and the pickers stay
native so a phone opens its own list. `placeLine()` is the "Kennel 4 · ● Main
Zone" line on the move, hospital, rehome and death forms. The dot is
`aria-hidden` and is never shown without the name, so colour is never the only
signal. It has a ring in the page background colour.

**Capacity and zone colour cannot be confused.** Occupancy is a bar, a pill
badge and coloured text. A zone colour is a round dot beside a name, or a
coloured chip with the name inside it. On the enclosure cards the zone dot
appears only in the flat (sorted) grid, as a "● Main Zone" line, where no zone
heading names the zone already.

**The facility map's outlines keep their occupancy colours.** The item said to
colour "the facility map's zone outlines if they are drawn". They are drawn, but
in occupancy colours (green / orange / red), and that is what a person reading
the map is looking at. Repainting them in zone colours would make "Main Zone is
blue" and "Main Zone is full" compete for the same outline. The dot goes on the
plan buttons, the "Not on this plan yet" list and the picked zone's card.

**Filter chips wear the colour (Lutan, mid-build).** Asked in chat: "is it
possible for those filter bubbles to be all the zone colour". A coloured zone's
chip on `/enclosures` and `/residents` is a tint with a full-colour edge when not
chosen. When chosen it is solid, with near-black `#121212` text (every swatch is
4.5:1 or better against it) and a tick, so "chosen" is not carried by colour
alone. Zones with no colour keep the plain chip.

**Deliberately left as text.** These places use the zone name inside a
sentence or a plain-text string, where a dot has nowhere to go: the assistant's
answers and cards, My tasks' maintenance lines, the edit-resident form's "Currently
in …" sentence, the undo-death confirmation, the capacity warning dialog, and the
admin map editor's lists. The public QR card at `/e/[id]` and the public resident
page `/r/[code]` stay plain, because zones are not shown on the public site.

**Zone names are not changed here.** Dev and production names still carry
"- Blue", "- White". Renaming them is the shelter's data and Lutan's call, in
Settings → Zones, now that the dots show.
