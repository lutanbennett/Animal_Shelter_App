-- consumer: none
--
-- DB-11, assistant retention. assistant_actions.request_text (0070) is the raw sentence a person typed at the
-- assistant and has been kept forever. Lutan's decisions: keep 2 days (2026-10-10), except the requests the
-- assistant could not help with, which show what people ask that gets no answer; those are kept 90 days
-- (2026-10-19). 'unmatched' (nothing understood) and 'refused' (0130, turned away) are the could-not-help rows.
--
-- WHO READS THE ROWS needs no SQL. "Only admin should be able to read assistant rows" (Lutan, 2026-10-19) is
-- already what the live policies say: 0153's assistant_actions_admin_all gives Admin everything; 0150's
-- assistant_actions_select_perm gives anyone else only their own rows (assistant.record and user_id = me);
-- 0214 changed insert only. Management lost its read-everything in 0150 and does NOT get it back.
--
-- The delete runs daily at 03:17 UTC inside the database (pg_cron), so it needs no key and no deploy. The
-- function is security definer and executable by nobody but the cron job's owner, so no login can call it.
-- Re-runnable: create extension if not exists, create or replace, cron.schedule on a name replaces the job.

create extension if not exists pg_cron;

create or replace function purge_assistant_actions()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from public.assistant_actions
   where (status not in ('unmatched', 'refused') and created_at < now() - interval '2 days')
      or (status in ('unmatched', 'refused') and created_at < now() - interval '90 days');
  get diagnostics n = row_count;
  return n;
end;
$$;
comment on function purge_assistant_actions() is
  'Retention for assistant_actions (DB-11): rows older than 2 days go, except unmatched and refused ones, which go after 90 days. Run daily by pg_cron.';
revoke all on function purge_assistant_actions() from public, anon, authenticated;

select cron.schedule('purge-assistant-actions', '17 3 * * *', 'select public.purge_assistant_actions()');
