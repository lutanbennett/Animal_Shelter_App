-- consumer: none (no app code reads shelter_id on these yet; the shelter policies filter rows for every API read, anon and authenticated)
-- Tenancy programme (#ykefa), item #tnc10: ten tables held one shelter's data and had no shelter_id, so 0392's policies could not cover them.
--   stock and costs: diet_ingredients, item_unit_conversions, merch_exchange_rates; money and places: donation_channels, community_places;
--   diets: diet_types; mirrors of tenant rows: translations, label_drafts, label_sources; sync cursor: calendar_sync_state.
-- Each gets a nullable shelter_id, an explicit backfill to Lanna (as 0390), the current_shelter_id() default, and 0392's three restrictive policies.
-- NOT NULL is NOT here (#stmp5 step 3). The seven shelter-editable lookup lists are recorded as shared-for-now in docs/tenancy-shared-tables-registry.json.
-- Re-runnable. To undo: drop the three shelter_scope_* policies and the column from each table.
do $$
declare
  t text; cmd text; lanna uuid;
begin
  select id into lanna from public.shelters where key = 'lanna';
  foreach t in array array['diet_ingredients','item_unit_conversions','merch_exchange_rates','donation_channels','community_places',
                           'diet_types','translations','label_drafts','label_sources','calendar_sync_state'] loop
    execute format('alter table public.%I add column if not exists shelter_id uuid references public.shelters(id)', t);
    execute format('alter table public.%I alter column shelter_id set default public.current_shelter_id()', t);
    if lanna is not null then
      execute format('alter table public.%I disable trigger user', t);
      execute format('update public.%I set shelter_id = %L where shelter_id is null', t, lanna);
      execute format('alter table public.%I enable trigger user', t);
    end if;
  end loop;
  -- 0392's loop, re-run: every table that has the column, so the ten above are covered.
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
