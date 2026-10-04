-- consumer: src/app/residents/new/actions.ts, src/app/residents/[id]/edit/actions.ts, src/app/residents/[id]/move/actions.ts, src/app/residents/[id]/adoption-updates/actions.ts, src/app/residents/[id]/page.tsx, src/lib/residents/who-and-where.ts
--
-- R5's second conversion (docs/roles-and-permissions.md §12; decisions/
-- 2026-10-04-perm-convert-residents.md): the three resident-side tables stop asking
-- WHO the caller is and start asking WHAT the caller may do. Same shape as 0135.
--
--   residents          resident.record (read / edit)   insert: resident.register
--   placement_history  resident.record (read / edit)   insert: by placement_type, see below
--   adoption_updates   resident.adoption_news          (Edit includes delete, finding A8)
--
-- THE SHAPE (copied from 0135)
--   one policy per command, `(select has_permission(…))` so Postgres plans it once per
--   statement (finding D, §3), ANDed with the one scope question that is not a cell:
--     (select sees_all_residents())   -- NEW below
--
-- sees_all_residents() IS TWO QUESTIONS IN ONE, and the second is the reason it exists.
--   1. roles.scope_residents = 'all'  (a vet's own_clinic role is false: a vet's rows come from
--      the vet_* policies, which are left alone, so a has_permission() policy never widens them)
--   2. the role does not borrow the volunteer floor (roles.legacy_role is not 'volunteer').
--      The volunteer holds Read on resident.record and reads a resident only as who-and-where
--      (resident_who_and_where, 0134, gated on current_user_role() = 'volunteer'). A cell-only
--      policy on `residents` would hand the volunteer, and the 2IC and both Heads who borrow it,
--      the whole table, OR-ed beside the view: the "how much of a resident" scope of §5, which has
--      no column yet. This mirrors the view's own gate and the app's readsWhoAndWhereOnly(), so
--      the three agree; it goes away with the legacy_role bridge, when the scope gets a column.
--
-- WHAT IS DROPPED, WHAT STAYS
--   Dropped: management_* / staff_* on residents and placement_history, and the two
--   adoption_updates policies that listed admin, management and staff (their names carry no
--   role prefix, so they are named). Found in pg_policies, not assumed, so a re-run is right.
--   Left alone: admin_all_* (R6; Admin says yes anyway and keeps hard DELETE), vet_* (Last).
--   adoption_updates had no admin policy of its own: Admin now comes through has_permission().
--   The vet's read of adoption_updates was inside the dropped policy, so it is re-created as
--   vet_read_adoption_updates, same predicate, unchanged.
--
-- NO DELETE POLICY on residents or placement_history (as 0135): the cells have no delete act, so
-- this closes C2 for management and staff (they could hard-delete a resident from a hand-built
-- request; the app never does). adoption_updates DOES get a delete policy: Edit includes delete.
--
-- placement_history INSERT asks the activity of the row's type, because one table carries five
-- acts:  Intake -> resident.register;  ChangeEnclosure -> placement.move;
-- SendToHospital / ReturnFromHospital -> placement.hospital;
-- Foster / Adopt / ReturnToShelter -> placement.rehome;  Deceased -> placement.death;
-- DeceasedInError -> placement.death_withdraw (undo_deceased_placement() is the real path and is
-- security definer; a hand-built insert of that type used to pass for management and staff).
-- placement.death_withdraw is written last on purpose: check-role-write-policies.mjs reads the
-- first activity in a policy.
--
-- Written to be safely re-runnable. To undo: drop the *_perm policies, vet_read_adoption_updates
-- and sees_all_residents(), then re-create management_rw_residents, staff_rw_residents (0001), the
-- placement_history policies (0001, 0108) and the two adoption_updates policies (0094).

-- ---------------------------------------------------------------------------
-- 1. The scope question these tables need.
-- ---------------------------------------------------------------------------
create or replace function sees_all_residents()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id and r.archived_at is null
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and r.scope_residents = 'all'
       and r.legacy_role is not null
       and r.legacy_role <> 'volunteer'
  );
$$;

comment on function sees_all_residents() is
  'Does the caller''s live role reach every resident''s whole record (roles.scope_residents = all) and not only who-and-where (a role borrowing the volunteer floor reads residents through resident_who_and_where)? False for no role, an archived person or role, a vet (own_clinic) and anything on the volunteer floor. Asked as (select sees_all_residents()) beside has_permission() in the converted resident policies.';

revoke all on function sees_all_residents() from public, anon;
grant execute on function sees_all_residents() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Drop the role-named policies on the three tables, and our own on a re-run.
-- ---------------------------------------------------------------------------
do $drop$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies
     where schemaname = 'public'
       and tablename in ('residents', 'placement_history', 'adoption_updates')
       and (policyname like 'management\_%' or policyname like 'staff\_%'
            or policyname in ('record_keepers_write_adoption_updates', 'resident_roles_read_adoption_updates')
            or policyname like '%\_perm'
            or policyname = 'vet_read_adoption_updates')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end
$drop$;

-- ---------------------------------------------------------------------------
-- 3. residents
-- ---------------------------------------------------------------------------
create policy residents_select_perm on residents for select to authenticated
  using ((select has_permission('resident.record', 'read')) and (select sees_all_residents()));
create policy residents_insert_perm on residents for insert to authenticated
  with check ((select has_permission('resident.register')) and (select sees_all_residents()));
create policy residents_update_perm on residents for update to authenticated
  using ((select has_permission('resident.record')) and (select sees_all_residents()))
  with check ((select has_permission('resident.record')) and (select sees_all_residents()));

-- ---------------------------------------------------------------------------
-- 4. placement_history
-- ---------------------------------------------------------------------------
create policy placement_history_select_perm on placement_history for select to authenticated
  using ((select has_permission('resident.record', 'read')) and (select sees_all_residents()));
create policy placement_history_insert_perm on placement_history for insert to authenticated
  with check (
    (select sees_all_residents())
    and (
         (placement_type = 'ChangeEnclosure' and (select has_permission('placement.move')))
      or (placement_type in ('SendToHospital', 'ReturnFromHospital') and (select has_permission('placement.hospital')))
      or (placement_type in ('Foster', 'Adopt', 'ReturnToShelter') and (select has_permission('placement.rehome')))
      or (placement_type = 'Deceased' and (select has_permission('placement.death')))
      or (placement_type = 'Intake' and (select has_permission('resident.register')))
      or (placement_type = 'DeceasedInError' and (select has_permission('placement.death_withdraw')))
    )
  );
create policy placement_history_update_perm on placement_history for update to authenticated
  using ((select has_permission('resident.record')) and (select sees_all_residents()))
  with check ((select has_permission('resident.record')) and (select sees_all_residents()));

-- ---------------------------------------------------------------------------
-- 5. adoption_updates (Edit includes delete: finding A8)
-- ---------------------------------------------------------------------------
create policy adoption_updates_select_perm on adoption_updates for select to authenticated
  using ((select has_permission('resident.adoption_news', 'read')) and (select sees_all_residents()));
create policy adoption_updates_insert_perm on adoption_updates for insert to authenticated
  with check ((select has_permission('resident.adoption_news')) and (select sees_all_residents()));
create policy adoption_updates_update_perm on adoption_updates for update to authenticated
  using ((select has_permission('resident.adoption_news')) and (select sees_all_residents()))
  with check ((select has_permission('resident.adoption_news')) and (select sees_all_residents()));
create policy adoption_updates_delete_perm on adoption_updates for delete to authenticated
  using ((select has_permission('resident.adoption_news')) and (select sees_all_residents()));

-- The vet's half of the dropped read policy, predicate unchanged.
create policy vet_read_adoption_updates on adoption_updates for select to authenticated
  using (current_user_role() = 'vet'::app_role
         and resident_id in (select current_vet_resident_ids()));

notify pgrst, 'reload schema';
