-- The customer's terminology is "resident", never "animal", and the app now
-- says so everywhere it speaks — so the one column, sequence and constraint
-- still carrying the old word are renamed to match. Values are untouched:
-- codes stay "R-0001", Drive folder names stay "<Name> (R-0001)", and the
-- cached residents.drive_folder_id lookups don't care about the column name.
--
-- resident_list_view (0012) selects the column by reference, so Postgres
-- carries the rename through to it; its output column is now resident_code.
-- No function body mentions the column, so nothing else needs re-creating.
-- Each step is guarded so the file is re-runnable.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'residents' and column_name = 'animal_code'
  ) then
    alter table residents rename column animal_code to resident_code;
  end if;

  if exists (
    select 1 from pg_constraint where conname = 'residents_animal_code_key'
  ) then
    alter table residents rename constraint residents_animal_code_key to residents_resident_code_key;
  end if;

  if exists (
    select 1 from pg_class where relkind = 'S' and relname = 'residents_animal_number_seq'
  ) then
    alter sequence residents_animal_number_seq rename to residents_resident_number_seq;
  end if;
end $$;

-- The column default was written against the old sequence name; Postgres
-- follows the rename by OID, but restating it keeps the definition honest
-- for anyone reading it back.
alter table residents
  alter column resident_code set default ('R-' || lpad(nextval('residents_resident_number_seq')::text, 4, '0'));
