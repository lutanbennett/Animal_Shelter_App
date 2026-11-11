-- consumer: src/app/management/recurring-jobs/actions.ts
-- #3nuwy, group 4: record_recurring_job and reassign_recurring_job raise KEYS
-- (docs/decisions/2026-11-11-refusal-keys-group-4.md). Bodies are 0178's and 0277's, unchanged but for the 12 raises. Re-runnable.
-- undo: re-apply the bodies in 0178 (record_recurring_job) and 0277 (reassign_recurring_job) in a new file.

create or replace function public.record_recurring_job(p_job_id uuid, p_occurs_on date, p_outcome text, p_note text DEFAULT NULL::text)
 RETURNS recurring_job_occurrences
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_any boolean := coalesce((select has_permission('recurring.do_any')), false);
  v_job recurring_jobs;
  v_row recurring_job_occurrences;
  v_note text := nullif(btrim(p_note), '');
begin
  -- 0178: recurring.do_own records your own dates, recurring.do_any anyone's. Was the enum, which let every
  -- doctor in and let a role borrowing management record any job whatever its cells.
  if not (v_any or coalesce((select has_permission('recurring.do_own')), false)) then
    raise exception 'recurring_job.record_not_allowed' using errcode = 'P0001';
  end if;
  if p_outcome is not null and p_outcome not in ('done', 'skipped') then
    raise exception 'recurring_job.outcome_invalid' using errcode = 'P0001';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'recurring_job.not_found' using errcode = 'P0001';
  end if;

  -- The date's effective assignees: its cover team if it has one, else the
  -- job's usual ones. recurring.do_any may record any job.
  if not v_any then
    if exists (select 1 from recurring_job_occurrence_assignees
                where job_id = p_job_id and occurs_on = p_occurs_on) then
      if not exists (select 1 from recurring_job_occurrence_assignees
                      where job_id = p_job_id and occurs_on = p_occurs_on and user_id = auth.uid()) then
        raise exception 'recurring_job.date_handed_over' using errcode = 'P0001';
      end if;
    elsif not exists (select 1 from recurring_job_assignees
                       where job_id = p_job_id and user_id = auth.uid()) then
      raise exception 'recurring_job.not_assigned' using errcode = 'P0001';
    end if;
  end if;

  -- Clearing: undo a mistaken done / skipped. A row left saying nothing goes.
  if p_outcome is null then
    delete from recurring_job_occurrences
     where job_id = p_job_id and occurs_on = p_occurs_on and reassigned_at is null;
    update recurring_job_occurrences
       set outcome = null, done_by = null, done_at = null, note = null
     where job_id = p_job_id and occurs_on = p_occurs_on
    returning * into v_row;
    return v_row;
  end if;

  if not recurrence_occurs_on(p_occurs_on, v_job.repeat, v_job.every, v_job.weekdays, v_job.month_day,
                              v_job.week_of_month, v_job.starts_on, v_job.ends_on) then
    raise exception 'recurring_job.not_on_that_date' using errcode = 'P0001',
      detail = json_build_object('date', to_char(p_occurs_on, 'FMDD Mon YYYY'))::text;
  end if;
  if p_outcome = 'done' and p_occurs_on > shelter_today() then
    raise exception 'recurring_job.done_before_its_day' using errcode = 'P0001';
  end if;

  insert into recurring_job_occurrences (job_id, occurs_on, outcome, done_by, done_at, note)
  values (p_job_id, p_occurs_on, p_outcome, auth.uid(), now(), v_note)
  on conflict (job_id, occurs_on) do update
    set outcome = excluded.outcome, done_by = excluded.done_by,
        done_at = excluded.done_at, note = excluded.note
  returning * into v_row;
  return v_row;
end;
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
    raise exception 'recurring_job.reassign_not_allowed' using errcode = 'P0001';
  end if;
  select * into v_job from recurring_jobs where id = p_job_id;
  if not found then
    raise exception 'recurring_job.not_found' using errcode = 'P0001';
  end if;
  select coalesce(array_agg(distinct u), '{}') into v_ids
    from unnest(coalesce(p_user_ids, '{}')) as u where u is not null;

  -- A date that is done or skipped is history: who covered it stays.
  if exists (select 1 from recurring_job_occurrences
              where job_id = p_job_id and occurs_on = p_occurs_on and outcome is not null) then
    raise exception 'recurring_job.date_already_marked' using errcode = 'P0001';
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
    raise exception 'recurring_job.not_on_that_date' using errcode = 'P0001',
      detail = json_build_object('date', to_char(p_occurs_on, 'FMDD Mon YYYY'))::text;
  end if;
  -- "Can still sign in": a login with at least one live role that is in the app, which since 0259 means Admin or a role
  -- holding at least one cell -- not roles.opens_app. Counted by person (0196: a login may hold several roles).
  select count(distinct ur.user_id) into v_ok
    from user_roles ur
    join roles r on r.id = ur.role_id
   where ur.user_id = any (v_ids)
     and ur.archived_at is null
     and role_row_live(ur.starts_on, ur.ends_on)
     and (r.is_admin or exists (select 1 from role_permissions rp where rp.role_id = r.id));
  if v_ok <> cardinality(v_ids) then
    raise exception 'recurring_job.cannot_sign_in' using errcode = 'P0001';
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
