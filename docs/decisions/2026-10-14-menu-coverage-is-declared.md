# Menu coverage: reachability is declared, not discovered (2026-10-14)

Lutan, 2026-10-13: "we won't remove the navigation until we are satisfied that everything is covered." This turns that
into a test: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-menu-coverage.mjs` (dev only, read-only;
`--role=<key>`, `--lang=th`). It exits 1 while any orphan is unexplained.

## What it computes

For each non-Admin role that opens the app: every page it may open (route registry through `canOpen`, the pages outside
the registry, the three landings) against what it can get to **without `NavPane`**: its home tiles (the exact
`homeTilesFor` the home draws, from the role's live `role_cards` and cells), the header and account menu, and pages
reachable from those. Anything it cannot prove reachable is an **orphan**.

## Why declared, not crawled

A crawl that misses a link (a link built in a client component, behind a condition, from a string) reports the page as
unreachable in one direction and, worse, a crawl that finds any mention of a path reports it reachable when the link is
only shown to another role or is not a link. The falsely clean list is the failure that costs a member of staff a page
with nothing on screen to explain it. So the relationships are written down in `scripts/lib/menu-coverage-declared.mjs`:
chrome entries, deep pages with their parent, and the landings. **Each entry names the file and the string that make it
true and the script re-checks that on every run; an entry whose proof has gone is ignored and its page becomes an orphan
again.** Landings are the one place the script reads source for lists (the `href:` tiles of `/operations`, `/management`,
`/admin`), because those lists are the thing being relied on.

Cost: a new deep page does not count until someone declares it, so the list errs towards over-reporting, deliberately.
And a declared link proves a link exists in a file, not that this role sees it (a conditional is not evaluated);
`needs` on an entry covers the two cases known today.

## Accepting an orphan

`ACCEPTED` in the declared file is empty and stays Lutan's: an entry needs a role (or `*`), page, reason and
`acceptedBy`, and one without them is ignored. Nothing is silently excluded in code.

## What a clean run does and does not prove

Proves: every page each role's cells open has a route to it from a tile, the header or a declared parent. Does **not**
prove: that staff know the route, that a tile's page links to the declared child on every viewport, pages not in the
registry that nobody declared, a role with no cards on dev (the output says which were exercised), or a person holding
several roles. A role whose home redirects (`home_path`, a clinic login) is checked from the page it redirects to, and a
redirect to a page its cells refuse is reported as a broken home.

## Badge counts

The menu's one badge, My tasks, is the sum of overdue/due-today access requests (Admin), maintenance and recurring jobs.
`loadUrgentCounts()` (`src/lib/my-tasks/urgent.ts`) is now the single definition, used by the menu and the home. A tile
for `/my` (derived homes) carries the total; the Maintenance tile carries the maintenance share. **There is no My tasks
card, so a card-built home has no tile for `/my` and the total has no home there**; adding that card is Lutan's call
(the card set is agreed at twenty-one) and is reported in the PR, not answered.
