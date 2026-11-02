-- consumer: none
--
-- 0299's owner check formatted a table and column taken from resident_note_sources. A login that cannot read that
-- registry (it holds no resident.record) got a null there and an internal error, not a refusal. This replaces the
-- trigger function so such a caller is refused with 42501, the same code the policies give.
--
-- WHAT THIS FILE DOES NOT DO: change any policy, table or grant. Additive and re-runnable (create or replace).
-- String literals carry no semicolon or double dash.

create or replace function resident_note_tags_check_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_col text;
  v_owner uuid;
begin
  select s.resident_column into v_col from resident_note_sources s
   where s.source_table = new.source_table and s.source_column = new.source_column;
  if v_col is null then
    raise exception 'not allowed to tag in this note' using errcode = '42501';
  end if;
  execute format('select %I from %I where id = $1', v_col, new.source_table) into v_owner using new.source_row_id;
  if v_owner is distinct from new.from_resident_id then
    raise exception 'the note does not exist or does not belong to the resident it says' using errcode = '23514';
  end if;
  return new;
end
$$;

do $report$
begin
  if pg_get_functiondef('public.resident_note_tags_check_owner()'::regprocedure) not like '%42501%' then
    raise exception '0300 the owner check does not refuse a caller who cannot read the registry';
  end if;
end
$report$;
