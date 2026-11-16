-- consumer: src/lib/status/health.ts
--
-- #q7x4m. Deletes a donation tax ID once its seven years are up (donation_tax_ids.retain_until, 0381). Copies 0227:
-- pg_cron inside the database, so applying this file IS the install (no key, no deploy). Daily at 03:41 UTC.
-- The donation and its receipt are untouched: the receipt register (donation_receipts, 0168) is a separate table with no link
-- to donation_tax_ids and no delete is permitted on it, so "a receipt was issued" survives the ID going. Only the
-- donation_tax_ids row is deleted.
-- Reporting: the job name is in EXPECTED_CRON_JOBS (health.ts), so a missing, switched-off, failed or stale run goes red/amber.
-- Zero deletions is the normal state until 2033 and is NOT a fault: the watcher reads the run status, never the count. What
-- each run deleted is recorded in retention_runs (a count only, never an ID).
-- Re-runnable: create ... if not exists, create or replace, cron.schedule on a name replaces the job.

create extension if not exists pg_cron;

create table if not exists retention_runs (
  id       bigint generated always as identity primary key,
  job      text not null,
  ran_at   timestamptz not null default now(),
  deleted  integer not null
);
comment on table retention_runs is 'One row per run of a retention job: which job and how many rows it deleted (0385). Counts only, no personal data. Service role only.';
alter table retention_runs enable row level security;
revoke all on retention_runs from public, anon, authenticated;
grant select, insert on retention_runs to service_role;

create or replace function purge_donation_tax_ids()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from public.donation_tax_ids where retain_until < current_date;
  get diagnostics n = row_count;
  insert into public.retention_runs (job, deleted) values ('purge-donation-tax-ids', n);
  return n;
end;
$$;
comment on function purge_donation_tax_ids() is
  'Deletes donation_tax_ids rows whose retain_until has passed (0385, #q7x4m). The donation and its receipt stay. Run daily by pg_cron; records the count in retention_runs.';
revoke all on function purge_donation_tax_ids() from public, anon, authenticated;

select cron.schedule('purge-donation-tax-ids', '41 3 * * *', 'select public.purge_donation_tax_ids()');
