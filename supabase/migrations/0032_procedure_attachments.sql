-- Procedure files under the deceased lock (follows 0031).
--
-- 0026's attachment_resident_id() maps a polymorphic attachment back to
-- its resident so the lock can refuse changes to a closed record. It knew
-- 'resident' and 'blood_test'; a file on a procedure resolves through the
-- procedure's resident the same way. Split from 0031 because the enum
-- value it references was added there and can't be used in the same
-- transaction.

create or replace function attachment_resident_id(
  p_owner_type attachment_owner_type,
  p_owner_id uuid
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_owner_type = 'resident' then p_owner_id
    when p_owner_type = 'blood_test' then
      (select bt.resident_id from blood_tests bt where bt.id = p_owner_id)
    when p_owner_type = 'procedure' then
      (select pr.resident_id from procedures pr where pr.id = p_owner_id)
  end;
$$;
