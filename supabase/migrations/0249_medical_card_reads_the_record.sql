-- consumer: src/app/residents/[id]/page.tsx
--
-- A login that holds a medical edit may READ the resident record (docs/decisions/
-- 2026-10-22-medical-card-opens-the-record.md; Lutan 2026-10-22: the Medical records card opens the full
-- resident page, medical sections editable, the rest visible only).
--
-- THE GAP (0144): residents_select_perm and placement_history_select_perm ask sees_all_residents(),
-- i.e. roles.scope_residents = 'all'. A who_and_where role (Head of Medical, 2IC, every card-only login) is
-- false there, so the page the redirect would let it reach comes back with no resident and no history.
--
-- THE FIX: one new question, may_open_resident_record(), true when the caller
--   (a) sees_all_residents(), as before, OR
--   (b) holds a live role whose scope_residents is 'who_and_where' AND whose own permission cells include an
--       EDIT of a medical.* activity.
-- It is asked on the two READ policies only, still ANDed with has_permission('resident.record', 'read').
-- Every write policy keeps sees_all_residents(), so nothing here lets the new readers change a resident.
--
-- WHY 0134 STILL HOLDS: the volunteer and the Head of Maintenance hold no medical.* edit, so (b) is false for
-- them and they read a resident only through resident_who_and_where, as 0134 intends. The vet (doctor) is
-- own_clinic, not who_and_where, so (b) is false for them as well and their vet_* policies are untouched.
-- The scope and the medical edit must sit on the SAME role row, so one role cannot lend its cells to another.
--
-- Not widened, deliberately (reported, not built): resident attachments/photos (0152/0189/0223) and
-- adoption_updates (0144) still ask sees_all_residents(); a card login sees the page without those.
--
-- Re-runnable. To undo: re-create residents_select_perm and placement_history_select_perm as in 0144 and drop
-- may_open_resident_record().

create or replace function may_open_resident_record()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.sees_all_residents())
      or exists (
        select 1
          from public.user_roles ur
          join public.roles r on r.id = ur.role_id and r.archived_at is null
         where ur.user_id = (select auth.uid())
           and ur.archived_at is null
           and public.role_row_live(ur.starts_on, ur.ends_on)
           and r.scope_residents = 'who_and_where'
           and exists (
             select 1
               from public.role_permissions rp
              where rp.role_id = r.id
                and rp.activity like 'medical.%'
                and rp.level >= 2
           )
      );
$$;

comment on function may_open_resident_record() is
  'May the caller READ a resident''s whole record? True for sees_all_residents(), and for a who_and_where role that holds an edit of a medical.* activity (the Medical records card, 0249). False for the volunteer floor without a medical edit, a vet (own_clinic) and no role. Read policies only; every write keeps sees_all_residents().';

revoke all on function may_open_resident_record() from public, anon;
grant execute on function may_open_resident_record() to authenticated, service_role;

drop policy if exists residents_select_perm on residents;
create policy residents_select_perm on residents for select to authenticated
  using ((select has_permission('resident.record', 'read')) and (select may_open_resident_record()));

drop policy if exists placement_history_select_perm on placement_history;
create policy placement_history_select_perm on placement_history for select to authenticated
  using ((select has_permission('resident.record', 'read')) and (select may_open_resident_record()));

notify pgrst, 'reload schema';
