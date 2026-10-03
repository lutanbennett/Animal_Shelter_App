# 2026-10-03 — The permission catalogue in code: `can()`, `requirePermission()`, the route registry, and stock as the pattern

F2, first part, of `docs/roles-and-permissions.md` (`permissions-catalogue`, §15).
App-side only: no migration (`0133` stays free) and **not one RLS policy changed**,
so the parity check's baseline has not moved. Stock (`stock.count`,
`stock.delivery`) is the one area converted. **`permissions-sweep-residents`,
`-medical` and `-rest` copy what is below**, so this file is the pattern; the stock
diff is only its first use.

## The pattern, in six lines

```ts
// src/lib/permissions/  catalogue.ts · can.ts · load.ts · require.ts · routes.ts

// A page: one activity, one guard, no role name, no branch on who is looking.
const { supabase, perms } = await requirePermission("stock.count");
const { supabase, perms } = await requirePermission("medical.weight", "read");   // an Edit/Read activity

// Anything else on that page, a menu entry, a client component: the same question.
can(perms, "stock.delivery");

// A server action: returns its own wording, as every action does today.
if (!can(await loadPermissions(), "stock.count")) return { ok: false, error: e.notAuthorized };
```

Do not write `requireRole(...)`, a role list, `role === "…"` or a new `canX(role)`
for anything the catalogue has an activity for. If it has none, that is a catalogue
question (add a row and a migration), not a reason for a predicate.

## `can()`

`can(perms, activity, level = "edit")`, in `can.ts`, pure and client-safe.

- **A function over data, not a method.** `Permissions` is plain data (role, `isAdmin`,
  scopes, cells), so it passes from a server component to a client component as a
  prop. §10 sketched `perms.can(...)`; a method cannot cross that boundary, a function
  can, and the call reads the same. No provider is built yet: nothing client-side asks
  yet except `NavLinks`, which is handed a boolean as before. The first client
  component that needs it passes `perms` down.
- **Two kinds of key are two types.** `YesNoKey` takes no level; `LevelKey` takes
  `"read"` or `"edit"` (default edit; edit includes read). `can(perms, "stock.count", "read")`
  does not compile. §4 rule 2 made the kind part of the activity, so the type says so.
- **Fails closed, and says so in one place.** No answer for a person (signed out, no
  role, archived role), an unknown key, a level other than read/edit, a missing cell, a
  malformed cell: every one is `false`. Admin is yes before any cell is read, for every
  key the catalogue knows.
- **One deliberate difference from `has_permission()`.** The database also says yes to
  Admin for a key it does not know (§6 rule 8, a new activity starts at None for
  everyone *but* Admin). `can()` says no to an unknown key for everyone, Admin included.
  A mistyped key in a policy stays invisible to testing as Admin; in TypeScript it cannot
  be written at all, and if untyped code reaches `can()` the answer is no.
- **`parsePermissions()`** reads `my_permissions()`'s jsonb defensively: cells for keys
  this build does not know (the database can be a release ahead) and cells that are not
  exactly 1 or 2 are dropped, so a malformed answer can only mean less access.

`loadPermissions()` is the live lookup of §10 (L9): one `my_permissions()` RPC per
request, memoised with React `cache()` so the menu, the page and an action share it.
There is no token claim to go stale. It returns `null` signed out, and `can(null, …)`
is false.

## Where keys live

`src/lib/permissions/catalogue.ts`, `ACTIVITIES` (55 rows): key, kind, area, sort,
`requires`, `probes`. `ActivityKey`, `YesNoKey`, `LevelKey` are derived from it, so
**the union is the list**; there is no second place to keep in step.

It holds the product's list and nothing a shelter can change: cells live in
`role_permissions`, labels in the dictionaries (a key never changes, a name is
translated, §4 rule 6).

- **It agrees with `0132` exactly**, and a check says so. It was already true: the
  55 keys, kinds, areas and sorts in the file are the seed's, and no prerequisites are
  stated on either side. Stating them is a change to a row here and a migration, done
  with the Settings matrix that enforces them; `0132` declined to guess them from prose
  and so does this file.
- **`probes` is the parity check's.** The field is `{ level: "read" | "edit"; sql: string }[]`
  (§11), empty on every row. `permission-parity-check` fills the values in this file and
  owns the script; this stream owns the field and the file. The two edit different
  arrays, so they merge cleanly.

## Unknown keys are a build failure, not a runtime false

Two layers, both in `npm run lint`:

1. **The compiler.** `ActivityKey` is a literal union; `can`, `requirePermission` and
   the registry's `activity` refuse anything else.
2. **`scripts/check-permission-catalogue.mjs`**, for what TypeScript cannot see. It
   fails when the file and the seeded `permission_activities` differ in key, kind, area
   or sort; when any `can()`, `requirePermission()` or registry key in `src/`, **or any
   `has_permission('…')` in a migration**, names an activity that does not exist; when
   `can()` stops failing closed; and when a registered route's page does not guard with
   its entry's activity. The SQL scan is the one that matters most: a mistyped key in a
   policy otherwise denies silently, and is invisible as Admin. The script needs no
   database; it reads the seed out of the migrations that carry it, so it also sees a
   later migration that adds an activity.

**Adding an activity, then:** a row in `catalogue.ts` and a migration inserting it into
`permission_activities`, in one PR. The check fails if only one half is there.

## The route registry, and what `home-screens` can expect

`src/lib/permissions/routes.ts`: `ROUTES: RouteEntry[]`, each
`{ path, activity, level?, icon, label(t), device: "any" | "phone" | "desk", menu }`.
Today it holds the two stock pages, as the pattern.

- **A page's guard and its entry cannot disagree**: the check reads each registered
  page's `page.tsx` for `requirePermission("<the entry's activity>"…)`.
- **A role's page set is derived, not written.** `routesFor(perms)` returns the entries
  that person may open, `canOpen(perms, entry)` asks one, `routeFor(path)` finds one.
  `home-screens` renders tiles from `routesFor(perms)`: `icon` is a `LucideIcon`, `label`
  is a function of the dictionary (so it is in the person's language), `menu: false`
  means "guarded, reachable, not in the sidebar" but still eligible for a tile, and
  `device` is the field for §8's phone-and-desk pair over one action.
- **What it does not hold yet:** a group or an order for tiles (the whiteboard's headings
  are a role's home and not a property of a page, so `home-screens` should add its
  ordering and grouping beside the registry, not in it), and any page outside stock. The
  sweeps add their areas' pages as they convert them, **one entry per page**; Settings
  and Management landing pages arrive when their areas move.
- **The sidebar is not yet built from it.** `NavLinks.tsx` still lists its links by hand
  and receives `canStocktake` as a boolean computed from `can()`. Building the menu from
  the registry is `home-screens`' work; doing it here would have meant converting every
  area's entry in a file every UI stream touches.

## What a refusal looks like

**Unchanged for anyone.** A page refuses through the existing `refuse()` (the in-app
`/no-access` page; signed out goes to `/login`; a public viewer to where their sign-in
lands). An action returns the same `notAuthorized` wording from the same dictionary
entry as before. `requirePermission` is `requireRole` with the question changed, so it
shares the refusal rather than copying it. The `role` string it returns is now
`perms.role.key`, for the sites that still need it while their area is unconverted.

## Stock: what moved

`canStocktake` and `STOCKTAKE_ROLES` (`management/stocktake.ts`), and `canRecordDelivery`
and `DELIVERY_ROLES` (`management/stock-receipts.ts`), are **deleted**. Their callers:

| Was | Now |
|---|---|
| `requireRole(canStocktake)` in `/stocktake` | `requirePermission("stock.count")` |
| `canRecordDelivery(role)` for the Deliveries link on `/stocktake` | `can(perms, "stock.delivery")` |
| `requireRole(canRecordDelivery)` in `/deliveries` | `requirePermission("stock.delivery")` |
| `canStocktake` / `canRecordDelivery` in the two actions files | `can(await loadPermissions(), "stock.count" / "stock.delivery")` |
| `canStocktake(role)` for the menu in `NavPane` | `can(await loadPermissions(), "stock.count")` |

**Behaviour is identical**, and the check proves it: building a `Permissions` for each
of the six roles from the seeded cells, `stock.count` answers yes for Admin, Management,
Staff and Volunteer and no for Vet and the public viewer; `stock.delivery` yes for Admin,
Management and Staff only; no role at all is no. Those are the truth tables of the
predicates just deleted.

### The one list that stays, and why

`src/lib/recurring-jobs/eligibility.ts` used the two predicates for "can this
**assignee** do a job that links to /stocktake". That asks about *another person's* role.
`can()` reads the caller's own cells; a non-admin cannot read `role_permissions`
(`0132`'s policy is admin-only), so the app cannot answer "may a volunteer count stock?"
for a manager building a rota. Answering for any role needs a `security definer` function
over the tables, which is a migration and not this PR's. So `STOCK_COUNT_ROLES` and
`STOCK_DELIVERY_ROLES` stay in `eligibility.ts`, equal to the seed, and the check fails
if they drift from it.

**This is the follow-up the sweeps need before they touch `eligibility.ts`**: a
`role_can(role_key, activity, level)` database function, a page-and-RPC pair for
`canDoJob`, and the form's picker fed from it. Filed on the `backlog` branch.

## Left alone, on purpose

- **No policy, no migration.** `perm-convert-*` owns policies, after the parity check.
- **`current_user_role()` and `hasAppAccess`** still drive the proxy and `refusedPath`.
  `roles.opens_app` is the future answer for a configured role; no role needs it yet.
- **Medication-label part (3), "Stocktake in the menu only for the people who do it".**
  The recurring-job-assignee rule is not built. The shape is now obvious: it is an
  activity-plus-assignment question, `can(perms, "stock.count")` **and** "is assigned a
  recurring job that links to /stocktake", with the assignment half in the query
  `NavPane` already makes for My tasks. It must not be a new `canX(role)`.
- **`scripts/check-stocktake-sheet.mjs`** has no `@/` resolver and has failed to import
  `stocktake.ts` since that file began importing `@/lib/units`. Not caused or fixed here;
  its roles assertion moved to the catalogue check. Not in `npm run lint`.

## Boundary with `stocktake-cards-phone`

Lines taken here: in `src/app/stocktake/page.tsx` the imports, the guard on the first
line of the component, and the Deliveries-link condition; in `src/app/stocktake/actions.ts`
the guard at the top of `saveStocktake`; in `src/lib/management/stocktake.ts` the
deleted `STOCKTAKE_ROLES`/`canStocktake` block. The rendering below the guard is theirs.
