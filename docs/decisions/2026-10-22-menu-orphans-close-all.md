# Menu orphans closed: 15 → 0 (2026-10-22)

Stream `menu-orphans-close-all`. `scripts/check-menu-coverage.mjs` on dev: 66 → 15 (earlier streams) → **0**. It surprised nobody on
count: the six leaf pages closed exactly their 15 rows and no more.

The six cards already existed in `cards.ts`; the orphans were roles not being *given* them, which is `role_cards` data, not code.
Two mechanisms, by what each card needs:

- **Tile only, in code** (`RULED_CARDS`, `src/lib/home/tiles.ts`, drawn after a card home like `landingTiles`' other tiles):
  View residents → head of maintenance, head of medical; Record Weight, Add Medical Photos, Feed Special Diets → management, 2IC;
  Bills → management. `cardTile()` still demands the cells cover the bundle, so **nothing is granted**; production needs no manual step.
- **Add Shelter Photos** (doctor, head of medical, management, 2IC) bundles `photos.shelter_add`, which none of them held, so it is a real
  grant and stays data. On **dev** the card and that cell were assigned by SQL (4 role_cards rows, 4 role_permissions rows).
  **Production: the Director ticks Add Shelter Photos for those four roles in Who does what.** Until then they keep the left menu,
  which is not being removed here.

Findings, not changed: `check-cards-schema.mjs` on dev reports pre-existing drift for `doctor` and `dryrun_photo_viewer_d6b305`, and a
harness error from the last-approver guard; none involves the cells touched here. The `menu-removal` item is now unblocked but is not this stream's.
