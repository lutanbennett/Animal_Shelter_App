-- consumer: scripts/check-card-grants.mjs
--
-- Part 10 of the multi-tenancy programme (#omt6u). recompute_role_permissions() inserted role_permissions rows with no shelter_id,
-- so the row took the column default current_shelter_id(), which reads only the x-shelter-id request header. Since 0397 made
-- shelter_id NOT NULL, any recompute with no header (a migration, a job, a script) fails. It now takes the shelter from the role
-- it is recomputing, which is always the honest one. Same body as 0257 otherwise. Re-runnable (create or replace).
create or replace function public.recompute_role_permissions(p_role uuid, p_bundle jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.roles where id = p_role) then
    raise exception 'No such role.' using errcode = 'no_data_found';
  end if;
  if exists (select 1 from public.roles where id = p_role and kind = 'fixed') then
    raise exception 'Fixed roles have no cards.' using errcode = 'check_violation';
  end if;

  delete from public.role_permissions rp
   where rp.role_id = p_role
     and not exists (select 1 from public.cards_effective(p_role, null) e where e.activity = rp.activity);

  insert into public.role_permissions (role_id, activity, level, shelter_id)
  select p_role, e.activity, e.level, (select r.shelter_id from public.roles r where r.id = p_role)
    from public.cards_effective(p_role, null) e
  on conflict (role_id, activity) do update set level = excluded.level
    where public.role_permissions.level is distinct from excluded.level;
end;
$$;
