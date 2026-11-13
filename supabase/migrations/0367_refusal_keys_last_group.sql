-- consumer: src/app/management/recurring-jobs/actions.ts, src/lib/medical/weigh-first.ts, src/lib/recurring-jobs/queries.ts,
-- consumer: src/lib/recurring-jobs/eligibility-load.ts, src/app/admin/website/actions.ts
-- #3nuwy, group 10 -- THE LAST GROUP of person-read English (docs/decisions/2026-11-13-refusal-keys-group-10.md):
-- recurrence_dates, recurring_job_dates, role_can and propose_website_draft raise KEYS instead of English sentences.
-- Bodies are the LIVE ones (0095, 0277, 0315) with only the raise lines changed, generated from those files. Re-runnable.
--
-- 5 raises, 4 keys: the two 0095 functions raise the identical sentence with one meaning, so they share
-- recurring_job.span_too_long. role_can's message named the function and the role; its key carries neither (a role
-- is data, and nothing here reads a role by name).
--
-- EVERY EXISTING SQLSTATE IS KEPT: span_too_long is bare (P0001); role_can insufficient_privilege (42501);
-- propose_website_draft 42501 and 22023. role_can and propose_website_draft are SECURITY DEFINER (0262's rule): their
-- permission checks (has_permission / is_admin flag / auth.role) are not touched, only message text.
-- Neither new raise passes parameters, so no json_build_object is needed.
--
-- undo: re-apply the four bodies from 0095, 0277 and 0315 in a new file.

create or replace function recurrence_dates(
  p_repeat text,
  p_every integer,
  p_weekdays smallint[],
  p_month_day smallint,
  p_week_of_month smallint,
  p_starts_on date,
  p_ends_on date,
  p_from date,
  p_to date
)
returns setof date
language plpgsql
immutable
parallel safe
as $$
begin
  if p_from is null or p_to is null or p_to - p_from > 731 then
    raise exception 'recurring_job.span_too_long';
  end if;
  return query
    select p_from + i
      from generate_series(0, p_to - p_from) as i
     where recurrence_occurs_on(p_from + i, p_repeat, p_every, p_weekdays, p_month_day,
                                p_week_of_month, p_starts_on, p_ends_on);
end;
$$;

create or replace function recurring_job_dates(p_from date, p_to date)
returns table (job_id uuid, occurs_on date)
language plpgsql
stable
as $$
begin
  if p_from is null or p_to is null or p_to - p_from > 731 then
    raise exception 'recurring_job.span_too_long';
  end if;
  return query
    select j.id, p_from + i
      from recurring_jobs j
      cross join generate_series(0, p_to - p_from) as i
     where recurrence_occurs_on(p_from + i, j.repeat, j.every, j.weekdays, j.month_day,
                                j.week_of_month, j.starts_on, j.ends_on)
     order by 2, 1;
end;
$$;

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
    raise exception 'role.eligibility_not_allowed'
      using errcode = 'insufficient_privilege';
  end if;

  return exists (
    select 1
      from public.roles r
     where r.key = p_role_key
       and p_activity is not null
       and p_level in ('read', 'edit')
       and (
         r.is_admin
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

create or replace function propose_website_draft(p_target text, p_row_key text, p_patch jsonb)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if not (select has_permission('website.propose')) then
    raise exception 'website.propose_not_allowed' using errcode = '42501';
  end if;
  if p_target not in ('site_content', 'site_pages') then
    raise exception 'website.draft_table_invalid' using errcode = '22023';
  end if;
  insert into website_drafts (target, row_key, patch, proposed_by)
  values (p_target, p_row_key, p_patch, (select auth.uid()))
  on conflict (target, row_key) do update
    set patch = excluded.patch, proposed_by = excluded.proposed_by, proposed_at = now()
  returning id into v_id;
  return v_id;
end;
$$;
