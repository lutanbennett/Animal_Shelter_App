-- consumer: none
--
-- Retire the old way of giving a vet login a clinic (backlog, "Drop
-- current_user_vet_id() and user_roles.vet_id"; closes the multi-clinic arc of
-- 0125 and the feature PR that followed it).
--
-- A vet login's clinics are now the active clinics of the doctor it is linked
-- to (vet_doctors.user_id -> vet_doctor_clinics). user_roles.vet_id (0102) was
-- the transition source, and current_user_vet_id() (singular) its reader.
--
-- ## Before the column goes: no vet loses a clinic
--
-- Dropping the column would silently remove the clinic of any vet login that
-- still has user_roles.vet_id and no linked doctor, and 0108's resident
-- scoping would then show them nothing. So first, for each such live login, a
-- doctor is created from the login's name (falling back to its email), linked
-- to the login and to that clinic. The name is only a label an admin can
-- correct on the clinic's Doctors page; the clinics are what matter. If the
-- login already has a doctor, that doctor is simply put at the clinic.
--
-- ## What now guarantees "only a vet carries a clinic"
--
-- user_roles_vet_id_only_for_vets stopped a non-vet row carrying a clinic. It is
-- dropped with the column, not simply removed: current_user_vet_ids() returns
-- the empty set for anyone who is not a live vet account (its exists() on
-- user_roles), so a doctor linked to a non-vet login grants that login nothing,
-- and vet_doctors.user_id can be set only by an admin at aal2 (0125 trigger).
--
-- ## Deploy order
--
-- The release live today (0.13.0) still reads user_roles.vet_id on Settings ->
-- Security, so on production this migration and the code in the same PR go
-- together: apply it only as that release goes out. (Dev has the code.)
--
-- ## Callers
--
-- Checked before writing: no function, policy, view or trigger body in the dev
-- catalogue or in the migration history still calls current_user_vet_id() after
-- 0125 (0108/0110/0124 were redefined onto current_user_vet_ids()). The one
-- trigger on the column, user_roles_clear_vet_id, goes with it.
--
-- Re-runnable: guarded throughout.

-- 1. Back-fill: a doctor for every live vet login whose only clinic is the column.
do $$
declare
  r record;
  v_doctor uuid;
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'user_roles' and column_name = 'vet_id'
  ) then
    return;
  end if;

  for r in
    execute $q$
      select ur.user_id, ur.vet_id,
             coalesce(nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''), u.email, 'Vet login') as label
        from user_roles ur
        join auth.users u on u.id = ur.user_id
       where ur.role = 'vet' and ur.archived_at is null and ur.vet_id is not null
    $q$
  loop
    select id into v_doctor from vet_doctors where user_id = r.user_id;
    if v_doctor is null then
      -- vet_id is where the doctor is first listed: the 0125 trigger links it.
      insert into vet_doctors (name, user_id, vet_id)
      values (r.label, r.user_id, r.vet_id)
      returning id into v_doctor;
    end if;
    insert into vet_doctor_clinics (vet_id, doctor_id, active)
    values (r.vet_id, v_doctor, true)
    on conflict (vet_id, doctor_id) do update set active = true;
  end loop;
end $$;

-- 2. current_user_vet_ids() without the user_roles.vet_id union.
create or replace function current_user_vet_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct c.vet_id), '{}'::uuid[])
    from vet_doctors d
    join vet_doctor_clinics c on c.doctor_id = d.id
   where d.user_id = auth.uid() and c.active
     and exists (
       select 1 from user_roles
        where user_id = auth.uid() and archived_at is null and role = 'vet'
     );
$$;

comment on function current_user_vet_ids() is
  'The clinics the calling vet login works at: its linked doctor''s active clinics (0125, 0127). Empty for anyone who is not a live vet account.';

revoke all on function current_user_vet_ids() from public, anon;
grant execute on function current_user_vet_ids() to authenticated, service_role;

-- 3. Drop the singular function, the trigger, the check and the column.
drop function if exists current_user_vet_id();
drop trigger if exists user_roles_clear_vet_id on user_roles;
drop function if exists user_roles_clear_vet_id();
alter table user_roles drop constraint if exists user_roles_vet_id_only_for_vets;
alter table user_roles drop column if exists vet_id;

notify pgrst, 'reload schema';
