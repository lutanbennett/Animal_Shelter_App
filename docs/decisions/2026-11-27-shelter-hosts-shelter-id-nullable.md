# `shelter_hosts.shelter_id` is nullable; `0397` made it NOT NULL by accident (#shnul)

**Decided 2026-11-27, stream `shelter-hosts-nullability`, migration `0448`.**

## How dev got NOT NULL (established, not inferred)

Not from a pre-existing table: dev's rows were all created at `2026-11-15 12:48:57`, the moment `0382`
ran, so `0382` created the table nullable and seeded `cooperjaidee.org` and `www.cooperjaidee.org` with
`shelter_id null`. Two later **blanket sweeps over every `shelter_id` column** then caught it:

1. `0390_stamp_shelter_id.sql` set `shelter_id = <lanna>` on every null row of every table with the
   column, and gave each one the default `current_shelter_id()`. That turned both front-door rows into
   Lanna rows. Its loop has no exclusion for `shelter_hosts`.
2. `0397_shelter_id_not_null.sql` set NOT NULL on every still-nullable `shelter_id`. Its pre-check found
   no null rows, because `0390` had just stamped them.

Measured on dev 2026-11-27: `is_nullable=NO`, default `current_shelter_id()`, and both cooperjaidee rows
join to the shelter `lanna`. **Both migrations ran in every environment, so UAT and production are
expected to match dev, but neither was read by this stream** (the planner confirms them before `0448`
is applied anywhere but dev).

## Decision: nullable is right

`shelter_hosts` is a routing map, not shelter data. `0382` designed the null row as the explicit
**front door**, which `shelter_host_kind()` tells apart from an unknown host, and `0426`
(`resolve_shelter_site`: "id null means no shelter (front door or unknown host)"), `0428`
(`shelter_hosts_primary_has_shelter`), `0445` and `0447` were all written on that shape. The sweeps were
about tables holding a shelter's records; nothing in `2026-11-17-shelter-id-not-null.md` considered the
host map. So the migrations are right and the live column is wrong.

`0448` drops NOT NULL **and the default** on this one table. The default goes too because it is the same
fault in miniature: an insert that omits `shelter_id` would silently take the request's shelter, when a
front-door row must be an explicit null. The only insert (`0414`'s `product_admin_map_host`) passes
`shelter_id` explicitly, so nothing changes at run time. Every other table keeps `0397`'s NOT NULL.

No null-handling code is dead under this decision (deliverable 6 of the brief only applied to the
opposite answer).

## NOT done, and why: the two cooperjaidee rows still point at Lanna

Setting them back to null would restore `0382`'s design, but it changes which shelter header the live
apex sends on production (the apex is a `custom_domain` route and `PLATFORM_HOST` there). The apex is
limited to `/platform`, `/login` and a few other paths (`2026-11-20-platform-console-apex-closed.md`), so
the effect is probably small, but this stream cannot read production and that is a change in what
production does. **For the planner to file and decide:** whether the apex rows go back to null, after
reading production's `shelter_hosts`.
