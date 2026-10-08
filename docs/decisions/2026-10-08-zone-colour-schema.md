# Zone colour: the column checks the form, the app owns the palette

2026-10-08, `claude/zone-colour-schema`, migration `0162_zone_colour.sql`.

**Decided:** `zones.colour` is nullable text checked only for the form `#rrggbb`
(either case). Null means no dot. It is **not** checked against a list of the
palette's values.

**Why not a list:** the backlog item asks for about ten named swatches tuned to
read in both light and dark themes at about 3:1. Contrast tuning is exactly the
kind of change that moves a hex value by a few points, and a list in the
constraint would turn every such tweak into a migration, with existing rows
needing an update in the same file. With the form-only check, a retuned swatch is
an app change; rows holding the old value still show a dot, and the Settings
screen can offer to move them to the nearest swatch if that ever matters. A
colour typed into the API directly is still a valid colour, just off-palette.

**Why `#rrggbb` and not a swatch key (`'blue'`):** a key would tie the database to
the palette's naming and need a lookup on every screen that draws a dot,
including the vet's and the volunteer's views, which read zones only through
views. A hex is self-describing wherever it lands.

**The views:** five views read `zones` on dev (found by `pg_depend`, not by
grepping the migration files, because `resident_list_view`'s live definition
already differs from the last file that wrote it — it joins
`private.resident_current_state`). Four carry zone names and gain `zone_colour`
as their last column: `resident_list_view`, `resident_who_and_where` (the
volunteer's), `medication_list_residents` and `special_diet_list`. The fifth,
`private.resident_current_state`, carries only the zone id. `public_enclosures` is
the public site's and is left alone: zones are not shown there.

**Lifecycle:** the pseudo-zone takes no colour, refused by the same trigger
function that already refuses it a map shape (0142) and an order (0161).

**One open question for the feature half:** the palette in the item lists blue,
green, yellow, orange, red, pink, purple, brown, grey and teal, but the site
already names zones **sand** (the House Zone) and **white** (the Front Zone). The
column accepts both; the palette needs to decide whether they are swatches.
