# 2026-10-04 — `home-screens`: where a sign-in lands, how a tablet is decided, and what the switch does

F2's last piece, `docs/roles-and-permissions.md` §8 (Lutan's per-role-pages steer) with L2 answered:
**one login for the Director, the home follows the device.** App-side only: no migration, no policy,
so the parity check's baseline has not moved. With `permissions-sweep-residents`, `-medical` and
`-rest` already in (#336, #340, #342), **F2 is complete**: nothing remains between the foundation and
building the roles. §12: "F2 has to be complete before the first configured role exists."

## What was built

- **`/home`** is where a sign-in lands (`DEFAULT_SIGNED_IN_PATH`, was `/my`). It decides, then
  redirects or draws. `/my` still exists and is the first tile for anyone who has tasks.
- **A home is `routesFor(perms)` drawn as tiles** (`src/lib/home/tiles.ts`), not a list per role.
  A role a shelter adds is coherent the day it exists. The two pages that ask no activity, My tasks
  and Residents, lead; the registry supplies the rest.
- **`/home/[role]`** shows another role's home as that role sees it, read with Admin's own session
  (`roles` and `role_permissions` are admin-read-only, 0132). **`HomeSwitch`** is the row of links
  over it and over Settings.
- **Admin's landing**: phone → `/home/management`; anything else → `/admin` (Settings).

## The device rule (the one that decides what the Director sees every morning)

It is **the browser's own statement, read on the server**, not a measured width and not a stored choice
(`src/lib/home/device.ts`, tested in `scripts/check-home-screens.mjs`):

1. `Sec-CH-UA-Mobile`: `?1` is a phone, `?0` is not. It wins over the user-agent, so a phone told to
   *request desktop site* is a desk, which is what she asked the browser to be.
2. Otherwise the user-agent: `Mobi`, `iPhone` or `iPod` is a phone.
3. Anything else is a desk.

**Why not the other two.** A *breakpoint* is only known after the page has painted: landing on one
screen and jumping to the other is a flicker she would see every morning, and the redirect cannot be
made by the server at all. A *stored preference* is the opposite of "follows the device": she would
tap Settings once at night on the phone and wake up to Settings, or the reverse. So the rule is asked
afresh at every landing and nothing is remembered.

**A tablet is a desk, and the rule does not pretend otherwise.** No browser says "tablet": an iPad
announces itself as a Mac, an Android tablet drops `Mobile` from its user-agent. So both fall to rule 3
and land on Settings, which is the larger screen's home. That is the safe side of the guess: Settings is
what a tablet-sized screen is good for, Management's tiles are one tap away in the switch, and nobody is
locked out of either. If a tablet ever matters more than that, the answer is a stored per-device
preference, written by the switch, read only when rule 2 cannot decide. It was not built, because no
one on site has one (no PCs, phones only, and the Director's own larger screen is a desk).

## What the switch does

- **It is Admin's, and the server refuses everyone else.** `/home/[role]` returns `refuse()` (the
  in-app `/no-access`) unless `perms.isAdmin`, for every role including a role asking for its own key
  (a non-Admin's home is `/home`). Hiding the switch is courtesy; `HomeSwitch` is drawn only for Admin
  and the page does not depend on that. Second lock: `listHomeRoles` and `loadRolePermissions` read
  tables RLS lets only Admin read, so a page that forgot the check would still render nothing.
  `scripts/check-home-screens-live.mjs` proves it against dev: management, staff, volunteer and vet
  each opening `/home/management`, `/home/staff` and their own key are all refused, and none of them
  is shown the switch on Settings.
- **It lists whichever roles exist**: every live role that opens the app except Admin (Admin's homes
  are Settings and the others), Management first. Today that is **Management, Staff, Vet, Volunteer**,
  after Settings. The 2IC, Maintenance and Medical are rows nothing has created; each appears the day
  its row does, with no change here.
- **A role with no tiles** gets a home that says so, not a 404. A role holding only Settings
  activities gets its Settings pages as tiles (the rule that a role's home leaves Settings out gives
  way rather than leaving it empty). A role that does not exist, is archived, or does not open the app
  (the public viewer) is a 404.
- **It shows the screen; it does not become the role.** The tiles open the real pages as Admin.
  That is what "see what the 2IC sees" needs: the screen, not a demotion.

## Decisions worth keeping

**1. Two pages with one word are one tile.** Contacts is `/contacts` (the read page) and
`/management/contacts` (the manager); Vets likewise. Of one activity, the tile opens the page the role
holds at the higher level; of two activities (Enclosures, and the map prototype that shares its word),
the menu's page. Found by the live harness, which showed a volunteer's Enclosures tile opening the
prototype.

**2. A role's home leaves out `/admin/*`.** Settings is Admin's night home (`/admin`), not a role's
tasks, and it stays reachable from the sidebar for any role that may open one of its pages.

**3. Ordering is hand-chosen for the defaults and falls back to registry order.** `ORDER` in
`tiles.ts` is the whiteboard's order for Management and Staff; a role not listed is in registry order.
It lives beside the registry, not in it, because a home belongs to a role and a page belongs to a task.

**4. `RouteEntry` gained `scope`, and `/appointments` is now registered.** The medical sweep's
Departure 1: staff, Management and Volunteer hold `medical.visits` but are refused the vet's page, so a
registry entry without a scope would hand them a tile it refuses. `canOpen()` honours
`scope: { clinical: "own_clinic" }`; the page's own guard is unchanged and the catalogue check still
reads it. **The other record-scoped pages stay unregistered**, as the residents sweep decided: if a
tile cannot be drawn that is the contract working.

**5. The vet's landing is its scope, not its name.** `/home` sends anyone whose clinical scope is their
own clinic to `/appointments`, as `/my` did by role name before. `roles.home_path`, when a role has
one, wins over the default for non-Admin roles; no role has one seeded, so nothing changes today.
`signedInLandingPath` and `/my`'s vet redirect still name the role and stay until the vet is migrated.

## What this does not do

- **The Director's curated daytime screen.** Management's home today is every page Management can open:
  **19 tiles**, not the whiteboard's five. That is the mechanism working before anyone has curated it;
  `management-phone-home` and `recurring-jobs-phone` build the real screen on it.
- **The volunteer's "Residents and Enclosures" home (§12 R1)**, which is `volunteer-schema`'s.
- **A sidebar built from the registry.** `NavLinks.tsx` gained only a Home link; building the menu
  from `ROUTES` is a separate piece and wants `icon-buttons` (batch 44) out of `hub-icons.ts` first.
