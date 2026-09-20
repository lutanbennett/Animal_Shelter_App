-- Vets management moves under the Management section (2026-09-21).
--
-- 0039 gave management exactly staff's policies, and staff only read the
-- vets table (staff_read_vets, 0001) — the CRUD page was admin-only. Now
-- that /management/vets exists, management needs write access, the same
-- way it already has it on contacts. This is the one deliberate departure
-- from "management = staff": the read-only twin is replaced by a
-- read/write policy, so the policy *count* still matches staff's (which
-- the 0039 mirror block asserts) but the names no longer pair one to one
-- for this table. If the 0039 block is ever re-run it would recreate
-- management_read_vets and trip its own count check — re-run this file
-- after it.

drop policy if exists management_read_vets on vets;
drop policy if exists management_rw_vets on vets;
create policy management_rw_vets on vets
  for all
  using (current_user_role() = 'management')
  with check (current_user_role() = 'management');

notify pgrst, 'reload schema';
