-- consumer: src/lib/bills/access.ts
--
-- check-bills-roles red (docs/decisions/2026-10-21-bills-inbox-and-role-groups-schema.md). Lutan ruled
-- 2026-10-21: a visiting vet may NOT use the bills inbox, which is one shared pile of everyone's bills with
-- amounts. can_use_bills_inbox() (0189) admitted anyone holding medical.visits, and the doctor role was given
-- that cell in PR 766, so a clinic login could add, read and delete inbox cards and move their photos.
--
-- The fix is the fence the app already draws: canUseBills() (src/lib/bills/access.ts) refuses a clinic login
-- (scope_clinical = own_clinic) whatever else the role holds. The database now asks the same question.
-- Nothing else changes: a shelter role holding medical.visits, stock.delivery or maintenance.bills keeps the
-- inbox exactly as before. Its callers (bills_inbox's policy, 0189; bill_owner_can() for 'bill_inbox'
-- attachments, 0190) pick it up. Filing on a clinic visit is bill_owner_can's own medical.visits branch plus
-- record_attachment()'s clinic fence (0174, 0190), neither touched.
--
-- Re-runnable: create or replace.
create or replace function public.can_use_bills_inbox()
  returns boolean
  language sql
  stable
as $$
  select not coalesce((select public.is_clinic_login()), false)
     and (   coalesce((select has_permission('stock.delivery')), false)
          or coalesce((select has_permission('medical.visits')), false)
          or coalesce((select has_permission('maintenance.bills')), false));
$$;

revoke all on function public.can_use_bills_inbox() from public, anon;
grant execute on function public.can_use_bills_inbox() to authenticated, service_role;
