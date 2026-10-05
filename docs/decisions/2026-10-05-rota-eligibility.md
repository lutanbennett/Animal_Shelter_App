# 2026-10-05 — Rota eligibility asks the role's key (`0146`)

Backlog: "A configured role's rota eligibility: the picker and `/my` ask the enum role, not the role's
key" (found by `2ic-role`, R4). Brief `rota-eligibility`.

## The bug

`app_users.role` is the legacy enum. Every configured role borrows `volunteer` as its `legacy_role`, so
the 2IC, the Head of Medical and the Head of Maintenance all read `volunteer`. `canDoJob`,
`loadEligibility` and the picker asked `role_can()` about that borrowed value, and a volunteer may not
open `/stocktake`: the weekly stocktake could not be given to the 2IC and lost its link on her My tasks.
Management only ever worked because her enum value and her key are the same string
(`2026-10-05-management-role.md` §1, §3).

## What changed

- **`0146`** adds `role_key` to `private.app_users` (appended, so `create or replace` holds), from
  `roles.key` through `user_roles.role_id`, falling back to the enum's text for a row with no `role_id`.
  `public.app_users` is `select *`, which Postgres expands at creation, so it is re-created to pick the
  column up, `security_barrier` kept (`0086`); the email masking (`0126`) is untouched. `role` stays.
- **Moved to keys:** `canDoJob`, `rolesForJob`, `jobIsRestricted`, `loadEligibility`, the Recurring jobs
  page and its picker, the save-time `whoCannotDo`, and `/my` (it passes `perms.role.key`, the reader's
  own key, which `role_can()` answers about anyone).
- **Still read the enum, on purpose:** the `.in("role", ASSIGNABLE_ROLES)` gates on who may be assigned at
  all, `loadAssignableUsers` (maintenance), and the whole legacy layer. A configured role passes them
  because it borrows an assignable enum value, and a role cannot be held without one (`0132`).

## `ASSIGNABLE_ROLES`: the 2026-10-04 decision still holds, narrowed

`2026-10-04-permissions-sweep-rest.md` left it by name pending "its own decision when a configured role
exists". This is it. No vet is given a recurring job (Lutan, 2026-09-27) and that stays: `canDoJob`
refuses the key `vet` and `public_viewer`. The constant is now the **enum gate** only and is documented as
such. It is no longer the list of keys eligibility is asked about: those are the keys of the people
concerned, because the set of configured roles is data (`roles`), and Management cannot read that table.

## The second question

"Can this role open the page the job links to" is answered by the role's **own cells** through
`role_can(key, activity, level)`; nothing borrows the volunteer floor any more. A role with no cell for the
page is refused, and an unknown key is asked and answered no.

## What the roles can do afterwards (for `director-draft-roles`' preview copy)

Given a page-linked recurring job, by role, as the cells stand today (this PR does not write cells):

- **2IC:** the stocktake, deliveries, the maintenance board, `/management/purchasing`, enclosures, My tasks
  and any unlinked job. Not `/contacts` (no contacts cell), not `/management/*` otherwise, not `/admin/*`.
- **Head of Medical, Head of Maintenance:** exactly the pages their own cells open, once those rows exist.
  Row 47 (`recurring.do_own`) is what lets a job be done at all; the picker now honours whatever else
  they hold. Until the cells land the picker offers them unlinked jobs only.
- **Volunteers:** unchanged: the stocktake, enclosures, contacts, residents, unlinked jobs; not the
  maintenance board or deliveries.

## Known drift, recorded

`check-recurring-job-eligibility.mjs` case `L canDoJob(/management)` was already red on a clean `main`:
staff and volunteers hold `contacts.directory` (`0144`), so the `/management` landing opens for them and
the pre-conversion fixture row was stale. The script now lists it as moved by the cells
(`MOVED_BY_CELLS`) instead of leaving a red nobody owns; the fixture file is unchanged.

The role label shown in the picker is the dictionary's for built-in roles and the key set out as words for a
configured one ("Second in command"): her configured name lives in `roles`, which only Admin can read.
