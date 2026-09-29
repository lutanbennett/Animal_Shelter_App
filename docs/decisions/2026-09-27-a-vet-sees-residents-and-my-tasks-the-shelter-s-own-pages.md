# 2026-09-27 — A vet sees Residents and My tasks; the shelter's own pages refuse them

Lutan's call from Pass 1 (Vet) of the role walkthrough: a vet is an outside
clinic with a clinical job, so Enclosures, Maintenance, Vets, Contacts and
Projects are not theirs.

- **An allow-list of the shelter's roles, not "not vet".** `isShelterRole()`
  in `src/lib/auth/app-access.ts` is admin, management, staff, volunteer —
  the same shape as `APP_ACCESS_ROLES`, so a role added later starts outside
  these pages until someone decides otherwise. It is deliberately not reused
  from `STOCKTAKE_ROLES`, which is the same list today for a different reason.
- **Every page guards itself; there is no layout guard.** All twelve pages in
  the five trees (both list and detail, plus `/maintenance/new` and
  `/maintenance/[id]/edit`) call `requireRole(isShelterRole)` in place of
  `createClient()`, so a vet gets #177's `/no-access` page. Next's own guide
  (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`, "Layouts
  and auth checks") says a layout does not stop its pages rendering or
  reaching the RSC payload, which is the whole point here — the vet list is
  the one that is inappropriate to show at all. A new page in one of these
  trees needs the same line.
- **Server actions are left to RLS.** The brief is menu and route gating.
  Read from dev's `pg_policies` on 2026-09-27, a vet has no write policy on
  zones, enclosures, maintenance (or its photos), contacts or the project
  tables. The exception is `vet_rw_vets` (`0001`): a vet has full
  read/write on the `vets` table, so a vet calling the API directly could
  still edit another clinic's entry. Reads are also still open at the
  database — `vet_read_contacts`, `vet_read_enclosures`, `vet_read_zones` —
  so the pages refuse a vet but the rows are one API call away. That needs a migration and is on the
  backlog rather than here; it belongs with the resident-level RLS scope
  (order 4), which is where vet database access is being decided.
- **A vet scanning a kennel QR code gets the visitor card.** `/e/[id]` used
  to send any app user on to `/enclosures/[id]`, which would now refuse a
  vet. The card lists who lives there, each linking to `/r/`, which opens the
  resident page for them — the useful part of the enclosure page for a vet.
  Its "sign in" hint now shows only when signed out.
- **`/maintenance` was already empty for a vet, and that was the bug.** No
  maintenance RLS policy for vets (`0001`, `0039`) meant the board rendered
  "no jobs"; the guard turns that into "not for you".
- **Manual:** the vet role summary says what the menu holds (it keeps "Can
  read resident details"), and the enclosure, project, vet and contact
  topics now carry role chips without the vet. There is no Thai manual file
  (`src/lib/manual/` is English only), so the brief's `th.ts` has nothing to
  edit.
