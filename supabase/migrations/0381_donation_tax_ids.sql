-- consumer: none
--
-- The donor's 13-digit tax ID for the Thai e-Donation path (#99zuk, schema half). Kept APART from donations, in its own table, one row
-- per gift that needs it, readable and writable only through has_permission('donation.receipt') (the same cell as the gifts themselves;
-- no read level is added, see docs/decisions/2026-11-15-donation-tax-id-schema.md). Nothing in src/ reads this yet: the app half follows.
-- PDPA: the ID is kept 7 years from the END OF THE CALENDAR YEAR OF THE GIFT (retain_until, a stored generated column fed by a copy of
-- the gift date that is locked after insert, so unrelated activity can never reset the clock).
-- Deliberately NOT audited with record_audit(): that trigger copies the whole row into the audit log, which would put the ID in a place
-- with a wider readership than this table.
-- Re-runnable. To undo: drop table donation_tax_ids; drop function donation_tax_ids_guard(); drop function thai_national_id_ok(text).

create or replace function thai_national_id_ok(t text)
returns boolean
language sql
immutable
parallel safe
as $$
  select case
    when t is null or t !~ '^[0-9]{13}$' then false
    else (11 - (
      select sum(substr(t, i, 1)::int * (14 - i)) % 11 from generate_series(1, 12) as i
    )) % 10 = substr(t, 13, 1)::int
  end
$$;

comment on function thai_national_id_ok(text) is
  'True when t is 13 digits and its last digit is the Thai ID mod-11 check digit (0381). Applies to individuals; a juristic person''s number is not checked this way.';

create table if not exists donation_tax_ids (
  donation_id      uuid primary key references donations (id) on delete cascade,
  tax_id           text not null check (tax_id ~ '^[0-9]{13}$'),
  holder_kind      text not null default 'person' check (holder_kind in ('person', 'juristic')),
  gift_received_on date not null,
  retain_until     date generated always as (make_date(extract(year from gift_received_on)::int + 7, 12, 31)) stored,
  recorded_on      date,
  recorded_by      uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  constraint donation_tax_ids_person_checksum check (holder_kind <> 'person' or thai_national_id_ok(tax_id))
);

create index if not exists donation_tax_ids_to_record_idx on donation_tax_ids (gift_received_on) where recorded_on is null;
create index if not exists donation_tax_ids_retain_idx on donation_tax_ids (retain_until);

comment on table donation_tax_ids is
  'A donor''s 13-digit tax ID for e-Donation, one row per gift that asks for a deduction (0381). PDPA-sensitive; read only via donation.receipt. Delete the row once retain_until has passed.';
comment on column donation_tax_ids.gift_received_on is
  'Copied from donations.received_on by trigger at insert and locked afterwards. It is what retain_until measures, so editing the gift later cannot move the clock.';
comment on column donation_tax_ids.retain_until is
  '31 December of (gift year + 7). A clean-up job deletes rows where retain_until < current_date.';
comment on column donation_tax_ids.recorded_on is
  'Null = still to record in e-Donation. The date the foundation entered the gift there.';

create or replace function donation_tax_ids_guard()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    select d.received_on into new.gift_received_on from donations d where d.id = new.donation_id;
    if new.gift_received_on is null then
      raise exception 'donation not found for tax id';
    end if;
  else
    if new.donation_id is distinct from old.donation_id
       or new.gift_received_on is distinct from old.gift_received_on
       or new.created_at is distinct from old.created_at then
      raise exception 'donation_id, gift_received_on and created_at cannot change';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists donation_tax_ids_guard on donation_tax_ids;
create trigger donation_tax_ids_guard
  before insert or update on donation_tax_ids
  for each row execute function donation_tax_ids_guard();

alter table donation_tax_ids enable row level security;

drop policy if exists donation_tax_ids_perm on donation_tax_ids;
create policy donation_tax_ids_perm on donation_tax_ids for all to authenticated
  using ((select has_permission('donation.receipt')))
  with check ((select has_permission('donation.receipt')));

revoke all on donation_tax_ids from public, anon, authenticated;
grant select, insert, update, delete on donation_tax_ids to authenticated;
grant all on donation_tax_ids to service_role;

revoke execute on function thai_national_id_ok(text) from public, anon;
grant execute on function thai_national_id_ok(text) to authenticated, service_role;
