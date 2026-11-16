-- Proof for 0385. Fake values only; everything rolls back.
begin;
do $$
declare old_d uuid; new_d uuid; n int; before_runs int;
begin
  insert into donations (received_on, donor_name, method) values ('2010-06-01', 'HARNESS OLD', 'cash') returning id into old_d;
  insert into donations (received_on, donor_name, method) values (current_date, 'HARNESS NEW', 'cash') returning id into new_d;
  insert into donation_tax_ids (donation_id, tax_id, holder_kind) values (old_d, '0000000000001', 'juristic'), (new_d, '0000000000002', 'juristic');
  if (select retain_until from donation_tax_ids where donation_id = old_d) <> date '2017-12-31' then raise exception 'FAIL retain_until math'; end if;
  select count(*) into before_runs from retention_runs;
  n := purge_donation_tax_ids();
  if n < 1 then raise exception 'FAIL nothing deleted'; end if;
  if exists (select 1 from donation_tax_ids where donation_id = old_d) then raise exception 'FAIL expired id kept'; end if;
  if not exists (select 1 from donation_tax_ids where donation_id = new_d) then raise exception 'FAIL fresh id deleted'; end if;
  if (select count(*) from donations where id in (old_d, new_d)) <> 2 then raise exception 'FAIL donation lost'; end if;
  if (select count(*) from retention_runs) <> before_runs + 1 then raise exception 'FAIL run not recorded'; end if;
  if has_function_privilege('anon', 'purge_donation_tax_ids()', 'execute') or has_function_privilege('authenticated', 'purge_donation_tax_ids()', 'execute') then raise exception 'FAIL callable by a login'; end if;
  if not exists (select 1 from cron.job where jobname = 'purge-donation-tax-ids') then raise exception 'FAIL job not scheduled'; end if;
  raise exception 'HARNESS PASSED (rolled back)';
end $$;
rollback;
