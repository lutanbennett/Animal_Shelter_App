# 2026-10-06 — Converting the last four tables to `has_permission()` (`0150`, R5's sixth and last slice)

`docs/roles-and-permissions.md` §12 R5, §9 rule 4 and §15. The last of the six conversions; it copies the shape in
`2026-10-04-perm-convert-medical.md` (one policy per command, `(select has_permission(…))`, no role named) and reports the way
`2026-10-06-perm-convert-stock-and-lists.md` and `2026-10-06-perm-convert-work.md` do. What follows is only what this slice added
or found, then a closing section on all six.

## The tables

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| `assistant_actions` | `assistant.record`, **own row** | `assistant.record`, own row | none (nobody updates) | none |
| `translations` | `translations.manage` Read **or** `sees_all_translations()` | `translations.manage` | `translations.manage` | `translations.manage` |
| `facility_maps` | open to every login (`facility_maps_read`, kept) | `facility.enclosures` Edit | same | same |
| `fixed_outgoings` | `reports.cashflow` Read | `reports.cashflow` Edit | same | same |

Eight role-named policies dropped, found in `pg_policies` (`assistant_actions` 4, `translations` 2, `facility_maps` 1,
`fixed_outgoings` 1); 13 `_perm` policies written. `admin_all_*` untouched, as in `0135` and `0147`; so are
`translations_maintenance_select_perm` (`0141`) and `vet_read_translations` (the vet's own). The four tables were four small
decisions, as the brief expected, and two of them went a different way from the activity §15 had pencilled in.

## What this slice had to decide

### `facility_maps` asks `facility.enclosures`, not `facility.map`

§15 named `facility.map`. **It is the wrong cell:** `facility.map` is "see the map", held by management, staff **and** the
volunteer (`0132`), and the table's read is already open to every login. Writing a plan is `/admin/facility-map`, whose page
(`requirePermission("facility.enclosures")`) and three actions all ask `facility.enclosures`. Asking `facility.map` would have handed
every staff member and volunteer the right to replace a plan by a hand-built request. The script has a role holding only
`facility.map` and it writes nothing.

**A known tightening: management loses the write.** `0142`'s `management_rw_facility_maps` named admin and management, but management
holds `facility.enclosures` at **Read** (`0132`; the same cell as staff and the volunteer), so the page and the actions have always
refused it and only a hand-built request could write. It is the same shape as `0148`'s `frequency` ("management could update and
delete a frequency by hand; it cannot now"), not probed by the parity check, and no screen changes. When the "upload plans from the
system" item lands it will write this table from the page, and the cell it asks is the one to revisit.

### `assistant_actions`: the audit row is the caller's own, and management's read-all is gone

Today management and staff insert their own row; management reads every row, staff read their own. A policy cannot say "management" now,
and **there is no activity for reading other people's assistant rows**, and nothing in the app reads them: the status page counts them as
Admin (`admin_all_assistant_actions` stays), and `logAssistantAction` only inserts. So insert and read are the same test, `assistant.record`
and `user_id = (select auth.uid())`.

**A known tightening, opened here: management can no longer read other people's assistant rows.** This is the narrow direction on
purpose. What people typed at the assistant is the subject of the open retention item (DB-11, "needs a decision first", not touched), and
a manager reading it should be an activity someone chooses. If the decision is that managers do review the corpus, the answer is one new
read policy on that activity; **owner: the DB-11 decision.**

**Does this make "a volunteer turned away from an assistant write leaves no audit row" easier?** Not by itself, and it is worth saying so.
The volunteer holds `assistant.ask` but not `assistant.record` (the draft keeps that split), so the insert policy refuses them, as today.
But the item is now a **one-line change in one policy** and not a hunt for roles: insert asks `assistant.record` **or**
(`assistant.ask` and `status = 'refused'`), own row, and `0130` already added the value. I did not do it: it widens who can write the
table, and it is the item's own decision. Filed on the backlog branch.

### `translations`: write is `translations.manage`; read needed a new scope function

Write is the easy half: management holds `translations.manage` and nothing else does, as before. **Nothing about who may translate changed.**

Read is the part that is not an activity: staff read every translation row today and `translations.manage` is not theirs (staff
read, by design, the Thai that pages show them). The first version asked `sees_all_residents()` (`0144`: a live role whose residents
scope is all and whose floor is not the volunteer's), which is exactly management and staff and leaves the vet's own policy alone, and the
rest of this series uses it that way. **It was wrong, and a check caught it:** `check-app-access-gate` reported `public_viewer reads 76
rows of translations`. `public_viewer` has `scope_residents = all` and a legacy role that is not `volunteer`, so `sees_all_residents()`
alone is true for it. Every earlier use of that function sits **beside** `has_permission()`, which is what keeps `public_viewer` out; this
one sat alone. The fix is a second function, `sees_all_translations()`: `sees_all_residents()` **and** the role opens the app
(`roles.opens_app`), which is true for management and staff and false for `public_viewer`. It names no role. A sweep of `pg_policies` finds no
other policy that asks a scope function without `has_permission()`.

It is a stand-in. A "see translations" cell would replace it; **owner: the "one place to translate everything" item**, which this
slice did not widen or narrow. Both facts the sibling `project-thai-title` relies on are unchanged: the Thai title stays a paired column, and
Management → Translations reads through the same policies it read through.

### `fixed_outgoings`: narrow by default

The cashflow forecast's money. Read is `reports.cashflow` Read and write is Edit; management is the only default role that holds the cell, so
nobody gets a wider read than before. A role holding `reports.cashflow` Read can read the table and not change it.

## Which known tightenings closed, opened

**None closed. Two opened**, both small and both about management: it no longer reads other people's `assistant_actions` rows (no screen
read them), and it no longer writes `facility_maps` by hand (no screen let it). Neither is probed by `check-permission-parity` (there is no
probe on these four tables), so the parity delta is unchanged.

## The parity check, before and after (§11)

`director-draft-apply` merged, and its re-cut probes took the board from red to nearly green. Re-measured:

- **Before** (`0149` applied, nothing of `0150`): **1,913 match / 26 known / 21 mismatch.**
- **After** (`0150` applied, final file): **1,913 match / 26 known / 21 mismatch, the same 21 lines** (`diff` of the mismatch lines is
  empty). 245 probe runs, 1,960 answers. **None of the 21 names `assistant_actions`, `translations`, `facility_maps` or `fixed_outgoings`**, or
  `assistant.record`, `translations.manage`, `facility.enclosures`, `facility.map` or `reports.cashflow`. They are all the vet's cells and
  `resident.adoption_news`: the draft's.
- **The board is not green yet, and the owner is the draft:** the 21 are the vet. `check-permission-tables` fails on `A cells vet`
  and the `H vet …` lines, `check-perm-convert-orphans` on the vet's `prescription_rounds` and `frequency_rounds`, `check-maintenance-role` on one
  line (the Head of Maintenance's bundle gained cells in the draft). `check-2ic-role` (313 held), `check-medical-role` (101 held) and
  `check-volunteer-narrowing` are **GREEN**: the first genuinely green results those three have had in a week.
- `check-policy-role-names` is **GREEN with the four tables removed from `OWNERS`**: 6 policies on 3 tables remain, the photo split's.
  `check-permission-catalogue` passes. `check-app-access-gate` is OK.

## What the new script covers

`scripts/check-perm-convert-settings.mjs`: real rows, each login's own JWT, always rolled back. Four tables, four commands each,
**seventeen principals**: admin, management, staff, volunteer, a vet, no role, and eleven configured roles (`assistant.record`;
`assistant.ask` alone; `translations.manage`; a staff-floor role that reads every resident and holds no cell; the same scoped to a clinic;
a volunteer-floor role with scope all; one that opens no app (the `public_viewer` shape); `facility.enclosures` Read and Edit;
`facility.map` alone; `reports.cashflow` Read and Edit). 291 checks, all held, plus three sweeps (no policy names management or staff;
every `_perm` policy wraps `has_permission()` in `select`; 14 `_perm` policies on the four tables, the 13 new and `0141`'s).

It first ran **red twice, both times usefully**: once because management is refused the `facility_maps` writes (the finding above, not a
fault in the policy), and once, via `check-app-access-gate` rather than the script, on `public_viewer`. The latter is why the script now has
the "opens no app" role.

## What this does not cover

- **The pages, driven by a person.** See the test plan: the assistant, Management → Translations and the cashflow forecast read these tables and
  were opened as throwaway logins at the database; a person's check is left to Lutan.
- **Production apply is Lutan's**, from the main checkout: `--dry-run`, then apply `0150`. `-- consumer: none`.
- **`0150` was applied to dev once by the runner, then its file changed** (the `sees_all_translations()` fix, a comment) and the file's SQL
  re-run against dev, as `0147`–`0149` did. It is unmerged and re-runnable; dev holds the final file.

## The conversion, closed: six slices

R5 moved every policy off `current_user_role() = 'management' | 'staff'` and onto `has_permission()`: six planned slices, plus the orphan sweep that found the tables none of them owned. Each decision file below says what that slice closed and left; the tightenings still open are collected here with owners.

| Slice | Migration | Tables | Tightenings it left open |
|---|---|---|---|
| `perm-convert-medical` | `0135` | the medical record tables | see its decision file |
| `perm-convert-residents` | `0144` | `residents`, `placement_history`, `adoption_updates` (with `sees_all_residents()`) | see its decision file |
| `perm-convert-orphans` (the sweep) | `0145` | the policies no stream owned: enclosures, zones, `group_origins`, rounds, stock, recurring; wrote the closing query | none |
| `perm-convert-people` | `0147` | contacts, friends, vets, doctors, bulk appointments | **N3** (staff read Shelter Friends because the contacts pages show the card); C7 for staff insert and for vets |
| `perm-convert-stock-and-lists` | `0148` | six lookup tables | **N1, N2** (staff read prices through the lookup cell); the 2IC reads `immunization_types.cost` if the draft stands; **C3 / C10** for the vet |
| `perm-convert-work` | `0149` | `maintenance`, `maintenance_assignees`, `project_folders` | job delete has no activity (`has_shelter_floor()` is the stopgap; `role-gaps-sweep`) |
| `perm-convert-settings` (this) | `0150` | `assistant_actions`, `translations`, `facility_maps`, `fixed_outgoings` | management's read of others' assistant rows (**DB-11**) and its write of `facility_maps`; `sees_all_translations()` until a see-translations cell exists |

**What is left, and it is not this stream's:** `attachments`, `maintenance_photos` and `project_photos` (6 policies on 3 tables) wait for the
photo split (A3 / A5). `node scripts/check-policy-role-names.mjs --final` is red until that lands, and `perm-drop-enum` does not start
before it is green. So **foundation 3 is not complete**: its promise that no page is left on an old predicate includes the photo routes, which
stay on `assertPhotoWriteAccess`. Every conversion it listed is done; the photo split is the remainder, and I did not tick the item.

Remember when reading §15 later that the scope functions are not a substitute for `has_permission()`: `sees_all_residents()`,
`sees_all_contacts()`, `sees_all_translations()` and `has_shelter_floor()` are each correct **beside** a cell, and `0150` is the one slice
where a function nearly stood alone. `check-app-access-gate` is the check that notices.
