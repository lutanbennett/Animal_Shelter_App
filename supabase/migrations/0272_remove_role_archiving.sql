-- consumer: src/lib/permissions/approvers.ts, src/app/admin/security/actions.ts, src/app/admin/security/page.tsx, src/app/admin/security/role-options.ts, src/app/admin/who-does-what/page.tsx, src/lib/auth/held-roles.ts, scripts/lib/readonly-checks.mjs
--
-- Take out role archiving (roles.archived_at). Lutan, 2026-10-27: "Do we need a archiving feature for roles or can they just be
-- deleted? the reason that the retire was built was that I was advised it was required for the audit log but that appears to
-- not be the case." It is not: audit_log has no foreign key to roles and keeps full old_row/new_row copies. See
-- docs/decisions/2026-10-27-role-archiving-removed.md.
--
-- ONLY roles.archived_at GOES. user_roles.archived_at (a person's assignment to a role, ended) STAYS: 0270's guard and every
-- "ur.archived_at is null" below depend on it. Do not confuse the two.
--
-- Every reader is rewritten FIRST, from the live function bodies on dev (not the older migration files), and only then is the
-- column dropped. After 0270 no role is archived, so each "r.archived_at is null" filter was already true for every row; removing
-- it changes no answer.
--   has_permission, is_admin, holds_app_role, my_permissions, reassign_recurring_job, role_can   -> filter removed
--   roles_guard_fixed      -> "or archived" test removed (a fixed role could never be archived; now nothing can be)
--   set_role_cards (0222)  -> the "retired roles do not approve photos" join filter removed. The function 0222 changed is this
--                             one; with no retired roles there is nothing to exclude, so it is rewritten, not dropped.
--   user_roles_take_live_role (0173) -> trigger and function DROPPED: its only job was refusing a retired role.
--
-- Re-runnable: create or replace / drop if exists. Grants are unchanged by create or replace.

drop trigger if exists user_roles_take_live_role on public.user_roles;
drop function if exists public.user_roles_take_live_role();

CREATE OR REPLACE FUNCTION public.has_permission(p_activity text, p_level text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.key = 'admin'
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.key = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.holds_app_role()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and (
         -- Admin sits outside the card system and holds no cards (CLAUDE.md). Same test has_permission() uses.
         r.key = 'admin'
         or exists (select 1 from public.role_permissions rp where rp.role_id = r.id)
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.my_permissions()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with mine as (
    select r.*, ur.is_main, ur.created_at as held_since
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
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
$function$;

CREATE OR REPLACE FUNCTION public.reassign_recurring_job(p_job_id uuid, p_occurs_on date, p_user_ids uuid[], p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    join roles r on r.id = ur.role_id
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
$function$;

CREATE OR REPLACE FUNCTION public.role_can(p_role_key text, p_activity text, p_level text DEFAULT 'edit'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_own boolean;
begin
  select exists (
    select 1
      from public.user_roles ur
      join public.roles r on r.id = ur.role_id
     where ur.user_id = (select auth.uid())
       and ur.archived_at is null
       and public.role_row_live(ur.starts_on, ur.ends_on)
       and r.key = p_role_key
  ) into v_own;

  -- coalesce: a null own-role test makes `not null` untrue
  if not coalesce(
       (select auth.role()) = 'service_role'
    or public.has_permission('recurring.manage', 'edit')
    or v_own,
    false
  ) then
    raise exception 'role_can: not permitted to ask about the % role', coalesce(p_role_key, '(null)')
      using errcode = 'insufficient_privilege';
  end if;

  return exists (
    select 1
      from public.roles r
     where r.key = p_role_key
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.key = 'admin'
         or exists (
           select 1
             from public.role_permissions rp
            where rp.role_id = r.id
              and rp.activity = p_activity
              and rp.level >= case p_level when 'read' then 1 else 2 end
         )
       )
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.roles_guard_fixed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'DELETE' then
    if old.kind = 'fixed' then
      raise exception 'The % role is fixed and cannot be deleted.', old.key using errcode = 'check_violation';
    end if;
    return old;
  end if;
  if old.kind = 'fixed' and (
       new.key is distinct from old.key
    or new.kind is distinct from old.kind
  ) then
    raise exception 'The % role is fixed: it cannot be renamed or re-kinded.', old.key
      using errcode = 'check_violation';
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_role_cards(p_role uuid, p_cards text[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_approver_after boolean;
  v_holders text;
begin
  if exists (select 1 from unnest(p_cards) c group by c having count(*) > 1) then
    raise exception 'A card can be given to a role once.' using errcode = 'unique_violation';
  end if;

  -- Is there an approver once this call lands? The edited role counts by what the cards it is being handed require (card_grants,
  -- with includes), every other role by the cells it holds now (role_permissions is exactly its cards' union).
  v_approver_after :=
    exists (select 1 from public.card_closure(p_cards) cl join public.card_grants g on g.card = cl.card
             where g.activity = 'photos.approve' and g.level >= 1)
    or exists (select 1 from public.role_permissions rp join public.roles ar on ar.id = rp.role_id
                where rp.role_id <> p_role and rp.activity = 'photos.approve' and rp.level >= 1);

  if not v_approver_after then
    if 'add_photos' = any (coalesce(p_cards, array[]::text[]))
       and not exists (select 1 from public.role_cards rc where rc.role_id = p_role and rc.card = 'add_photos') then
      raise exception 'Give a role the Approve photos card first, so someone can approve these photos.'
        using errcode = 'check_violation';
    end if;

    if exists (select 1 from public.role_permissions rp
                where rp.role_id = p_role and rp.activity = 'photos.approve' and rp.level >= 1) then
      select string_agg(h.name, ', ' order by h.name) into v_holders
        from (
          select r.name from public.role_cards rc join public.roles r on r.id = rc.role_id
           where rc.card = 'add_photos' and rc.role_id <> p_role
          union
          select r.name from public.roles r
           where r.id = p_role and 'add_photos' = any (coalesce(p_cards, array[]::text[]))
        ) h;
      if v_holders is not null then
        raise exception 'This is the last role that can approve photos, and these roles still add resident photos: %. Take Add resident photos off them first, or give another role the Approve photos card.', v_holders
          using errcode = 'check_violation';
      end if;
    end if;
  end if;

  delete from public.role_cards rc
   where rc.role_id = p_role and not (rc.card = any (coalesce(p_cards, array[]::text[])));

  insert into public.role_cards (role_id, card, position)
  select p_role, c.card, c.pos
    from unnest(coalesce(p_cards, array[]::text[])) with ordinality as c (card, pos)
  on conflict (role_id, card) do update set position = excluded.position
    where public.role_cards.position is distinct from excluded.position;

  perform public.recompute_role_permissions(p_role, null);
end;
$function$;

alter table public.roles drop column if exists archived_at;
