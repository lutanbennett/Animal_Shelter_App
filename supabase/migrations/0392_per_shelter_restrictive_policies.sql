-- consumer: none (no app code reads these directly; they filter rows for every API read and write, anon and authenticated)
-- Part 5 of the tenancy programme (#ujqr5). A RESTRICTIVE per-shelter policy on every public table that carries shelter_id
-- (95 on dev at 2026-11-17), for select, update and delete, to anon and authenticated:
--     is_trusted_caller() or shelter_id = current_shelter_id()
-- A restrictive policy can only TAKE ROWS AWAY from what the permissive (card) policies already allow. It grants nothing:
-- cards and Admin decide what a login may do, the shelter header only decides which rows exist to do it to.
-- Trusted callers (service role, cron, anything whose JWT role is not anon/authenticated) are unfiltered, as is_trusted_caller() defines.
-- INSERT is deliberately NOT restricted here: new rows already take current_shelter_id() by default (0390), and tightening
-- no-header writes belongs with NOT NULL (#stmp5 step 3, after Part 7's filters).
-- Re-runnable: drops then creates; picks tables from the catalogue so it needs no list kept in step.
-- To undo: drop the three policies named shelter_scope_<cmd> from each table; every row then reads exactly as it did before this file.
do $$
declare t text; cmd text;
begin
  for t in
    select c.relname from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'shelter_id' and not a.attisdropped
    where n.nspname = 'public' and c.relkind in ('r','p') and c.relname <> 'shelters'
  loop
    execute format('alter table public.%I enable row level security', t);
    foreach cmd in array array['select','update','delete'] loop
      execute format('drop policy if exists %I on public.%I', 'shelter_scope_' || cmd, t);
      execute format(
        'create policy %I on public.%I as restrictive for %s to anon, authenticated using (public.is_trusted_caller() or shelter_id = public.current_shelter_id())',
        'shelter_scope_' || cmd, t, cmd);
    end loop;
  end loop;
end $$;
