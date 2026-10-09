-- consumer: src/lib/donations/receipts.ts, src/app/admin/donations/actions.ts
--
-- Donation receipts, the schema half (backlog, "Donation receipts: a form for the Director to issue a receipt";
-- Lutan's answers of 2026-10-09 are on the item). Folded into the community-dogs schema PR by Lutan's choice on
-- 2026-10-09, because only one branch may carry a migration at a time; the two files touch nothing in common.
-- The feature half is claude/donation-receipts. Design notes: docs/decisions/2026-10-09-donation-receipts.md.
--
-- WHAT IS HERE
--   donations            one gift: who, when, how, what for. The record the receipt is printed from, and the
--                        start of the donations ledger the Cashflow forecast has no source for (the /donate item's
--                        step (b) is this table).
--   donation_lines       one or more description lines, each with an amount in baht, or no amount for an in-kind
--                        gift (the sample receipt is one line: "Sponsorship of two packs (40kg) of dry dog food").
--   donation_receipts    the receipt register. One row per number ever issued, voided ones included.
--   receipt_counters     the next number, one row per series. NOT a sequence: a sequence skips a value whenever a
--                        transaction that took one rolls back, and a receipt register must never skip.
--   issue_donation_receipt(donation, country, issuer, content)  the only way a receipt row is made.
--   activity donation.receipt (yes/no, "Issue a donation receipt"). No cells: Admin only until delegated in
--                        Settings, per the item ("the Director (Admin) by default").
--
-- THE NUMBER. 'LCA' + seven digits, the first LCA0009000 (Lutan, 2026-10-09), one series for both countries.
-- issue_donation_receipt() takes the counter row FOR UPDATE, so two receipts issued at once queue on it, and the
-- increment and the insert commit or roll back together: a failed issue leaves the counter where it was, so no
-- number is ever skipped, and the unique constraint means none is ever repeated.
--
-- A RECEIPT IS NEVER DELETED OR REWRITTEN. A mistake is corrected by voiding the receipt (it keeps its number and
-- stays in the register, marked void, with who, when and why) and issuing a new one. donation_receipts has no
-- delete grant and a trigger refuses delete for everyone, the service role included; the same trigger refuses any
-- change to the number, the donation it belongs to, the country, the date, who issued it, or what it says.
-- Only the void, Drive and sent columns move, and a void cannot be undone.
--
-- WHAT IT SAYS IS KEPT ON THE RECEIPT (content, issuer). A receipt is a document that has been sent. Re-printing
-- one must give the same page, so the donor name, lines, total and the issuer block as printed are stored on the
-- row as jsonb, not re-read from the donation (which can be corrected) or from the issuer constant (which changes
-- when the address does, or per shelter at multi-tenancy). The donation stays editable; a receipt does not.
--
-- No Thai ID number is stored here. The item keeps that for the e-Donation follow-up, which must store it apart.
--
-- Additive: new tables, function, activity. Re-runnable throughout. To undo, in a new file: drop the function,
-- the four tables (receipts first), the trigger functions, and the activity row.

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists donations (
  id                     uuid primary key default gen_random_uuid(),
  received_on            date not null,
  donor_name             text not null check (btrim(donor_name) <> ''),
  contact_id             uuid references contacts (id) on delete set null,
  donor_email            text,
  donor_phone            text,
  donor_line             text,
  method                 text not null check (method in ('bank_transfer', 'promptpay', 'cash', 'donorbox', 'in_kind')),
  designation            text not null default 'general' check (designation in ('general', 'resident', 'project', 'appeal')),
  designation_resident_id uuid references residents (id) on delete set null,
  designation_note       text,
  note                   text,
  recorded_by            uuid references auth.users (id) on delete set null default auth.uid(),
  created_at             timestamptz not null default now()
);

create index if not exists donations_received_on_idx on donations (received_on);
create index if not exists donations_contact_idx on donations (contact_id) where contact_id is not null;

comment on table donations is
  'One gift (0168). The receipt is printed from it; donation_receipts keeps what was printed. Amounts are on donation_lines, in baht.';
comment on column donations.donor_name is
  'Free text as the Director types it, Thai or Latin. Kept even when contact_id is set: the receipt names who gave, and a contact can be renamed.';

create table if not exists donation_lines (
  id          uuid primary key default gen_random_uuid(),
  donation_id uuid not null references donations (id) on delete cascade,
  position    smallint not null check (position >= 0),
  description text not null check (btrim(description) <> ''),
  -- Baht. Null only for an in-kind line, which describes the gift instead of pricing it.
  amount      numeric(12, 2) check (amount is null or amount > 0),
  unique (donation_id, position)
);

comment on table donation_lines is
  'A description line on a donation, each with an amount in baht, or null for an in-kind gift (0168).';

create table if not exists receipt_counters (
  series     text primary key check (series ~ '^[A-Z]+$'),
  next_value bigint not null check (next_value >= 0 and next_value <= 9999999)
);

comment on table receipt_counters is
  'The next receipt number per series (0168). A row, not a sequence, because a sequence skips on rollback. Written only by issue_donation_receipt().';

insert into receipt_counters (series, next_value) values ('LCA', 9000)
on conflict (series) do nothing;

create table if not exists donation_receipts (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique check (number ~ '^[A-Z]+[0-9]{7}$'),
  donation_id   uuid not null references donations (id) on delete restrict,
  country       text not null check (country in ('TH', 'US')),
  issued_on     date not null,
  issued_by     uuid references auth.users (id) on delete set null,
  issued_at     timestamptz not null default now(),
  -- What the page says, as printed: donor name, lines, total, currency.
  content       jsonb not null check (jsonb_typeof(content) = 'object'),
  -- The issuer block as printed: name, address lines, registration lines.
  issuer        jsonb not null check (jsonb_typeof(issuer) = 'object'),
  drive_file_id text,
  drive_saved_at timestamptz,
  sent_at       timestamptz,
  sent_by       uuid references auth.users (id) on delete set null,
  voided_at     timestamptz,
  voided_by     uuid references auth.users (id) on delete set null,
  void_reason   text,
  constraint donation_receipts_void_has_reason
    check (voided_at is null or (void_reason is not null and btrim(void_reason) <> ''))
);

create index if not exists donation_receipts_donation_idx on donation_receipts (donation_id);
create index if not exists donation_receipts_issued_on_idx on donation_receipts (issued_on);
-- One live receipt per donation; any number of voided ones.
create unique index if not exists donation_receipts_one_live
  on donation_receipts (donation_id) where voided_at is null;

comment on table donation_receipts is
  'The receipt register (0168). Never deleted, never rewritten: a mistake is voided (keeping its number) and re-issued. Rows are made only by issue_donation_receipt().';
comment on column donation_receipts.drive_file_id is
  'Null means not yet saved to Drive. The receipt is still valid and offered to the Director; the upload is retried.';

-- ---------------------------------------------------------------------------
-- 2. The register cannot be deleted or rewritten
-- ---------------------------------------------------------------------------

create or replace function donation_receipts_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'A donation receipt is never deleted: void it instead (receipt %)', old.number;
  end if;
  if new.number is distinct from old.number
     or new.donation_id is distinct from old.donation_id
     or new.country is distinct from old.country
     or new.issued_on is distinct from old.issued_on
     or new.issued_by is distinct from old.issued_by
     or new.issued_at is distinct from old.issued_at
     or new.content is distinct from old.content
     or new.issuer is distinct from old.issuer then
    raise exception 'A donation receipt is never rewritten: void it and issue a new one (receipt %)', old.number;
  end if;
  if old.voided_at is not null and (
       new.voided_at is distinct from old.voided_at
       or new.voided_by is distinct from old.voided_by
       or new.void_reason is distinct from old.void_reason) then
    raise exception 'A void cannot be undone or changed (receipt %)', old.number;
  end if;
  return new;
end;
$$;

drop trigger if exists donation_receipts_guard on donation_receipts;
create trigger donation_receipts_guard
  before update or delete on donation_receipts
  for each row execute function donation_receipts_guard();

-- ---------------------------------------------------------------------------
-- 3. Issuing: the only way a receipt row is made
-- ---------------------------------------------------------------------------

create or replace function issue_donation_receipt(
  p_donation_id uuid,
  p_country text,
  p_issued_on date,
  p_issuer jsonb,
  p_content jsonb
)
returns donation_receipts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_value bigint;
  v_row donation_receipts;
begin
  if not (select has_permission('donation.receipt')) then
    raise exception 'Not allowed to issue a donation receipt' using errcode = '42501';
  end if;
  if not exists (select 1 from donations where id = p_donation_id) then
    raise exception 'No such donation';
  end if;

  update receipt_counters
     set next_value = next_value + 1
   where series = 'LCA'
  returning next_value - 1 into v_value;
  if v_value is null then
    raise exception 'Receipt counter LCA is missing';
  end if;

  insert into donation_receipts (number, donation_id, country, issued_on, issued_by, content, issuer)
  values ('LCA' || lpad(v_value::text, 7, '0'), p_donation_id, p_country, p_issued_on, auth.uid(), p_content, p_issuer)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) from public, anon;
grant execute on function issue_donation_receipt(uuid, text, date, jsonb, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. The activity, and who may read and write
-- ---------------------------------------------------------------------------

insert into permission_activities (key, kind, area, sort)
values ('donation.receipt', 'yesno', 'management', 59)
on conflict (key) do update set kind = excluded.kind, area = excluded.area, sort = excluded.sort;

alter table donations enable row level security;
alter table donation_lines enable row level security;
alter table donation_receipts enable row level security;
alter table receipt_counters enable row level security;

drop policy if exists donations_perm on donations;
create policy donations_perm on donations for all to authenticated
  using ((select has_permission('donation.receipt')))
  with check ((select has_permission('donation.receipt')));

drop policy if exists donation_lines_perm on donation_lines;
create policy donation_lines_perm on donation_lines for all to authenticated
  using ((select has_permission('donation.receipt')))
  with check ((select has_permission('donation.receipt')));

drop policy if exists donation_receipts_read_perm on donation_receipts;
create policy donation_receipts_read_perm on donation_receipts for select to authenticated
  using ((select has_permission('donation.receipt')));
drop policy if exists donation_receipts_update_perm on donation_receipts;
create policy donation_receipts_update_perm on donation_receipts for update to authenticated
  using ((select has_permission('donation.receipt')))
  with check ((select has_permission('donation.receipt')));

-- receipt_counters: no policy, so no direct access for authenticated; the security definer function writes it.

revoke all on donations from public, anon, authenticated;
grant select, insert, update, delete on donations to authenticated;
grant all on donations to service_role;

revoke all on donation_lines from public, anon, authenticated;
grant select, insert, update, delete on donation_lines to authenticated;
grant all on donation_lines to service_role;

-- No insert (issue_donation_receipt) and no delete (never) for authenticated.
revoke all on donation_receipts from public, anon, authenticated;
grant select, update on donation_receipts to authenticated;
grant all on donation_receipts to service_role;

revoke all on receipt_counters from public, anon, authenticated;
grant select on receipt_counters to service_role;
grant update on receipt_counters to service_role;

-- ---------------------------------------------------------------------------
-- 5. Audit
-- ---------------------------------------------------------------------------

drop trigger if exists audit_donations on donations;
create trigger audit_donations
  after insert or update or delete on donations
  for each row execute function record_audit();

drop trigger if exists audit_donation_lines on donation_lines;
create trigger audit_donation_lines
  after insert or update or delete on donation_lines
  for each row execute function record_audit();

drop trigger if exists audit_donation_receipts on donation_receipts;
create trigger audit_donation_receipts
  after insert or update or delete on donation_receipts
  for each row execute function record_audit();
