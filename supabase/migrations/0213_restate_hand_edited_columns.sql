-- consumer: supabase/migrations/0211_forecasts_use_delivery_cost.sql, src/app/admin/immunization-types/page.tsx, src/app/admin/zones/page.tsx, src/app/admin/facility-map/page.tsx
--
-- Makes a from-zero build of the migration files agree with dev on the two columns that were hand-edited
-- there (database review 2026-10-13, F1). Dev is the only shape the app has ever been tested against, so
-- the files are brought to dev, not the other way round. See docs/decisions/2026-10-16-hand-edited-columns-restated.md.
--
--   immunization_types.interval_months  integer (0007)  ->  numeric not null    (dev's hand edit)
--   zones.internal   boolean not null default true (0004) ->  nullable, default true (dev's hand edit)
--
-- Re-runnable: each step tests the current shape first, so on dev (already in the target shape) this
-- changes nothing, and on a rebuild it changes only what differs.
--
-- Postgres refuses to change a column's type while a view reads it, so the two views that read
-- interval_months are dropped and recreated exactly as dev holds them (0166 definitions, grants as
-- 0155/0166/0124 left them: select to authenticated + service_role only). Nothing else depends on them.

do $$
declare
  v_type text;
begin
  select data_type into v_type from information_schema.columns
   where table_schema = 'public' and table_name = 'immunization_types' and column_name = 'interval_months';

  if v_type = 'integer' then
    drop view if exists immunization_next_due;
    drop view if exists picker_immunization_types;

    -- Rows with no interval would violate the not-null below. 0007 documented null as "one-off, no
    -- recurring due date"; dev holds no such row, so a rebuild with none loses nothing. Fail loudly
    -- rather than invent an interval if one exists.
    if exists (select 1 from immunization_types where interval_months is null) then
      raise exception 'immunization_types has rows with null interval_months; decide their interval before restating the column not null';
    end if;

    alter table immunization_types drop constraint if exists interval_months_positive;
    alter table immunization_types alter column interval_months type numeric;
    alter table immunization_types
      add constraint interval_months_positive check (interval_months is null or interval_months > 0);

    create view immunization_next_due
    with (security_invoker = on)
    as
    select distinct on (ir.resident_id, ir.immunization_type_id)
      ir.resident_id,
      ir.immunization_type_id,
      it.name as immunization_type_name,
      it.interval_months,
      ir.date_administered as last_administered,
      case when it.interval_months is not null
        then (ir.date_administered + (it.interval_months || ' months')::interval)::date
      end as next_due_date,
      it.name_th as immunization_type_name_th
    from immunization_records ir
    join immunization_types it on it.id = ir.immunization_type_id
    where ir.archived_at is null
    order by ir.resident_id, ir.immunization_type_id, ir.date_administered desc;

    revoke all on immunization_next_due from anon, authenticated, service_role;
    grant select on immunization_next_due to authenticated, service_role;

    create view picker_immunization_types as
    select id, name, is_mandatory, interval_months, name_th
    from immunization_types i
    where (select has_permission('medical.immunizations', 'read'))
       or (select has_permission('reference.types', 'read'));

    comment on view picker_immunization_types is
      'What a form that picks a vaccine reads of one (0155): id, name, mandatory flag, months between doses. No cost. Rows for a login holding medical.immunizations Read or reference.types Read. A new immunization_types column is private until it is added here.';
    revoke all on picker_immunization_types from anon, authenticated, service_role;
    grant select on picker_immunization_types to authenticated, service_role;
  end if;
end $$;

alter table immunization_types alter column interval_months set not null;

comment on column immunization_types.interval_months is
  'Months between doses (e.g. 24 for Rabies, 3 for Heartworm). Every type recurs; numeric because dev holds it that way (0213).';

-- zones.internal: nullable on dev, default true kept.
alter table zones alter column internal drop not null;

notify pgrst, 'reload schema';
