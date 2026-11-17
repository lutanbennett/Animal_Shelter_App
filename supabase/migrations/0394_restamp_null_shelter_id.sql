-- consumer: none
-- Rows written WITHOUT a shelter header after 0390 stamped the table (the Pi's pollers, trigger-written audit_log rows, scripts) took
-- current_shelter_id() = null, and with 0392's per-shelter policies a null-shelter row is invisible to every login. Found on dev on 2026-11-17:
-- audit_log 21, reels 2, video_uploads 2, write_requests 1, user_roles 1. This repeats 0390's one-off stamp (Lanna, the only shelter) and is
-- idempotent. It is a STOPGAP and not the cure: until NOT NULL and Part 7's filters land, a headerless writer keeps producing null rows, so run
-- this again (or check-null-shelter-id.mjs) before 0392 reaches any environment that has such writers. See docs/decisions/2026-11-17-tenancy-part5-policies.md.
do $$
declare t text; lanna uuid;
begin
  select id into lanna from public.shelters where key = 'lanna';
  if lanna is null then return; end if;
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables x on x.table_schema = c.table_schema and x.table_name = c.table_name and x.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'shelter_id' order by 1
  loop
    execute format('alter table public.%I disable trigger user', t);
    execute format('update public.%I set shelter_id = %L where shelter_id is null', t, lanna);
    execute format('alter table public.%I enable trigger user', t);
  end loop;
end $$;
