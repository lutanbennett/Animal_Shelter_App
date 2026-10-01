# Facility map — scope and recommendation

Status: **awaiting Lutan's decision** (backlog item, 2026-09-28; not yet built).
Written 2026-10-01 on `claude/facility-map-scope`. Prototype: `/enclosures/map-prototype`
(dev only, hidden in production builds). This is a recommendation, not a choice made;
a `docs/decisions/` entry follows when one is picked.

## Recommendation

**Background image with clickable SVG shapes laid over it, one plan image per zone plus a site overview, shapes placed by an admin "place on map" editor.** Put it as a **Map / List
toggle on `/enclosures`**. Build it in three steps, each its own PR:

1. `-schema` PR: `facility_maps` + `enclosures.map_shape` (one migration, number reserved at planning).
2. Read-only map on `/enclosures` (the part people use).
3. Admin editor (draw a shape per enclosure).

Do not start with real map coordinates (overkill for one site) or a traced SVG
(see "If the drawings turn out to be CAD").

## 1. The drawings — answered by Lutan, 2026-10-01

Hand-drawn on paper; **one picture per zone**, plus **one of the whole shelter outlining
each zone**. The director has not sent them yet; they will be loaded when they arrive.
Lutan will ask Claude to turn the paper drawings into something usable.

So the format is settled: **raster**. The pipeline is photograph/scan → straighten and
crop → clean up (contrast, background) → resize to ≤2000 px wide WebP/PNG → upload. A
later optional step is tracing the cleaned drawing to a themeable SVG; that is a
nice-to-have per drawing, not a prerequisite, and the data model below does not change
if a map's image is swapped for an SVG. Keep the originals in Drive. Until the
drawings arrive the work uses placeholder images.

**Navigation model (Lutan's):** *site overview → tap a zone → that zone's plan → tap an
enclosure → `/enclosures/[id]`.* Two levels, so two kinds of shape: zone shapes on the
overview, enclosure shapes on a zone plan. Ideally a user drills in without the list.

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
`enclosures.map_shape jsonb` (`[[x%,y%], …]`, null = not on the map); `zones.map_shape` for
the zone's outline on the overview; and `facility_maps(id, kind overview|zone, zone_id
(null for the overview), image_path, width, height)` — one overview row, one row per zone. Keyed on the enclosure id, so renaming never breaks it, and a new
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
- **Pan and pinch like Google Maps is a requirement, not a nicety.** The prototype's
  scroll-frame plus 1×/2×/3× buttons is **not enough** and must not ship. Build a
  small gesture layer on Pointer Events: one finger drags, two fingers pinch about their
  midpoint, double-tap zooms, wheel/ctrl-wheel on desktop, clamped so the plan cannot
  be lost off-screen, with `touch-action: none` on the map only. Both shapes and image
  sit in one transformed wrapper so they move together. ~150 lines, or the small
  `react-zoom-pan-pinch` library (zero deps, ~10 kB) — decide at build; no mapping
  library either way. Shapes need a hit-test that tolerates a drag (a gesture that moved
  more than ~8 px is a pan, not a tap).
- Shapes large enough to tap, and **two-step tap** (select → card with Open) so a fat
  finger never navigates by accident. Breadcrumb (Shelter › Zone) and a back button.
- Hosting: one `<img>` plus inline SVG, no server-rendered images, no new deps — fine for
  the Worker budget and the Pi origin. Plan images served from storage with
  long cache; resize to ≤2000 px wide on upload.

## 6. Public side

**No.** Visitors do not get a map: the per-enclosure QR codes already cover "what is
here", and a site plan with enclosure positions has no visitor value and mild
security cost. Staff only (`isShelterRole`).

## Prototype findings

`/enclosures/map-prototype` is single-level and lays three hand-drawn percentage polygons (real, live
enclosures) over a placeholder plan, with 1×/2×/3× zoom inside a scroll frame, tap to
select, and an Open button.

- Tap targets at 375 px wide: the plan is ~343 px wide, so a polygon covering 16% × 27%
  of the plan is ~55 × 56 px at 1× — over the 44 px guideline, and larger when zoomed.
  Real enclosures on a site plan will often be **smaller than that**; the 2×/3× zoom
  is what makes small kennels usable, so zoom is not optional.
- The recommendation's weak point: a dense kennel block at 1× will have shapes under 44 px.
  Mitigations already in scope: zoom, two-step select, and falling back to the list.
- Not verified in a signed-in browser by Claude this session (see the test plan).

## Still open

1. Who photographs the drawings, and can they be flat and well lit (a phone scan app is fine)?
2. Does the overview also want an On-site / Off-site cue, or on-site zones only? (Recommended: on-site only.)
3. OK with staff-only, and the Map / List toggle on `/enclosures`?
