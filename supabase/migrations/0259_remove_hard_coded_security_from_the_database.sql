-- consumer: none
--
-- security-db-half (docs/decisions/2026-10-25-security-database-half.md). The database half of removing hard-coded security.
-- The app half was #920 (docs/decisions/2026-10-25-remove-hard-coded-security.md); this is the last place where something
-- other than a card granted or denied anything.
--
-- Lutan's rule, 2026-10-24, given four times before it was understood: "A role is a placeholder that gets no permissions
-- until a card is assigned. The cards assigned will define page access and read write permissions. It's that simple and
-- there are to be zero exceptions to this rule." And: "No more little bit here and then fix some other stuff I want it all
-- gone right now." And, on what to do where removing a rule leaves a gap: "just apply what is required to each card, if
-- someone loses some access I will fix that later." And, 2026-10-25: "No creating cards just remove permissions."
--
-- THE FAULT. Eleven functions read a column on `roles` (scope_residents, scope_clinical, scope_contacts, scope_photos,
-- opens_app) and decided access from it. 108 row policies and 13 views call those functions, so a role column was still
-- deciding what a login could read even after 0257 made role_permissions exactly the union of the role's cards.
--
-- WHAT THIS DOES, and why it is shaped this way.
--
-- In every one of those 108 policies the role-column predicate sits BESIDE a card check: the policy asks has_permission
-- of its own activity, and then sees_all_residents() as well. The card is already the grantor; the role column only ever
-- SUBTRACTED from what the card gave. So removing the hard-coded security means those predicates stop subtracting, and
-- the card check beside them becomes the whole decision. That is what this migration does, by redefining each predicate
-- so that it no longer reads a role column -- which reaches all 108 policies and all 13 views at once, without having to
-- rewrite them.
--
-- Two things it deliberately does NOT do:
--   * It does not replace a role column with a different card requirement (e.g. sees_all_residents() -> has_permission
--     ('resident.record')). That would turn a card into a requirement list checked against the role, which CLAUDE.md
--     forbids: "A card applies the access that lets its activity be performed. It is not a requirement list checked
--     against the role." An earlier draft proposed exactly that mapping and it is not taken.
--   * It creates no card, no card_grants row and no permission cell. Where removing a role column leaves a role unable to
--     do something, the access goes away and the loss is recorded in docs/card-access-faults.md. Proposing the card sets
--     that close those gaps is Card review 2, which needs Lutan's approval of the set.
--
-- The functions are kept (as constants) rather than dropped because dropping them would mean rewriting 108 policies and 13
-- view bodies in this same migration. That is tidy-up, not security, and it is not worth the risk here: a constant
-- predicate reads no role column, which is the whole of what the rule asks. Each one says so in its own comment.
--
-- ADMIN IS UNTOUCHED. Admin sits outside the card system (CLAUDE.md; Lutan, 2026-10-25: "Admin always has access to
-- everything. No matter what cards exist or don't exist."). has_permission()'s `r.key = 'admin'` short-circuit (0196) is
-- not altered by this file. Admin holds NO cards and NO cells, on dev and on production, so two places below have to keep
-- letting Admin through explicitly or the Director -- who is on Admin on production today -- would be locked out:
-- holds_app_role() and the "can still sign in" test in reassign_recurring_job(). Both use the same `r.key = 'admin'`
-- test has_permission() already uses. No card is given to Admin anywhere.

begin;

-- 1. sees_all_residents() (scope_residents; 0144, 0179, 0196) -> no longer reads the role.
-- Called beside the resident activity has_permission check in every resident policy, so the card is now the whole decision.
-- Admin keeps every resident record (92 current + 9 deceased on dev; 286 + 13 + 1 on production, read by Lutan 2026-10-25)
-- because has_permission() answers true for Admin before it reads a cell.
create or replace function public.sees_all_residents()
returns boolean language sql immutable
set search_path to ''
as $$ select true $$;

comment on function public.sees_all_residents() is
  'Always true since 0259. It used to read roles.scope_residents. Every caller asks a resident card beside it; that card is the whole decision.';

-- 2. on_volunteer_floor() (0179, 0180) -> no longer reads the role.
-- The inverse of the above: callers ask `NOT on_volunteer_floor()` to hold a role BACK from a surface. Nobody is singled
-- out by role any more, so it is false. This WIDENS four surfaces that have no card gate at all; recorded as faults.
create or replace function public.on_volunteer_floor()
returns boolean language sql immutable
set search_path to ''
as $$ select false $$;

comment on function public.on_volunteer_floor() is
  'Always false since 0259. It used to read roles.scope_residents to hold a role back from a surface. No role column may narrow access.';

-- 3. may_open_resident_record() (0249) -> no longer reads the role.
-- It was `sees_all_residents() or (scope_residents = who_and_where and a medical cell)`. The medical cell half was already
-- card-derived; the role-column half is gone, and a permissive gate with no role column left is true.
create or replace function public.may_open_resident_record()
returns boolean language sql immutable
set search_path to ''
as $$ select true $$;

comment on function public.may_open_resident_record() is
  'Always true since 0259. It used to read roles.scope_residents. Callers ask the resident card beside it.';

-- 4. sees_all_clinical() (scope_clinical; 0135, 0136, 0140, 0167, 0230) -> no longer reads the role.
create or replace function public.sees_all_clinical()
returns boolean language sql immutable
set search_path to ''
as $$ select true $$;

comment on function public.sees_all_clinical() is
  'Always true since 0259. It used to read roles.scope_clinical. Every caller asks a medical card beside it.';

-- 5. is_clinic_login() (scope_clinical; 0135 onward) -> no longer reads the role.
-- This decided "this login is a vet, confined to its own clinic" from a role column. Both polarities were in use: it held
-- other roles back (`NOT is_clinic_login() OR ...`) and it was the only thing granting doctor_contacts. False means no
-- role is a clinic login by virtue of its role. The doctor loses the surfaces that only this granted -- recorded as
-- faults, and lowest priority by Lutan's own ranking (2026-10-25: "The vet can wait as it's the least used (current no
-- doctors are in the system) profile."). No doctor logins exist on production.
create or replace function public.is_clinic_login()
returns boolean language sql immutable
set search_path to ''
as $$ select false $$;

comment on function public.is_clinic_login() is
  'Always false since 0259. It used to read roles.scope_clinical. A vet''s own-clinic scoping is per-login clinic links (current_clinic_resident_ids), never a role column.';

-- 6. sees_all_contacts() (scope_contacts; 0126, 0147, 0155) -> no longer reads the role.
create or replace function public.sees_all_contacts()
returns boolean language sql immutable
set search_path to ''
as $$ select true $$;

comment on function public.sees_all_contacts() is
  'Always true since 0259. It used to read roles.scope_contacts. Callers ask contacts.browse beside it.';

-- 7. The two contact views that existed only to serve a narrowed role column (0126, 0147, 0155).
-- volunteer_contacts was `has_permission('contacts.browse') AND NOT sees_all_contacts()`; doctor_contacts was
-- `is_clinic_login()`. With the role columns gone both are empty by construction, and no app code reads either: since #920
-- contactRelation() returns `contacts` or `picker_contacts` only. Dropped rather than left as empty views that look like
-- a working surface.
drop view if exists public.volunteer_contacts;
drop view if exists public.doctor_contacts;

-- 8. photos_medical_only() (scope_photos; 0152) -> no longer reads the role.
-- It confined a role to the Medical photo folder. can_publish_resident_photos() already asks photos.resident_publish, so
-- that becomes card-only; record_attachment()'s folder rule (below) loses its role half the same way.
create or replace function public.photos_medical_only()
returns boolean language sql immutable
set search_path to ''
as $$ select false $$;

comment on function public.photos_medical_only() is
  'Always false since 0259. It used to read roles.scope_photos. Which folders a login may add to is the photo cards and nothing else.';

-- 9. private.has_app_access() / holds_app_role() (opens_app; 0132).
-- Found NOT in the state the brief recorded, which is why live definitions were read rather than grepped for: by the time
-- this was written has_app_access() no longer read roles.opens_app at all -- it called holds_app_role(), which tested
-- `r.key <> 'public_viewer'`. That is still a role-keyed rule deciding whether a login is in the app, so it is in scope
-- and goes the same way.
--
-- This is the one place that could not simply stop deciding. Left true, every authenticated session including
-- public_viewer would be inside the app; left false, nobody would be. So it takes the SAME shape the app half shipped for
-- entersApp() in src/lib/permissions/can.ts: Admin, or a role that holds at least one cell -- which is to say at least one
-- card that gives something. A role with no cards is not in the app, and there is no column that switches a role on or
-- off. public_viewer holds no cards, so it stays out on its cards rather than on its name.
create or replace function public.holds_app_role()
returns boolean language sql stable security definer
set search_path to ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and (
         -- Admin sits outside the card system and holds no cards (CLAUDE.md). Same test has_permission() uses.
         r.key = 'admin'
         or exists (select 1 from public.role_permissions rp where rp.role_id = r.id)
       )
  );
$$;

comment on function public.holds_app_role() is
  'Admin, or a role that holds at least one cell (one card that gives something). Since 0259 no role column and no role name decides who is in the app; it used to test roles.opens_app and then r.key <> ''public_viewer''.';

-- 10. can_use_bills_inbox() (0189, 0240) -> the clinic clause goes.
-- `not is_clinic_login()` is already true now that (5) landed, but the clause is removed so nothing suggests a role still
-- decides this. What remains is the three card checks it already had.
create or replace function public.can_use_bills_inbox()
returns boolean language sql stable
as $$
  select coalesce((select has_permission('stock.delivery')), false)
      or coalesce((select has_permission('medical.visits')), false)
      or coalesce((select has_permission('maintenance.bills')), false);
$$;

comment on function public.can_use_bills_inbox() is
  'The three cards that file a bill, and nothing else. Since 0259 it no longer refuses a login for being a clinic login (roles.scope_clinical).';

-- 11. record_attachment() (0174, 0190, 0217, 0220) -> every clinic-login branch goes.
-- v_clinic was is_clinic_login(), so after (5) all five of its branches are dead: two that refused (a clinic login may not
-- file a bill; it may only touch its own clinic's residents) and three that granted (a clinic login may file a resident,
-- blood-test or procedure photo, and a visit report). Dead branches that look like live security are exactly the fault
-- this programme exists to remove, so they are taken out rather than left to read as rules. The 0217 Medical-folder rule
-- keeps its card half (photos.shelter_add, can_publish_resident_photos) and loses its role half (photos_medical_only).
-- The doctor loses the report-attachment path with this; it is a row in docs/card-access-faults.md.
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null,
  p_purpose text default 'bill'
)
returns table(attachment attachments, is_profile boolean)
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
  v_allowed boolean;
begin
  -- 0220: purpose is bill or report, and a report hangs on a visit only.
  if p_purpose is null or p_purpose not in ('bill', 'report') or (p_purpose = 'report' and p_owner_type <> 'clinic_visit') then
    raise exception 'Not a valid attachment purpose.';
  end if;

  v_allowed := case p_owner_type
    when 'resident' then coalesce((select has_permission('photos.resident_add')), false)
    when 'blood_test' then coalesce((select has_permission('medical.blood_tests')), false)
    when 'procedure' then coalesce((select has_permission('medical.procedures')), false)
    when 'maintenance' then coalesce((select has_permission('maintenance.photos')), false)
    when 'project' then coalesce((select has_permission('projects.photos')), false)
    when 'clinic_visit' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'stock_receipt' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'bill_inbox' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    when 'maintenance_bill' then coalesce((select bill_owner_can(p_owner_type, true)), false)
    else false
  end;

  if not v_allowed then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- 0217 CHANGE 1, card half only: photos.shelter_add admits a resident photo in the SHELTER folder, not an adopter's.
  if p_owner_type = 'resident'
     and not (select can_publish_resident_photos())
     and (p_adoption_update_id is not null
          or lower(btrim(coalesce(p_sub_folder, ''))) <> 'medical')
     and not (
       p_adoption_update_id is null
       and lower(btrim(coalesce(p_sub_folder, ''))) = 'shelter'
       and coalesce((select has_permission('photos.shelter_add')), false)
     ) then
    raise exception 'This login can add photos to the Medical folder only.';
  end if;

  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id, purpose)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id, p_purpose)
  returning * into v_attachment;

  -- 0217 CHANGE 2: a photo still waiting for approval never becomes the profile photo (that is public).
  if p_owner_type = 'resident' and v_attachment.approved_at is not null then
    update residents
    set profile_photo_drive_file_id = p_drive_file_id
    where id = p_owner_id
      and profile_photo_drive_file_id is null;

    if found then
      v_is_profile := true;
    end if;
  end if;

  return query select v_attachment, v_is_profile;
end;
$$;

-- 12. reassign_recurring_job() (0178) -> its "can still sign in" test read roles.opens_app.
-- Found by reading the live definitions; it is not in the brief's list of eleven. Same card-derived test as (9), so the
-- two cannot disagree about who is in the app. Admin passes on the same `r.key = 'admin'` test, nothing else is by name.
create or replace function public.reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text default null)
returns recurring_job_occurrences
language plpgsql security definer
set search_path to 'public'
as $$
declare
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_ids uuid[];
  v_ok integer;
begin
  -- 0178: the recurring-jobs page's cell (handing dates over is recurring.manage), not the role name.
  if not coalesce((select has_permission('recurring.manage')), false) then
    raise exception 'Only management can reassign a job.';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'That recurring job no longer exists.';
  end if;
  select coalesce(array_agg(distinct u), '{}') into v_ids
    from unnest(coalesce(p_user_ids, '{}')) as u where u is not null;

  -- A date that is done or skipped is history: who covered it stays.
  if exists (select 1 from recurring_job_occurrences
              where job_id = p_job_id and occurs_on = p_occurs_on and outcome is not null) then
    raise exception 'That date has already been marked done or skipped.';
  end if;

  -- No one: hand the date back to the usual assignees.
  if cardinality(v_ids) = 0 then
    delete from recurring_job_occurrence_assignees where job_id = p_job_id and occurs_on = p_occurs_on;
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on;
    return null;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'This job does not fall on %.', to_char(p_occurs_on, 'FMDD Mon YYYY');
  end if;
  -- "Can still sign in": a login with at least one live role that is in the app, which since 0259 means Admin or a role
  -- holding at least one cell -- not roles.opens_app. Counted by person (0196: a login may hold several roles).
  select count(distinct ur.user_id) into v_ok
    from user_roles ur
    join roles r on r.id = ur.role_id and r.archived_at is null
   where ur.user_id = any (v_ids)
     and ur.archived_at is null
     and role_row_live(ur.starts_on, ur.ends_on)
     and (r.key = 'admin' or exists (select 1 from role_permissions rp where rp.role_id = r.id));
  if v_ok <> cardinality(v_ids) then
    raise exception 'A job can only be reassigned to someone who can still sign in.';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, reassigned_by, reassigned_at, reassign_note)
  values (p_job_id, p_occurs_on, auth.uid(), now(), nullif(btrim(p_note), ''))
  on conflict (job_id, occurs_on) do update
    set reassigned_by = excluded.reassigned_by, reassigned_at = excluded.reassigned_at,
        reassign_note = excluded.reassign_note
  returning * into v_row;

  delete from recurring_job_occurrence_assignees
   where job_id = p_job_id and occurs_on = p_occurs_on and user_id <> all (v_ids);
  insert into recurring_job_occurrence_assignees (job_id, occurs_on, user_id)
  select p_job_id, p_occurs_on, u from unnest(v_ids) as u
  on conflict do nothing;

  return v_row;
end;
$$;

-- 13. my_permissions() (0196 onward) -> stops reporting the role columns.
-- It is what src/lib/permissions/can.ts parses into Permissions. It granted nothing by itself, but it read five of the
-- columns and handed four scopes plus role.opens_app to the app, which is how a role column would find its way back into a
-- decision. Since #920 the app reads none of them, and sees_login_emails (the fifth) is removed by this migration, so the
-- `scopes` object goes entirely. What is left is the role's identity, its role keys, the Admin flag and the cells.
create or replace function public.my_permissions()
returns jsonb language sql stable security definer
set search_path to ''
as $$
  with mine as (
    select r.*, ur.is_main, ur.created_at as held_since
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
  ),
  main as (select * from mine order by is_main desc, held_since limit 1),
  wide as (
    select
      bool_or(key = 'admin') as is_admin,
      jsonb_agg(key order by is_main desc, held_since) as role_keys
    from mine
  )
  select jsonb_build_object(
    'role', jsonb_build_object(
      'key', m.key, 'name', m.name, 'name_th', m.name_th, 'kind', m.kind,
      'home_path', m.home_path
    ),
    'roles', w.role_keys,
    'is_admin', w.is_admin,
    'permissions', case
      when w.is_admin
        then (select coalesce(jsonb_object_agg(a.key, 2), '{}'::jsonb) from public.permission_activities a)
      else (select coalesce(jsonb_object_agg(x.activity, x.level), '{}'::jsonb)
              from (select rp.activity, max(rp.level) as level
                      from public.role_permissions rp
                     where rp.role_id in (select id from mine)
                     group by rp.activity) x)
    end
  )
  from main m, wide w;
$$;

comment on function public.my_permissions() is
  'What a login may do: its role identity, its role keys, the Admin flag and its cells (which 0257 computes from card_grants alone). Since 0259 it reports no role scope column and no opens_app.';

-- 14. roles.sees_login_emails -> dropped, column and plumbing together.
-- Named by the app half and deliberately left here. Nothing consumed it: all six references in src/ were select, assign or
-- type, so it denied nobody anything -- which is why it was not a breach. It becomes hidden security the moment anyone
-- uses it, so the column goes with the plumbing in this PR (src/lib/permissions/can.ts, src/lib/home/roles.ts,
-- src/app/admin/who-does-what/page.tsx). my_permissions() above already stopped reporting it.
alter table public.roles drop column if exists sees_login_emails;

-- The four remaining scope columns (scope_residents, scope_clinical, scope_contacts, scope_photos) and opens_app are now
-- read by NOTHING that grants or denies anything -- nothing in the database after this file, and nothing in src/ since
-- #920. They are left in place on purpose: dropping them reaches a dozen live-database check scripts that still insert
-- and assert on them (check-2ic-role, check-card-grants, check-home-cards, check-menu-coverage, check-medical-jobs,
-- check-director-answers-schema and others), which is bookkeeping with a wide blast radius rather than security, and the
-- brief's deliverable boundary stops here. Dead columns nothing reads grant nothing. Dropping them is its own small PR.

commit;
