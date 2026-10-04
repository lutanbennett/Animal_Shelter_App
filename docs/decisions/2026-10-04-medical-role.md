# 2026-10-04 — The Head of Medical (`0136`): the first configured role, and the first job

`docs/roles-and-permissions.md` §12 R2. **Three roles copy this one (Maintenance, the 2IC, then
whatever follows), so it records how, not only what.** It is a role row plus a named job over a
screen that already worked, and it turned out not to be quite as small as §12's "a role row, one
read policy": the finding is the second section.

Both blockers in the brief were checked, not assumed. **The migration slot:** `0135`
(`perm-convert-medical`) had merged, so this is `0136`. **R1:** `0134` (the narrowing) and
`volunteer-read-only` (#349) are both on `main`, so the role's dependency was already satisfied.

## 1. The role row's shape (copy this)

```sql
insert into roles (key, name, name_th, kind, opens_app, home_path, legacy_role,
                   scope_residents, scope_clinical, scope_contacts, scope_photos, sees_login_emails)
values ('head_of_medical', 'Head of Medical', 'หัวหน้าฝ่ายการแพทย์', 'custom', true, '/home', 'volunteer',
        'all', 'any', 'name_type', 'medical_only', false);
```

- **`kind = 'custom'`**, never `default` (the five shipped roles) or `fixed`. No enum migration:
  `legacy_role` borrows `volunteer`, and the enum goes with the bridge.
- **`legacy_role = 'volunteer'` is still right after `0134`.** The narrowing left the volunteer
  at who-and-where, the enclosures and three cells, which is the floor this role stands on. It is
  also the *narrowest* value, so a right the role gets through the borrowed value is never wider
  than the job. This is what §12 means by "narrower than its job, never wider": the role can do
  less than its cells say before it can do more. The check proves it from the other side: the
  role reads `resident_who_and_where` (gated on `current_user_role() = 'volunteer'`) without any
  policy of its own.
- **Scopes are the narrowest that the job allows**, not the defaults: contacts `name_type`,
  photos `medical_only`, login emails off. `scope_residents` and `scope_clinical` stay `all` and
  `any`; "who and where, no detail" is not a scope column yet (§9), it is the view.
- **`name_th` is required in practice.** The role's name has a Thai form, since it is shown to
  Admin in Thai (the Director). Lutan should confirm the wording: หัวหน้าฝ่ายการแพทย์.
- **`home_path = '/home'`**: the role lands on the home screens, which draw its job. `/home`
  treats `'/home'` as "no redirect", so there is no loop.
- **Cells are two `role_permissions` rows**, written by the migration with `on conflict do
  nothing`, and nothing else.

## 2. What §12 got wrong: one read policy was not enough

§12's R2 row says "a read policy on `prescriptions`, and on the names it needs from `medication`
and `frequency`". Reading the live policies and signing in as the role found three more things:

| Table | Why a plain read policy does not do |
|---|---|
| `prescriptions` | Already done: `0135` made it answer `has_permission('medical.prescriptions', 'read')`. |
| `frequency` | No sensitive column. **A policy**, as §12 said: `frequency_select_perm`. |
| `medication` | Carries `cost_per_unit` and `stock_on_hand`. A policy hides rows, not columns, so it would hand this role the price list, which is the **C9** leak `0134` just closed for the volunteer. **A view** with a fixed column list: `medication_list_medications` (id, name, dose unit, label photo). |
| `residents` | No policy for a volunteer-based role, and `resident_list_view` is `security_invoker` over it. The list's join to `residents` came back empty: **the screen would have shown nobody.** **A view** `medication_list_residents`: who, photo, status, enclosure and zone. |

Both views follow the shape of `0126` and `0134` (owner rights, a fixed column list, granted to
`authenticated` and `service_role` only) and are gated on `has_permission('medical.prescriptions',
'read')` **and** `sees_all_clinical()`: a cell and a scope, no role name. So a vet (own clinic)
still reads its own clinic's residents through the `vet_*` policies and gets no row from the view.
A new column on `medication` or `residents` is private until it is added to the view.

**This changes the screen, which the brief said not to.** The brief's reasoning was that a change
to the list would mean §14's permission design was wrong, and it was, in two ways, both small:

1. **The page asked `stock.medications` Read, not `medical.prescriptions` Read.** §14 says "no new
   activity... opens for anyone with Read on `medical.prescriptions`". The route registry and the
   page guard now say that. Consequence: **Staff, who hold `medical.prescriptions` but not
   `stock.medications`, can now open the list** and get its tile. That is what §14 meant. Management
   and Admin are unchanged.
   **A vet is not offered it.** A vet holds `medical.prescriptions` (Edit, clinic-scoped) and so would have
   opened a page whose views, gated on `sees_all_clinical()`, carry none of its residents: an empty list. The
   route says `scope: { clinical: "any" }` (`RouteEntry.scope` gained that value beside `own_clinic`), and the
   page refuses a login whose clinical scope is not `any`. A vet's own-clinic list is a separate piece if wanted.
   Knock-on: the manual topic and its acceptance row lost their `activity` tag, because the matrix demands the
   `roles` tag equal every holder of the cell and a vet is a holder that is refused; they keep the roles tag
   (admin, management, staff). The Head of Medical, a configured role, does not see the topic in the manual as a
   result; the matrix gains the role's own column when roles do.
2. **The loader read the tables behind the views.** `src/lib/medication-list/load.ts` now reads
   `prescriptions` and `frequency` flat and `medication_list_medications` and
   `medication_list_residents` through the views, and joins in code. The page, the grouping, the due-day
   logic, the strings and the layout are untouched; the output for Management is the same list.

## 3. How the job and its bundle are expressed (copy this)

`src/lib/permissions/jobs.ts`, about 70 lines, data and two helpers:

- **`JOBS`**: `administer_medication` → a label (from the dictionary, both languages), a **bundle**
  (`medical.prescriptions` Read, `resident.record` Read) and the one route its tile opens.
- **`JOBS_OF_ROLE`**: `head_of_medical → [administer_medication]`. A role is *given* jobs.
- **`bundleOfRole(key)`**: the union of a role's jobs, each activity once at the highest level any
  job asks. A role's rights are the union; jobs may overlap, so it is not a partition.
- **`homeTilesFor()`** (`src/lib/home/tiles.ts`): a role with jobs shows its jobs, one tile each,
  and nothing else. A role with none is derived from its cells as before. A tile is drawn only when
  every activity in the bundle is held at its level and the route opens, so a job a role is only
  half-given draws no tile that would then refuse.

**The rules the layer obeys** (Lutan, 2026-10-04): jobs sit above activities and replace none.
Nothing asks "does this role have the job"; every gate still asks the activity
(`has_permission('medical.prescriptions', 'read')`, `can()`), so Edit versus Read survives inside a
job. **What keeps the file and the database in step:** the migration writes the expansion into
`role_permissions`, and `scripts/check-medical-role.mjs` fails if `role_permissions` for the role are
not exactly `bundleOfRole()`. Neither can drift unseen.

**Deliberately not built:** a `jobs` table, a `role_jobs` table, a job column on `roles`, a UI to
give a role a job. The suggestion that suggests itself is a `jobs` and `role_jobs` pair, with the
bundle held as rows, so the matrix can show jobs and Admin can give one. Not built because this
is the first example and one example cannot tell a table's columns from its accidents.

## 4. What the next example should do differently

- **Check the tables the screen joins to, not only the table the cell names.** This one found the
  gap only by signing in as the role. Do that **first**: make the disposable login before writing
  the migration, open the screen, and read the errors. `check-medical-role.mjs` is the template:
  one probe per table and view the screen reads, per principal, in a rolled-back transaction.
- **Prefer a view to a policy whenever the table has a column the role should not see.** A policy
  cannot hide a column. List the table's columns before choosing.
- **Decide the home's second tile before the first.** The Medical home is one tile. Maintenance has
  the board and probably more, so decide whether Residents (a lead tile everyone had) belongs; here
  it does not, because a role with jobs shows only jobs.
- **Put the role's key in `JOBS_OF_ROLE` in the same commit as the migration**, or `homeTilesFor`
  derives the home from the cells and shows a different one.
- **The day described is bigger than the first job.** Lutan described the Head of Medical's day on
  2026-10-04: weight, medical photos, a pick list, timed doses, special diets and pictures for
  staff who read neither language. Five backlog items. Each is a job (`Record Weight`, `Add Medical
  Photos`, `Feed Special Diets`) or a screen. **Their cells are not in this role yet**: a cell with
  no screen would be a promise the role cannot use, and `check-medical-role.mjs` asserts exactly two.

## 5. What was not done, and why it is fine

- **The role is not finished until the Head of Medical has used it for a real round** (§12's
  done-when). It is built and verified on dev under a real JWT; the test plan's *Left for manual
  verification* table holds that line.
- **Dev photos do not load** in the browser pane (Drive's proxy); the list's image slots fall back
  to the placeholder. Not this change.
- **Production**: apply `0136` from the main checkout, `--dry-run` first, after the merge. The
  apply prints a consumer warning (`src/lib/home/tiles.ts` is not in the live release): the safe
  direction, since the migration only adds a role and two views.
- **Nothing here creates a login.** Whether Settings' user screen offers the new role in its picker was
  not checked; a login for it on dev was made by script.

## What the checks say

- `scripts/check-medical-role.mjs`: **101 checks, 0 failed**. For seven principals (the Head of
  Medical, admin, management, staff, volunteer, a vet, no role): the list's four sources read as
  expected; the Head of Medical reads nothing beyond them (not `medication`, `residents`,
  `resident_list_view`, `weight`, visits, procedures, stock counts, the assistant, contacts); the
  price, stock, breed and bio columns do not exist on the views; the Head of Medical's insert and
  update on `prescriptions` and insert on `weight` are refused; the role row has the shape above;
  the cells equal `bundleOfRole()`.
- Parity (`check-permission-parity.mjs`): green. Volunteer narrowing, and the `0135` conversion
  harness (241 checks): green, unchanged.
