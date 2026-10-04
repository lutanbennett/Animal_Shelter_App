# 2026-10-04 — Facility map, read-only (step 2 of 3)

The map on `/enclosures`, built on `0142` (`docs/decisions/2026-10-04-facility-maps-schema.md`). No
migration. Step 3, the admin place-on-map editor, is not here and inherits what is listed at the end.

## What it is

`/enclosures?view=map`, a **List / Map** toggle at the top right of the page. The plan is a plain `<img>`
with an inline SVG laid over it: no server-rendered images, no new dependency, nothing for the Worker or the
Pi to do. Navigation is Lutan's: **site overview → tap a zone → that zone's plan → tap an enclosure →
`/enclosures/[id]`**, with buttons above the plan for the overview and for each zone that has one.

- **Code.** `src/app/enclosures/map/FacilityMap.tsx` (the map, plain data in), `PanZoom.tsx` (the gesture
  frame), `src/app/enclosures/ViewToggle.tsx`, `src/lib/facility-map/geometry.ts` (shapes and the pan/zoom
  clamp, pure) and `types.ts`. `FacilityMap` takes `FacilityMapData` and knows nothing of the page, so it
  moves under Shelter Operations with the Enclosures page if the Settings/Management review decides that.
- **Shapes are drawn in the image's own space** (`viewBox 0 0 100 {100·h/w}`), not the scope's
  `preserveAspectRatio="none"`. Stretching a polygon is harmless, but stretching its count and icons is not;
  the percentages in the database are unchanged and the drawing is still resolution-independent.
- **Pan and pinch are ours, ~200 lines on Pointer Events**, not `react-zoom-pan-pinch` (scope §5 left it open).
  One finger drags, two pinch about their midpoint, double-tap zooms in and back, ctrl/⌘-wheel (a trackpad
  pinch) zooms about the cursor, and +, − and fit buttons do the same for a keyboard or a hand that cannot
  pinch. Clamped so the plan cannot be lost; `touch-action: none` on the frame only, so the page still scrolls.
  A movement over 8 px is a pan and its click is swallowed before it reaches a shape; pointer capture is taken
  only once a drag starts, because capturing on press retargets the tap's `click` away from the shape.
- **Two-step tap.** Tapping a shape selects it and shows a card under the plan (residents against capacity
  with the list's own `OccupancyIndicator`, open jobs, special diets); **Open enclosure** is what navigates.
  Each shape also carries a transparent wide-stroke twin as a hit area, because a 55 px kennel left no slack
  for a fat finger in the prototype.
- **Status uses only what the page already loads.** Fill is `occupancyLevel` (the list's thresholds); each
  enclosure shows `count/capacity` as text, a spanner when it has an open job, a bowl for a special diet, so
  colour is never the only signal; the shape's accessible name carries the count and the level in words.
  Zones on the overview are outlined, labelled, and coloured by their total residents against total capacity.
  Adopted and Deceased are history and never count (`loadOccupants`). **No "you are here"**, as scoped.

## Zero shapes: decided

Almost nothing is placed until step 3 ships, so "a plan with nothing on it" is the normal state for a while.
Three rules, so it reads as deliberate:

1. **No plan, no Map button.** The toggle appears only when `facility_maps` has a row the viewer can read.
   Production has none, so nothing changes there until a plan image is loaded.
2. **A plan with no shapes shows the image anyway,** with a sentence saying so ("The enclosures in X have not
   been placed on this plan yet. Pick one from the list below.") instead of the usual hint.
3. **Whatever is not on the plan is listed under it** — "Not on this plan yet (n)" — as links to the
   enclosure (on a zone plan) or to the zone's plan or its list (on the overview). So an unplaced enclosure is
   one tap from its page and cannot be lost; a new enclosure appears here automatically, with no map work.

Rejected: showing the image with nothing beside it (reads as broken); hiding the toggle until every enclosure
is placed (the Director would wait on step 3 for something already useful).

**What the map includes.** On-site, physical zones only (`zones.internal`, not `Lifecycle`), unfiltered: the
list's place, zone, search and sort controls are not shown in Map view, because the map is its own navigation
and a zone filter would only leave it empty. Off-site zones and fosters are never placed (scope §3).
**Not decided, as the schema decision left it:** non-resident rooms (Medical room, Kitchen, Storage) and
free-roam spaces with no capacity. They are enclosures, so they are listed and, if placed, drawn grey with
a bare count (`occupancyLevel` is `unknown` with no capacity). Whether they should instead be excluded is a
question for the Director, and a render-only change here.

## The plan image

`image_path` is a **file name under `public/facility-maps/`**, resolved by one function, `planImageUrl`, so the
editor can move the files to storage with signed URLs without touching the map. **Lutan chose the repo
(2026-10-04):** the Main Zone – Blue photograph (1492×1054 WebP, 86 KB) is committed at
`public/facility-maps/main-zone-blue.webp`; the original stays in Drive. **Two files from one drawing (Lutan, 2026-10-04):** the full image serves the shelter overview and the Cat Zone, and `main-zone-blue-crop.webp` (870×1020, cut from it at 60,0) serves the Blue zone's own plan, without the House Zone and the three unnumbered rooms on the right. Both are `facility_maps` rows pointing at different files, so shapes on each are percent of *that* file. The `facility_maps` rows that point
at it are data, not migration, so they are not in this PR: the Map button stays hidden everywhere until an
admin or the step-3 editor adds one (dev has rows for the Main and Cat Zone and the overview). A file in
`public/` is fetchable by anyone who knows the name — the plan has no visitor value and enclosure positions
are a mild secret — so step 3 should weigh storage with signed URLs against that before it takes uploads.

## The public side: no

Visitors do not get a map (scope §6, confirmed). The per-enclosure QR codes already answer "what is here", and
`/e/[id]` stays the whole public surface. The map is gated by `facility.map`, which anon never holds, and
`facility_maps` is `to authenticated`, so there is no public path to it or to the image listing.

## Volunteers

The roles paper (§12 R1) gives a volunteer "the map" and they were handed the Enclosures list as a stand-in.
**The substitution can be undone and needs no cell change:** `0132` already grants `volunteer` the yes/no
activity `facility.map`, and `0134` keeps it (`and activity not in ('resident.record','facility.enclosures',
'facility.map')`). So a volunteer sees the Map toggle exactly as staff do, with the occupancy the narrowed
`resident_who_and_where` view gives them (`loadOccupants`), and `facility_maps` is readable by every login.
Nothing for the roles work to change. Vet and Head of Maintenance do not hold `facility.map`; they see no toggle.

## Left for step 3

| Screen / thing | Reads | Writes | Trap |
|---|---|---|---|
| Place-on-map editor (`/admin/…`) | `facility_maps`, `zones`/`enclosures.map_shape`, the unplaced list | `map_shape` and `facility_maps` rows (admin/management by RLS) | Use `parseShape` and `pointsAttr` from `src/lib/facility-map/geometry.ts`; shapes are **percent of the image's width and height**, y included, so a point's y in the drawing space is `y · height / width`. |
| Adding a plan | the file's pixel `width`/`height` | `facility_maps` + the image | `image_path` is a name under `public/facility-maps/` today; change `planImageUrl` only. One row per zone, two zones may share a file (Main and Cat do). |
| Drawing tool | — | — | Reuse `PanZoom` for the editing canvas; it swallows a click after a drag, which is exactly what a draw-a-point tool needs. |
| Zone outlines | `zones.map_shape` on the overview | same | The overview row needs a plan too. Zones with no outline are listed under the overview already. |
