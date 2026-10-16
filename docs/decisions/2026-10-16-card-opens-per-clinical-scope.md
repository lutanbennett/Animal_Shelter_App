# 2026-10-16 — A card can name a different page for shelter roles (`opensAny`)

**Bug.** Management was given **Book clinic visits** and got no tile. The card opened `/appointments`, which is the
clinic login's own page (`scope: { clinical: "own_clinic" }`), so `canOpen()` refused it for Management (scope `any`)
and `cardTilesFor()` dropped the tile without a word.

**Choice: per-scope `opens`, not a re-point.** Re-pointing the card at `/upcoming-visits` would have fixed Management
and broken the vet, who holds the same card and can open only `/appointments`. So a card keeps `opens` (the clinic
login's page) and may add `opensAny`, the page for a role whose clinical scope is `any`. `cardOpens(card, clinical)` is
the one place that chooses; `cardTile()` and the "stands for another card" rule both go through it. It is more machinery
than a re-point, but the next card of this shape is declared, not discovered by a missing tile.

**No access changes.** No route's scope was touched and no role gained a page: each role's tile now leads to a page it
could already open. Loosening `/appointments` would have made the tile appear and quietly handed the vets' page to a
shelter role.

**The guard.** `scripts/check-home-cards.mjs` (check 5) builds, for each clinical scope, a role holding exactly one
card's bundle and requires its tile to be drawn on a page that role can open. A card that opens a clinic login's page is
checked at both scopes; a shelter-only card (the medical jobs) at `any`. Shown red on two planted faults (no `opensAny`;
`opensAny` pointing at `/appointments`) and restored.

**Who does what** now warns on a held card that draws no tile, and says on **View residents** that Management's home shows
it as part of **Residents** (the `subsumed` rule), so that is not filed as a second bug.
