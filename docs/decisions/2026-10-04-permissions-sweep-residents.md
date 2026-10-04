# 2026-10-04 — `permissions-sweep-residents`: what was swept, and the three places it departs from the stock pattern

F2, the residents area, of `docs/roles-and-permissions.md` §15. App-side only: no
migration (`0134` stays free), no policy. It follows
`2026-10-03-permissions-catalogue.md` for every guard it converts; this file exists
because three things the stock pattern did not have to answer came up, and **`-medical`
and `-rest` will copy whichever version they find**.

## What moved

Every role list, predicate and inline role test in the residents area now asks `can()`:

| Was | Now |
|---|---|
| `DECEASED_ROLES`, `UNDO_DECEASED_ROLES` (`placements/deceased.ts`) | `placement.death`, `placement.death_withdraw` |
| `HOSPITAL_ROLES`, `REHOME_ROLES`, `MOVE_ROLES` | `placement.hospital`, `placement.rehome`, `placement.move` |
| `ADOPTION_UPDATE_ROLES` | `resident.adoption_news` |
| `MICROCHIP_WRITE_ROLES` (also read by `/procedures/new` and `/vet-visits/[id]/edit`) | `resident.microchip` |
| inline `role === "admin" \|\| …` in `/residents` (register link), `/residents/[id]/edit` and its action | `resident.register`, `resident.record` |
| `canManage(role)` for the hub's translations button | `translations.manage` |
| `assertPhotoWriteAccess()` in the resident photo route and `movePhotoToFolder` | `photos.resident_add` |
| `photoCategoriesForRole(role)` (`role === "vet"`) | `photoCategoriesFor(perms)` |

Before any of it was deleted, each list's truth table went into
`scripts/fixtures/legacy-predicates.json` and `scripts/check-permission-parity.mjs`
gained a row for it. The check is green before and after.

## Departure 1 — record-scoped pages keep their in-place refusal and are not in the route registry

The brief says every route touched needs a registry entry. The eight pages that carry
a `can()` test (`/residents/[id]/hospital`, `…/hospital/return`, `…/move`, `…/rehome`,
`…/rehome/return`, `…/deceased`, `…/deceased/undo`, `…/edit`, and the adoption-update
pages) **do not refuse**: they render the resident's header and a "you cannot do this"
message in place, and the same page also shows other blocked states (already in
hospital, never adopted). Registering them means `requirePermission()`, which
redirects to `/no-access`, so a refusal would change for anyone who types the URL.
Their paths also hold a record id, so a home tile for `/residents/[id]/hospital` is
meaningless and `routesFor()` would hand `home-screens` a tile it cannot draw.

So they stay as they were, with the test moved to `can(perms, …)`. Nothing is
registered, and the catalogue check, which only inspects registered pages, has nothing
to disagree with. **If Lutan wants them registered, that is two changes together:** a
field on `RouteEntry` marking a path as record-scoped (so `routesFor` can leave it out
of tiles), and the pages guarding with `requirePermission`; the second is a visible
change to a refusal and wants a release line.

## Departure 2 — "files to Medical only" is `photos.resident_publish`, not a role

`photoCategoriesForRole` gave a vet the Medical folder alone. It is now: whoever holds
`photos.resident_add` but not `photos.resident_publish` files to Medical only. That is
the catalogue's own account of the rule: filing anywhere but Medical is what publishes
a photo (parity finding A5, `permission-parity-check`), so publishing is exactly what a
vet lacks. For the six roles it is identical (the parity table `photoFullFolders`
pairs it with `photos.resident_publish`). A configured role built from "add but not
publish" behaves like a vet here, which is the point.

`assertPhotoWriteAccess` **stays**, for the projects, maintenance, procedure and blood
test photo routes. It is one list shared across areas, and the parity check's
`UNPAIRED` note already says it waits for the photo split. Only the two resident
callers left it.

## Departure 3 — a manual topic names an activity beside its `roles` tag; a matrix row says what it `needs`

§15 asks that manual topics and acceptance entries "name an activity". The `roles` tag
cannot simply be replaced: the "Who:" badge on a topic names the six roles that exist
today, and the app cannot read `role_permissions` to name a configured role (it is
admin-only, `0132`). So:

- `ManualTopic.activity?: ActivityKey` is added **beside** `roles`. The reader's "is
  this mine?" (`/manual`, and the PDF) asks `can()` for it, in `isForTopic`
  (`src/lib/manual/for-topic.ts`), so a role built later sees the right topics. It is
  a separate file because `scripts/acceptance-matrix.mjs` loads `filter.ts` without the
  `@/` alias.
- `scripts/acceptance-matrix.mjs` **fails when a topic's `roles` tag differs from the
  roles that hold its activity by default**, read from the seed
  (`scripts/lib/permission-seed.mjs`). The words cannot drift from the cells.
- A matrix entry gains an optional `needs: "<activity>"` (`":read"` for a read level),
  and its does / must-not cells then come from who holds it. The two checks above apply
  to it as well. (`activity` was already a row's display name, so the field is `needs`.)

Eight topics and fifteen rows now carry them. **Left alone on purpose:** the
`microchip` topic and its two rows. The manual says Management may record a chip and
the seed says not (Finding B, question L6 in §15, undecided); tagging it would make the
check fail or silently change the manual page for a manager. When L6 is answered, tag
it with whichever side was right. Topics that were untagged (the list, the hub,
placement history, photos) are everyone's and were not given an activity.

## Left for the other sweeps, and why

- **`canArchiveMedical`** and the medical archive button in `[section]/page.tsx`: the
  medical area (`-medical`). The page still reads `current_user_role` once for it.
- **`contactRelation(role)` / `contactNameEmbed(role)`**
  (`lib/contacts/visibility.ts`): which view of the address book a role reads is a
  contacts-area rule (`-rest`). Four residents sites still pass the role string to it
  and say so in a comment; none uses `perms.role.key`.
- **`/residents/new`** has no app-side guard at all today (RLS refuses a volunteer
  after they fill the form in), so there is no predicate to move. Adding the guard
  would be a new refusal and is not a sweep.
- **`eligibility.ts`**: `role-can-app`'s.
