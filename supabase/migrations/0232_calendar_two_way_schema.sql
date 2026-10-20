-- consumer: none (the app half, a later stream, will read these from src/lib/clinics/calendar-sync.ts and the Worker's 15-minute cron)
--
-- Schema half of the two-way calendar (phase 2 of the vet calendar; phase 1 is 0207). Nothing reads
-- either object yet. Additive and re-runnable. Neither is public, so no public view changes.
--
-- 1. calendar_sync_state: one row per calendar the app polls. sync_token is Google's events.list
--    syncToken, so each run asks only for what changed since the last. Service role only.
-- 2. clinic_visits.calendar_etag and calendar_event_updated_at: the event's etag and `updated` time
--    as of the app's own last write, so the poll can recognise a change as its own and ignore it.
--    Neither is in the dirty trigger's list (0207), so writing them does not re-mark the visit.

create table if not exists calendar_sync_state (
  calendar_id   text primary key,
  sync_token    text,
  last_run_at   timestamptz,
  last_ok_at    timestamptz,
  last_error    text,
  created_at    timestamptz not null default now()
);

comment on table calendar_sync_state is 'One row per Google calendar polled for changes (0232). sync_token = events.list syncToken; null forces a full read. Service role only.';

alter table calendar_sync_state enable row level security;
revoke all on calendar_sync_state from public, anon, authenticated;
grant select, insert, update, delete on calendar_sync_state to service_role;

alter table clinic_visits add column if not exists calendar_etag text;
alter table clinic_visits add column if not exists calendar_event_updated_at timestamptz;

comment on column public.clinic_visits.calendar_etag is
  'Etag of the Google event as of the app''s last write; a polled event with this etag is the app''s own change (0232).';
comment on column public.clinic_visits.calendar_event_updated_at is
  'The event''s `updated` time as of the app''s last write; with calendar_etag, lets the poll ignore its own change (0232).';
