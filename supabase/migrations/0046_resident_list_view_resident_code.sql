-- 0045 assumed renaming residents.animal_code would carry through to
-- resident_list_view. It does follow the underlying column, but a view's
-- output column names are fixed when the view is created, so the view kept
-- exposing it as animal_code (a 400 on resident_code from /residents). This
-- renames the view's output column to match. Guarded so it is re-runnable.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'resident_list_view' and column_name = 'animal_code'
  ) then
    alter view resident_list_view rename column animal_code to resident_code;
  end if;
end $$;
