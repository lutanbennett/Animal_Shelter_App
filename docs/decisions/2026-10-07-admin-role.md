# 2026-10-07 — `admin-role` (R6): Admin needs nothing built; the real blocker for `perm-drop-enum` is the vet, then Admin's own 42 policies

`docs/roles-and-permissions.md` §12 R6 and §15 "R6 Admin, and the finish". It follows `2026-10-05-management-role.md`, whose shape it copies.
**No migration was written; `0153` was not used.** The brief asked first for "what does R6 still need?", with evidence. The answer is below.

## 1. What R6 still needs: nothing

§12 R6 is "The Settings tables and setup lists on `has_permission()`. `user_roles` keeps its own fixed rule (§6). Done when: parity green."

- **The tables are converted.** `perm-convert-settings` (`0150`) did `assistant_actions`, `translations`, `facility_maps`, `fixed_outgoings`; the
  setup lists went with `0148` and `0145`. `node scripts/check-policy-role-names.mjs --final` prints
  `ok no policy names 'management'::app_role or 'staff'::app_role` and `RESULT: GREEN (the end state)` on dev, 2026-10-07 (the photo split's
  `0152` emptied the last `OWNERS` entries).
- **No `roles` row is wanted.** Same reasoning as Management §1, stronger: Admin is `legacy_role admin` with no cells, "a rule, not data" (`0132`), and
  `has_permission()` answers yes before it reads any table (§6 rule 1). A trigger refuses a cell for it. A row would have to be invented and then
  refused by that trigger.
- **The Settings pages' guards are already on the registry.** `src/app/admin/`: every `page.tsx` calls `requirePermission`, `requireAdmin` or
  `requireAnyPageUnder`, except `contacts/` and `vets/` (bare redirects to `/management/*`) and `role-draft/`, which refuses through
  `refuseFor`. Nothing to convert, and `management-settings-split` owns where pages live, so none was touched.
- **`user_roles` keeps its fixed rule:** `admin_all_user_roles` (`current_user_role() = 'admin'`) and the 2-step security rules are unchanged by design.

**Parity, and a finding about §12's done-when.** Re-measured on dev with `check-permission-parity.mjs`: **1,926 match / 24 known / 21 mismatch**
(before this stream and after; it changes nothing). The 21 are the vet's lines (`resident.adoption_news`, `visit.book`, the vet's cells), as in
`2026-10-06-perm-convert-settings.md`. `check-permission-tables` ends `HARNESS-KNOWN-RED` on the same lines. So **R6 cannot show "parity green" while
the vet disagreement stands**, and §12 wrote that done-when as if Admin's slice could be green by itself. It cannot: the board is global, and the vet's
disagreement is the draft's, not Admin's. R6 is **satisfied in substance, not green on the board**, and the owner of the red is the vet decision (§3).
Re-ran green: `check-policy-role-names --final`, `check-permission-catalogue`, `check-home-screens`.

## 2. What actually blocks `perm-drop-enum` (measured on dev, 2026-10-07)

§15 gates `perm-drop-enum` on "every table converted, vets and staff included". Staff is done. The brief expected the vet to be the gap and
said 62 `vet_*` policies. Counting `pg_policies` and not the migrations, **it is wider than the vet**:

| What still names the enum | Count on dev | Owner today |
|---|---|---|
| `vet_*` policies (text names `'vet'::app_role` or `current_user_role()`) | **71 on 29 tables** (the migrations show 62 distinct; later files added more) | nobody: `0135` "Last (§12)" |
| `admin_*` policies (`current_user_role() = 'admin'`, e.g. `admin_all_residents`) | **42** | nobody; §15 never mentions them |
| `volunteer_read_enclosures`, `volunteer_read_zones` | **2** | nobody (`0134` left them) |
| Functions that read the role: `current_user_role`, `has_shelter_floor`, `merge_vet_doctors`, `reassign_recurring_job`, `record_attachment`, `record_deceased_archive`, `record_recurring_job`, `record_stock_correction`, `record_stocktake`, `set_resident_microchip`, `set_standard_diet`, `undo_deceased_placement`, `user_roles_sync_role_id`, `vet_doctors_guard_login`, `vet_may_edit_doctor` | **15** | partly `perm-drop-enum` |
| Views: `current_placement`, `immunization_compliance`, `immunization_duplicate_check`, `recurring_job_staffing`, `resident_current_state`, `resident_who_and_where`, `translation_queue`, `vet_contacts`, `volunteer_contacts` | **9** | `perm-drop-enum` |
| Columns of type `app_role`: `user_roles.role`, `app_users.role`, `roles.legacy_role` | 3 | `perm-drop-enum` |

**The Admin finding, and why it belongs here.** `check-policy-role-names.mjs` looks only for management and staff, so "R6 Admin, and the finish" looked
done while **42 `admin_all_*` policies still call `current_user_role()`**. They are harmless today and each is redundant beside a `_perm` policy
(Admin passes `has_permission()` anyway), but dropping `current_user_role()` and the enum breaks every one. They fall in two groups: tables that also
have a converted `_perm` policy (drop the `admin_*` policy, parity unchanged, because `has_permission()` already admits Admin) and Admin-only
tables with no cell (`user_roles`, `roles`, `role_permissions`, `permission_activities`, `audit_log`, `site_content*`, `site_pages`,
`translatable_fields`), which need an `is_admin()`-style rule that does not read the enum (§6). That is a small, mechanical schema PR and is
**the one piece of R6 that was left unowned**; it is filed as a backlog item, not done here.

## 3. The vet decision that is Lutan's, recorded

The vet's actual rows come only from the 71 `vet_*` policies, which never ask the cells (`0135`: "a vet's rows come only from the `vet_*` policies").
The Director's draft narrowed the vet's **cells** to the microchip; Lutan ruled vets stay on hold ("may be turned on in the future but is not a
specific need right now"). **Converting the vet makes the draft real: today the narrowing is cosmetic.** A doctor login would lose clinical access it
has today. That is a behaviour change, not a refactor, and the 21 red lines are exactly this. The question for Lutan, already half-recorded in
`2026-10-06-director-draft-apply.md`:

> **Do vets keep their reference-data cells while on hold (the paper's 13), or is the paper rewritten to the draft's one?**

Until it is answered the vet conversion cannot be written without choosing. This stream did not choose and did not start it.

## 4. Where this leaves §15

`perm-convert-settings` is the last of the staff/management conversions and `--final` is green. In front of `perm-drop-enum` there are now
**three** things, not one: (a) the vet conversion, blocked on §3; (b) `perm-convert-admin`, the 42 + 2 policies above, unblocked and mechanical;
(c) the 15 functions and 9 views, which `perm-drop-enum` can carry. `check-policy-role-names.mjs` should be extended to count `'vet'::app_role`,
`'admin'::app_role`, `'volunteer'::app_role` and bare `current_user_role()` in policy text, with an `OWNERS` entry per table, so that this table
cannot drift the way "done" did for Admin; filed with (b).

## 5. Not done

- The roles-build backlog item is **not ticked**: it also waits on watched tests of the 2IC, Management and the Head roles, and on the vet.
- Nobody has driven Admin's Settings pages in a browser in this stream; no code changed to need it.
