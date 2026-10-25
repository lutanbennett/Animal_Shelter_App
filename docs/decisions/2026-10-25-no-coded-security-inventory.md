# Is anything other than a card deciding what a card-only login can do? An inventory, 2026-10-25

Lutan's question, in his words: *"If you cannot guarantee this then don't assert that it does not matter. We will rerun all tests once you
confirm there are no other settings in the system that could impact the card tests."*

This file is the evidence behind the answer. It was built from the **live dev database** (every policy, every function, every view, every grant,
read with a read-only query on 2026-10-25, migrations through `0261` applied) and from a sweep of `src/` and `worker/`. Production was read only
through the named read-only checks (below), so every production statement says how far it goes.

## The answer, first

**Yes. Two coded rules still decide access outside a card, and two more things change what a card-only login can read or see without being
that card's grant. Nothing else was found. The card tests should not be called clean until the first two are fixed or Lutan says to run
around them.**

### A. STILL DECIDES ACCESS OUTSIDE A CARD (two rules; each is its own backlog item, neither is fixed here)

1. **Settings → Who does what opens for a role named `management`, not for a card.**
   `src/lib/permissions/who-does-what.ts:13` is `perms.isAdmin || perms.roles.includes("management")`. A login whose role is *called*
   Management can open the screen that shows every role's cards and cells; a login holding every card but not named that cannot. The page then
   reads all of it with the service role (which ignores the database's own rules), so the database does not back the gate up. Editing is
   separate and is Admin + the authenticator app, so this is a **read** of the role grid, not a way to change it. Backlog: `who-does-what-by-card`.
   (The file's own comment says it was meant to be temporary: *"the stream that gives it an activity changes one line."*)

2. **A login whose role is named `doctor` or `public_viewer` is never offered a recurring job.**
   `src/lib/recurring-jobs/eligibility.ts:36` `NEVER_ASSIGNABLE = ["doctor", "public_viewer"]`, used by the picker (`ASSIGNABLE_KEY_FILTER`
   in `app-users.ts`, the two recurring-jobs files) and by `canDoJob()` / `eligibility-load.ts`. A Doctor role that holds `recurring_jobs` or
   `my_tasks` is not offered jobs; a differently-named role holding the same cards is. The database does **not** enforce this (the
   `reassign_recurring_job` and `record_recurring_job` functions check cards only), so it is an offer rule, not a lock. Backlog:
   `never-assignable-by-card`. It was a decision of Lutan's (2026-09-27, "doctors are not assignable") that predates the card rule.

### B. NOT a coded rule, but it is not "that card's grant" either (matters when reading a card test)

3. **Holding any one card lets a login read a set of things no card gives.** `has_app_access()` (= `holds_app_role()`) is true for Admin or for a
   role holding at least one cell; it is what several policies and views ask. So a login with *only* `do_stocktaking` still reads: the
   **facility maps, map rooms and room placements**, **translatable_fields** and approved map-room translations, and the views
   **`app_users`** (every login's email, display name and role key), **`current_placement`**, **`resident_current_state`** (resident names,
   placement, status, date of death), **`immunization_compliance`**, **`immunization_duplicate_check`** and **`translation_queue`**.
   Derived from cards (no card, no access) but **not from the card under test**, so a "this card gives exactly X" test will see these as extras.
   Every login's reach to the resident-state views is independent of `resident.record`. Whether that is wanted is Lutan's call; it is listed so
   it is not a surprise. Two reference tables, `rounds` and `units`, are readable by **any signed-in login**, card or not.
4. **`roles.show_menu`** (Settings → Who does what, per role) decides whether the login sees the left-hand menu or tiles only. No page is closed
   by it. It is `true` for every role on dev today. If a card test sees "no menu", this is why. Not access, but it changes what is *seen*.

Also **changes what is seen, not what can be opened**: the manual and the release notes mark topics "for your role" by role key
(`src/lib/manual/audience.ts`, `src/lib/releases.ts`). Documentation only.

### C. What was checked and is clean

- **No role column decides anything anywhere in the database.** No policy, view or function reads `roles.scope_*`, `opens_app`,
  `sees_login_emails`, `is_admin` (there is no such column) or `role_extras`. Checked by reading the **live definitions** of all 172 functions in
  `public` and `private` (75 `security definer`), all 49 views, and all 357 policies, for those names and for `roles.key / kind / show_menu /
  home_path`. The only role-by-key reads in the database are the Admin test (`r.key = 'admin'`, in `has_permission`, `holds_app_role`,
  `is_admin`, `role_can`, `reassign_recurring_job`), the structural triggers on `user_roles` (Admin can't be an additional role, there must always
  be an active admin, a retired role can't be given), and `roles_guard_fixed`.
- **Production's live definitions read no role column either.** `node scripts/check-no-role-column-security.mjs --env production` (it asks the database what it holds, not the migration files) reported today: no function, view or policy reads a role column to grant or deny anything; Admin still reaches everything without a card; Admin holds no cards or cells. Same result on dev.
- **A role's cells are exactly its cards.** On dev, `role_permissions` equals the union of each role's cards (through `card_includes` and
  `card_grants`): 0 extra cells, 0 missing, 127 cells across 22 roles. **On production** `cards-union` reports every role "exactly the union of
  its cards" and `role-cards-coverage` reports "every held card is covered", both run today with `node scripts/check-production.mjs`.
- **`role_extras` is gone on dev** (table absent). **On production it is gone by the migration ledger**: `apply-migrations.mjs --status --env
  production` reports 262 applied, 0 pending, against a `main` that contains `0261_drop_role_extras_and_p_bundle.sql`. The table itself was not
  queried on production, so "gone" there rests on the ledger, not on a look. (The 65 rows measured earlier today are therefore past tense.)
- **The 28 cards' grants in the database equal the code's bundles**, card by card (`card_grants` + `card_includes` against `cards.ts`): 0 differences.
- **The Admin bypass is exactly where it is declared**: `can.ts:67` answers before any cell, `has_permission()` and `is_admin()` read `r.key =
  'admin'`. Admin holds 0 cards and 0 `role_permissions` rows on dev. Unchanged and not touched.

## The seven stub functions (inert but present)

These seven answer a constant and are still **called by about 130 policy and view clauses**. They do nothing today. They are the door a role
rule would come back through if one were redefined, so the check now fails on any migration that redefines them.

| Function | Answers | Called by (policies + views) |
|---|---|---|
| `is_clinic_login()` | `false` | 65 (every `doctor_*` policy, so **all ~65 doctor policies are dead**) |
| `sees_all_residents()` | `true` | 17 |
| `sees_all_clinical()` | `true` | 34 |
| `sees_all_contacts()` | `true` | 4 |
| `may_open_resident_record()` | `true` | 2 |
| `on_volunteer_floor()` | `false` | 6 (incl. the `resident_current_state` view) |
| `photos_medical_only()` | `false` | via `can_publish_resident_photos`, `can_approve_photos`, `can_file_pending_photo` |

`current_user_clinic_ids()` and `current_doctor_resident_ids()` still ask `is_clinic_login()`, so they return nothing: a vet's "own clinic" scope
is gone, which matches the doctor holding only cards. The role columns `roles.opens_app`, `scope_residents`, `scope_clinical`, `scope_contacts`,
`scope_photos` **still exist** (24 live roles carry values; five check constraints keep them well-formed) and **nothing reads them**: app
(zero hits in `src/`), database (zero in any function, view or policy), CI scripts aside (`dev-signin.mjs` writes them,
`scripts/lib/old-role-shim.mjs` reads `scope_residents`). Dropping them is its own PR and reaches a dozen check scripts.

## The full table

Verdicts: **card** (derived from `has_permission()` / cards) · **Admin** (the declared exception) · **inert** (present, decides nothing) ·
**OUTSIDE A CARD** · **other** (not a role rule; what it is says in the row).

### 1. Row-level security policies (357 on `public`, 0 on `storage`; read from `pg_policies`)

| Group | Count | What it consults | Verdict |
|---|---|---|---|
| Policies with `has_permission()` | 343 clauses across the set | the cell for an activity | **card** |
| `admin_all_*`, `*_admin_delete`, `*_admin_*` | 30 | `is_admin()` (residents, weight, blood_tests, prescriptions, procedures, immunization_records, placement_history, resident_diets, rounds, group_origins delete/insert/update; role, card, feature, group, role_permissions, user_roles, doctors, doctor_clinics, clinic_visits, audit_log, translatable_fields, assistant_actions) | **Admin**. Note: deleting a resident or a weight is Admin-only with no card for it, which is a card gap, not a coded rule on a card-only login |
| `doctor_*` (vet policies) | ~65 | `is_clinic_login()` (= false) | **inert** |
| `requires_aal2` (RESTRICTIVE) | 27 | `auth.jwt()->>'aal' = 'aal2'` on writes to roles, user_roles, role_cards, role_groups, role_permissions, card_grants, card_includes, card_features, features | **other**: session strength, on top of Admin. Not a card, not a role rule; applies to the role/card tables only |
| `attachments_*_folder_guard` (RESTRICTIVE) | 2 | the `sub_folder = 'medical'` of the row, else `can_publish_resident_photos()` | **card** (a data condition on a card-granted write) |
| `bills_inbox_perm` | 1 | `can_use_bills_inbox()` = three cards | **card** |
| `pending_photos_*` | 4 | `uploaded_by = auth.uid()` OR `can_approve_photos()` | **card**, plus own-row ownership |
| `assistant_actions` | own rows | `auth.uid()` with a card | **card**, own-row |
| `facility_maps_read`, `map_rooms_read`, `map_room_placements_read`, `app_read_translatable_fields`, `map_rooms_translations_read` | 5 | `has_app_access()` (any card) | **B3** above: derived from cards, not from the card under test |
| `rounds_read`, `units_select_perm` | 2 | `true` (any signed-in login) | **other**: reference data readable with no card at all |
| `prescription_rounds_read`, `resident_diet_rounds_read` | 2 | `EXISTS` on the parent row, so the parent's RLS | **card** (inherited) |
| `desexing_signups_anon_insert` | 1 | `status = 'new'`, role `anon` | **other**: the public sign-up form, by design |
| `sees_all_*`, `may_open_resident_record`, `on_volunteer_floor` clauses | ~130 | constants | **inert** |

No table has row-level security off. Seven tables have RLS on and **no policy** (service role only): `status_alert_test_requests`,
`calendar_sync_state`, `video_uploads`, `schema_migrations`, `receipt_counters`, `status_alert_runs`, `status_alert_checks`.

### 2. Functions (172 in `public`/`private`; 75 `security definer`)

Definer functions that gate on a card or Admin: `has_permission`, `is_admin`, `role_can`, `my_permissions`, `reassign_recurring_job`, `record_intake`,
`record_stocktake`, `record_stock_correction`, `record_recurring_job`, `record_attachment`, `record_deceased_archive`, `undo_deceased_placement`,
`issue_donation_receipt`, `set_resident_microchip`, `set_resident_profile_photo`, `set_resident_drive_folder`, `set_shelter_photo_folder`,
`shelter_photo_folder`, `delete_resident_photo`, `set_label_th`, `label_translations`, `weigh_first_visits`, `stock_diet_forecast`,
`stock_medication_forecast`, `can_approve_photos`, `can_publish_resident_photos`, `appeal_photos_medical_stamp`, `site_content_stocktaking_guard` →
**card** or **Admin**. **Nothing else in the definer set consults a role**, with these exceptions, each checked by reading its body:

| Function | What it does | Verdict |
|---|---|---|
| `holds_app_role()` | Admin or a role with ≥1 `role_permissions` row | **card** (any card); source of B3 |
| `user_roles_extra_role_rules`, `user_roles_keep_an_admin`, `user_roles_take_live_role`, `roles_guard_fixed`, `role_cards_guard`, `role_permissions_guard` (triggers) | keep Admin/public_viewer fixed, always an active admin, no retired role | **Admin** structure; they refuse writes, they grant nothing |
| `doctors_guard_login`, `site_content_stocktaking_guard` | Admin + aal2 to link a doctor / switch Stocktaking | **Admin** + session strength |
| `desexing_signups_gate` | `auth.role() = 'anon'` limits on public sign-ups | **other** (public form) |
| `current_*_ids`, `clinic_login_*`, `doctor_can_write_attachment`, `attachment_resident_id` | ask `is_clinic_login()` | **inert** |
| `approved_translations`, `is_public_drive_file`, `shelter_date/today/time_zone` | callable by `anon`; return published translations, public file flags, dates | **other** (the public site) |
| `can_see_drive_file`, `is_known_drive_file` | caller-RLS (invoker) / definer file-id lookups | **card** via RLS (`can_see_drive_file`); `is_known_drive_file` is definer (its callers were not traced) |
| `record_audit`, `*_stamp`, `*_guard`, `*_default_*`, `reset_*`, `close_prior_placement`, `handle_deceased_placement`, `purge_assistant_actions`, `scheduled_job_status` | triggers and housekeeping; read `app.*` settings or `auth.uid()` to stamp who did it | **other** (bookkeeping) |

45 definer functions are executable by `authenticated`, and 5 by `anon` (`approved_translations`, `is_public_drive_file`, `shelter_date`,
`shelter_time_zone`, `shelter_today`). `has_permission`, `is_admin`, `holds_app_role` and `my_permissions` answer about the **caller** only
(`auth.uid()`), and `role_can` refuses to answer about a role the caller does not hold unless they hold `recurring.manage` at edit.

### 3. Views (49)

| Group | Verdict |
|---|---|
| 18 `public_*` views (anon + authenticated, no gate) | **other**: the public website; what they show is controlled by published flags and the hidden-pages setting, not roles |
| `picker_*`, `stock_*`, `medication_list_*`, `medical_photo_residents`, `special_diet_list` (they call `has_permission()`) | **card** |
| `app_users`, `current_placement`, `immunization_compliance`, `immunization_duplicate_check`, `resident_current_state`, `translation_queue` | `has_app_access()`: **B3** |
| `resident_who_and_where` | `sees_all_residents()` (= true) | **inert** |
| remaining invoker views | inherit the underlying table's RLS | **card** |

### 4. Role-table columns

| Column | Exists? | Read by the app | Read by the database | Verdict |
|---|---|---|---|---|
| `roles.opens_app`, `scope_residents`, `scope_clinical`, `scope_contacts`, `scope_photos` | yes (24 live roles carry values) | no (0 hits in `src/`, `worker/`) | no (0 functions, views, policies) | **inert** |
| `roles.sees_login_emails` | dropped (0259) | no | no | gone |
| `roles.kind` | yes | read into `Permissions` and by the Who-does-what editor to refuse `fixed` roles; CHECK ties `fixed` to admin/public_viewer | trigger `roles_guard_fixed` | **Admin** structure |
| `roles.show_menu` | yes | `src/lib/menu/show-menu.ts` | no | **B4**: changes what is seen |
| `roles.home_path` | yes | read into `Permissions`; nothing redirects on it | no | **inert** |
| `role_extras` (table) | dev: dropped. Production: dropped by ledger (0261) | no | no | gone |

### 5. The card machinery's side doors

- **`CARD_SATISFIED_BY`** (`cards.ts:231`): one entry, `approve_photos: ["approve_photos"]`. It is a card satisfied by **itself**, so it is a
  no-op: no card is satisfied by another. **Card.**
- **`card_includes`** (3 edges in the database, matching `includes` in the code): `residents → view_residents`, `medical_records →
  view_residents`, `book_clinic_visits → view_residents`. The effect is one extra cell, `resident.record` at **read**, which the card was already
  documented to bring.
- **`requiresCardSomewhere`**: `add_photos` can only be given to a role once *some* role holds `approve_photos` (`0221`, enforced in
  `set_role_cards()`). An **assignment** rule, not an access rule; it never reads a role name.
- **Per card, single bundle or closure** (verified from `cards.ts` and `card_grants`; 28 cards):
  - **Closure of two bundles (the card plus `view_residents`):** `residents` (11 activities), `medical_records` (9), `book_clinic_visits` (3).
  - **Single bundle, 23 cards:** `view_residents`, `administer_medication`, `record_weight`, `add_medical_photos`, `feed_special_diets`,
    `do_maintenance` (7), `do_stocktaking`, `do_purchasing`, `record_delivery`, `contacts` (7), `recurring_jobs` (3), `dashboard` (2),
    `donations_receipts`, `bills`, `website`, `outreach_notes`, `assistant` (2), `enclosures`, `add_photos` (2), `approve_photos` (3),
    `run_appeals` (2), `meme_library`, `my_tasks`.
  - **Single, empty:** `operations_landing` and `management_landing` grant **no cell**. They open a landing page on "any page under it"
    (`opensAnyIn`). So a login holding only one of them has no cell, and `holds_app_role()` is **false** for it: it is outside the app. Worth knowing
    when testing those two.
- Database `card_grants` equals the code bundles for all 28 cards (0 differences).

### 6. Two-step (`aal2`)

- **Database:** the 27 restrictive policies and the two triggers above. Nothing a card-only login can reach.
- **App:** `/admin/security` (Admin + aal2), `/admin/stocktaking` (switch), `/admin/who-does-what` **editing** (Admin + aal2; viewing is the rule in A1),
  `/my` shows a banner to an Admin who has not enrolled. `src/lib/auth/two-step.ts` decides assurance from the Supabase session.

### 7. Service role and other bypasses of RLS

27 files use the service role (named one by one, with what each is for and what guards it, under `serviceRoleSites` in
`docs/hard-coded-security-registry.json`). The ones that read **role** data are `home/roles.ts`, `menu/show-menu.ts`, `held-roles.ts`, the two
Who-does-what pages (see A1) and the Admin Security screen. The rest are Worker/cron jobs (shared-secret routes `calendar/sweep` and `status/alerts`,
`worker/*`) and Google Calendar/Drive plumbing. The facility-maps storage bucket is private with **no storage policy**, so it is reachable only
through `/api/facility-maps/[...path]`, which checks the caller. **Not established:** that every one of these call sites is guarded as the registry
says; the check insists each is *named*, it cannot judge the guard.

### 8. App-side guards

| Guard | Decision is | Verdict |
|---|---|---|
| `can()` | cells, with `isAdmin` first | **card** + **Admin** |
| `requirePermission()`, route registry (`routes.ts`, 45 pages) | the activity a page registers | **card** |
| `entersApp()` | Admin, or ≥1 cell | **card** (any card) |
| `tiles.ts` / `cardTile()` | the role's cards re-checked against the page rules | **card** (the silent drop is reported, not hidden) |
| `canUseBills` | three activities | **card** |
| `opensAnyIn` | any page in the section the role can open | **card** |
| `opensWhoDoesWhat` | `isAdmin` or role `management` | **OUTSIDE A CARD** (A1) |
| `NEVER_ASSIGNABLE` | role keys `doctor`, `public_viewer` | **OUTSIDE A CARD** (A2) |
| `home/group/[id]` | the role is one the login holds | **other** (own-role view) |
| Admin-only previews (`/home/[role]`) | `isAdmin` | **Admin** |

### 9. Environment and flags

Every `process.env` the app reads is now named in the registry with what it gates (22, listed there). Those that decide who sees what:
`PUBLIC_SITE` (`"locked"` puts the public website behind sign-in on that Worker; sees only public pages), the Worker host variables, and the
shared secret `ORIGIN_KEY` for cron routes. **None reads a role or a card.** Database-side switches: `site_content.stocktaking_food_enabled` /
`stocktaking_medical_enabled` (Admin + aal2 to change; they hide the Stocktaking feature for everyone), the `hidden_public_pages` list (public site
only). `features` / `card_features` are **grouping for the card list** (names and order), not switches: no feature can turn a card off.

### 10. Middleware

`src/proxy.ts` (67 lines) redirects hosts and lets public pages through; it has no role or card reference. A signed-out visitor on a non-public
path is sent to sign-in by the pages' own guards. **Not established:** the Cloudflare configuration in front of the Worker (access rules, WAF) and
the Supabase Auth project settings (whether sign-up is open, which providers are on). Those decide who can *become* a login and live outside the
repository; nothing in this inventory covers them.

## What the check now does, and what it cannot see

`node scripts/check-hard-coded-security.mjs` asserts zero. It fails on: an unrecorded read of a role by key, of a retired role column, of the roles
table, or of `show_menu`; a new service-role file; a new environment variable; a record that no longer matches (so a fixed rule cannot linger); a
broken Admin bypass; and, in any migration from `0262`, a policy that does not resolve through `has_permission()` or `is_admin()`, a security
definer function that does not call a card or Admin function, a read of a retired role column, a redefinition of one of the seven stubs, or a grant
to `anon`/`public`. It prints `no coded security outside the Admin bypass` only when the two rules in A are gone; until then it prints NOT CLEAN
and names them.

It **cannot see**: the live database (only migration files; a change made by hand in the SQL editor is invisible: use `check-production.mjs`), a
role rule written in a shape the patterns do not match (a role key assembled from pieces, kept in a variable or looked up in a table), whether a
service-role call site is guarded, or anything in Cloudflare/Supabase Auth settings.

## Not established, and what would establish it

- **Production's full policy-by-policy and function-by-function list.** Role-column reads are established on production by `check-no-role-column-security.mjs`; the *counts*, the seven stubs, the any-card floor (B3) and the `is_admin()` policies were read on **dev only** and carried to production by the ledger (262/262 applied, same migrations). Establish: run the same `pg_policies` / `pg_proc` read against production, which needs Lutan to allow an ad-hoc production read (they are refused in worktrees).
- **That dev's live policies equal what the migrations say.** Established only for the role-reading names, not policy by policy. Establish:
  replay the migrations into an empty database and diff `pg_policies`.
- **That every server action calls `can()`.** A missing gate is a different fault from a coded rule and was not audited here.
- **Cloudflare and Supabase Auth settings** (above).
- **Google Drive sharing** (folder permissions decide who can open a file by its direct Drive link, outside the app).

## Decisions made while doing this

- The check asserts zero but is allowed to **exit 0 while the two rules in A are listed** (printing NOT CLEAN). Making it exit 1 now would turn
  every PR red until two access changes ship, which this PR was told not to make. The two are named rules with backlog items, not a baseline: the
  entry is deleted the day the line goes, and the check fails if the line is gone but the entry is not, so the list can only shrink.
- No access was changed, no policy removed, no card created or touched, `role_extras` not touched.
