# #vleak: public_resident_cards and public_shelter_stats now filter by shelter (0391), and the canary now proves it

**Status: built, applied to dev, `KNOWN_TODAY` emptied.** Not applied to production: it goes in an ordinary later release.

## What changed
- `0391_public_views_scoped_by_shelter.sql` re-creates both views column for column. `public_resident_cards` gains `where r.shelter_id = current_shelter_id()`. `public_shelter_stats` counts only rows (residents, `placement_history`, prescriptions through their resident) of that shelter. `public_enclosures` joins the cards view, so it scopes too. Both stay owner-run; the header is a request setting, so it still reaches `current_shelter_id()` through the view.
- **The earlier "Part 5 scopes it" in `KNOWN_TODAY` is out of date and was wrong to wait for Part 5.** 0390 (stamp and default) made the column filterable; the policies (#ujqr5) are not needed for a view. Both entries are removed; the list is empty.

## 0350's "the kennel card always answers"
Kept **for the caller's own shelter** (it still ignores `is_public_visible`). What ends is answering for another shelter's residents and for a request with **no header**: `current_shelter_id()` is null, so the filter is never true and anon with no header reads 0 rows from the cards view and 0 from every stats count (counts stay 0, not null, so tiles still read "nothing to show").

## The two questions the brief set
- **Does `check-public-views.mjs` go red on "readable but empty"?** No. Its test is `read.ok` (HTTP status); CI has no `TEST_SHELTER_ID` variable (`gh variable list` is empty), so anon there sends no header and reads empty with HTTP 200. Measured after the apply: 0 FAIL lines. So no open PR goes red from this.
- **Was the canary's pass real?** It was not going to be. It runs as `set local role anon` over the Management API with **no header**, so after scoping both readings are empty and the diff vanishes because nothing is visible, not because the view is scoped. Fixed here: the canary now sets `request.headers` to Lanna's id for every read, **refuses to run (`NOT CHECKED`) if `public_resident_cards` reads empty as Lanna**, and then plants shelter B and requires Lanna's view of every anon object to stay byte-identical. The baseline holds real rows, so a pass means B's rows were kept out. Limit: it proves B is hidden from Lanna, not that Lanna is hidden from B (one planted direction).

## Localhost
A `localhost` session sends no header, so these two views read empty on dev. `tenancy-localhost-shelter` owns that. No Lanna fallback was added to `current_shelter_id()` (rejected 2026-11-15).

## For `#ujqr5` (the planner's, not edited here)
Views can be scoped with the header alone; only table policies need `NOT NULL`/Part 7. Any other owner-run public view that counts tenant tables could take the same one-line filter.
