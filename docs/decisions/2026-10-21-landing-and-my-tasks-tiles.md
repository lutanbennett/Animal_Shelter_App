# My tasks, Operations and Management as home tiles (menu-removal orphans 1 of 6)

Lutan ruled 2026-10-20: My tasks becomes a tile with the open-task count, and Operations and Management are tiles on
the homes of the roles that can open them.

**The tiles follow the menu's own tests, not role_cards.** `landingTiles()` in `src/lib/home/tiles.ts` adds My tasks
for any role holding `recurring.do_own` (the menu's `hasTasks`) and each landing for any role that `opensAnyIn()` it
(the landing's own guard). So the five roles that open `/my` have it today with no seeding and no migration, a role a
shelter creates gets it the moment its cells allow, and the tile can never point at a page that refuses the reader.

**The My tasks card still exists** (`my_tasks`, bundle `recurring.do_own` only, opens `/my`), as Lutan asked: it is how
Admin gives a new role its own tasks on Who does what. A role holding it draws one My tasks tile, never two. It is not
seeded onto any role, because the five roles already hold `recurring.do_own` through other cards or extras.

**The count drops by 51, not 12.** `check-menu-coverage.mjs` on dev went 66 → 15. The 12 named rows are gone; the other
39 are pages that the Operations and Management landings list, which the script already follows from a reachable
landing. That is the landings working as intended, not a miscount. The 15 left (Add photos, Feed Special Diets, Record
Weight, Add Medical Photos, Bills, Residents for the two Heads) belong to orphan groups 2–6.

**Not done, on purpose:** the left-hand menu stays; Operations and Management stay fixed pages, not Admin-built groups
(the next item).
