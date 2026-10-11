-- consumer: src/app/clinic-visits/new/page.tsx, src/app/clinic-visits/new/actions.ts, src/app/maintenance/actions.ts, src/app/projects/actions.ts
--
-- perm-policy-cleanup. Two backlog items in one schema PR (docs/decisions/2026-10-11-perm-policy-cleanup.md).
--
-- (a) Narrow the policies that accept either of two cells, so the box on Settings -> Who does what is the only
--     thing that opens the table. Nothing is broken today: Management holds both cells of every pair. It matters
--     the first time an Admin gives one of a pair without the other.
--       contacts_select_perm         browse OR directory   -> browse   (0170/0171 widened it so a directory editor could read
--                                                             what they edit; the grid now has to give both, which is what it meant)
--       shelter_friends_select_perm  view OR manage        -> view
--       clinics / doctors / doctor_clinics select          -> clinics.list at read (was: or clinics.doctors, or visit.book)
--       doctors / doctor_clinics insert                    -> clinics.doctors (was: or visit.book)
--     Nobody loses anything today: Management is the only holder of any of these cells and holds all of them.
--
-- (b) Three splits of section 4 that nothing read:
--       visit.book            clinic_visits_insert_perm asks visit.book (was medical.visits). bulk_appointments already asked it,
--                             so booking needed both; now it needs the one the grid names. medical.visits keeps read and change.
--       maintenance.progress  a status move needs it. A row policy cannot tell one column from another, so the check sits in
--                             maintenance_before_write; maintenance.jobs still opens the row for every other change.
--       projects.publish      a change to is_public needs it, in project_folders_before_write; projects.folders still opens the row.
--     Both triggers let a caller with no login through (the service role, the worker): they have no role to ask, and RLS
--     does not apply to them either.
--
-- Left as they are, and why, in the decision file: medical.archive (needs a trigger on four tables), stock.delivery (the
-- purchasing job reads receipts by design, 0143) and reference.add_while_recording (two cells legitimately open one insert).
--
-- Release order: this file must reach a database BEFORE the app code that reads visit.book, maintenance.progress and
-- projects.publish. Nothing drops a column, so the app can roll back half way.
-- Written to be safely re-runnable. To undo: re-create each policy and function as 0155, 0170/0171, 0172 and the migrations
-- that wrote the two trigger functions had them.

-- contacts: browse only (sees_all_contacts() stays beside it, as in 0147)
drop policy if exists contacts_select_perm on contacts;
create policy contacts_select_perm on contacts for select to authenticated
  using ((select has_permission('contacts.browse')) and (select sees_all_contacts()));

-- shelter friends: view only
drop policy if exists shelter_friends_select_perm on shelter_friends;
create policy shelter_friends_select_perm on shelter_friends for select to authenticated
  using ((select has_permission('friends.view')));

-- clinics, doctors, doctor_clinics: read with clinics.list
drop policy if exists clinics_select_perm on clinics;
create policy clinics_select_perm on clinics for select to authenticated
  using ((select has_permission('clinics.list', 'read')));
drop policy if exists doctors_select_perm on doctors;
create policy doctors_select_perm on doctors for select to authenticated
  using ((select has_permission('clinics.list', 'read')));
drop policy if exists doctor_clinics_select_perm on doctor_clinics;
create policy doctor_clinics_select_perm on doctor_clinics for select to authenticated
  using ((select has_permission('clinics.list', 'read')));

-- adding a doctor: clinics.doctors only
drop policy if exists doctors_insert_perm on doctors;
create policy doctors_insert_perm on doctors for insert to authenticated
  with check ((select has_permission('clinics.doctors')));
drop policy if exists doctor_clinics_insert_perm on doctor_clinics;
create policy doctor_clinics_insert_perm on doctor_clinics for insert to authenticated
  with check (
    (select has_permission('clinics.doctors'))
    and not exists (select 1 from doctors d where d.id = doctor_clinics.doctor_id and d.user_id is not null)
  );

-- visit.book: booking a visit
drop policy if exists clinic_visits_insert_perm on clinic_visits;
create policy clinic_visits_insert_perm on clinic_visits for insert to authenticated
  with check ((select has_permission('visit.book')) and (select sees_all_clinical()));

-- maintenance.progress: moving a job on
create or replace function public.maintenance_before_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status
     and (select auth.uid()) is not null
     and not (select has_permission('maintenance.progress')) then
    raise exception 'Moving a job on needs the Move a job on permission.' using errcode = '42501';
  end if;

  if new.enclosure_id is not null then
    select zone_id into new.zone_id from enclosures where id = new.enclosure_id;
  end if;

  if new.zone_id is null then
    raise exception 'A maintenance job needs a zone or an enclosure.';
  end if;

  if new.status = 'Completed' then
    new.date_completed := coalesce(new.date_completed, shelter_today());
  else
    new.date_completed := null;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- projects.publish: making a project public or private
create or replace function public.project_folders_before_write()
returns trigger
language plpgsql
as $$
declare
  parent_category text;
  cursor_id uuid;
begin
  if (select auth.uid()) is not null
     and ((tg_op = 'UPDATE' and new.is_public is distinct from old.is_public)
          or (tg_op = 'INSERT' and new.is_public))
     and not (select has_permission('projects.publish')) then
    raise exception 'Making a project public needs the Publish permission.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and new.parent_folder_id is null then
    -- Only the seed in this migration creates roots. It runs as the
    -- migration role before this trigger exists, so this never fires for it.
    raise exception 'New folders must be created inside a category.';
  end if;

  if tg_op = 'UPDATE' and old.parent_folder_id is null then
    if new.name is distinct from old.name
       or new.parent_folder_id is not null
       or new.top_level_category is distinct from old.top_level_category then
      raise exception 'Categories cannot be renamed or moved.';
    end if;
  end if;

  if new.parent_folder_id is not null then
    if new.parent_folder_id = new.id then
      raise exception 'A folder cannot be its own parent.';
    end if;

    select top_level_category into parent_category
    from project_folders where id = new.parent_folder_id;
    if parent_category is null then
      raise exception 'Parent folder does not exist.';
    end if;
    new.top_level_category := parent_category;

    -- Walk up from the new parent; meeting ourselves means a cycle.
    if tg_op = 'UPDATE' then
      cursor_id := new.parent_folder_id;
      while cursor_id is not null loop
        if cursor_id = new.id then
          raise exception 'A folder cannot be moved into its own subfolder.';
        end if;
        select parent_folder_id into cursor_id from project_folders where id = cursor_id;
      end loop;
    end if;
  end if;

  new.name := btrim(new.name);
  if new.name = '' then
    raise exception 'A folder needs a name.';
  end if;
  if position('/' in new.name) > 0 then
    raise exception 'A folder name cannot contain "/".';
  end if;

  new.updated_at := now();
  return new;
end;
$$;
