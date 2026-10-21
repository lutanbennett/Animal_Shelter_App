-- consumer: src/lib/status/health.ts
--
-- Lets the app ask pg_cron how its jobs are doing. pg_cron runs inside the database and tells nobody
-- (0227's purge-assistant-actions was the first and only job), so this is the one read the status page and
-- the Worker's quarter-hourly alert run use to watch any job by name. Nothing is copied: it reads cron.job
-- and the newest cron.job_run_details row per job. A name with no cron.job row still returns a line
-- (job_exists = false), which is the "never installed" case this exists to catch.
--
-- Security definer, executable by service_role only, so no login can read the cron tables through it.
-- Re-runnable: create or replace, revoke/grant.

create or replace function scheduled_job_status(p_names text[])
returns table (
  jobname text,
  job_exists boolean,
  active boolean,
  schedule text,
  last_status text,
  last_started_at timestamptz,
  last_ended_at timestamptz,
  last_message text
)
language sql
security definer
set search_path = ''
as $$
  select n.name,
         j.jobid is not null,
         j.active,
         j.schedule,
         r.status,
         r.start_time,
         r.end_time,
         r.return_message
    from unnest(p_names) as n(name)
    left join cron.job j on j.jobname = n.name
    left join lateral (
      select d.status, d.start_time, d.end_time, d.return_message
        from cron.job_run_details d
       where d.jobid = j.jobid
       order by d.start_time desc
       limit 1
    ) r on true
$$;
comment on function scheduled_job_status(text[]) is
  'State of the named pg_cron jobs and the newest run of each (status, start, end, return message). A missing job still returns a row with job_exists = false. Read by the System status page and the alert run.';
revoke all on function scheduled_job_status(text[]) from public, anon, authenticated;
grant execute on function scheduled_job_status(text[]) to service_role;
