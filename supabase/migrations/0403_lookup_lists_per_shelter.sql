-- consumer: none (no app code reads shelter_id on these; the shelter policies filter rows for every API read, and each insert takes current_shelter_id() as its default)
-- Tenancy programme, #lklst: seven lookup lists were shared by every shelter yet hold values a shelter chooses (immunization_types even carries a price).
--   bill_kinds, blood_test_types, immunization_types, procedure_types, frequency, units, group_origins
-- Each gets shelter_id, stamped Lanna by an explicit one-off statement (as 0390/0396), the current_shelter_id() default, then NOT NULL (as 0397),
-- 0392's three restrictive policies, and its name/key uniqueness made per shelter (a second shelter must be able to have its own "Rabies").
-- Re-runnable. To undo: drop the three shelter_scope_* policies, restore the old unique keys, drop the column.
do $$
declare
  t text; cmd text; lanna uuid; n bigint;
begin
  select id into lanna from public.shelters where key = 'lanna';
  foreach t in array array['bill_kinds','blood_test_types','immunization_types','procedure_types','frequency','units','group_origins'] loop
    execute format('alter table public.%I add column if not exists shelter_id uuid references public.shelters(id)', t);
    execute format('alter table public.%I alter column shelter_id set default public.current_shelter_id()', t);
    if lanna is not null then
      execute format('alter table public.%I disable trigger user', t);
      execute format('update public.%I set shelter_id = %L where shelter_id is null', t, lanna);
      execute format('alter table public.%I enable trigger user', t);
    end if;
    execute format('select count(*) from public.%I where shelter_id is null', t) into n;
    if n > 0 then raise exception 'null shelter_id rows remain in %: no Lanna shelter to stamp them with', t; end if;
    execute format('alter table public.%I alter column shelter_id set not null', t);
    execute format('alter table public.%I enable row level security', t);
    foreach cmd in array array['select','update','delete'] loop
      execute format('drop policy if exists %I on public.%I', 'shelter_scope_' || cmd, t);
      execute format(
        'create policy %I on public.%I as restrictive for %s to anon, authenticated using (public.is_trusted_caller() or shelter_id = public.current_shelter_id())',
        'shelter_scope_' || cmd, t, cmd);
    end loop;
  end loop;
end $$;

-- Uniqueness per shelter. The old keys are dropped only if still present; the new ones only if absent.
alter table public.bill_kinds drop constraint if exists bill_kinds_key_key;
alter table public.blood_test_types drop constraint if exists blood_test_types_name_key;
alter table public.immunization_types drop constraint if exists immunization_types_name_key;
alter table public.procedure_types drop constraint if exists procedure_types_name_key;
alter table public.frequency drop constraint if exists frequency_label_key;
drop index if exists public.units_name_lower_key;
create unique index if not exists bill_kinds_shelter_key_key on public.bill_kinds (shelter_id, key);
create unique index if not exists blood_test_types_shelter_name_key on public.blood_test_types (shelter_id, name);
create unique index if not exists immunization_types_shelter_name_key on public.immunization_types (shelter_id, name);
create unique index if not exists procedure_types_shelter_name_key on public.procedure_types (shelter_id, name);
create unique index if not exists frequency_shelter_label_key on public.frequency (shelter_id, label);
create unique index if not exists units_shelter_name_lower_key on public.units (shelter_id, lower(btrim(name)));
