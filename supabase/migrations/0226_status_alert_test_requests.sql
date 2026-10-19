-- consumer: none
-- Relay for the Status alert mail test from a Pi-drawn page (schema half;
-- design: docs/decisions/2026-10-16-alert-tile-green-needs-delivery.md,
-- option 2, approved 2026-10-19).
--
-- The Pi cannot send mail. Its Status page therefore writes one row here
-- meaning "please send a test alert", and the Worker's 15-minute cron picks
-- it up, sends the test, and records which status_alert_runs row it made.
--
--   requested_by       profile id of the admin who pressed the button (no
--                      foreign key: a deleted user must not block the log)
--   requested_by_name  their name at the time, for the tile to show
--   requested_at       when
--   status             'pending' -> 'sent' | 'failed'
--   picked_up_at       when the Worker took it
--   run_id             the status_alert_runs row the test produced
--   note               what went wrong, if it did
--
-- The writer can only ask. A trigger forces every new row to be pending with
-- nothing filled in, so an insert can never claim a result. A partial unique
-- index allows one pending request at a time, so a held-down button queues
-- one mail, not forty. Rows older than 30 days are deleted by the feature's
-- cron, as for status_alert_runs.
--
-- Service role only, like status_alert_checks and status_alert_runs (0098):
-- RLS on, no policies, nothing for anon or authenticated.
--
-- Re-runnable.

create table if not exists status_alert_test_requests (
  id bigint generated always as identity primary key,
  requested_at timestamptz not null default now(),
  requested_by uuid,
  requested_by_name text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  picked_up_at timestamptz,
  run_id bigint references status_alert_runs (id) on delete set null,
  note text
);

create unique index if not exists status_alert_test_requests_one_pending
  on status_alert_test_requests ((true)) where status = 'pending';
create index if not exists status_alert_test_requests_requested_at_idx
  on status_alert_test_requests (requested_at desc);

create or replace function status_alert_test_requests_new_row() returns trigger
language plpgsql as $$
begin
  new.status := 'pending';
  new.picked_up_at := null;
  new.run_id := null;
  new.note := null;
  new.requested_at := now();
  return new;
end $$;

drop trigger if exists status_alert_test_requests_new_row on status_alert_test_requests;
create trigger status_alert_test_requests_new_row
  before insert on status_alert_test_requests
  for each row execute function status_alert_test_requests_new_row();

alter table status_alert_test_requests enable row level security;
revoke all on status_alert_test_requests from public, anon, authenticated;
grant select, insert, update, delete on status_alert_test_requests to service_role;
