# 2026-10-08 — Facility map plans are uploaded and replaced in the app

**Supersedes the storage section of `2026-10-05-facility-map-editor.md`** ("The one real decision: where plans
are stored — committed files, no upload") and the *Add a plan* and *Shared files* notes that follow from it.
The rest of that file (the drawing tools, rooms, who, the per-screen table) stands.

## What changed, and why it is a reversal

The 2026-10-05 file chose committed WebP files in `public/facility-maps/`, registered by file name: about five
plans for the life of the system, loaded by Lutan, so an upload path was not worth a stream. Lutan reversed that
on 2026-10-05 (backlog: *Facility map plans uploaded and replaced from the system*): **a new drawing must not
need a developer or a deploy.** Two new drawings (House Zone, revised Main Zone) were the trigger. The old file
foresaw this — "only `planImageUrl` and `addPlan` change; the map and the editor read the URL, never the path" —
and that is what happened: the read-only map on `/enclosures` is untouched.

## Where the pictures live: a private Supabase Storage bucket

Bucket `facility-maps`, private, created by the app on first upload (no setup step per environment), limited to
5 MB and WebP / PNG / JPEG at the bucket as well as in the code. Only the service role touches it: the upload
actions after their `facility.enclosures` check, and the image route after its sign-in check. So the bucket
needs **no storage policies and no migration**.

- `facility_maps.image_path` keeps its meaning as "where the picture is": `storage:plans/<plan id>/<millis>-<random>.<ext>`
  for an uploaded plan, a bare file name for one still committed in `public/`. `planImageUrl` maps the first to
  `/api/facility-maps/…` and the second to `/facility-maps/…`. No column changed.
- **Read by signed-in staff only.** `/api/facility-maps/[...path]` answers 404 to a signed-out request, a login
  with no app access (`my_permissions` null), and any name that is not the exact upload pattern — the same 404
  for each, so nobody outside can tell a plan exists. (`proxy.ts` already sends a signed-out request to `/login`
  first; the route's own check is the second line.)
- **Cached for a year in the viewer's browser, `private`** (never at the edge). Every upload has a new name, so a
  replaced plan is a new URL and shows at once. That is the "long cache keyed on a version" the item asked for,
  with the name as the version.

Rejected, as the item expected:

- **Google Drive.** The rest of the app's uploads go there, and the brief said to follow the existing path. Not
  here: the 2026-09-25 outage (the Drive OAuth client in Testing mode, every upload broken for a week) would make
  the *map* unopenable, not just an upload fail, and the photo proxy is a Drive fetch on every cache miss.
  Storage is in the same Supabase project the map's rows are, so if Storage is down so is the map anyway; it adds
  no new way to fail. Nothing here depends on the Pi either: the image route runs wherever the app runs.
- **base64 in the row:** a megabyte in every `/enclosures` read.
- **A new table for history** (or an audit trigger on `facility_maps`): schema, and this stream was told no
  migration. See *Who replaced it* below.

## The gate on a file

`src/lib/facility-map/plan-image.ts` reads the type and pixel size from the file's own bytes — PNG `IHDR`, the
three WebP chunk kinds, a JPEG's start-of-frame — and the server uses those, never the browser's. Refused, each
with a sentence a non-technical person can act on: not WebP / PNG / JPEG (an SVG included), over 5 MB, under
100 px on a side (the committed Cat Zone crop is 145 × 210, and is accepted), over 8000 px.

**SVG is refused, not sanitised.** Every drawing program saves a PNG; an SVG is a document that can carry script,
and a sanitiser has to be right forever. The message says "save it as a PNG".

**Re-encoding happens in the browser, not on the server.** The Worker has no image library and the Pi is the
production origin; neither should decode a 12-megapixel photo. The editor opens the chosen file as a picture
(which proves it is one), and anything that is not already a WebP or PNG within 3000 px and 5 MB is drawn onto a
canvas, scaled to 3000 px on its longest side and saved as WebP (JPEG where the browser cannot write WebP). That
also bakes in a phone photo's EXIF rotation, which matters: the server reads a JPEG's *stored* size, and a
rotated photo would otherwise get its width and height swapped and every shape stretched. A clean WebP or PNG
export is sent untouched, so it stays sharp. The server still checks the bytes either way.

## Replacing a plan — the hard part

Shapes are percentages of the picture (`0142`), so a new drawing with a different layout or crop puts every
shape in the wrong place, silently. *Replace this plan* therefore:

1. **Shows the new picture with the existing shapes drawn over it before anything is saved**, and says how many
   enclosures (and rooms) are placed on the plan.
2. **Asks:** *Keep them* (same drawing, a sharper copy) or *Clear them and place them again* (a new layout). A
   picture whose proportions differ from the current one by more than 2% defaults to *Clear*, with a sentence
   saying the shapes cannot line up. A plan with nothing placed asks nothing.
3. **Never leaves the old picture deleted.** The new picture is stored under its own name first; the row is
   changed only after that worked; the old picture is never deleted. A failure part-way leaves the plan as it was.
4. **Keeps history, and Undo.** Each plan has `plans/<id>/history.json` beside its pictures: every add, replace
   and undo, when, by whom (login id and name), from what to what, and — for a replace that cleared the shapes —
   the shapes it took off. *Undo the replace* puts the previous picture back and, if the shapes were cleared,
   puts them back too (anything placed on the new picture since is taken off, because it was placed on a layout
   no longer shown). Only the latest replace, and only while the plan still shows its picture; the history
   record is written before the shapes are cleared, so what was taken off can always be put back.

"Clear" covers what is drawn on that plan: on a zone plan, that zone's enclosures; on the overview, the zones'
outlines; on either, any of the three rooms (`map_rooms`, `0157`) drawn on it.

## Who replaced it: the plan's history, not the audit log (yet)

The item says "record who replaced it (the audit log, `0121`)". `audit_log` is fed by triggers, and
`facility_maps` has none: adding `audit_facility_maps` is a two-line migration, which this stream was told not to
write (`contacts-address-map-schema` holds `0164`). So who and when are in the plan's history file, shown in the
editor under the plan ("Replaced 8 Oct 2026, 14:05 by …"), and the backlog has a follow-up for the trigger so
*Recent changes* sees plan replacements too. Nothing about the history file needs to change when it lands.

## The three committed plans

They keep working: a bare file name is still served from `public/facility-maps/`. Each one in the editor now says
it is "in the app's code" and offers **Move into the app's storage**, which fetches that same file in the browser
and uploads it as a replace that keeps the shapes. Once every environment's plans have been moved (dev in this
PR's verification; production by Lutan after the release), the files are deleted from `public/` in a small
follow-up PR (backlog). They are **not** deleted here: production's rows still point at them until someone moves
them, and deleting first would blank the production map.

They are no longer world-readable regardless: `proxy.ts`'s matcher stopped skipping image extensions some time
after the 2026-10-04 note, so a signed-out request for `/facility-maps/main-zone-blue.webp` is sent to `/login`.

## Who, and on what screen

Unchanged, and deliberately not widened: `facility.enclosures` at *edit* — Admin only since `0150` (management
holds Read; whether management should get the map without every enclosure is its own open backlog item, and
still open). The same check is in every action, and RLS on `facility_maps`, `zones`, `enclosures` and
`map_rooms` is the real boundary for the shape writes. The editor
keeps its *Best on a larger screen* notice — drawing twenty kennels is desk work — but **adding or replacing a
picture works on a phone**: the file input takes `image/*`, which offers the camera, and every control is 44 px.

## Found on the way: adding a plan for a zone is broken by `0162`

`refuse_lifecycle_map()` (shared by `zones`, `enclosures` and `facility_maps`) was rewritten in `0161`/`0162` with
`if (tg_table_name = 'zones' and new.name = 'Lifecycle') or …`. PL/pgSQL does not short-circuit that into
skipping the field lookup, and `facility_maps` has no `name`, so **every insert of a zone plan fails** with
`record "new" has no field "name"` — on `main`, before this branch, through the old file-name *Add a plan* too.
Replacing a plan (an update of `image_path`) and adding the overview (no `zone_id`) are unaffected. The fix is a
nested `if` in a new migration, which this stream may not write. Lutan (2026-10-08): it goes into the schema PR
already in flight, #463 (`claude/contacts-address-map-schema`, `0164`, commit `ace66c3c`: the name check now sits inside the zones branch; tested on dev in a rollback, before and after). Until that is applied, *Add a plan* for a
zone with no plan yet (the House Zone) fails.

## Per-screen table

| Screen / thing | Reads | Writes | Gate / trap |
|---|---|---|---|
| Add a plan (`uploadPlan`, `mode=add`) | the file | Storage object, `facility_maps` insert, history | bytes checked; `23505` → "already has a plan, replace its picture" |
| Replace (`uploadPlan`, `mode=replace`) | the plan row, its shapes | new Storage object, row's `image_path`/`width`/`height`, history, then (Clear) shapes | object first, row second, history before the shapes go |
| Undo the replace (`undoReplace`) | history | row back, history, (if cleared) shapes back | only the latest replace, only while it is still the picture shown |
| Move into the app's storage | the committed file, in the browser | as Replace, keeping shapes | same path as a replace, so nothing new to trust |
| `/api/facility-maps/…` | Storage | — | signed in with an app role, exact name pattern, else 404 |
