# 2026-10-05 — Facility map editor (step 3 of 3)

`/admin/facility-map`, Settings → **Facility map**. No migration: `0142` already holds `facility_maps` and
`map_shape`. It closes the thread opened by `2026-10-04-facility-maps-schema.md` and
`2026-10-04-facility-map-read-only.md`. The point of it, from the backlog item: **nobody ever types a
coordinate**, so the map stays correct as enclosures are added or renamed.

## What it is

Pick a plan, pick an enclosure (on the shelter overview, a zone), draw it on the plan, and it is saved. Two
tools, because a kennel is nearly always a rectangle and a yard is not:

- **Rectangle** — click one corner, then the opposite one.
- **Polygon** — click each corner, then click the first point, press Enter or tap Done. Backspace / Undo point
  takes the last point back; Escape drops the shape.

A shape is **saved the moment it is finished** and the next enclosure with nothing on the plan is picked for
you, so a zone is one run of drawing with no Save button between shapes. A placed shape shows a dot on each
corner to drag (saved on release); *Draw again* starts it over; the bin takes it off the plan. There is no
"discard changes" state to lose work in.

Reused as asked: `PanZoom` is the canvas (it gained one prop, `doubleTapZoom`, which the editor turns off —
two quick clicks are two points, not a zoom), and `parseShape` / `pointsAttr` from `geometry.ts` are the only
shape reader and writer. `geometry.ts` gained the drawing half (`drawingToPercent`, `rectShape`, `shapeArea`,
`roundPct`). A click is converted with the SVG's own `getScreenCTM`, so pan and zoom need no arithmetic of
ours. Points are rounded to two decimals of a percent (about 0.1 px on the 1492 px plan).

## The one real decision: where plans are stored — **committed files, no upload**

`facility_maps.image_path` stays a file name under `public/facility-maps/`, resolved by `planImageUrl` as
before. The editor's *Add a plan* picks what the plan is for (the overview, or a zone with no plan yet), takes
the file's name, **loads it in the browser to read its pixel size and prove it is a picture**, and inserts the
`facility_maps` row. Nothing is uploaded and nothing on the server touches an image.

Why, and why not Drive with signed URLs:

- **Volume.** The item says "roughly four or five for the site, ever", and three are already committed. An
  upload path is justified by frequency; this one is used about five times in the life of the system, by a
  developer-adjacent person (Lutan loads the drawings), not by the Director on a laptop.
- **The Pi.** The Pi is the production origin and the system's dominant risk. A file in `public/` is a static
  asset the Worker already serves; a Drive-backed plan is a signed-URL fetch on every map open, a token that
  expires (the 90-day token and the Drive client already broke uploads once, 2026-09-25), and a second place
  the Map can fail. A map nobody can open because Drive's token lapsed is worse than a missing upload button.
- **Size.** The expensive option is a new upload route, a bucket or folder, signed-URL minting, a
  content-type and size gate, and a delete path — most of a stream, to avoid copying one file into a folder
  five times.
- **The cost, stated:** adding a plan is a developer step (drop the WebP into `public/facility-maps/`, deploy),
  then the admin registers it. The page says so in words, so it never looks broken. The earlier worry that a
  `public/` file is fetchable by anyone who knows its name stands: the plan has no visitor value and enclosure
  positions are a mild secret, which was weighed in step 2 and is unchanged. If the Director ever needs to
  load plans herself, or a plan turns out to be sensitive, only `planImageUrl` and `addPlan` change (the map
  and the editor read the URL, never the path); that is a new decision, not a refactor.

Rejected: Drive with signed URLs (above); Supabase Storage, which is a third system for four files; base64 in
the row, which puts a megabyte in every `/enclosures` read.

`addPlan` accepts only a plain file name (`.webp`, `.png`, `.jpg`, `.svg`, no folder). A typo cannot be saved:
the *Add this plan* button stays off until the picture has loaded in the browser. The server re-checks the
name and the size is a positive integer; the one-per-zone and one-overview limits are the database's
(`23505`, turned into a sentence).

## Non-resident rooms: **the editor draws enclosures, nothing else** (and every enclosure is offered)

Medical room, Kitchen and Storage are enclosures in this system, so the editor lists them with the others and
an admin can place them, and they then draw grey with a bare count on the Map (`occupancyLevel` is `unknown`
with no capacity), exactly as step 2 left it. There is deliberately **no "label" or free-shape tool**: a shape
that is not an enclosure would need a table nothing else reads, and the schema has no such place.

Whether those rooms belong on the map at all is **the Director's answer to give, and Lutan's to ask her**. It
is cheap either way and the editor needs no change for "no": she simply leaves them unplaced (the list says so
in a line under it), or, if she wants them gone from the unplaced list too, that is a render-only change in
`FacilityMap` plus a one-line filter in the editor. If she says "yes, and I want a label for the car park",
that is a schema change (a `map_labels` table) and its own stream.

## Who, and on what screen

- **Settings → Facility map**, `facility.enclosures` at *edit* (the same activity as Zones and Enclosures
  beside it; the route registry entry is `device: "any"`, `menu: false`, like them). The server actions check
  the same activity, and RLS (`admin`, `management`) is the real boundary: the check script proves a volunteer's
  write changes nothing.
- **Desktop-first, said plainly.** Drawing a polygon accurately is desk work and the only person with a
  computer is the Director, at home (`2026-10-03-no-pcs-on-site-supersedes-admin-on-mobile.md`). So the page
  sits inside `LargerScreenNotice` ("Best on a larger screen"), its admin tile carries the *Larger screen*
  note, and it still renders on a phone behind the *Show anyway* button: the list, the plan buttons, the
  pan / zoom and the drawing all work with a finger (the buttons are 44 px; a tap places a point, a drag pans),
  it is just not the place to place twenty kennels.
- Lifecycle and off-site zones are never listed (`neq name Lifecycle`, `internal = true`), and the database
  refuses a shape on them regardless (`refuse_lifecycle_map`).

## Per-screen table (the handover standard)

| Screen / thing | Reads | Writes | Gate / trap |
|---|---|---|---|
| `/admin/facility-map` | `zones` (on-site, not Lifecycle), `enclosures`, `facility_maps` | — | `requirePermission("facility.enclosures")`; every shape goes back through `parseShape`, so a bad stored value shows as unplaced, never crashes |
| Draw / adjust / clear a shape (`saveShape`) | — | `zones.map_shape` or `enclosures.map_shape` | re-parsed with `parseShape`, rejected under `MIN_SHAPE_AREA`; then the check constraint; then the Lifecycle trigger. Zero rows updated is reported, not swallowed |
| Add a plan (`addPlan`) | — | `facility_maps` insert | file name pattern; size from the loaded image; `23505` → "already has a plan" |
| Remove a plan (`removePlan`) | — | `facility_maps` delete | **keeps the shapes** on their rows; they reappear if a plan is added again. A zone plan removed while two zones shared one file affects only that zone's row |
| The Map on `/enclosures` | the same rows | — | revalidated by each action, so a drawn shape is on the Map the next time it is opened |

## Shared files and the Pi

- A plan file may be shared by two zones (Main and Cat share a drawing). The two rows are independent: shapes
  are percent of *that row's* `width` × `height`, so a plan row must carry the dimensions of the file it points
  at. The editor reads them from the file itself, which is what keeps that true.
- **A re-shot or re-cropped file with a different aspect ratio invalidates the shapes drawn on the old one** (the
  percentages no longer mean the same pixels). Treat it as a new plan: remove the plan, add it again, redraw.
  The editor does not detect this; the shapes would simply sit in the wrong place, visibly.
- The Worker budget: the editor is a client component and three small server actions that each do one row
  write; there is no image processing and no new dependency.

## Cleanup done in this PR

The dev-only `/enclosures/map-prototype`, its `facility.map` route entry (the only registry entry that
activity had; the activity itself stays, it gates the Map toggle) and `public/prototype/placeholder-plan.svg`
are deleted, with the references in `routes.ts`, `home/tiles.ts` and `check-home-screens.mjs` reworded. The
prototype mentions that remain in `docs/facility-map-scope.md` and `docs/roles-and-permissions.md` are
historical and now say so.

## Not done

- A touch-friendly way to add a corner to a placed shape, or to move one whole shape. Drag-a-corner and
  *Draw again* cover the cases step 3 was asked for; a move-all is a follow-up if placing twenty enclosures
  turns out to want it.
- Detecting a plan file that changed under its shapes (above).
- Keyboard-only drawing. A polygon needs a pointer; this is a desk tool for one person, and the List view is
  the accessible way to reach an enclosure.
