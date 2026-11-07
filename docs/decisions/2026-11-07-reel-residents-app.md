# A reel's tagged animals, app half (backlog #v3h8m)

Follows `2026-11-07-reel-residents-schema.md`; nothing in that decision was re-opened.

## What changed
`src/lib/reels/queries.ts` no longer embeds `residents(...)` in the `reel_residents` read. It calls `reel_resident_tags(p_reel_ids)` (0330) once for the page of reels.
`named = true` rows become the reel's `residents`; every other row is counted into a new `unnamedCount`. The library tile and the reel page draw
"N animals tagged, you cannot see which" (`reels.taggedUnseen`, English and Thai) when `unnamedCount > 0`, and "No animal is tagged" only when there are no rows at all.
The resident filter is built from named rows only, as the schema decision said it must be.

## Found and settled: the `#` picker
The schema half feared `src/app/api/residents/tag-search/route.ts` (asks `resident.record`) blocked a `reel_add` login. It does not matter: `ReelForm.tsx` already searches
`/api/reels/resident-search` (asks `resident.who_and_where`, reads the `resident_who_and_where` view, 0329). The general route is not used by reels.

## No new control, so no new gate
Only text changed. Nothing grants anything; the function is `SECURITY INVOKER` and still returns names only where the login could list residents by name.

## Proved
Dev, a login holding exactly `reel_view` (`dev-signin.mjs --cards reel_view`): `/reels` shows "1 animal tagged, you cannot see which" on both tiles
where it used to show nothing. Not driven on screen: a `reel_add` login (named rows, proved at the data level by the schema half).

## Found, not fixed
Saving a reel from the edit form rebuilds links from the tags the editor can see; a login that can edit but not name every animal could drop a link it cannot see. `reel_add` carries
who-and-where so it sees every name today; worth re-checking if the cards are rebuilt.
