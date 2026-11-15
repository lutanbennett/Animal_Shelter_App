# Admin reaches every sectioned page through its hub (#fc7te)

**Re-measured 2026-11-15.** Of the nine candidates the item named, seven really were unreachable and two were not: `/appointments` is reached by the nav pane (NavPane `canAppointments`) and `/suppliers` is a supplier's own page whose list, `/management/suppliers`, is already a hub tile. The check then found two more the item had not listed: `/memes` and `/reels` (reachable only from a resident's page).

**Added to the Management hub**, each gated `canOpen(perms, routeFor(path))`, no role key, no card list, Admin passes via `perms.isAdmin`: `/management/merch-shop`, `/admin/shop` (a different page, `shop.manage`), `/management/animal-reports`, `/management/expenses`, `/management/foundation-papers`, `/management/foundation-papers/board-ids` (its own tile: the parent page does not link to it), `/text/approve` (Management: it is a review queue for staff; it gained `section: "management"` in the registry, as did board-ids), `/memes`, `/reels`.

**Blind spot:** a NEW check, `scripts/check-section-hubs.mjs`, not a change to `check-menu-coverage.mjs`, whose subject is one card and which skips Admin by design. It reads the registry and the three hub pages as text and fails on any sectioned route with no `href` tile. Proven: it listed 10 missing before the hub change, 3 after (memes, reels, and who-does-what, which the hub opens through a constant and is accepted with that reason), 0 now. Wired into the `hard-coded-security` CI job.

**Not done:** Admin was given no cards. Operations and Settings hubs were not changed (nothing missing there). Card-holder (one-card login) pass: not run.
