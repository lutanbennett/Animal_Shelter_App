-- Contacts are carers, volunteers or vendors — nothing else (2026-09-22).
--
-- 0001 gave `contact_type` five values; `Donor` and `Other` were never
-- used (dev has none; the guard below refuses if production does) and the decision was to
-- remove them outright rather than leave dead values in the enum and hide
-- them in the UI. If a type is needed later it gets added with a new
-- migration.
--
-- Postgres can't drop a value from an enum, so the type is recreated:
-- rename the old one aside, create the new one, retype the column, drop
-- the old. The `do` block refuses to run while any row still uses a value
-- that is going away, so this can never silently fail a cast mid-way.
-- Re-runnable: once the old values are gone the whole block is a no-op.

do $$
begin
  if exists (
    select 1 from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'contact_type' and e.enumlabel in ('Donor', 'Other')
  ) then
    if exists (select 1 from contacts where type::text in ('Donor', 'Other')) then
      raise exception 'contacts still has Donor/Other rows — reassign them before dropping the values';
    end if;

    alter type contact_type rename to contact_type_old;
    create type contact_type as enum ('Carer', 'Volunteer', 'Vendor');
    alter table contacts
      alter column type type contact_type using type::text::contact_type;
    drop type contact_type_old;
  end if;
end $$;
