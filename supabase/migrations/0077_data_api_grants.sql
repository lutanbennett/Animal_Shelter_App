-- Data API grants, written down (Supabase notice received 2026-09-24).
-- See docs/decisions.md, 2026-09-24.
--
-- From 2026-10-30 Supabase stops giving new tables in `public` automatic
-- grants to anon / authenticated / service_role. Until now every table,
-- view and sequence we created picked those up from the project's
-- `alter default privileges`, so no migration before this one grants them
-- (bar the public_* views, app_users and translation_queue, which grant
-- narrowly on purpose). Existing objects keep what they have — but a
-- from-scratch rebuild of these files (a new project, a `db reset`) after
-- that date would create every table unreachable through supabase-js:
-- "permission denied", whatever RLS says.
--
-- This file makes the grants the app relies on explicit, so the schema is
-- complete without the defaults. On dev and production today every line is
-- a no-op: the defaults already granted all of it and more.
--
--   authenticated   select/insert/update/delete on every table. RLS is the
--                   real gate and stays so; the grant only lets PostgREST
--                   reach the policies.
--   service_role    the same (admin.ts, the worker, scripts). It bypasses
--                   RLS but not grants.
--   anon            only what the public site reads straight from a base
--                   table: site_content, site_content_photos and site_pages,
--                   each with a `public_read_*` policy that says so. The
--                   public_* views grant anon themselves and are re-stated
--                   below. Nothing else — no DML, no internal views.
--   sequences       usage + select, which is what an insert's
--                   nextval() default needs.
--
-- It deliberately does not revoke. The defaults gave anon full DML on every
-- table and select on the non-public views; what that exposes is recorded
-- in decisions.md and is a separate change, not a side effect of this one.
--
-- Not covered: functions. The notice is about tables; function EXECUTE
-- still comes from the default privileges (and 0072 already grants
-- cashflow_forecast explicitly).
--
-- Every migration from here on grants what it creates, in the same file;
-- `npm run lint` (scripts/check-migration-grants.mjs) fails one that
-- doesn't. Re-runnable: grant is idempotent.

-- =========================================================================
-- 1. Tables
-- =========================================================================
grant select, insert, update, delete on
  assistant_actions,
  attachments,
  blood_test_types,
  blood_tests,
  bulk_appointments,
  contacts,
  diet_types,
  enclosures,
  frequency,
  group_origins,
  immunization_records,
  immunization_types,
  maintenance,
  maintenance_assignees,
  maintenance_photos,
  medication,
  placement_history,
  prescriptions,
  procedure_types,
  procedures,
  project_folders,
  project_photos,
  resident_diets,
  residents,
  shelter_friends,
  site_content,
  site_content_photos,
  site_pages,
  translatable_fields,
  translations,
  user_roles,
  vet_appointments,
  vets,
  weight,
  zones
to authenticated, service_role;

-- The public site's home page and footer read these with the anon key.
grant select on site_content, site_content_photos, site_pages to anon;

-- =========================================================================
-- 2. Sequences (the R- and M- code defaults)
-- =========================================================================
grant usage, select on sequence
  residents_resident_number_seq,
  maintenance_job_number_seq
to authenticated, service_role;

-- =========================================================================
-- 3. Views
-- =========================================================================
-- Internal views: signed-in reads only. None is written through.
grant select on
  app_users,
  current_placement,
  immunization_compliance,
  immunization_duplicate_check,
  immunization_next_due,
  project_folder_summary,
  resident_current_state,
  resident_list_view,
  translation_queue
to authenticated, service_role;

-- The public site. Each view's own migration already grants anon and
-- authenticated; service_role is new here.
grant select on
  public_project_photos,
  public_projects,
  public_recent_adoptions,
  public_resident_cards,
  public_resident_photos,
  public_resident_profiles,
  public_shelter_friends,
  public_shelter_stats,
  public_site_pages
to anon, authenticated, service_role;
