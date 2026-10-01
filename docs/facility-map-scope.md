# Facility map — scope and recommendation

Status: **awaiting Lutan's decision** (backlog item, 2026-09-28; not yet built).
Written 2026-10-01 on `claude/facility-map-scope`. Prototype: `/enclosures/map-prototype`
(dev only, hidden in production builds). This is a recommendation, not a choice made;
a `docs/decisions/` entry follows when one is picked.

## Recommendation

**Background image with clickable SVG shapes laid over it, one plan image per zone
group, shapes placed by an admin "place on map" editor.** Put it as a **Map / List
toggle on `/enclosures`**. Build it in three steps, each its own PR:

1. `-schema` PR: `facility_maps` + `enclosures.map_shape` (one migration, number reserved at planning).
2. Read-only map on `/enclosures` (the part people use).
3. Admin editor (draw a shape per enclosure).

Do not start with real map coordinates (overkill for one site) or a traced SVG
(see "If the drawings turn out to be CAD").

## 1. The drawings — **open: needs Lutan**

Not yet seen. Needed: the format (PDF, CAD export, photo of paper) and how many
(one site plan, or one per building/zone). Copies go in Drive (the plan is not
sensitive but is large and will be replaced when the site changes); once built the
chosen images live in the existing uploads bucket, referenced by `facility_maps`,
not committed to the repo.

The recommendation holds for any raster (scan, photo, PDF page rendered to PNG/WebP).
**If the drawings are clean CAD/vector exports,** tracing to SVG becomes worth
reconsidering: sharper at pinch-zoom, themeable for dark mode, and the shapes could be
the drawing's own rooms rather than hand-drawn overlays. Cost: someone has to clean
the export, and every site change means re-tracing. A photo of paper settles it on
the image option.

## 2. How the map is drawn

| Option | Cost | Verdict |
|---|---|---|
| **Image + SVG polygons in percentages** (`viewBox 0 0 100 100`, `preserveAspectRatio="none"` over the image) | lowest; no library, static assets, runs on the Worker/Pi as-is | **recommended** |
| Traced SVG of the plan | medium–high; clean-up per drawing | only if drawings are vector (above) |
| Real coordinates + mapping library on satellite | high; library weight, tiles, licensing | no — one site, indoor, no GPS value |

Percentages mean shapes scale with the image on any phone with no JS measuring.

## 3. How enclosures are placed

Admin **place-on-map editor**: pick an enclosure from a list of unplaced ones, tap
points on the plan to draw its polygon, drag points to adjust. Stored as
`enclosures.map_shape jsonb` (`[[x%,y%], …]`, null = not on the map) and
`enclosures.facility_map_id` pointing at `facility_maps(id, zone_group, image_path,
width, height, sort)`. Keyed on the enclosure id, so renaming never breaks it, and a new
enclosure simply appears in the "unplaced" list. Deleting an enclosure removes its
shape with it. (Hand-edited coordinates are the failure mode this avoids.)

**Not on the map:**
- **Off-site** zones (Outreach etc., `zones.internal = false`), Hospitalised and
  Fostered are not at the shelter; they are simply never placed. The map shows
  On-site only, matching the existing On-site / Off-site filter.
- **The Lifecycle pseudo-zone and its pseudo-enclosures are not physical.** The editor
  must not offer them, and a `check` (or the editor query) must exclude
  `zones.name = 'Lifecycle'`, the same line `0119` guards for placements.
- Adopted/Deceased are history (`STATUSES_IN_PLACE`), so they never colour a shape.

## 4. What each shape shows

Only data `/enclosures/page.tsx` already loads, no new queries: **occupancy**
(`occupancyLevel`: fill colour ok/near/full/over), **open maintenance** (a badge),
**special diet** (a marker). Zones outlined and labelled from `zones.name`
(`placeName` for Thai). Colour is never the only signal (badge/count text too).
"You are here" needs GPS, which is poor indoors: **not worth it**.

## 5. Where it lives, mobile, hosting

- **A Map / List toggle on `/enclosures`** reusing the same filters and loaded data;
  `/enclosures/[id]` stays the one destination. Re-evaluate the home if Enclosures
  moves under Shelter Operations — the toggle moves with the page.
- Phone first: pan/pinch via the browser (container `overflow:auto` with a zoom
  control, as the prototype does; CSS `touch-action: pinch-zoom` on the frame), shapes
  large enough to tap, and **two-step tap** (select → card with Open) so a fat finger
  never navigates by accident.
- Hosting: one `<img>` plus inline SVG, no server-rendered images, no new deps — fine for
  the Worker budget and the Pi origin. Plan images served from storage with
  long cache; resize to ≤2000 px wide on upload.

## 6. Public side

**No.** Visitors do not get a map: the per-enclosure QR codes already cover "what is
here", and a site plan with enclosure positions has no visitor value and mild
security cost. Staff only (`isShelterRole`).

## Prototype findings

`/enclosures/map-prototype` lays three hand-drawn percentage polygons (real, live
enclosures) over a placeholder plan, with 1×/2×/3× zoom inside a scroll frame, tap to
select, and an Open button.

- Tap targets at 375 px wide: the plan is ~343 px wide, so a polygon covering 16% × 27%
  of the plan is ~55 × 56 px at 1× — over the 44 px guideline, and larger when zoomed.
  Real enclosures on a site plan will often be **smaller than that**; the 2×/3× zoom
  is what makes small kennels usable, so zoom is not optional.
- The recommendation's weak point: a dense kennel block at 1× will have shapes under 44 px.
  Mitigations already in scope: zoom, two-step select, and falling back to the list.
- Not verified in a signed-in browser by Claude this session (see the test plan).

## Questions for Lutan

1. The drawings: format and count? Please share copies.
2. Is one plan enough, or one per building/zone?
3. OK with staff-only, and with the Map / List toggle on `/enclosures`?
