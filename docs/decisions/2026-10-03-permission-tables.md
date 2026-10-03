# 2026-10-03 — The permission tables (`0132`): where the build departs from the §9 sketch, and why

F1 of `docs/roles-and-permissions.md` §12 (`permissions-schema`, §15). Additive
and read by nothing: no policy, view, function or file under `src/` changed, and
nothing yet calls `has_permission()`. This records the places the migration is not
the sketch, how each rule of §6 is held, and what was done with the six `?` cells.
The paper's §9 and §10 have been corrected to match, so they no longer describe a
shape that does not exist.

## What was built

`roles` (six rows), `permission_activities` (55), `role_permissions` (122 cells),
`user_roles.role_id`, `has_permission(activity, level)`, `my_permissions()`, and
the `audit_log` trigger on `roles` and `role_permissions`. Proved in
`scripts/check-permission-tables.mjs`: 660 answers (six roles × 55 activities ×
read and edit) under each role's own login equal the paper's §4 table, which the
script reads itself rather than from the migration.

## Where it departs from the §9 sketch

| Sketch | Built | Why |
|---|---|---|
| `scope_resident_detail in ('full', 'who_and_where')` | **not there** | `who_and_where` has no view behind it yet (§5 says so). A column whose only non-default value nothing can honour is a setting that does nothing and looks as if it works. The volunteer slice adds the column and its view together; widening a check is one statement. Every other scope value has something behind it (below) |
| `requires jsonb default '[]'` | the same, plus `check (jsonb_typeof(requires) = 'array')`, **empty, and not enforced** | The prerequisites belong to the catalogue file (§4 rule 5), which is the next stream's and is checked against this table. Stating a few here from the prose would be a guess dressed as data. The shape check only stops garbage landing |
| `sort integer` | `unique` | Two activities with the same place in the matrix is never intended |
| `kind in ('fixed','default','custom')` | the same, plus `(kind = 'fixed') = (key in ('admin','public_viewer'))` and `kind = 'custom' or legacy_role is not null` | §6 says which roles are fixed; a constraint says it too. While the enum exists, a built-in role must name its enum value |
| `legacy_role app_role` | the same, with a unique index over it for the fixed and default kinds | One built-in role per enum value, so "the role this enum value means" has one answer |
| `has_permission`: any non-`read` level means edit | any level other than `read` or `edit` answers **no** | A mistyped `'raed'` should not silently become the stricter check; no row, unknown or malformed all answer no, which is what the brief asked of the other four cases |
| `unique (role_id, activity)`, `id` | the same | |
| `user_roles.role_id uuid references roles` | the same, nullable, indexed, **back-filled and kept in step by a trigger** in both directions | §12 step F1 asks for the back-fill and the trigger; nullable so "a person with no role" has an answer. `role_id` is the authority when given or changed (a configured role names the enum value it borrows); otherwise the enum column drives it, which is every write the app makes today |
| no `created_at` | `roles.created_at` | The first thing anyone asks of a role a shelter added |

## How each rule of §6 is held

A rule that exists only in prose is not a rule, so for each: what holds it and
what does not.

| § 6 | Held by | Not held by the database |
|---|---|---|
| 1 Admin has everything, always | Admin has **no rows** (a trigger refuses a cell for any fixed role), and `has_permission()` answers yes for it before reading any cell. No edit can take a power from Admin | |
| 2 There is always an Admin | **A deferred constraint trigger on `user_roles`** refuses a transaction that leaves no active admin. Deferred, so a swap of two admins in one transaction passes and only the committed result is judged; it objects only when a change removed the last active admin, so a database that never had one is not blocked from unrelated writes | Before this, the rule was the app's refusal to change, archive or delete **your own** login. That holds one admin at a time; it does not hold two admins demoting each other at once. **This is the one place `0132` touches existing behaviour**, and only for a change that would have left nobody. It also stops the Supabase console deleting the last admin's auth user |
| 3 Security is Admin's, with 2-step | `roles` and `role_permissions` accept writes from an admin **at aal2** only (admin policy plus restrictive aal2 policies, the pattern of `0100`). `permission_activities` is read-only through the API: the catalogue is the product's | The service role bypasses RLS, as everywhere. Creating people and changing a person's role are `user_roles`, already guarded by `0100` |
| 4 Public viewer and signed-out are fixed | `kind = 'fixed'` is a check over exactly those two reserved keys; a trigger refuses delete, archive, rename, re-kind, re-bridge, and any cell. A signed-out caller has no `user_roles` row, so every answer is no (and `anon` cannot execute the functions) | |
| 5 Everyone with a login can… | | Not activities, so no cell reaches them; held by the code and policies that already hold them |
| 6 A deceased record is read-only | | A rule about the record, held by the existing lifecycle triggers |
| 7 The audit log records regardless | The audit trigger on both tables (created after the seed, so the seed is not logged); `audit_log` is already append-only for everyone (`0121`) | A migration or the service role writes with a null actor, as `0121` documents |
| 8 A new activity starts at None | By construction: no row is None; only Admin is yes without a cell | |
| 9 A cell never outranks a prerequisite | | Waits with `requires`: the Settings matrix and the catalogue check, not a row constraint (cells are written one at a time, and a constraint over them makes every edit order-dependent) |

## The scope columns, checked against the policies that implement them

| Column and values | What backs it | Verdict |
|---|---|---|
| `scope_residents` `all` · `own_clinic` | `current_vet_resident_ids()` (`0108`, redefined in `0125`) | Honoured in the database |
| `scope_clinical` `any` · `own_clinic` | `vet_owns_visit()`, `current_user_vet_ids()` (`0110`, `0125`) | Honoured |
| `scope_contacts` `full` · `name_phone` · `name_type` | the `volunteer_contacts` and `vet_contacts` views (`0126`) | Honoured |
| `sees_login_emails` | `private.app_users` hides `email` from a vet and a volunteer (`0126`) | Honoured |
| `scope_photos` `all` · `medical_only` | **App code only**: `PHOTO_CATEGORIES` in `src/app/residents/[id]/photos/actions.ts`. `record_attachment()` (`0097`) checks the role and never the folder | **Kept, and flagged.** A vet's login used by hand can file a photo outside Medical, which `0101` would then publish. Not new and not this PR's to close; it is on the backlog branch |
| `scope_resident_detail` `who_and_where` | nothing | **Left out** (above) |

## The seed

The six built-in roles carry **today's cells** from §4: management 48, staff 37,
vet 13, volunteer 24; Admin and the public viewer none. Each cell is what the
screens offer today (L8), not what the database happens to allow, so the twelve
places §3 C lists where the database allows more are not reproduced here and will
show as known tightenings when the parity check is built.

**Lanna's three configured roles are not seeded**, and nor is the narrowed
volunteer. §12 puts each configured role in its own slice after F2, because a
page guarded by an old predicate would show a Head the pages of the volunteer it
borrows. They also cannot be represented honestly yet: the 2IC, Maintenance and
Medical all see a resident as "who and where", which this migration declines to
model (above). So the seed is the template every shelter starts from, and the
Director's table is not seeded at all.

**The six `?` cells of `docs/roles-director-table.md`**, and what was done with
each. None was guessed into a seeded permission:

| Cell | Done |
|---|---|
| 2IC, a resident's page ("who and where ?") | **Not seeded.** The 2IC role does not exist yet |
| Head of Maintenance, a resident's page ("who and where ?") | **Not seeded.** Same |
| 2IC, record a delivery ("Edit ?") | **Not seeded.** Same. No row means None, the safe direction |
| Head of Maintenance, set up recurring tasks ("None ?") | **Not seeded.** Same |
| 2IC, mark her own recurring tasks done ("Edit ?") | **Not seeded.** Same |
| Management, record a microchip ("Edit ?") | **Seeded as None** (no row): that is today's screen and today's database (finding B, L6), and §4's cell is `–`. If L6 is answered yes it is one row, in the slice that converts residents |

## Smaller choices

- **Admin is yes for an activity the catalogue does not know.** The paper says
  Admin is yes before any table is read (§6, 1), and §6 rule 8 says a new
  activity starts at None for everyone *but* Admin. The cost is that a mistyped
  key in a policy cannot be seen by testing as Admin; the catalogue check the
  next stream adds is what catches it, and a test as any other role shows it.
- **Cells are never overwritten on a re-run** (`on conflict do nothing`), so
  once the matrix is editable, replaying the file cannot undo a shelter's edit.
  The catalogue rows are re-asserted (`on conflict do update`): they are the
  product's.
- **`my_permissions()` returns `jsonb`, null for no live role,** with Admin's
  cells expanded to all 55 at level 2, so `can()` needs no Admin special case.
- **Recent changes will show these two tables** the first time a cell is edited,
  under their own names. `undoKind` treats an edited cell as a file change and so
  not undoable, and a deleted cell as re-insertable, which goes through the same
  RLS and triggers as any write. Nothing writes either table yet.
- **Not measured:** the cost of `has_permission()` under RLS. §10 says it is
  measured with `explain (analyze, buffers)` in the first conversion PR, where
  there is a real policy to measure.
- **Nothing was applied to production.** Applied to dev from this branch only.
