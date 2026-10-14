-- consumer: src/app/admin/website/actions.ts, src/lib/site/content.ts, scripts/check-medication-rounds.mjs
--
-- ONE schema PR carrying three 2026-10-13 database-review findings (F2, F4, W1).
--
-- F2  site_content, site_pages and site_content_photos were readable by every login (using (true)); 0122 only
--     revoked anon. Read now needs website.content Read -- or reports.cashflow Read, because the cashflow forecast
--     reads clinic_visit_estimate off site_content (src/lib/site/content.ts loadClinicVisitEstimate). Visitors are
--     unaffected: public_site_* views run as their owner (0122, 0059).
-- F4  record_audit() on nine more tables, and an actor for service-role scripts via app.actor. auth.uid() still wins
--     when present, so a signed-in caller cannot pose as someone else. user_roles has no id column (key is user_id),
--     and audit_log.row_id is not null, so the function now falls back to user_id; without that the trigger would
--     raise and block every role change.
-- W1  the two round-status views filtered on current_date (UTC); now shelter_today() (0073). Kept, not dropped:
--     no src/ or worker/ reader, but scripts/check-medication-rounds.mjs and check-view-write-grants.mjs read them.

-- F2 ---------------------------------------------------------------------------------------------------------------
drop policy if exists public_read_site_content on site_content;
drop policy if exists read_site_content on site_content;
create policy read_site_content on site_content for select to authenticated
  using ((select has_permission('website.content', 'read') or has_permission('reports.cashflow', 'read')));

drop policy if exists public_read_site_pages on site_pages;
drop policy if exists read_site_pages on site_pages;
create policy read_site_pages on site_pages for select to authenticated
  using ((select has_permission('website.content', 'read')));

drop policy if exists public_read_site_content_photos on site_content_photos;
drop policy if exists read_site_content_photos on site_content_photos;
create policy read_site_content_photos on site_content_photos for select to authenticated
  using ((select has_permission('website.content', 'read')));

-- F4 ---------------------------------------------------------------------------------------------------------------
create or replace function record_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_id uuid;
  v_actor uuid;
  v_named text;
  v_skip text[] := coalesce(tg_argv, array[]::text[]);
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old) - v_skip;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new) - v_skip;
  end if;

  if tg_op = 'UPDATE' and v_old = v_new then
    return null;
  end if;

  v_id := coalesce((v_new ->> 'id')::uuid, (v_old ->> 'id')::uuid,
                   (v_new ->> 'user_id')::uuid, (v_old ->> 'user_id')::uuid);

  v_actor := auth.uid();
  if v_actor is null then
    v_named := current_setting('app.actor', true);
    if v_named ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      v_actor := v_named::uuid;
    end if;
  end if;

  insert into audit_log (table_name, row_id, op, actor, old_row, new_row)
  values (tg_table_name, v_id, tg_op, v_actor, v_old, v_new);

  return null;
end;
$$;

revoke execute on function record_audit() from public, anon, authenticated;

drop trigger if exists audit_placement_history on placement_history;
create trigger audit_placement_history
  after insert or update or delete on placement_history
  for each row execute function record_audit();
drop trigger if exists audit_user_roles on user_roles;
create trigger audit_user_roles
  after insert or update or delete on user_roles
  for each row execute function record_audit();
drop trigger if exists audit_maintenance on maintenance;
create trigger audit_maintenance
  after insert or update or delete on maintenance
  for each row execute function record_audit();
drop trigger if exists audit_maintenance_bills on maintenance_bills;
create trigger audit_maintenance_bills
  after insert or update or delete on maintenance_bills
  for each row execute function record_audit();
drop trigger if exists audit_bills_inbox on bills_inbox;
create trigger audit_bills_inbox
  after insert or update or delete on bills_inbox
  for each row execute function record_audit();
drop trigger if exists audit_stock_receipts on stock_receipts;
create trigger audit_stock_receipts
  after insert or update or delete on stock_receipts
  for each row execute function record_audit();
drop trigger if exists audit_blood_tests on blood_tests;
create trigger audit_blood_tests
  after insert or update or delete on blood_tests
  for each row execute function record_audit();
drop trigger if exists audit_procedures on procedures;
create trigger audit_procedures
  after insert or update or delete on procedures
  for each row execute function record_audit();
drop trigger if exists audit_resident_diets on resident_diets;
create trigger audit_resident_diets
  after insert or update or delete on resident_diets
  for each row execute function record_audit();

-- W1 ---------------------------------------------------------------------------------------------------------------
alter table maintenance_bills alter column bill_date set default shelter_today();

create or replace view prescription_round_status
with (security_invoker = true) as
select p.id as prescription_id,
       p.resident_id,
       o.owed as rounds_owed,
       count(pr.round_id)::integer as round_count,
       case
         when count(pr.round_id) = o.owed then 'ok'
         when count(pr.round_id) = 0 then 'none'
         else 'mismatch'
       end as status
  from prescriptions p
  left join frequency f on f.id = p.frequency_id
  cross join lateral (
    select case when f.doses_per_day is not null then f.doses_per_day
                when f.interval_count is not null then 1
                else 0 end as owed
  ) o
  left join prescription_rounds pr on pr.prescription_id = p.id
 where p.end_date is null or p.end_date >= shelter_today()
 group by p.id, p.resident_id, o.owed;

create or replace view resident_diet_round_status
with (security_invoker = true) as
select d.id as resident_diet_id,
       d.resident_id,
       d.meals_per_day as rounds_owed,
       count(dr.round_id)::integer as round_count,
       case
         when count(dr.round_id) = d.meals_per_day then 'ok'
         when count(dr.round_id) = 0 then 'none'
         else 'mismatch'
       end as status
  from resident_diets d
  left join resident_diet_rounds dr on dr.resident_diet_id = d.id
 where d.end_date is null or d.end_date >= shelter_today()
 group by d.id, d.resident_id, d.meals_per_day;

grant select on prescription_round_status, resident_diet_round_status to authenticated, service_role;

notify pgrst, 'reload schema';
