# 2026-10-05 — `management-role` (R5): Management is the template role, not a fifth configured one

`docs/roles-and-permissions.md` §12 R5. It follows `2026-10-05-management-phone-home.md` (the screen) and the four role
files (`medical`, `maintenance`, `2ic`, and R1's volunteer narrowing). **No migration was written; `0146` was not used.**

## 1. The call: no new `roles` row, and `legacy_role` stays `management`

The brief assumed R5 would add a row the way R2 to R4 did. It does not need one, and Lutan confirmed in chat
(2026-10-05) after being shown the alternative: build on the existing role.

`roles` already holds `management` (kind `default`, 48 cells, `legacy_role = 'management'`, `home_path` null, from `0132`).
Every earlier role had to *invent* a floor because nothing existed that matched it. Management is the one role whose
floor already exists, and it is the enum value its own policies name:

- **`legacy_role = 'management'`** is today's rights exactly. Every table still answering by role name (`check-policy-role-names.mjs`:
  22 tables, 50 policies, owned by `perm-convert-people`, `-stock-and-lists`, `-work`, `-settings` and the photo split) already admits her.
  Nothing is to be rebuilt, and nothing she holds is narrower in the database than the cells say.
- **A new configured row on the `volunteer` floor** (the four precedents) would have needed a price-free view or cell policy
  for each of those 22 tables, written to be thrown away when the conversions land. The 2IC's `0143` was 360 lines for four
  jobs; hers would be several times that, for a role whose whole point is that it is wide.
- **A new row on the `staff` floor** was the brief's candidate. It *mostly* fits and mostly is the problem: the
  `management_*` policies (stock correction, medication and diet prices, publishing a photo, moving a resident) would not
  admit it, so she would be refused things her cells grant, the opposite of a leak and just as wrong.
- **The tile screen would also have been lost.** `managementDay` in `src/lib/home/tiles.ts` is keyed on the role key
  `management`. A row called anything else falls through to the generic home (§4 below).

**This is linked to the 2IC's call (§1 of that file), as the brief said.** The 2IC chose `volunteer`, and that is what
*created* the rota-eligibility bridge problem: `app_users.role` is the enum, so a configured role looks like a volunteer to
`canDoJob`. Management does not have that problem at all, because the enum value and the role key are the same string. She
is the one configured-or-not role the rota code answers correctly today (§3).

What it gives up, said plainly: Management is not a *demonstration* that the configured-role route scales to the widest role.
That is now R6's question (Admin), and the "roles a shelter adds" stream's.

## 2. What R5 was, once the row was not needed

The brief's other items are mostly already built (`management-phone-home` #372, `perm-convert-*` 0135/0144/0145,
`home-screens`). What this stream did is **drive the screen as a real Management login** and record what came out:

| Check | Result |
|---|---|
| `/home` as a Management login at 375 px | four tiles: Recurring jobs, Intake, Residents, My tasks; no overflow |
| Admin's switch (`check-home-screens-live.mjs`) | all expectations held; `/home/management` shows the same screen |
| The four tiles' pages, English and Thai (`check-phone-width.mjs --roles=management`) | 82 page views, **4 overflowed**: `/management/recurring-jobs` (hers, fixed here) and `/management/medications`, `/management/diets`, `/residents/[id]/rehome` (owned by `phone-width-fixes`) |
| `check-policy-role-names.mjs`, #370's assertion | green: every remaining role-named policy has an owner |
| Parity | before **1,930 match / 30 known / 0 mismatch**; unchanged (no migration) |

**The one defect.** Recurring jobs is the first tile and, on dev's real rows, scrolled sideways by 56 px: the *Hand over*
person picker sets its width from its longest option (a name plus an email plus a role), and the label did not let it shrink.
`min-w-0 max-w-full` on the label and the select. The phone-width check found it only because dev holds long emails; the
seeded rows did not include one.

## 3. Findings for `rota-eligibility` (batch 52; not fixed here, no migration numbered)

Driven as a Management login on dev, opening *New recurring job* and linking it to **Stocktake**:

- The picker says *"Only roles that can do the work on the linked page are listed: Admin, Management, Staff"* and lists those
  people. **A 2IC login (`second_in_command`, `legacy_role` volunteer) is not offered**, although she holds `stock.count`.
  That is the bug as filed, reproduced from Management's side.
- **Management herself is offered**, and `/my` keeps her link, because `role_can('management', …)` is asked about the key
  `management`, which equals her enum value. So Management is *both* the assigner and a correct assignee; the bug is wholly
  on the assignee side for configured roles.
- Not checked: how the 2IC is labelled in the picker for a job with no link (she should appear, as the enum role); and
  whether `Hand over` lists her. The stream should look at both.
- For the fix: `ASSIGNABLE_ROLES`, `canDoJob`, `loadEligibility` and the three callers (`recurring-jobs/page.tsx`,
  `actions.ts`, `my-tasks/recurring.ts`) all work in enum values; `app_users` is a view, so it needs the role key (`0147`).

## 4. The trap this leaves for the "create a role" stream

The curated screen is keyed on the string `management` (`tiles.ts`, `perms.role.key === "management"`). A shelter that creates
its own manager role in Settings, even with Management's exact cells, gets the **generic** home (one tile per page, minus
desk pages), not the four-tile one. That is the same shape as the bug that bit each earlier role, one level up. It is not
fixed here because no such role can be created yet (the matrix is last in §12) and the right fix is a decision about whether
a home is a property of the role (`roles.home_path`, which already exists and is used by a vet) or of a job list. Filed on the
backlog branch.

`check-home-screens.mjs` now pins the property the screen was built for: take away `recurring.manage`,
`resident.register` or `recurring.do_own` from Management in turn and exactly that tile goes; take away all three and
Residents is still there. A role edited in Settings loses a tile; it never gets one that refuses.

## 5. The jobs layer: what four worked examples plus a fifth case say

The backlog said the layer would be formalised from three or four examples. The pattern is now clear enough to name, and
Management is why:

- **Job-built roles** (Head of Medical, Head of Maintenance, 2IC): the role's cells **are** the union of its jobs'
  bundles (`bundleOfRole()`, checked against `role_permissions` by each role's script), and the home is its jobs, one tile each.
- **Template roles** (Management, Staff, Vet, Volunteer): the cells are *wider than the home*. Management holds 48 cells and
  four tiles; the other forty-odd pages stay in the sidebar (L7 is open). Her tiles are a **view over her rights**, not the
  source of them, so putting her in `JOBS_OF_ROLE` would be wrong: the "cells equal the union of the bundles" check could
  not hold for her, and removing a job would imply removing rights she is meant to keep.
- **What both share, and what is worth keeping as the rule:** *a tile appears if and only if the role holds the cell its page
  needs.* `homeTilesFor` already enforces it in both branches; the new checks pin it for the template one.

So: do not formalise jobs into a table now. The distinction above is the useful judgement, and the Settings matrix, when it
exists, should offer jobs as *shortcuts for granting* (job-built roles) while a role's home can still be a curated list.

## 6. Per-screen handover for Admin (R6)

| Screen | Reads | Writes | Gate | Trap |
|---|---|---|---|---|
| `/home` (Management) | her cells | none | any | keyed on role key `management` (§4) |
| `/management/recurring-jobs` | rota, assignees, eligibility via `role_can()` | the rota | `recurring.manage` | picker is by enum role (§3); the Hand over select now fits 375 px |
| `/residents/new` (Intake) | zones, enclosures | the wizard | `resident.register` | deliberately not in the route registry, or Staff would get an Intake tile |
| `/residents`, `/my` | unchanged | unchanged | unchanged | none found |

**What R6 inherits.** Admin is the fixed role (`legacy_role admin`, no cells; `has_permission()` answers yes for everything),
so it has no bridge problem either. What remains for R6 is the Settings tables and setup lists
(`perm-convert-settings`: `facility_maps`, `fixed_outgoings`, `translations`, `assistant_actions`), then `--final` on
`check-policy-role-names.mjs`. The parity check is the proof; its 30 known tightenings are closed by the table conversions,
not by any role.

## 7. Not done, and who has to look

- **Nobody has watched the Director use these screens on a phone.** The Test plan's manual table says so. R5's done-when,
  "the Director has run a day from her phone", is therefore **not met**, and the roles item stays open.
- No login exists for a Management user at Lanna beyond Admin's switch (the Director holds Admin). The dev login used above
  was made by script and removed.
- `/management/medications`, `/management/diets` and the rehome carer select still overflow at 375 px; they are
  `phone-width-fixes`' and were not touched.
