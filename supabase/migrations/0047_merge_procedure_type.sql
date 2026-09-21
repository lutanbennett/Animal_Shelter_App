-- Admin page for procedure types (2026-09-21).
--
-- 0031 let staff and vets add a procedure type inline from the procedure
-- form "until an admin page exists". That page is /admin/procedure-types;
-- admin already has `for all` on procedure_types (0031) and procedures
-- (0001), so no policy changes — only the merge helper, the same shape as
-- merge_medication / merge_frequency in 0043.
--
-- "X-ray" and "Xray" added inline by two different people are the same
-- procedure. Merging moves every procedure from the duplicate onto the one
-- to keep and deletes the duplicate, in one transaction. SECURITY INVOKER,
-- so RLS decides who may: the caller needs UPDATE on procedures and DELETE
-- on procedure_types (only admin has the latter; a staff or vet call fails
-- at the delete and the whole thing rolls back).
--
-- Deleting a type that procedures reference is blocked by the FK (no
-- cascade — the procedure is part of the resident's medical record); the
-- page checks first and says so.
--
-- Drive folders are unaffected: a procedure's files live under
-- `Procedures/<Type> <YYYYMMDD>/`, where <Type> is read at upload time, so
-- files attached after a rename or merge go under the new name while
-- earlier folders keep the old one.

create or replace function merge_procedure_type(p_from uuid, p_into uuid)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_moved integer;
begin
  if p_from = p_into then
    raise exception 'Choose a different procedure type to merge into.';
  end if;
  if not exists (select 1 from procedure_types where id = p_from)
     or not exists (select 1 from procedure_types where id = p_into) then
    raise exception 'Procedure type not found.';
  end if;

  update procedures set procedure_type_id = p_into where procedure_type_id = p_from;
  get diagnostics v_moved = row_count;

  delete from procedure_types where id = p_from;
  if not found then
    raise exception 'Not authorized to remove the duplicate procedure type.';
  end if;
  return v_moved;
end;
$$;

notify pgrst, 'reload schema';
