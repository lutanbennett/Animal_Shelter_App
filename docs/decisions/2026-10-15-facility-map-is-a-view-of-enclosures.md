# The facility map is a view of the enclosures, not a right of its own (2026-10-15)

Lutan, 2026-10-15: whoever can see enclosures should be able to see them on the map too.

**Decision.** `/enclosures` no longer asks `facility.map`. The Map tab shows whenever the page
loads (the page already requires `facility.enclosures` at Read) and a plan image exists. The
manual topic and the acceptance matrix now name `facility.enclosures` instead.

**Why no card ever granted it.** The cards work (`cards.ts`) put the facility map and rooms in
"belong to no card (accepted)", so a login built from the Enclosures card could read the list
and never the map. The map reads the same rows as the list, so a second yes/no gate protected
nothing and only produced that gap.

**What is left.** The `facility.map` catalogue row, `permission_activities` row, seeded
`role_permissions` cells and `role_extras` rows are orphaned but harmless (nothing reads them).
Removing them is a follow-up schema PR, filed on the `backlog` branch because this batch's one
migration slot belongs to `map-rooms-column-drop`. `check-permission-parity.mjs` and
`check-cards-schema.mjs` still name the activity, correctly, until that migration lands.

**Exposure.** The seeds (0132) gave `facility.map` to management, staff and volunteer, the same
three that hold `facility.enclosures` Read, so for seeded roles nothing widens. Roles created
since (second_in_command, head_of_*, doctor, public_viewer) are the ones to check live. The plan
images were already served to any signed-in login (`/api/facility-maps`, 0142), so the images
are not new exposure.
