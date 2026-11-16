-- consumer: none
--
-- Multi-tenancy programme, the stamping that Part 5 (#ujqr5) needs and nothing owned (#stmp5, under #ykefa). Measured 2026-11-16 on dev: all 95
-- shelter_id columns were nullable, had no default and held no value, so any per-shelter policy would have read nothing even with the right header
-- (docs/decisions/2026-11-16-tenancy-part5-policies.md). This file does the first two of #stmp5's four steps:
--   (1) every existing row is stamped with Lanna, shelter #1, by an explicit one-off statement (there is one shelter today; the statement names it
--       by key and does nothing if it is absent), with user triggers off for the update so updated_at and audit rows are not rewritten;
--   (2) every shelter_id column takes current_shelter_id() when an insert leaves it out. A caller with no header (service role, scripts, the Worker's
--       cron) still gets null, exactly as before; that is Part 7's sweep, and it is why NOT NULL (step 3) is NOT here: it would turn every such write
--       into an error in production. No Lanna fallback anywhere: an unmapped host stamps nothing.
-- current_shelter_id() is granted to anon, because a column default runs with the inserting role's rights and the public forms insert as anon. It is
-- security invoker and reads only a request header, so granting it exposes nothing. The allow-lists in check-migration-grants.mjs and
-- check-public-views.mjs gain it in this same change (0383 said Part 5 would).
-- No policy is created here and no code reads the column, so running behaviour is unchanged.
--
-- Re-runnable. To undo the default: alter table <t> alter column shelter_id drop default (every table below); the stamp is data and is left.

grant execute on function current_shelter_id() to anon;

do $$
declare
  t text;
  lanna uuid;
begin
  select id into lanna from public.shelters where key = 'lanna';
  for t in
    select c.table_name from information_schema.columns c
    join information_schema.tables x on x.table_schema = c.table_schema and x.table_name = c.table_name and x.table_type = 'BASE TABLE'
    where c.table_schema = 'public' and c.column_name = 'shelter_id'
    order by 1
  loop
    execute format('alter table public.%I alter column shelter_id set default public.current_shelter_id()', t);
    if lanna is not null then
      execute format('alter table public.%I disable trigger user', t);
      execute format('update public.%I set shelter_id = %L where shelter_id is null', t, lanna);
      execute format('alter table public.%I enable trigger user', t);
    end if;
  end loop;
end $$;
