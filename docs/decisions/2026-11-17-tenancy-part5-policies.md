# Part 5 of the tenancy programme (#ujqr5): the per-shelter restrictive policies, applied to dev

**Status: built and applied to dev 2026-11-17 (`0392`, `0393`, `0394`). In no release yet. `#ujqr5` stays open: `NOT NULL` and Part 7's filters are not this stream's.**
Supersedes nothing: `2026-11-16-tenancy-part5-policies.md` (PR #1635) is the stopped attempt this one starts from.

## The shape

`0392` puts three restrictive policies (`shelter_scope_select`, `_update`, `_delete`) on every public base table that carries `shelter_id`, to `anon` and `authenticated`:

    using (is_trusted_caller() or shelter_id = current_shelter_id())

A restrictive policy can only take rows away from what the card policies already allow. It grants nothing: cards and Admin decide the action, the header decides which rows exist to do it to. `can.ts`, `has_permission()` and the Admin short-circuit are untouched.
**The policies are generated from the catalogue** (every table with the column, except `shelters`), so no list has to be kept in step; **a table added later with a `shelter_id` column gets no policy until `0392`'s loop is re-run** (it is re-runnable). Measured on dev: 95 tables, 285 policies.
**INSERT is deliberately not restricted.** New rows take `current_shelter_id()` by default (`0390`); tightening a no-header write belongs with `NOT NULL` (`#stmp5` step 3, after Part 7), because a restrictive insert check would turn a no-header write into an error everywhere at once.
To undo: drop the three `shelter_scope_*` policies from each table; reads return to exactly what the card policies allow.

## Step zero and the trap check (deliverables 1 and 2)

- Not already built: no `shelter_scope_*` policy before `0392`.
- Before readings: catalogue `0 flagged, 2 allowed by name, 0 stale` (same as #1635); canary `0 new leak finding(s), 0 known (Part 5), 0 unstable`. **#1635 recorded `2 known`; `0391` had already emptied `KNOWN_TODAY`, so those two entries were already gone and there was nothing to clear.**
- `prove-dev-shelter-header.mjs`: **17 rows with the header, 0 without, 0 with another shelter's.** The trap #1635 hit (all columns null) is gone.
- After readings (after `0392`/`0393`/`0394`): catalogue `0 flagged, 2 allowed, 0 stale`; canary `0 new, 0 known`; `check-public-views.mjs` exit 0; `check-migration-grants.mjs` ok; `check-hard-coded-security.mjs` clean; `check-null-shelter-id.mjs` clean.

## Question 1: which tables (deliverable 3)

**95 get the policy** (every table with `shelter_id`). **29 do not**, because there is nothing to filter on; "nothing to filter on" is not "safe to share", so each is judged:

| Table | Why it takes no policy |
|---|---|
| `shelters` | The tenant table itself; its row is the shelter. Reading it is the tenant lookup, not tenant data. |
| `schema_migrations` | Platform: which migrations ran, not shelter data. |
| `status_alert_checks`, `status_alert_runs`, `status_alert_test_requests` | Installation monitoring (Pi/Worker health). Platform, see question 2. |
| `calendar_sync_state` | One row per Google calendar id, a sync cursor. Installation plumbing; **would need a column the day a second shelter has its own calendar.** |
| `permission_activities`, `card_features`, `card_grants`, `card_includes`, `features` | The card catalogue: what a card is and grants. Code-defined and identical for every shelter. **But `card_grants`/`card_includes` hold assignments, not just definitions; read when Part 6 handles singletons, and watch it.** |
| `translatable_fields`, `translatable_labels` | Which columns are translatable: schema metadata. |
| `translations`, `label_drafts`, `label_sources` | **Judgement call, flagged:** they hold text keyed by `(table_name, row_id)`, so they mirror tenant rows. Today they hold Lanna's labels only. When a second shelter exists these need a column of their own; they are the likeliest "lookup that turned out to hold one shelter's data". Reported for the planner to file. |
| `bill_kinds`, `blood_test_types`, `immunization_types`, `procedure_types`, `frequency`, `units`, `group_origins` | Lookup lists a shelter chooses its own values for. They carry no column, so they are shared today, and **that is a real gap when shelter two edits one** (`archived_at`, `sort`, `cost` on `immunization_types`). Not a leak of a row anyone owns yet. For the planner to file with Part 6. |
| `diet_types`, `diet_ingredients`, `item_unit_conversions`, `merch_exchange_rates`, `donation_channels`, `community_places` | **Look like lookups but hold one shelter's data:** stock on hand, unit costs, bank and PromptPay details, places. **These are the reading's wrong part:** they are not safe to share. Not fixed here (no column to filter on; adding one is a schema change in Part 6's territory). For the planner to file, named. |

So the planner's reading held for the 95 and for roughly half of the 29; **about ten of the 29 are tenant data with no column**, which is the leak-with-no-column-to-catch-it the brief warned about.

## Question 2: the eight unclassified service-role sites (`src/lib/status/alerts.ts` 6, `usage.ts` 2)

Tested by reachability, not intent. Their only readers are `/admin/status` (`page.tsx`, `actions.ts`), the alert route, the calendar poller and `health.ts`. **`/admin/status` is gated by the card `system.status`, which is an ordinary card** (`catalogue.ts:112`, kind `yesno`), so any login a shelter gives that card reaches it. `usage.ts` counts sign-ins (it pages `auth.admin.listUsers`), residents, clinic visits, weights and uploads **with the service role, across every shelter**.
**Answer: `usage.ts` is a tenant leak, not platform monitoring** the moment a second shelter has a login holding `system.status`: it shows that shelter's staff another shelter's counts and account numbers. `alerts.ts` reads installation state and mails the admins; its read side (`checkAlerts`) shows alert health only, platform. **Reported, not fixed: it is Part 7's filter (batch 3).** Whether `system.status` should be a card Admin alone can hold is Lutan's, and is not put to him here.

## Question 3: trusted-caller paths (deliverable 5)

- `is_trusted_caller()` is true when the JWT role is neither `anon` nor `authenticated`: service role, cron, and Management API sessions (no claims) are unfiltered.
- No table forces RLS (`relforcerowsecurity` 0), so the **35 `postgres`-owned definer functions bypass the policies**; the **57 owned by `rls_definer`** (`0375`) obey them, run with the caller's claims, and so see exactly the caller's shelter.
- **That second group is where the policies bit.** `has_permission()` is owned by `rls_definer` and reads `user_roles` and `roles`. A `user_roles` row with a null `shelter_id` made `has_permission()` return false, so the whole login lost every card. **Found by measuring, not reading:** the first real-user proof returned 0 rows of 17.
- Root cause was not the policy: it was **rows written without a header**. After `0390`, 27 rows on dev had a null shelter (audit_log 21, reels 2, video_uploads 2, write_requests 1, user_roles 1), from `dev-signin.mjs` (service role, no header), the Pi's pollers and trigger-written audit rows. `0394` re-stamps them (the same statement as `0390`, idempotent), and `dev-signin.mjs` now sends the header.
- **This is the finding that matters for production.** Until `NOT NULL` and Part 7 land, every headerless writer keeps producing rows these policies hide, and a null `user_roles` row **locks a login out of its own cards**. Production must not receive `0392` without `0394` re-run immediately before it, and the release order guard already on `#ujqr5` stands.

## Deliverable 7: the browser

The real admin login (user id read from `dev-signin-admin`), through the same role, claims and header path PostgREST uses, in a rolled-back harness: **residents 17 with the dev shelter header, 0 with no header, 0 with another shelter's header, 17 as a trusted caller.** This is the proof that tenancy holds. **A click-through in the browser pane was not completed**: pasting the sign-in cookie failed twice (my transcription of a ~3 KB token), and the first attempt bounced to `/login` because the admin's own `user_roles` row was one of the null ones. Left for a person.

## Not done, and whose

- `NOT NULL` on any column: `#stmp5` step 3, after Part 7.
- INSERT policies: with `NOT NULL`.
- Part 7's filters, including `usage.ts`: batch 3.
- Giving the ~10 tenant-data tables above a column: Part 6's singletons work, for the planner to file.
- The production release of `0392`: release-time, two-release order per `#ujqr5`.
