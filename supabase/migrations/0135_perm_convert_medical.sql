-- consumer: src/app/weight/actions.ts, src/app/prescriptions/actions.ts, src/app/procedures/new/actions.ts, src/app/diets/actions.ts, src/app/appointments/page.tsx, src/lib/medication-list/load.ts
--
-- R5's first conversion (docs/roles-and-permissions.md §12; decisions/
-- 2026-10-04-perm-convert-medical.md): the seven resident medical tables stop
-- asking WHO the caller is and start asking WHAT the caller may do.
--
--   vet_appointments  medical.visits       prescriptions   medical.prescriptions
--   procedures        medical.procedures   immunization_records  medical.immunizations
--   blood_tests       medical.blood_tests  weight          medical.weight
--   resident_diets    medical.diet
--
-- THE SHAPE (the other three conversions copy it)
--   one policy per command, calling has_permission() as `(select has_permission(…))`
--   so Postgres plans it once per statement (finding D, §3), and ANDing the one
--   scope question that is not a cell:
--     (select sees_all_clinical())   -- NEW below: the caller's role has scope_clinical = 'any'
--
-- WHAT IS DROPPED, WHAT STAYS
--   Dropped: every management_* and staff_* policy on these tables. They are
--   replaced by the policies below, which answer the same for management and staff
--   today (their cells are Edit on all seven) and for any role that is given the cells.
--   Left alone, on purpose:
--     admin_all_*  Admin is R6's, and says yes to has_permission() anyway. It also keeps
--                  hard DELETE as Admin-only, which is what the cells say (§11: a delete is
--                  not an act the matrix has; the screens archive).
--     vet_*        Vet is "Last" (§12) and its clinic limits are the scopes of §5, converted
--                  one for one at the end. sees_all_clinical() is false for a vet, so the
--                  new policies never hand a vet the shelter's whole record (the danger of a
--                  has_permission() policy: it answers for every role, vet's cells included).
--   Permissive policies are OR-ed, so each of these tables now answers: Admin (admin_all) or
--   a vet (own clinic, unchanged) or anyone whose cell and scope allow it (new).
--
-- NO DELETE POLICY IS WRITTEN. management and staff could hard-delete from `weight`
-- (a FOR ALL policy; known tightening C5) and nothing else. This closes C5 for those two
-- roles: the app removes by archiving, never by DELETE. The vet half of C5 and all of C4 are
-- vet policies and stay until Vet converts.
--
-- vet_appointments writes ask medical.visits, not visit.book. Today booking and writing a
-- visit up are the same right and the six roles hold both or neither; the split (§4) is
-- a later piece, and a role given one without the other is refused, never over-granted.
--
-- Archiving (an UPDATE of archived_at) rides the table's edit policy. Today it does too (N4
-- is the vet half). Holding medical.archive separately would need a trigger, because a
-- policy cannot see the old row; recorded in the decision file, not built here.
--
-- Written to be safely re-runnable. To undo: drop the *_perm policies and sees_all_clinical(),
-- then re-create management_* and staff_* from 0001 and the later files that name them
-- (0131 for blood_tests).

-- ---------------------------------------------------------------------------
-- 1. The one scope question these tables need.
--    True when the caller has a live role whose scope_clinical is 'any' (Admin's row says
--    any). A login with no role, an archived person, an archived role: false. A vet
--    (own_clinic): false, so a vet's rows come only from the vet_* policies.
-- ---------------------------------------------------------------------------
create or replace function sees_all_clinical()
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
       and r.scope_clinical = 'any'
  );
$$;

comment on function sees_all_clinical() is
  'Does the caller''s live role reach every resident''s clinical records (roles.scope_clinical = any)? False for no role, an archived person or role, and any own_clinic role (a vet). Asked as (select sees_all_clinical()) beside has_permission() in the converted medical policies; the Vet conversion will widen it, not replace it.';

revoke all on function sees_all_clinical() from public, anon;
grant execute on function sees_all_clinical() to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. The seven tables. Each: drop management_*/staff_* (old names, and our own on a
--    re-run), create select / insert / update.
-- ---------------------------------------------------------------------------
do $convert$
declare
  t record;
  p record;
begin
  for t in
    select * from (values
      ('vet_appointments',    'medical.visits'),
      ('procedures',          'medical.procedures'),
      ('blood_tests',         'medical.blood_tests'),
      ('prescriptions',       'medical.prescriptions'),
      ('immunization_records','medical.immunizations'),
      ('weight',              'medical.weight'),
      ('resident_diets',      'medical.diet')
    ) as v(tbl, act)
  loop
    -- every management_* and staff_* policy on the table, whatever it is called today
    for p in
      select policyname from pg_policies
       where schemaname = 'public' and tablename = t.tbl
         and (policyname like 'management\_%' or policyname like 'staff\_%')
    loop
      execute format('drop policy if exists %I on public.%I', p.policyname, t.tbl);
    end loop;

    execute format('drop policy if exists %I on public.%I', t.tbl || '_select_perm', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_insert_perm', t.tbl);
    execute format('drop policy if exists %I on public.%I', t.tbl || '_update_perm', t.tbl);

    execute format(
      'create policy %I on public.%I for select to authenticated using ((select has_permission(%L, ''read'')) and (select sees_all_clinical()))',
      t.tbl || '_select_perm', t.tbl, t.act);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select has_permission(%L)) and (select sees_all_clinical()))',
      t.tbl || '_insert_perm', t.tbl, t.act);
    execute format(
      'create policy %I on public.%I for update to authenticated using ((select has_permission(%L)) and (select sees_all_clinical())) with check ((select has_permission(%L)) and (select sees_all_clinical()))',
      t.tbl || '_update_perm', t.tbl, t.act, t.act);
  end loop;
end
$convert$;

notify pgrst, 'reload schema';
