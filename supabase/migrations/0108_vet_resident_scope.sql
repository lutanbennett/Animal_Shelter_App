-- A vet sees only the residents their own clinic treats (backlog, "A vet
-- should see only the residents their own clinic treats", Pass 1,
-- 2026-09-27; rule decided by Lutan 2026-09-28).
--
-- ## The rule
--
-- Any clinical record, clinic-level. A vet account sees every resident its
-- clinic (user_roles.vet_id, 0102) holds a vet visit, a prescription, a
-- procedure or a blood test for, and no other resident. Clinic-level, not
-- per-doctor, so a colleague covering a shift sees the same list. The
-- broadest reading was chosen on purpose: hiding a resident from the vet
-- about to treat them is worse than showing too much.
--
-- In this schema a prescription, procedure or blood test belongs to a
-- clinic only through its visit (vet_appointment_id -> vet_appointments.
-- vet_id); none of them has a clinic of its own. So all four are asked,
-- each through its visit, and a record with no visit belongs to no clinic
-- and makes nobody visible. The three joins are there so the rule still
-- reads as decided if a record's visit is ever for another resident.
--
-- ## The two narrower calls (docs/decisions.md, 2026-09-28)
--
-- A cancelled visit counts. The rule says any record the clinic holds, and
-- a cancelled booking is one; dropping a resident from the list because
-- their only visit was cancelled is the "hidden from the vet about to
-- treat them" case the rule exists to avoid.
--
-- Another clinic's rows on a visible resident are shown. The scope decides
-- which residents a vet sees, not how much of each: a resident's whole
-- clinical history (every clinic's visits, prescriptions, procedures, blood
-- tests) is what a vet needs before treating them. What a vet may *write*
-- on another clinic's rows is unchanged here.
--
-- A vet account with no clinic sees no resident at all. Deliberate, and the
-- same answer the visit forms already give an unlinked vet (decisions.md,
-- 2026-09-27): the fix is an admin setting the clinic in Settings ->
-- Security, and /residents says so.
--
-- ## Where it has to hold
--
-- RLS, not the pages: a /residents/<id> typed by hand, or the Data API with
-- a vet's JWT, reads exactly what the policies allow. So every path a vet
-- has to a resident's rows is narrowed here:
--
--   residents                      vet_read_residents
--   vet_appointments, prescriptions, procedures, blood_tests, weight,
--   immunization_records           vet_rw_* (read and write)
--   resident_diets                 vet_read / vet_insert / vet_update
--   placement_history              vet_read_placement_history
--   adoption_updates               resident_roles_read_adoption_updates
--   attachments                    vet_rw_attachments, for resident,
--                                  blood-test and procedure files
--   translations                   vet_read_translations, residents' rows
--
-- and the owner-rights views, which bypass RLS by design (0086) and would
-- otherwise hand a vet every resident whatever the policies say:
-- resident_current_state (every resident's name and place — the pickers on
-- the vet forms read it), current_placement, immunization_compliance,
-- immunization_duplicate_check and translation_queue. resident_list_view
-- is security_invoker and joins residents, so it follows the policy.
--
-- Of the security-definer functions, only record_attachment lets a vet
-- write a resident's rows (it inserts past attachments' RLS), so it gets
-- the same check. The others either refuse a vet already
-- (set_resident_profile_photo, delete_resident_photo,
-- record_deceased_archive, undo_deceased_placement) or return nothing
-- about a resident but an id or a yes/no to an id the caller already has
-- (attachment_resident_id, resident_is_deceased).
--
-- The photo proxy asks RLS on attachments (canSeeInternalFile), so a vet's
-- access to a resident's internal photos follows this file too.
--
-- Not narrowed here: contacts, enclosures, zones, shelter_friends. The
-- resident hub reads a carer's name from contacts and the list reads
-- enclosure and zone names, and none of them is a resident's record.
-- Whether a vet should read the address book at all is its own question.
--
-- Leaves 0105 (a vet reads the clinic list, cannot write it) and 0100
-- (aal2 on user_roles writes) as they are.
--
-- Re-runnable: `or replace` and drop-before-create throughout.

-- ---------------------------------------------------------------------------
-- 1. Which residents this vet's clinic treats
-- ---------------------------------------------------------------------------

-- Security definer: it reads the clinical tables whose policies call it,
-- so as the caller it would recurse. Empty for anyone who is not a live vet
-- account with a clinic (current_user_vet_id() is null for them), which is
-- what makes an unlinked vet see nothing rather than everything.
create or replace function current_vet_resident_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select va.resident_id
    from vet_appointments va
   where va.vet_id = current_user_vet_id()
  union
  select p.resident_id
    from prescriptions p
    join vet_appointments va on va.id = p.vet_appointment_id
   where va.vet_id = current_user_vet_id()
  union
  select pr.resident_id
    from procedures pr
    join vet_appointments va on va.id = pr.vet_appointment_id
   where va.vet_id = current_user_vet_id()
  union
  select bt.resident_id
    from blood_tests bt
    join vet_appointments va on va.id = bt.vet_appointment_id
   where va.vet_id = current_user_vet_id();
$$;

comment on function current_vet_resident_ids() is
  'The residents the calling vet account''s clinic holds a visit, prescription, procedure or blood test for (0108). Empty for anyone else.';

revoke all on function current_vet_resident_ids() from public, anon;
grant execute on function current_vet_resident_ids() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The policies
-- ---------------------------------------------------------------------------

drop policy if exists vet_read_residents on residents;
create policy vet_read_residents on residents
  for select using (
    current_user_role() = 'vet' and id in (select current_vet_resident_ids())
  );

-- The six clinical tables a vet reads and writes. `using` and `with check`
-- are the same, so a vet can neither read nor write a row for a resident
-- outside the scope, nor move a row there.
do $$
declare
  t text;
begin
  foreach t in array array[
    'vet_appointments', 'prescriptions', 'procedures', 'blood_tests',
    'weight', 'immunization_records'
  ] loop
    execute format('drop policy if exists %I on %I', 'vet_rw_' || t, t);
    execute format(
      'create policy %I on %I for all
         using (current_user_role() = ''vet'' and resident_id in (select current_vet_resident_ids()))
         with check (current_user_role() = ''vet'' and resident_id in (select current_vet_resident_ids()))',
      'vet_rw_' || t, t);
  end loop;
end;
$$;

drop policy if exists vet_read_resident_diets on resident_diets;
create policy vet_read_resident_diets on resident_diets
  for select using (
    current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids())
  );

drop policy if exists vet_insert_resident_diets on resident_diets;
create policy vet_insert_resident_diets on resident_diets
  for insert with check (
    current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids())
  );

drop policy if exists vet_update_resident_diets on resident_diets;
create policy vet_update_resident_diets on resident_diets
  for update
  using (current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids()))
  with check (current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids()));

drop policy if exists vet_read_placement_history on placement_history;
create policy vet_read_placement_history on placement_history
  for select using (
    current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids())
  );

-- 0097's one policy for every reading role; the vet's share is now scoped.
drop policy if exists resident_roles_read_adoption_updates on adoption_updates;
create policy resident_roles_read_adoption_updates on adoption_updates for select
  using (
    current_user_role() in ('admin', 'management', 'staff', 'volunteer')
    or (current_user_role() = 'vet' and resident_id in (select current_vet_resident_ids()))
  );

-- A resident's photos and files, and the files on their blood tests and
-- procedures. Project and maintenance files are not a resident's and keep
-- today's rule.
drop policy if exists vet_rw_attachments on attachments;
create policy vet_rw_attachments on attachments
  for all
  using (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
  )
  with check (
    current_user_role() = 'vet'
    and (
      owner_type not in ('resident', 'blood_test', 'procedure')
      or attachment_resident_id(owner_type, owner_id) in (select current_vet_resident_ids())
    )
  );

-- A resident's translated bio and notes. Other tables' translations keep
-- today's rule.
drop policy if exists vet_read_translations on translations;
create policy vet_read_translations on translations
  for select using (
    current_user_role() = 'vet'
    and (table_name <> 'residents' or row_id in (select current_vet_resident_ids()))
  );

-- ---------------------------------------------------------------------------
-- 3. The owner-rights views (0086)
-- ---------------------------------------------------------------------------

-- Same shape as 0086: the private view, gated. The added condition is a
-- no-op for every session but a vet's; the service role has no app role,
-- so `is distinct from` lets it through.

create or replace view public.resident_current_state with (security_barrier = true) as
select * from private.resident_current_state
where private.has_app_access()
  and (public.current_user_role() is distinct from 'vet'
       or resident_id in (select public.current_vet_resident_ids()));

create or replace view public.current_placement with (security_barrier = true) as
select * from private.current_placement
where private.has_app_access()
  and (public.current_user_role() is distinct from 'vet'
       or resident_id in (select public.current_vet_resident_ids()));

create or replace view public.immunization_compliance with (security_barrier = true) as
select * from private.immunization_compliance
where private.has_app_access()
  and (public.current_user_role() is distinct from 'vet'
       or resident_id in (select public.current_vet_resident_ids()));

create or replace view public.immunization_duplicate_check with (security_barrier = true) as
select * from private.immunization_duplicate_check
where private.has_app_access()
  and (public.current_user_role() is distinct from 'vet'
       or resident_id in (select public.current_vet_resident_ids()));

create or replace view public.translation_queue with (security_barrier = true) as
select * from private.translation_queue
where private.has_app_access()
  and (public.current_user_role() is distinct from 'vet'
       or table_name <> 'residents'
       or row_id in (select public.current_vet_resident_ids()));

comment on view public.resident_current_state is
  'private.resident_current_state for a session with a staff role, and for a vet only their clinic''s residents (0086, 0108). The public_* views read the private one. Edit private.resident_current_state, not this.';
comment on view public.current_placement is
  'private.current_placement for a session with a staff role, and for a vet only their clinic''s residents (0086, 0108). Edit private.current_placement, not this.';
comment on view public.immunization_compliance is
  'private.immunization_compliance for a session with a staff role, and for a vet only their clinic''s residents (0086, 0108). Edit private.immunization_compliance, not this.';
comment on view public.immunization_duplicate_check is
  'private.immunization_duplicate_check for a session with a staff role, and for a vet only their clinic''s residents (0086, 0108). Edit private.immunization_duplicate_check, not this.';
comment on view public.translation_queue is
  'private.translation_queue for a session with a staff role, and for a vet only their clinic''s residents'' rows (0086, 0108). Edit private.translation_queue, not this.';

-- `or replace` keeps 0086's grants; restated so this file stands alone.
revoke all on
  public.current_placement,
  public.resident_current_state,
  public.immunization_compliance,
  public.immunization_duplicate_check,
  public.translation_queue
from anon, authenticated, service_role;

grant select on
  public.current_placement,
  public.resident_current_state,
  public.immunization_compliance,
  public.immunization_duplicate_check,
  public.translation_queue
to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. record_attachment: the one definer function a vet writes through
-- ---------------------------------------------------------------------------

-- As on dev today (last written in 0097), plus the vet check after the
-- role check. It inserts as the definer, past vet_rw_attachments, so the
-- policy above does not reach it.
create or replace function public.record_attachment(
  p_owner_type attachment_owner_type,
  p_owner_id uuid,
  p_drive_file_id text,
  p_file_name text default null,
  p_sub_folder text default null,
  p_date_taken date default null,
  p_adoption_update_id uuid default null
)
returns table(attachment attachments, is_profile boolean)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_attachment attachments;
  v_is_profile boolean := false;
begin
  if current_user_role() is null
     or current_user_role() not in ('admin', 'management', 'staff', 'vet', 'volunteer') then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- A vet adds a resident's files only for a resident their clinic treats
  -- (0108). The same words as a missing resident: which residents exist
  -- outside the scope is not the vet's to learn.
  if current_user_role() = 'vet'
     and p_owner_type in ('resident', 'blood_test', 'procedure')
     and not coalesce(
       attachment_resident_id(p_owner_type, p_owner_id) in (select current_vet_resident_ids()),
       false
     ) then
    raise exception 'Not authorized to add attachments.';
  end if;

  -- The foreign key would refuse this too; this says it in a sentence.
  if p_adoption_update_id is not null and not exists (
    select 1 from adoption_updates u
     where u.id = p_adoption_update_id
       and p_owner_type = 'resident'
       and u.resident_id = p_owner_id
  ) then
    raise exception 'That adoption update is not about this resident.';
  end if;

  insert into attachments (owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, uploaded_by, adoption_update_id)
  values (p_owner_type, p_owner_id, p_sub_folder, p_drive_file_id, p_file_name, p_date_taken, auth.uid(), p_adoption_update_id)
  returning * into v_attachment;

  if p_owner_type = 'resident' then
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
$function$;

notify pgrst, 'reload schema';
