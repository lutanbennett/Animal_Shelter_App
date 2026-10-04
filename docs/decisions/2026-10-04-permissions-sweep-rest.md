# 2026-10-04 — `permissions-sweep-rest`: F2's last sweep, what moved, and what stays on purpose

F2, the rest of `docs/roles-and-permissions.md` §15. App-side only: no migration (`0134`
stays free for `perm-convert-medical`), no policy. It follows
`2026-10-03-permissions-catalogue.md`, `2026-10-04-permissions-sweep-residents.md` (#336) and
`2026-10-04-permissions-sweep-medical.md` (#340), and takes `2026-10-04-role-can-app.md`'s
handover for `eligibility.ts`.

## What moved

| Was | Now |
|---|---|
| `requireManagementUser()` / `hasManagementRole()` / `canManage()` / `MANAGEMENT_ROLES` (file deleted) | each Management page and action asks its own activity (table below) |
| `requireAdminUser()` / `hasAdminRole()` on every `/admin` page and action but Security | the page's activity (table below); Security keeps an Admin rule |
| `isShelterRole()` / `SHELTER_ROLES` (deleted) on `/enclosures`, `/maintenance`, `/projects`, `/contacts`, `/vets`, `/e/[id]` and the menu | `requirePermission(<activity>, "read")`; the menu and `/e/[id]` ask the registry |
| `canWriteMaintenance` / `canReadMaintenance`, `canWriteProjects` (deleted) | `maintenance.jobs` Edit / Read, `projects.folders` Edit |
| `canUseAssistant` / `canWriteWithAssistant` / `ASSISTANT_*_ROLES` / `loadAssistantRole` (deleted) | `assistant.ask`, `assistant.record`; `AssistantContext` carries `canAsk` instead of `role` |
| `canReadRecurringJobs` / `READ_ROLES` (file deleted) | `perms.role.opensApp` ("a role that opens the app has tasks"); not an activity |
| `assertPhotoWriteAccess()` in the **projects** and **maintenance** photo routes | `projects.photos`, `maintenance.photos` |
| `contactRelation(role)` / `contactNameEmbed(role)` | the role's contacts scope, `perms.scopes.contacts` (`full`, `name_phone`, `name_type`) |
| `NavLinks`' `isAdmin`, `canManage`, `isShelter` | `canSecurity`, `canSettings`, `canManagement`, `hasTasks` and one boolean per link, each from the registry |
| inline `role === "admin"` / `"staff"` / `"volunteer"` in `/my`, `/releases`, the enclosure hub, the doctors table, the maintenance board's default filter, the Shelter Friends draft count | `perms.isAdmin`, `can(...)` (the board's "open on my own jobs" is `!can(perms, "recurring.do_any")`: whoever cannot mark anyone's job opens on their own) |
| manual topics (34) and acceptance rows (46) | `activity` / `activityLevel` and `needs`; `acceptance-matrix.mjs --check` fails if a tag disagrees with the seeded holders |

Page → activity: `/management/dashboard` `reports.dashboard`, `contacts` `contacts.directory`,
`shelter-friends` `friends.manage`, `vets` `clinics.list`, `vets/[id]/doctors` `clinics.doctors`,
`medications` and `medication-list` (read) `stock.medications`, `diets` and `units` `stock.diets`,
`recurring-jobs` `recurring.manage`, `stock-usage` `stock.usage`, `cashflow` (and fixed outgoings)
`reports.cashflow`, `translations` `translations.manage`; `/admin/website` `website.content`,
`enclosures` and `zones` `facility.enclosures`, the four type lists `reference.types`,
`recent-changes` `audit.view` (its undo action `audit.undo`), `status` `system.status`. Twenty-six
pages were added to the registry (29 in all).

Every truth table was written to `scripts/fixtures/legacy-predicates.json` **before** its list was
deleted (new rows: `isShelterRole`, `isAdminRole`, `canReadRecurringJobs`, `contactRelation`), and
`check-permission-parity.mjs` is green before and after, with the new rows paired to the activities
or seeded scopes that replaced them.

## Decisions worth keeping

**1. Landing pages are not registered; they open for whoever can open a page under them.**
`/management` and `/admin` are grids of other pages and have no activity. `requireAnyPageUnder(prefix)`
(`permissions/require.ts`) refuses unless the person may open at least one registered page under the
prefix, and the grid shows only the tiles they may open (so Settings, which today only Admin holds
anything for, still opens for Admin alone). The sidebar's Management and Settings links ask the same
question. A role given only `translations.manage` sees Management with one tile, which is the point.

**2. The three eligibility rules went the way the handover said, with two additions.**
`/maintenance` is now its route entry; `/management` and `/admin` are decided by "any of the pages
registered under them". Because the maintenance board opens at **Read** but doing its work is
**Edit**, `RouteEntry` gained `jobLevel` (the level a recurring job linking there needs, when it is
higher than the one that opens the page). `needsForLinks(paths)` lets My tasks ask `role_can()` only
about the pages its own jobs link to: registering every page took the cells from three to twenty-five,
and one call per cell on every volunteer's home page was not acceptable. The rota page and its save
action ask for everything (about 100 calls, in parallel, on a page managers open rarely); a plural
`role_can()` is the fix if that ever hurts, and it is a schema PR, not this one.
**Limit, stated:** `/admin/security` and the two Admin-only tiles have no activity, so a link to
`/admin/security` is decided by the `/admin` any-of rule, which a role holding any Settings activity
would pass. Nobody links a rota job there; if anyone does, the page itself still refuses.

**3. "Admin only, no activity" is `perms.isAdmin`, not a role name.** Security (who may sign in, and as
what) and the access-requests task stay Admin rules (§6: an activity nobody else may hold is not an
activity). `requireAdminUser()` / `hasAdminRole()` remain, rewritten over `loadPermissions()`;
nothing in them names a role.

**4. Record-scoped pages keep Departure 1.** `/maintenance/[id]`, `/maintenance/new`, `/projects/[id]`,
`/contacts/[id]`, `/vets/[id]`, `/enclosures/[id]` and `/management/vets/[id]/doctors` are guarded
(the first guard now `requirePermission`, which refuses exactly as `requireRole` did) but **not
registered**: their paths hold an id. `/maintenance/new` and `/maintenance/[id]/edit` still render
their "read only" message in place for a volunteer. `/assistant` also still says "you can't use this"
in place; `/enclosures/map-prototype` is guarded (`facility.map`) and registered.

**5. Left, and why.** None of these is a role list guarding a page.
- `hasAppAccess` / `APP_ACCESS_ROLES` / `current_user_role()` in the proxy, `refusedPath`, sign-in
  landing and the public header: still "may this person into the app at all". `roles.opens_app` is the
  future answer; no role needs it yet, and nothing in this sweep made it reachable (the menu and My
  tasks now read `perms.role.opensApp`, which is the same seeded value).
- `/my`'s `role === "vet"` redirect, `signedInLandingPath`'s vet branch and `/no-access`' vet wording:
  where a role lands is `home-screens` (`roles.home_path`, not seeded for any role yet).
- `ASSIGNABLE_ROLES` (everyone with app access but a vet): Lutan's 2026-09-27 ruling that no vet is
  given a recurring job. A role list, but about a person's job, not a page; it wants its own decision
  when a configured role exists.
- `src/lib/manual/filter.ts`'s `MANUAL_ROLES` and the release notes' role tags: the reader's "who is
  this for" words, which `activity` now overrides in the manual. Release notes are tagged text, not a
  guard.
- `assertPhotoWriteAccess()` still guards the blood-test and procedure file routes, as `-medical`
  decided (departure 2 there). With the projects and maintenance routes gone it has two callers left.
- `scripts/check-permission-parity.mjs` still lists it under `UNPAIRED`.
- Manual topics `microchip` (question L6) and `appointments-vet`, `my-access-requests`, `security`,
  `two-step`: untagged, for the reasons #336 and #340 gave and, for the three Admin ones, decision 3.

## For whoever builds medication-label part (3), "Stocktake in the menu only for the people who do it"

The shape is clearer now: `can(perms, "stock.count")` **and** "has a recurring job that links to
`/stocktake`". The second half is a query over the reader's own jobs, which `loadMyRecurringTasks`
already runs for My tasks; `NavPane` already counts those. It must not be a new `canX(role)`.

## Is F2 complete?

The sweeps are, for every page and action that decided by role name. What remains in the app is the
list in decision 5, each with its owner. `home-screens` is the only other F2 piece.
