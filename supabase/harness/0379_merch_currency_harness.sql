-- Exercises 0379 against real rows; ends by raising, so success is the message. Nothing is kept.
begin;
do $$
declare n int; failed boolean;
begin
  -- a valid new currency inserts and the insert trigger stamps it
  insert into merch_exchange_rates (currency, thb_per_unit, set_by, set_at) values ('ZZA', 1.5, null, '2000-01-01');
  select count(*) into n from merch_exchange_rates where currency = 'ZZA' and set_at > '2001-01-01';
  if n <> 1 then raise exception 'FAIL insert not stamped'; end if;
  -- lowercase and four letters are refused by the check
  failed := false; begin insert into merch_exchange_rates (currency, thb_per_unit) values ('cad', 1); exception when check_violation then failed := true; end;
  if not failed then raise exception 'FAIL lowercase accepted'; end if;
  failed := false; begin insert into merch_exchange_rates (currency, thb_per_unit) values ('CADD', 1); exception when check_violation then failed := true; end;
  if not failed then raise exception 'FAIL four letters accepted'; end if;
  -- zero rate refused
  failed := false; begin insert into merch_exchange_rates (currency, thb_per_unit) values ('ZZB', 0); exception when check_violation then failed := true; end;
  if not failed then raise exception 'FAIL zero rate accepted'; end if;
  -- duplicate refused by the primary key
  failed := false; begin insert into merch_exchange_rates (currency, thb_per_unit) values ('ZZA', 2); exception when unique_violation then failed := true; end;
  if not failed then raise exception 'FAIL duplicate accepted'; end if;
  -- delete works and the five seeded rows are untouched
  delete from merch_exchange_rates where currency = 'ZZA';
  select count(*) into n from merch_exchange_rates where currency in ('USD','EUR','GBP','AUD','SGD');
  if n <> 5 then raise exception 'FAIL seeded rows changed: %', n; end if;
  raise exception 'HARNESS PASS: stamp, check (lowercase, 4 letters, zero), primary key, delete, seeds intact';
end $$;
rollback;
