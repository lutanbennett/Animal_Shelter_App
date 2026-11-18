-- consumer: worker/translations.mjs, worker/index.mjs, src/lib/status/health.ts
--
-- #lblcr. Two halves, one file.
--
-- 1. propose_label_th() stamps the draft with the shelter of the row it is labelling.
--    Since 0397 label_drafts.shelter_id is NOT NULL with a default that reads only the x-shelter-id request header
--    (0390). The function leaned on that default, so the shelter of a draft was whatever header the caller happened
--    to send, not the shelter of the label. Now it asks the labelled row (every registered label table that is
--    per-shelter carries shelter_id) and falls back to the header only for a table that has no such column
--    (`features`, a code-defined catalogue, is the one today). The same shape as record_label_sources() in 0397.
--    MEASURED on dev, 2026-11-18, before this file: with no header the call is refused at has_permission()
--    (42501 label.propose_not_allowed), because has_permission() reads user_roles through RLS and that is scoped
--    by the header, so a headerless login holds no card at all. With a header the draft is written. So the Worker
--    cron's fault is the missing header (fixed in worker/translations.mjs), and this change makes the stamp
--    follow the row instead of the header. Nothing else about the function changes: same card, same refusal keys,
--    same writes (label_drafts only).
--
-- 2. scheduled_writer_runs: the last outcome of each scheduled writer that does NOT live in pg_cron.
--    0238 lets the app ask pg_cron how its jobs are doing; a Worker cron (the label drafts, every 15 minutes) is
--    invisible to it, which is why this one failed for a day with nobody told. The Worker now reports each run
--    through record_scheduled_writer_run(), and src/lib/status/health.ts reads the table into the existing Scheduled
--    jobs tile, so the 0098 alert mailer covers it with nothing new to maintain.
--    A platform table (no shelter_id, like status_alert_checks): it says whether an installation's job ran, not
--    anything a shelter owns. Service role only; RLS on with no policy.
--
-- Re-runnable: create or replace / if not exists / revoke, grant.

create or replace function propose_label_th(p_table text, p_row_id text, p_column text, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_th_column text;
  v_text text;
  v_english text;
  v_rows bigint;
  v_shelter uuid;
begin
  -- The proposing grant, its own since 0296. Approving is translations.manage and stays there.
  if not (select has_permission('translations.propose')) then
    raise exception 'label.propose_not_allowed' using errcode = '42501';
  end if;

  select l.th_column into v_th_column
    from translatable_labels l
   where l.table_name = p_table and l.column_name = p_column;
  if v_th_column is null then
    raise exception 'label.not_translatable' using errcode = '22023',
      detail = json_build_object('table', p_table, 'column', p_column)::text;
  end if;

  v_text := nullif(btrim(p_text), '');
  if v_text is null then
    delete from label_drafts
     where table_name = p_table and row_id = p_row_id and column_name = p_column;
    return true;
  end if;

  execute format('select count(*) from %I x where x.id::text = $1', p_table)
    into v_rows using p_row_id;
  if v_rows = 0 then
    return false;
  end if;

  execute format('select x.%I::text from %I x where x.id::text = $1', p_column, p_table)
    into v_english using p_row_id;

  -- The draft belongs to the shelter of the row it labels. A table with no shelter_id column (a code-defined
  -- catalogue) takes the request's shelter instead; with neither, the insert below fails on NOT NULL, loudly.
  if exists (select 1 from information_schema.columns c
              where c.table_schema = 'public' and c.table_name = p_table and c.column_name = 'shelter_id') then
    execute format('select x.shelter_id from %I x where x.id::text = $1', p_table)
      into v_shelter using p_row_id;
  end if;
  v_shelter := coalesce(v_shelter, current_shelter_id());

  insert into label_drafts (table_name, row_id, column_name, text_th, source_text, proposed_by, proposed_at, shelter_id)
  values (p_table, p_row_id, p_column, v_text, v_english, (select auth.uid()), now(), v_shelter)
  on conflict (table_name, row_id, column_name) do update
    set text_th = excluded.text_th,
        source_text = excluded.source_text,
        proposed_by = excluded.proposed_by,
        proposed_at = excluded.proposed_at;
  return true;
end;
$$;

comment on function propose_label_th(text, text, text, text) is
  'Proposes a Thai label and leaves it waiting (0293, row check 0294, own card 0296). Writes label_drafts only, so the row''s live Thai is untouched. The draft takes the shelter of the row it labels (0408), or the request''s shelter for a table with no shelter_id. An empty text discards the draft, and a row id that does not exist returns false without writing.';
revoke all on function propose_label_th(text, text, text, text) from public, anon;
grant execute on function propose_label_th(text, text, text, text) to authenticated, service_role;

-- 2. What each scheduled writer outside pg_cron last did.
create table if not exists scheduled_writer_runs (
  job text primary key,
  last_outcome text not null check (last_outcome in ('ok', 'skipped', 'failed')),
  last_detail text,
  last_ran_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fail_runs integer not null default 0 check (fail_runs >= 0)
);
comment on table scheduled_writer_runs is
  'The newest outcome of each Worker-side scheduled writer, keyed by job name. skipped means deliberately not configured (counts as healthy). Written by record_scheduled_writer_run() from the Worker, read by the System status Scheduled jobs tile.';

alter table scheduled_writer_runs enable row level security;
revoke all on scheduled_writer_runs from public, anon, authenticated;
grant select, insert, update, delete on scheduled_writer_runs to service_role;

-- Security INVOKER on purpose: the Worker calls it with the service key, which already holds the table grants, and
-- nothing a signed-in login holds can reach it. fail_runs counts consecutive failures and resets on any other outcome.
create or replace function record_scheduled_writer_run(p_job text, p_outcome text, p_detail text default null)
returns void
language sql
as $$
  insert into scheduled_writer_runs as s (job, last_outcome, last_detail, last_ran_at, last_ok_at, fail_runs)
  values (p_job, p_outcome, left(p_detail, 500), now(),
          case when p_outcome <> 'failed' then now() end,
          case when p_outcome = 'failed' then 1 else 0 end)
  on conflict (job) do update
    set last_outcome = excluded.last_outcome,
        last_detail = excluded.last_detail,
        last_ran_at = excluded.last_ran_at,
        last_ok_at = case when excluded.last_outcome <> 'failed' then excluded.last_ran_at else s.last_ok_at end,
        fail_runs = case when excluded.last_outcome = 'failed' then s.fail_runs + 1 else 0 end
$$;
comment on function record_scheduled_writer_run(text, text, text) is
  'Records one run of a Worker-side scheduled writer (ok, skipped or failed) and counts consecutive failures. Service role only.';
revoke all on function record_scheduled_writer_run(text, text, text) from public, anon, authenticated;
grant execute on function record_scheduled_writer_run(text, text, text) to service_role;

notify pgrst, 'reload schema';
